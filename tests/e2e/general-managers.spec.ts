import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  chapters,
  challengesCopy,
  contact,
  decision,
  execution,
  hero,
  issues,
  roles,
  support,
  verification,
} from "../../src/content/adelva-general-managers";

const route = "/challenges/general-managers";
const plain = (s: string) => s.replace(/\n|<d>|<m>/g, "");
const required = [
  hero.eyebrow,
  ...hero.title,
  plain(hero.lead),
  ...chapters.map((c) => c.label),
  plain(challengesCopy.title),
  plain(challengesCopy.body),
  ...issues.flatMap((i) => [i.title, i.description]),
  plain(decision.title),
  ...decision.points.flatMap((p) => [plain(p.title), plain(p.text)]),
  plain(support.title),
  ...support.heads,
  ...support.rows.flatMap((r) => [r.judge, plain(r.combo), plain(r.keep)]),
  plain(support.note),
  plain(roles.title),
  ...roles.items.flatMap((r) => [r.name, plain(r.text)]),
  plain(roles.agreement),
  roles.crossNote,
  roles.cross.label,
  plain(execution.title),
  plain(execution.body),
  ...execution.steps,
  execution.approach.label,
  plain(verification.title),
  ...verification.items.flatMap((v) => [v.title, plain(v.text)]),
  plain(contact.title),
  contact.action.label,
  contact.flowLabel,
  ...contact.flow,
];

async function open(page: Page) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-general-managers]")).toHaveCount(1);
}

const issue = (page: Page, id: string) =>
  page.locator(`input[name="issue"][value="${id}"]`);
const litOpacity = (page: Page, id: string) =>
  page
    .locator(`[data-issue="${id}"][style*="--ox"]:visible`)
    .first()
    .evaluate((n) => Number(getComputedStyle(n).opacity));

for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [1920, 1080],
  [768, 1024],
  [390, 844],
  [360, 780],
])
  test.describe(`general-managers ${width}`, () => {
    test.use({ viewport: { width, height } });

    test("copy, one h1, width, shell, scenes do not overlap", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await open(page);
      const text = (await page.locator("main").textContent())?.replace(/\s+/g, "");
      for (const s of required) expect(text, s).toContain(s.replace(/\s+/g, ""));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main h2")).toHaveCount(7);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      // every scene's content ends before the next scene's content begins
      const overlaps = await page.evaluate(() => {
        const bad: string[] = [];
        const sections = [
          ...document.querySelectorAll<HTMLElement>("section[data-chapter]"),
        ];
        for (let i = 0; i < sections.length - 1; i++) {
          const flow = [
            ...sections[i].querySelectorAll<HTMLElement>(":scope > div > *"),
          ].filter(
            (n) =>
              getComputedStyle(n).position !== "absolute" && n.getClientRects().length,
          );
          const bottom = Math.max(...flow.map((n) => n.getBoundingClientRect().bottom));
          const next = sections[i + 1].getBoundingClientRect().top;
          if (bottom > next + 1) bad.push(`${i}: ${bottom} > ${next}`);
        }
        return bad;
      });
      expect(overlaps).toEqual([]);
      expect(errors).toEqual([]);
    });

    if ([1440, 768, 390].includes(width))
      test("axe before and after choosing; text stays without photographs", async ({
        page,
      }) => {
        await open(page);
        const scan = async () =>
          (
            await new AxeBuilder({ page })
              .include("[data-general-managers]")
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .analyze()
          ).violations;
        expect(await scan()).toEqual([]);
        await issue(page, "quality").check({ force: true });
        await issue(page, "system").check({ force: true });
        await page
          .locator('input[name="point"][value="authority"]')
          .check({ force: true });
        expect(await scan()).toEqual([]);
        await page.addStyleTag({ content: "img,picture{visibility:hidden!important}" });
        const text = (await page.locator("main").textContent())?.replace(/\s+/g, "");
        for (const s of required.slice(0, 10))
          expect(text).toContain(s.replace(/\s+/g, ""));
      });
  });

