import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const representativeRoutes = [
  "/",
  "/services/management-operations",
  "/services/revenue-brand",
  "/services/dx-it-procurement",
  "/approach",
  // The not-found document (Japanese ADELVA 404).
  "/this-page-does-not-exist",
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
