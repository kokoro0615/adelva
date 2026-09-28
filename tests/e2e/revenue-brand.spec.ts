import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { requiredStrings, route } from "../../src/content/adelva-revenue-brand";
async function ready(page: Page) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-revenue-brand]")).toHaveCount(1);
}
async function content(page: Page) {
  const text = await page.locator("main").textContent();
  for (const s of requiredStrings)
    expect(text?.replace(/\s+/g, "")).toContain(s.replace(/\s+/g, ""));
}
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 780],
  [1024, 768],
  [1920, 1080],
  [720, 450],
])
  test.describe(`revenue-brand ${width}`, () => {
    test.use({ viewport: { width, height } });
    test("copy, completed fallback, width, and shell", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await ready(page);
      await content(page);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page
          .locator("li[data-step]")
          .evaluateAll((ns) => ns.map((n) => n.getAttribute("data-state"))),
      ).toEqual(Array(6).fill("reached"));
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      expect(errors).toEqual([]);
    });
    if ([1440, 768, 390].includes(width))
      test("all text remains without photographs; axe", async ({ page }) => {
        await ready(page);
        await page.addStyleTag({ content: "img,picture{visibility:hidden!important}" });
        await content(page);
        await expect(page.locator("[data-river]:visible")).toHaveCount(1);
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(audit.violations).toEqual([]);
      });
  });
test("revenue-brand controls toggle by keyboard and anchors reach their section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const group = page.getByRole("group", { name: "集客・販売チャネルの要素" });
  const button = group.getByRole("button", { name: "公式サイト", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(group.getByRole("button", { name: "OTA", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.keyboard.press("Space");
  await expect(button).toHaveAttribute("aria-pressed", "false");
  const facility = page
    .getByRole("group", { name: "Photoブランディング" })
    .getByRole("button", { name: "施設", exact: true });
  await facility.click();
  await expect(page.locator("[data-revenue-brand]")).toHaveAttribute(
    "data-photo",
    "facility",
  );
  const corner = page.locator('[data-river="mobile"] [data-corner="0"]');
  await expect(corner).toHaveAttribute("transform", "translate(118 5753)");
  for (const id of ["rb-ch1", "rb-ch2", "rb-ch3"]) {
    await page.locator(`nav[aria-label="章目次"] a[href="#${id}"]`).click();
    await expect(page.locator(`#${id}-title`)).toBeInViewport();
  }
});
test.describe("revenue-brand no JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("has every string and completed process", async ({ page }) => {
    await page.goto(route);
    await content(page);
    await expect(page.locator("[data-counter]")).toHaveText("06");
  });
});
for (const [width, height] of [
  [1440, 900],
  [390, 844],
])
  test.describe(`revenue-brand motion ${width}`, () => {
    test.use({
      viewport: { width, height },
      contextOptions: { reducedMotion: "no-preference" },
    });
    test("advances all six steps, rewinds, and moves the viewfinder", async ({
      page,
    }) => {
      await ready(page);
      await expect(page.locator('[data-motion="on"]')).toHaveCount(1);
      await page.waitForTimeout(1800);
      for (const step of [1, 2, 3, 4, 5, 6, 3, 1]) {
        await page.evaluate((s) => {
          const river = [
            ...document.querySelectorAll<SVGSVGElement>("[data-river]"),
          ].find((n) => n.getBoundingClientRect().width > 0)!;
          const circle = river.querySelector<SVGCircleElement>(
            `[data-process-node="${s}"] circle`,
          )!;
          const r = river.getBoundingClientRect();
          const y =
            (circle.cy.baseVal.value * r.height) / river.viewBox.baseVal.height +
            r.top +
            scrollY -
            innerHeight * 0.58 +
            30;
          window.scrollTo({ top: y, behavior: "instant" });
        }, step);
        await expect(
          page.locator('li[data-step][data-state="current"]'),
        ).toHaveAttribute("data-step", String(step));
        await expect(page.locator("[data-counter]")).toHaveText(
          String(step).padStart(2, "0"),
        );
        expect(
          await page.locator('[data-progress-segment][data-reached="true"]').count(),
        ).toBe(step);
      }
      const food = page
        .getByRole("group", { name: "Photoブランディング" })
        .getByRole("button", { name: "料理", exact: true });
      await food.click();
      await expect(food).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(600);
      await expect(
        page.locator('[data-river]:visible [data-corner="0"]'),
      ).toHaveAttribute(
        "transform",
        width >= 1024 ? "translate(382 3186)" : "translate(124 5753)",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator("[data-motion]")).toHaveCount(0);
      await expect(page.locator("[data-counter]")).toHaveText("06");
    });
  });

test("revenue-brand restores its scroll position, survives resize, and keeps upcoming steps accessible", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo({ top: 6100, behavior: "instant" }));
  await page.waitForTimeout(1000);
  const before = await page.evaluate(() => scrollY);
  const audit = await new AxeBuilder({ page })
    .include("[data-revenue-brand] main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    audit.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? "")),
  ).toEqual([]);
  await page.goto("/contact");
  await page.goBack();
  await expect
    .poll(() => page.evaluate((y) => Math.abs(scrollY - y), before))
    .toBeLessThan(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-river="mobile"]')).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.reload();
  await expect(page.locator('[data-motion="on"]')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("revenue-brand has no console warnings after resource settling", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (!["warning", "error"].includes(m.type())) return;
    // Site-wide Next.js behaviour, also on /services/management-operations:
    // a prefetched route's stylesheet preload can outlive the load event.
    if (/preloaded using link preload but not used/.test(m.text())) return;
    errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await page.waitForTimeout(7000);
  expect(errors).toEqual([]);
});

/* The light, current and ignitions only run while motion is allowed and the
   reader scrolls, so check them there: every ignition fires on the way down. */
for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const)
  test(`revenue-brand motion ${width}: scrolling the whole page logs no errors and ignites`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (!["warning", "error"].includes(m.type())) return;
      if (/preloaded using link preload but not used/.test(m.text())) return;
      errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await ready(page);
    await expect(page.locator('[data-motion="on"]')).toHaveCount(1);
    const river = page.locator(
      `svg[data-river="${width >= 1024 ? "desktop" : "mobile"}"]`,
    );
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += 300) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
    // The bursts were used and have faded; the head reached the end.
    await expect(river.locator("[data-burst]").first()).toHaveAttribute(
      "transform",
      /translate/,
    );
    await expect(page.locator('li[data-step="6"]')).toHaveAttribute(
      "data-state",
      "current",
    );
    await context.close();
  });
