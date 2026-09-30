import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { requiredStrings, route } from "../../src/content/adelva-about";

async function ready(page: Page) {
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-about]")).toHaveCount(1);
}
async function content(page: Page) {
  const text = (await page.locator("main").textContent())?.replace(/\s+/g, "");
  for (const s of requiredStrings) expect(text).toContain(s.replace(/\s+/g, ""));
}
/** Scroll through the whole page in steps so lazy art and triggers settle. */
async function walk(page: Page, step = 500) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(40);
  }
}

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [360, 780],
  [1024, 768],
  [1920, 1080],
])
  test.describe(`about ${width}`, () => {
    test.use({ viewport: { width, height } });
    test("copy, landmarks, completed static state and width", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await ready(page);
      await content(page);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main h2")).toHaveCount(6);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      await expect(page.locator("nav[aria-label='このページの章'] a")).toHaveCount(4);
      await expect(page.locator("[data-title-block] dt")).toHaveCount(5);
      // Reduced motion: no hold, no canvas, every mark drawn.
      expect(
        await page
          .locator("[data-seg='b']")
          .evaluate((n) => getComputedStyle(n).position),
      ).toBe("relative");
      await expect(page.locator("[data-front]")).toBeHidden();
      const kind = width >= 1024 ? "desktop" : "mobile";
      await expect(page.locator(`[data-marks="a-${kind}"] [data-ring]`)).toHaveCount(3);
      await expect(page.locator(`[data-marks="b-${kind}"] [data-ring]`)).toHaveCount(3);
      await walk(page);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      const broken = await page.locator("main img").evaluateAll((imgs) =>
        imgs
          .map((i) => i as HTMLImageElement)
          .filter(
            (i) => i.getClientRects().length && i.complete && i.naturalWidth === 0,
          )
          .map((i) => i.currentSrc),
      );
      expect(broken).toEqual([]);
      expect(errors).toEqual([]);
    });
    if ([1440, 768, 390].includes(width))
      test("axe WCAG 2.2 AA, and all text without the art", async ({ page }) => {
        await ready(page);
        const audit = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(audit.violations).toEqual([]);
        await page.addStyleTag({
          content: "img,picture,canvas{visibility:hidden!important}",
        });
        await content(page);
      });
  });

test.describe("about no JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("reads completely with the marks drawn and no hold", async ({ page }) => {
    await page.goto(route);
    await content(page);
    await expect(
      page.locator("[data-marks='a-desktop'] [data-lead='gable'] path"),
    ).toHaveAttribute("d", /^M435\.0 1184\.6/);
    expect(
      await page
        .locator("[data-seg='b']")
        .evaluate((n) => getComputedStyle(n).position),
    ).toBe("relative");
  });
});

test("about rows focus their rings, and the index reaches every chapter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const row = page.locator("[data-row='c01'] a");
  await row.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(row).toBeFocused();
  await expect
    .poll(() =>
      page
        .locator("[data-reveal='c01']:visible")
        .evaluate((n) => getComputedStyle(n).clipPath),
    )
    .toMatch(/circle\((9[0-9]|1[0-9]{2})(\.\d+)?px/);
  expect(
    await page
      .locator("[data-marks='b-desktop'] [data-ring='c01'] path")
      .first()
      .evaluate((n) => getComputedStyle(n).strokeWidth),
  ).toBe("3.2px");
  for (const id of ["role", "domains", "stance", "company"]) {
    await page.locator(`nav[aria-label='このページの章'] a[href='#${id}']`).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
])
  test.describe(`about motion ${width}`, () => {
    test.use({
      viewport: { width, height },
      contextOptions: { reducedMotion: "no-preference" },
    });
    test("holds the domains while the front runs, then hands over and rewinds", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await ready(page);
      await expect(page.locator("[data-about][data-motion='on']")).toHaveCount(1);
      const kind = width >= 1024 ? "desktop" : "mobile";
      const geometry = await page.evaluate(() => {
        const pin = document.querySelector<HTMLElement>("[data-pin]")!;
        const seg = pin.querySelector<HTMLElement>("[data-seg='b']")!;
        return {
          top:
            pin.getBoundingClientRect().top +
            scrollY -
            (parseFloat(getComputedStyle(seg).top) || 0),
          distance: pin.offsetHeight - seg.offsetHeight,
          position: getComputedStyle(seg).position,
        };
      });
      expect(geometry.position).toBe("sticky");
      expect(geometry.distance).toBeGreaterThan(height * 0.9);
      const at = async (f: number) => {
        const y = Math.round(geometry.top + geometry.distance * f);
        const from = await page.evaluate(() => scrollY);
        for (let i = 1; i <= 10; i++) {
          await page.evaluate(
            (t) => window.scrollTo(0, t),
            from + ((y - from) * i) / 10,
          );
          await page.waitForTimeout(40);
        }
        await page.waitForTimeout(1400);
      };
      const opacities = () =>
        page
          .locator(`[data-marks="b-${kind}"] [data-ring]`)
          .evaluateAll((gs) =>
            gs.map((g) => Number((g as SVGGElement).style.opacity || "1")),
          );
      await at(0);
      await expect(page.locator("[data-front][data-ready='true']")).toHaveCount(1);
      await expect(page.locator("a[data-zone='domains']")).toHaveAttribute(
        "aria-current",
        "location",
      );
      expect(await opacities()).toEqual([1, 1, 1]);
      // The held segment does not move while the front runs.
      const segTop = () =>
        page
          .locator("[data-seg='b']")
          .evaluate((n) => Math.round(n.getBoundingClientRect().top));
      const heldAt = await segTop();
      await at(0.55);
      expect(await segTop()).toBe(heldAt);
      await at(1);
      expect(await opacities()).toEqual([0, 0, 0]);
      await at(0);
      expect(await opacities()).toEqual([1, 1, 1]);
      await walk(page, 700);
      await expect(page.locator("a[data-zone='company']")).toHaveAttribute(
        "aria-current",
        "location",
      );
      await expect(page.locator("[data-title-block] dd").first()).toHaveCSS(
        "opacity",
        "1",
      );
      expect(errors).toEqual([]);
    });
  });
