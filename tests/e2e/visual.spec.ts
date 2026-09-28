import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`home regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(async () => document.fonts.ready);
    await expect(page).toHaveScreenshot(`home-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}

/* /services/management-operations: first viewport at the three required sizes
   (finished state, reduced motion) and the pinned process at 0 / 0.6 / 1.0.
   Implementation-authored regression goldens; reference fidelity is measured
   separately by scripts/adelva/compare-management-operations.mjs. */
for (const viewport of viewports) {
  test(`management-operations regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/services/management-operations");
    await page.evaluate(async () => document.fonts.ready);
    await page.evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((image) => image.loading === "eager")
          .map((image) => image.decode().catch(() => {})),
      ),
    );
    await expect(page).toHaveScreenshot(`management-operations-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}

test.describe("management-operations pinned process", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });
  for (const [name, progress] of [
    ["00", 0],
    ["06", 0.6],
    ["10", 1],
  ] as const) {
    test(`management-operations process ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await page.goto("/services/management-operations");
      await page.evaluate(async () => document.fonts.ready);
      await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
      await page.evaluate((fraction) => {
        const section = document.querySelector<HTMLElement>("[data-process]")!;
        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: top + fraction * window.innerHeight * 5,
          behavior: "instant",
        });
      }, progress);
      await expect(page.locator("[data-stage]")).toHaveAttribute(
        "data-progress",
        String(Math.round(progress * 5) + 1),
      );
      await page.evaluate(() =>
        Promise.all(
          [...document.querySelectorAll<HTMLImageElement>("[data-plate] img")]
            .filter((image) => image.getClientRects().length > 0)
            .map((image) => image.decode().catch(() => {})),
        ),
      );
      await page.waitForTimeout(2200);
      await expect(page).toHaveScreenshot(`management-operations-process-${name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

/* revenue-brand: implementation regression, separate from A4 reference fidelity. */
for (const viewport of viewports) {
  test(`revenue-brand regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/services/revenue-brand");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter(
            (image) =>
              image.getClientRects().length > 0 &&
              image.getBoundingClientRect().top < innerHeight,
          )
          .map((image) => image.decode()),
      );
    });
    await expect(page).toHaveScreenshot(`revenue-brand-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}
