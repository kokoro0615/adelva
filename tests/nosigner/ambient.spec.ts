import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

test.use({
  launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] },
});
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: procedural background moves, freezes, reverses and keeps chapter text accessible`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        options?: object,
      ) {
        return original.call(
          this,
          kind,
          kind.includes("webgl")
            ? { ...options, preserveDrawingBuffer: true }
            : options,
        );
      } as typeof original;
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/challenges");
    const canvas = page.locator(".ns-ambient");
    await expect(canvas).toHaveAttribute("data-renderer", "webgl");
    await expect(page.locator("[data-ns-ready=true]")).toBeVisible();
    const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    await page.evaluate(() => scrollTo(0, 900));
    await page.waitForTimeout(1000);
    const first = await pixels();
    await page.waitForTimeout(300);
    expect(await pixels()).not.toBe(first);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-motion", "paused");
    const frozen = await pixels();
    await page.waitForTimeout(300);
    expect(await pixels()).toBe(frozen);
    for (const [section, theme] of [
      ["quote-form", "light"],
      ["quote-future", "dark"],
    ] as const) {
      const quote = page.locator(`[data-ns-section="${section}"]`);
      await quote.scrollIntoViewIfNeeded();
      await expect(page.locator(".ns-page")).toHaveAttribute(
        "data-ambient-theme",
        theme,
      );
      await expect(quote).toHaveCSS("background-image", "none");
      await expect(quote).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
    await page.evaluate(() => scrollTo(0, 900));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(canvas).toHaveAttribute("data-motion", "running");
    const resumed = await pixels();
    await page.waitForTimeout(300);
    expect(await pixels()).not.toBe(resumed);
    await page.getByRole("button", { name: "動きを一時停止" }).click();
    await expect(canvas).toHaveAttribute("data-motion", "paused");
    const stopped = await pixels();
    await page.waitForTimeout(300);
    expect(await pixels()).toBe(stopped);
    await page.setViewportSize({
      width: viewport.width - 20,
      height: viewport.height - 20,
    });
    await expect
      .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.height))
      .toBe(viewport.height - 20);
    expect(errors).toEqual([]);
  });
}

test("GPU unavailable retains a visible, theme-aware fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      options?: object,
    ) {
      return kind.includes("webgl") ? null : original.call(this, kind, options);
    } as typeof original;
  });
  await page.goto("/challenges");
  await expect(page.locator(".ns-ambient")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await page.locator('[data-ns-section="quote-form"]').scrollIntoViewIfNeeded();
  await expect(page.locator(".ns-ambient")).toHaveCSS(
    "background-color",
    "rgb(241, 242, 236)",
  );
});
