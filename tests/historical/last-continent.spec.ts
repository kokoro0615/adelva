import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

const viewports = [
  { name: "desktop", width: 1440, height: 900, x: 484, quoteY: 373.59375 },
  { name: "tablet", width: 768, height: 1024, x: 260, quoteY: 373.59375 },
  { name: "mobile", width: 390, height: 844, x: 59.25, quoteY: 257.59375 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name}: decoded mist joins the white section without a horizontal seam`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 100));
    await expect(page.locator(".home-hero__wrapper")).toHaveCSS("transform", /matrix/);
    await page.locator(".home-hero__mist-image").evaluate(async (element) => {
      const image = element as HTMLImageElement;
      image.loading = "eager";
      await image.decode();
    });
    for (const f of [1.1, 1.3, 1.333, 1.5, 1.8, 1.1]) {
      await page.evaluate((y) => window.scrollTo(0, y), viewport.height * f);
      await expect
        .poll(async () =>
          Math.abs((await page.evaluate(() => window.scrollY)) - viewport.height * f),
        )
        .toBeLessThanOrEqual(0.5);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const sectionY = await page
        .locator(".last-continent")
        .evaluate((e) => e.getBoundingClientRect().top);
      const boundary = Math.round(sectionY);
      const { data, info } = await sharp(await page.screenshot())
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const differences = [0.2, 0.3, 0.4, 0.6, 0.7, 0.8].flatMap((fraction) => {
        const x = Math.floor(viewport.width * fraction);
        return [0, 1, 2].map((channel) => {
          let above = 0,
            below = 0;
          for (let dy = 1; dy <= 3; dy++) {
            above += data[((boundary - dy) * info.width + x) * 3 + channel];
            below += data[((boundary + dy) * info.width + x) * 3 + channel];
          }
          return Math.abs(above - below) / 3;
        });
      });
      expect(
        Math.max(...differences),
        `maximum RGB discontinuity at f=${f}`,
      ).toBeLessThanOrEqual(5);
      expect(
        differences.reduce((sum, n) => sum + n, 0) / differences.length,
        `mean RGB discontinuity at f=${f}`,
      ).toBeLessThanOrEqual(3);
    }
  });

  for (const motion of ["no-preference", "reduce"] as const) {
    test(`${viewport.name}/${motion}: Last Continent covers the hero at both edges`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const section = page.locator(".last-continent");
      const initial = await section.boundingBox();
      expect(initial).not.toBeNull();
      // External measurements: the content is inset 12px, the surface is not.
      expect(initial!.x).toBe(0);
      expect(initial!.width).toBe(viewport.width);
      const quote = await section.locator("h3").boundingBox();
      expect(quote!.x).toBeCloseTo(viewport.x, 1);
      expect(quote!.y - initial!.y).toBeCloseTo(viewport.quoteY, 1);

      for (const offset of [-viewport.height / 2, 0, 200, 0]) {
        const top = 2 * viewport.height + offset;
        await page.evaluate((y) => window.scrollTo(0, y), top);
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(top);
        await expect
          .poll(() =>
            section.evaluate((e) => {
              const box = e.getBoundingClientRect();
              const y = Math.min(innerHeight - 100, Math.max(150, box.top + 240));
              return [1, innerWidth - 1].every((x) => {
                const hit = document.elementFromPoint(x, y);
                return hit === e || e.contains(hit);
              });
            }),
          )
          .toBe(true);
      }
      expect(await section.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
        "rgb(255, 255, 255)",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
        viewport.width,
      );
      const axe = await new AxeBuilder({ page })
        .include(".last-continent")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

for (const viewport of viewports) {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`${viewport.name}: season sky joins the quote without a bright horizontal edge (${reducedMotion})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".season__image").evaluate(async (element) => {
        const image = element as HTMLImageElement;
        image.loading = "eager";
        await image.decode();
      });
      const top = await page
        .locator(".season")
        .evaluate((element) => element.getBoundingClientRect().top + scrollY);
      for (const fraction of [0.55, 0.32, 0.333, 0.55]) {
        await page.evaluate(
          (y) => scrollTo({ top: y, behavior: "instant" }),
          top - viewport.height * fraction,
        );
        await expect
          .poll(async () =>
            Math.abs(
              (await page.evaluate(() => scrollY)) - (top - viewport.height * fraction),
            ),
          )
          .toBeLessThanOrEqual(0.5);
        const boundary = Math.round(
          await page
            .locator(".season")
            .evaluate((element) => element.getBoundingClientRect().top),
        );
        const { data, info } = await sharp(await page.screenshot())
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        // Sample away from the decorative column rules and fixed shell controls.
        const jumps = [0.25, 0.4, 0.6, 0.75].flatMap((xFraction) => {
          const x = Math.floor(viewport.width * xFraction);
          return [0, 1, 2].map((channel) =>
            Math.abs(
              data[((boundary - 3) * info.width + x) * 3 + channel] -
                data[((boundary + 3) * info.width + x) * 3 + channel],
            ),
          );
        });
        expect(
          Math.max(...jumps),
          `season boundary RGB jump at ${fraction}`,
        ).toBeLessThanOrEqual(5);
      }
    });
  }
}
