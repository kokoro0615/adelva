import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: HOW/WHY preserve reference row geometry and 40px/s motion`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    const expectedHeight =
      viewport.width < 768 ? 257 : Math.max(300, viewport.width * 0.234375);
    for (const section of ["#section-how", "#section-why"]) {
      for (const direction of ["ns-left", "ns-right"]) {
        const row = page
          .locator(`${section} .ns-strip`)
          .filter({ has: page.locator(`.${direction}`) })
          .first();
        await row.scrollIntoViewIfNeeded();
        await page.mouse.move(0, 0);
        const track = row.locator(".ns-strip-track");
        await expect(track).toHaveCSS("animation-play-state", "running");
        expect((await row.boundingBox())!.height).toBeCloseTo(expectedHeight, 1);
        const speed = await track.evaluate(async (el) => {
          // Sample the actual compositor transform against the animation timeline,
          // which avoids test-runner wall-clock scheduling noise.
          const animation = el.getAnimations()[0];
          const before = {
            x: new DOMMatrix(getComputedStyle(el).transform).m41,
            t: Number(animation.currentTime),
          };
          await new Promise((resolve) => setTimeout(resolve, 450));
          const after = {
            x: new DOMMatrix(getComputedStyle(el).transform).m41,
            t: Number(animation.currentTime),
          };
          return (after.x - before.x) / ((after.t - before.t) / 1000);
        });
        expect(speed).toBeCloseTo(direction === "ns-left" ? -40 : 40, 0);
        await row.locator(".ns-strip-link").focus();
        await expect(track).toHaveCSS("animation-play-state", "paused");
        await page.locator(":focus").evaluate((el) => (el as HTMLElement).blur());
      }
    }
    const row = page.locator(".ns-strip").first();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await expect(row.locator(".ns-strip-track")).toHaveCSS(
      "animation-play-state",
      "paused",
    );
    await expect(row.locator(".ns-strip-link")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0.8)",
    );
    await page.mouse.move(0, 0);
    await expect(row.locator(".ns-strip-track")).toHaveCSS(
      "animation-play-state",
      "running",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(row.locator(".ns-strip-track")).toHaveCSS("animation-name", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    );
  });
}
