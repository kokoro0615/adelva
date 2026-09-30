import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  after,
  hero,
  messages,
  notes,
  progressLabels,
  questions,
  roleOptions,
  send,
} from "../../src/content/adelva-contact";
import { challenges } from "../../src/content/adelva-navigation";

const required = [
  hero.eyebrow,
  ...hero.title,
  ...challenges.map((c) => c.label),
  "まだ整理できていない",
  questions.challenge.ask,
  questions.role.ask,
  questions.message.ask,
  questions.message.help,
  questions.contact.ask,
  ...roleOptions.map((r) => r.label),
  "会社名・施設名",
  "お名前",
  "メールアドレス",
  "電話番号",
  "ご相談の概要",
  "プライバシーポリシーに同意する",
  send.label,
  after.title,
  ...after.steps,
  after.link.label,
  ...notes.flatMap((n) => [n.title, ...n.body]),
];

async function open(page: Page, path = "/contact") {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-contact]")).toHaveCount(1);
}

async function fill(page: Page) {
  const form = page.locator("[data-contact-form]");
  await form.getByLabel("現場品質・人材を改善したい").check();
  await form.getByLabel("総支配人・現場責任者").check();
  await page.locator("#contact-message").fill("客室清掃の品質と人員配置を見直したい。");
  await page.locator("#contact-name").fill("山田 花子");
  await page.locator("#contact-email").fill("hanako@example.jp");
  await page.locator("#contact-tel").fill("03-1234-5678");
  await page.locator("#contact-consent").check();
}

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 780],
  [1024, 768],
  [1920, 1080],
])
  test.describe(`contact ${width}`, () => {
    test.use({ viewport: { width, height } });
    test("copy, one h1, width, shell", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await open(page);
      const text = (await page.locator("main").textContent())?.replace(/\s+/g, "");
      for (const s of required) expect(text).toContain(s.replace(/\s+/g, ""));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      await expect(
        page.locator('header a[href="/contact"][aria-current="page"]:visible'),
      ).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      // Exactly one progress indicator is exposed at a time.
      await expect(
        page.getByRole("navigation", { name: "入力の進み具合" }),
      ).toHaveCount(1);
      expect(errors).toEqual([]);
    });
    if ([1440, 768, 390].includes(width))
      test("axe at rest and with errors shown", async ({ page }) => {
        await open(page);
        const audit = () =>
          new AxeBuilder({ page })
            .include("main")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
        expect((await audit()).violations).toEqual([]);
        await page.locator("[data-contact-form] button[type=submit]").click();
        await expect(
          page.locator("[data-contact-form]").getByRole("alert"),
        ).toContainText(messages.summary);
        expect((await audit()).violations).toEqual([]);
      });
  });

test("keyboard selects cards, related domains follow, radios move with arrows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const first = page.locator("#contact-challenge-0");
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  const map = page.locator("[data-contact-form] [aria-live=polite]").first();
  await expect(map).toContainText("経営・運営統括");
  await page.locator("#contact-challenge-3").focus();
  await page.keyboard.press("Space");
  await expect(map).toContainText("収益・ブランド成長");
  await page.locator("#contact-role-0").focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#contact-role-1")).toBeChecked();
  const summary = page.getByRole("group", { name: "ご相談の概要" });
  await expect(summary).toContainText("総支配人・現場責任者");
  await expect(summary).toContainText("経営・運営統括");
});

test("empty submit lists errors, focuses the first, marks fields invalid", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await page.locator("[data-contact-form] button[type=submit]").click();
  const alert = page.locator("[data-contact-form]").getByRole("alert");
  for (const m of [
    messages.challenge,
    messages.message,
    messages.email,
    messages.consent,
  ])
    await expect(alert).toContainText(m);
  await expect(page.locator("#contact-challenge-0")).toBeFocused();
  await expect(page.locator("#contact-email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#contact-email")).toHaveAttribute(
    "aria-describedby",
    /contact-email-error/,
  );
  await page.locator("#contact-email").fill("hanako@example");
  await page.locator("#contact-email").blur();
  await expect(page.locator("#contact-email-error")).toContainText(
    messages.emailFormat,
  );
});

test("a complete submission lands on the thanks page; a direct visit does not", async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await fill(page);
  await expect(page.locator("[data-contact-form] button[type=submit]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.locator("[data-contact-form] button[type=submit]").click();
  await page.waitForURL("**/contact/thanks");
  await expect(page.locator("h1")).toHaveText(after.thanksTitle);
  await expect(page.locator("ol li[aria-current=step]")).toContainText(after.steps[1]);
  expect(await page.title()).toContain("お問い合わせを受け付けました");
  const audit = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  const fresh = await browser.newContext();
  const direct = await fresh.newPage();
  await direct.goto("/contact/thanks");
  expect(new URL(direct.url()).pathname).toBe("/contact");
  await fresh.close();
});

test("the form submits without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");
  await page.locator("#contact-challenge-5").check();
  await page.locator("#contact-role-2").check();
  await page
    .locator("#contact-message")
    .fill("まだ整理できていませんが相談したいです。");
  await page.locator("#contact-name").fill("山田 花子");
  await page.locator("#contact-email").fill("hanako@example.jp");
  await page.locator("#contact-tel").fill("0312345678");
  await page.locator("#contact-consent").check();
  await page.locator("[data-contact-form] button[type=submit]").click();
  await page.waitForURL("**/contact/thanks");
  await expect(page.locator("h1")).toHaveText(after.thanksTitle);
  await context.close();
});

test("motion-enabled scroll through the page logs no errors", async ({ browser }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const problems: string[] = [];
    page.on("pageerror", (e) => problems.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(m.text());
    });
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await page
      .locator("[data-contact-form]")
      .getByLabel("まだ整理できていない")
      .check();
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(80);
    }
    await expect(
      page
        .getByRole("navigation", { name: "入力の進み具合" })
        .locator("[aria-current=step]"),
    ).toHaveCount(1);
    expect(problems).toEqual([]);
    await context.close();
  }
});

test("touch screens scroll freely; only a fine pointer gets question snapping", async ({
  browser,
}) => {
  for (const [touch, expected] of [
    [true, /^$/],
    // Browsers serialise the default strictness away ("y proximity" -> "y").
    [false, /^y( proximity)?$/],
  ] as const) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: touch,
      isMobile: touch,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await page.goto("/contact");
    await page.waitForLoadState("networkidle");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.scrollSnapType))
      .toMatch(expected);
    if (touch) {
      // A slow drag that stops near 02 stays where the reader left it.
      const cdp = await context.newCDPSession(page);
      const drag = async (distance: number) => {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 200, y: 760 }],
        });
        for (let step = 1; step <= 8; step++) {
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x: 200, y: 760 - (distance * step) / 8 }],
          });
          await page.waitForTimeout(16);
        }
        await page.waitForTimeout(120);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await page.waitForTimeout(600);
      };
      const positions: number[] = [];
      for (let i = 0; i < 10; i++) {
        await drag(150);
        positions.push(await page.evaluate(() => Math.round(scrollY)));
      }
      for (let i = 1; i < positions.length; i++)
        expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
    }
    await context.close();
  }
});

test("progress labels and anchors reach each question", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const rail = page.getByRole("navigation", { name: "入力の進み具合" });
  await expect(rail.getByRole("link")).toHaveText([...progressLabels]);
  await rail.getByRole("link", { name: "ご連絡先" }).click();
  await expect(page.locator("#q04")).toBeInViewport();
});
