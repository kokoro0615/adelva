import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: camps remain visible over their background and reverse cleanly`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".camps__track")).toHaveAttribute("style", /transform/);
    const origin = await page
      .locator(".camps")
      .evaluate((e) => e.getBoundingClientRect().top + scrollY);
    const distance = await page
      .locator(".camps")
      .evaluate((e) => e.clientHeight - innerHeight);
    const sample = async (offset: number) => {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        origin + offset,
      );
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBe(Math.round(origin + offset));
      await page.evaluate(() => new Promise(requestAnimationFrame));
      return page
        .locator(".camps__track")
        .evaluate((e) => getComputedStyle(e).transform);
    };
    const mid = await sample(distance * 0.58);
    await expect(page.locator(".camps__viewport")).toBeInViewport();
    // A correctly translated track can still be entirely covered by its own
    // counter-translated intro. Hit testing catches that stacking regression.
    const visibleCard = await page.locator(".camps__link").evaluateAll((links) =>
      links.some((link) => {
        const r = link.getBoundingClientRect();
        const x =
          Math.max(0, r.left) +
          (Math.min(innerWidth, r.right) - Math.max(0, r.left)) / 2;
        return (
          r.right > 0 &&
          r.left < innerWidth &&
          link.contains(document.elementFromPoint(x, r.top + r.height / 2))
        );
      }),
    );
    expect(visibleCard).toBe(true);
    await sample(distance);
    expect(await sample(distance * 0.58)).toBe(mid);
    await sample(0);
    await expect(page.locator(".camps__mask rect").first()).toHaveAttribute(
      "width",
      "0.3333",
    );
    await sample(distance + viewport.height + 550);
    const bridge = await page.locator(".bridge__route").boundingBox();
    expect(bridge).not.toBeNull();
    expect(bridge!.y + bridge!.height).toBeGreaterThan(0);
    expect(bridge!.y).toBeLessThan(viewport.height);
    if (viewport.width === 390) {
      const globeTop = await page
        .locator(".globe")
        .evaluate((e) => e.getBoundingClientRect().top + scrollY);
      await page.evaluate(
        (y) => scrollTo({ top: y + 720, behavior: "instant" }),
        globeTop,
      );
      // Independent mobile target sample: film y=116.84, info y=343.72.
      await expect
        .poll(async () => (await page.locator(".globe__film-card").boundingBox())!.y)
        .toBeGreaterThan(114);
      const film = (await page.locator(".globe__film-card").boundingBox())!;
      const info = (await page.locator(".globe__info-card").boundingBox())!;
      expect(Math.abs(film.y - 116.84)).toBeLessThan(3);
      expect(Math.abs(info.y - 343.72)).toBeLessThan(3);
      for (const value of await page.locator(".globe__stat dd").all()) {
        expect(await value.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    ).toBe(false);
  });

  test(`${viewport.width}: lower content remains readable with reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".camps__copy")).toHaveCount(3);
    for (const link of await page.locator(".camps__link").all()) {
      await link.focus();
      await expect(link).toBeFocused();
      await expect(link).toBeInViewport();
      await expect(link.locator(".camps__copy")).toBeVisible();
    }
    const results = await new AxeBuilder({ page })
      .include(".longform")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
