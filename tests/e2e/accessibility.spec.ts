import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const representativeRoutes = [
  "/",
  "/itineraries",
  "/camps/echo-base",
  "/itineraries/south-pole-blue-rivers",
  "/antarctica/polar-plateau",
  "/prices",
  "/enquire",
  "/legal/privacy-policy",
];

for (const route of representativeRoutes) {
  test(`${route} has no automatically detectable WCAG A/AA violations`, async ({
    page,
  }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