test.describe("general-managers interaction", () => {
  test("choosing a terrace lights it and carries the issue to 03 and 07", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    expect(await litOpacity(page, "people")).toBe(0);
    await expect(
      page.locator('[role="row"][data-issues~="people"] [data-issue="people"]'),
    ).toBeHidden();
    // keyboard: tab to the checkbox and toggle with Space
    await issue(page, "people").focus();
    await page.keyboard.press("Space");
    await expect(issue(page, "people")).toBeChecked();
    await expect.poll(() => litOpacity(page, "people")).toBe(1);
    await expect(
      page.locator('[role="row"][data-issues~="people"] [data-issue="people"]'),
    ).toBeVisible();
    await expect(page.locator(`#gm-07 [data-issue="people"]`)).toBeVisible();
    await expect(page.locator(`#gm-07 [data-issue="quality"]`)).toBeHidden();
    await page.keyboard.press("Space");
    await expect.poll(() => litOpacity(page, "people")).toBe(0);
    await expect(page.locator(`#gm-07 [data-issue="people"]`)).toBeHidden();
  });

  test("points of judgement switch the marks on the photograph", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const tag = (text: string) => page.locator(`p[data-modes]`, { hasText: text });
    await expect(tag(decision.symptom)).toBeVisible();
    await expect(tag(decision.management)).toBeHidden();
    const group = page.getByRole("radiogroup", { name: decision.groupLabel });
    await group.getByRole("radio", { name: /現場判断と/ }).check({ force: true });
    await expect(tag(decision.management)).toBeVisible();
    await expect(tag(decision.field)).toBeVisible();
    await expect(tag(decision.symptom)).toBeHidden();
    // arrow keys move within the group
    await group.getByRole("radio", { name: /現場判断と/ }).focus();
    await page.keyboard.press("ArrowUp");
    await expect(
      group.getByRole("radio", { name: "優先順位と影響範囲" }),
    ).toBeChecked();
  });

  test("the chapter index links to each chapter and marks the current one", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const nav = page.getByRole("navigation", { name: "このページの章" });
    await nav.getByRole("link", { name: /確認する内容/ }).click();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#gm-06");
    await expect(nav.locator(':scope > ol [aria-current="location"]')).toContainText(
      "確認する内容",
    );
  });

  test("mobile: tray, related support and the chapter sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const tray = page.locator("[data-tray]");
    await expect(tray).toHaveAttribute("data-open", "false");
    await page.locator("#gm-01").scrollIntoViewIfNeeded();
    await issue(page, "sales").check({ force: true });
    await issue(page, "people").check({ force: true });
    await expect(tray).toHaveAttribute("data-open", "true");
    await expect(page.locator("[data-general-managers] [role=status]")).toHaveText(
      "2件を選択中",
    );
    await expect(tray).toContainText("人材");
    await tray.getByRole("link", { name: /関係する支援/ }).click();
    await expect(page.locator("#gm-support-1")).toBeFocused();
    // the sheet: open, move focus inside, close with Escape and return focus
    const open_ = page.getByRole("button", { name: /章の一覧を開く/ });
    await open_.click();
    const sheet = page.getByRole("dialog", { name: "このページの章" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(open_).toBeFocused();
    await open_.click();
    await sheet.getByRole("link", { name: /実行から引継ぎまで/ }).click();
    await expect(sheet).toBeHidden();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#gm-05");
  });

  test("links go to live routes", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const main = page.locator("main");
    expect(
      await main
        .getByRole("link", { name: /問い合わせを送信/ })
        .first()
        .getAttribute("href"),
    ).toBe("/contact");
    expect(
      await main.getByRole("link", { name: /支援の進め方を見る/ }).getAttribute("href"),
    ).toBe("/approach");
    expect(
      await main
        .getByRole("link", { name: /オーナー・経営者の方へ/ })
        .getAttribute("href"),
    ).toBe("/challenges/owner");
  });
});

test("no JavaScript: 320 px reflow, and a checkbox still lights its terrace", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 844 },
    baseURL,
  });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.locator("h1")).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.locator('label[data-issue="productivity"]').click();
  await expect(issue(page, "productivity")).toBeChecked();
  await expect.poll(() => litOpacity(page, "productivity")).toBe(1);
  await expect(page.locator(`#gm-07 [data-issue="productivity"]`)).toBeVisible();
  await context.close();
});

test.describe("general-managers motion", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ])
    test(`${width}: full scroll with motion has no runtime errors and ends complete`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.setViewportSize({ width, height });
      await open(page);
      await expect(page.locator("[data-general-managers]")).toHaveAttribute(
        "data-motion",
        "on",
      );
      await issue(page, "quality").check({ force: true });
      for (let y = 0; y < 16000; y += 500) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(1500);
      // at the end of the scroll every spill has been reached
      expect(
        await page
          .locator("[data-gate]")
          .evaluateAll((ns) => ns.map((n) => n.getAttribute("data-state"))),
      ).toEqual(Array(6).fill("done"));
      expect(errors).toEqual([]);
    });
});
