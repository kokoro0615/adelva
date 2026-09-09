import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: headings follow the continuous light/dark field`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    for (const section of ["section-how", "section-why"]) {
      await page.evaluate(
        (id) =>
          window.scrollTo(
            0,
            document.getElementById(id)!.getBoundingClientRect().top + scrollY - 170,
          ),
        section,
      );
      const heading = page.locator(`#${section} .ns-heading`);
      await expect(heading).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(heading).toHaveCSS("color", "rgb(0, 0, 0)");
    }
    // The source changes to dark only once HOW's trailing boundary leaves
    // its observer margin, not simply because the WHY heading is visible.
    await page.evaluate(() =>
      window.scrollTo(
        0,
        document.getElementById("section-why")!.getBoundingClientRect().top +
          scrollY +
          150,
      ),
    );
    await expect(page.locator("#section-why .ns-heading")).toHaveCSS(
      "color",
      "rgb(255, 255, 255)",
    );
  });
}
