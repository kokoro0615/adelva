import { expect, test, type Locator } from "@playwright/test";

// The configured external server may be a development server. Its inspector
// is tooling chrome and must not intercept the production footer controls.
test.beforeEach(async ({ page }) => {
  if (process.env.NOSIGNER_TEST_BASE_URL) {
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal{display:none!important}";
        document.head.appendChild(style);
      });
    });
  }
});

async function displacement(track: Locator) {
  return track.evaluate(async (element) => {
    const x = () => new DOMMatrix(getComputedStyle(element).transform).m41;
    const before = x();
    await new Promise((resolve) => setTimeout(resolve, 350));
    return x() - before;
  });
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: HOW and WHY motion, focus pause and page motion preference`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await page.mouse.move(0, 0);

    for (const section of ["#section-how", "#section-why"]) {
      for (const direction of ["ns-left", "ns-right"]) {
        const track = page.locator(`${section} .${direction}`).first();
        await track.locator("..").scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        await expect(track).toHaveCSS("animation-play-state", "running");
        const delta = await displacement(track);
        expect(direction === "ns-left" ? -delta : delta).toBeGreaterThan(5);
      }
    }

    const row = page.locator(".ns-strip").first();
    const track = row.locator(".ns-strip-track");
    await row.scrollIntoViewIfNeeded();
    await row.locator(".ns-strip-link").focus();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    expect(Math.abs(await displacement(track))).toBeLessThan(0.1);
    await page
      .locator(".ns-strip-link")
      .evaluateAll((links) => links.forEach((link) => (link as HTMLElement).blur()));
    await page.mouse.move(0, 0);
    await page.getByRole("button", { name: "動きを一時停止" }).click();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    expect(Math.abs(await displacement(track))).toBeLessThan(0.1);
    await page.getByRole("button", { name: "動きを再生" }).click();
    await expect(track).toHaveCSS("animation-play-state", "running");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(track).toHaveCSS("animation-name", "none");
    expect(Math.abs(await displacement(track))).toBeLessThan(0.1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    );
  });
}
