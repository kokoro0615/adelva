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

/* /services/management-operations (B 台杉): first viewport at the three
   required sizes in the reduced-motion representative state. Implementation-
   authored regression goldens; reference fidelity against the adopted
   prototypes is measured separately by scripts/adelva/compare-management-operations.mjs. */
for (const viewport of viewports) {
  test(`management-operations regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/services/management-operations");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter(
            (image) =>
              image.loading !== "lazy" &&
              image.getClientRects().length > 0 &&
              image.getBoundingClientRect().top < innerHeight,
          )
          .map((image) => image.decode().catch(() => {})),
      );
    });
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1, {
      timeout: 20_000,
    });
    // Narrow viewports draw the photograph into a canvas once its first images load.
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot(`management-operations-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}

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

/* /approach: first viewport at the three required sizes (finished state,
   reduced motion). Implementation-authored regression goldens; reference
   fidelity against the adopted mocks is measured separately by
   scripts/adelva/compare-approach.mjs. */
for (const viewport of viewports) {
  test(`approach regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/approach");
    await page.evaluate(async () => document.fonts.ready);
    await page.evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((image) => image.loading === "eager")
          .map((image) => image.decode().catch(() => {})),
      ),
    );
    await expect(page).toHaveScreenshot(`approach-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}

/* DX: adopted-reference comparisons remain separate in compare-dx-it-procurement.mjs. */
for (const viewport of viewports) {
  test(`dx-it-procurement regression at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/services/dx-it-procurement", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((image) => image.loading === "eager")
          .map((image) => image.decode().catch(() => {})),
      );
    });
    await expect(page).toHaveScreenshot(`dx-it-procurement-${viewport.name}.png`, {
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });
}

test.describe("dx-it-procurement process", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });
  for (const [name, tip] of [
    ["01", 160],
    ["04", 755],
    ["end", 1262],
  ] as const) {
    test(`dx-it-procurement process ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/services/dx-it-procurement", { waitUntil: "networkidle" });
      await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
      await page.evaluate(async (value) => {
        await document.fonts.ready;
        const section = document.querySelector("[data-process]")!;
        const r = section.getBoundingClientRect();
        window.scrollTo({
          top: r.top + scrollY + (value * r.width) / 1536 - innerHeight * 0.6,
          behavior: "instant",
        });
        await Promise.all(
          [...section.querySelectorAll("img")].map((image) => image.decode()),
        );
      }, tip);
      await page.waitForTimeout(2300);
      await expect(page).toHaveScreenshot(`dx-it-procurement-process-${name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: false,
        maxDiffPixelRatio: 0.005,
      });
    });
  }
});
