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
