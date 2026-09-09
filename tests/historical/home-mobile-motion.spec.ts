import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import reference from "../fixtures/home-mobile-motion-reference.json" with { type: "json" };

for (const viewport of reference.viewports) {
  test(`${viewport.width}: HOME entry choreography matches independent reference samples and reverses`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator('[data-home-motion-ready="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const top = await page
      .locator(".camps")
      .evaluate((e) => e.getBoundingClientRect().top + scrollY);
    for (const sample of viewport.samples) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        top + viewport.height * sample.fraction,
      );
      await expect
        .poll(async () =>
          Math.abs(
            (await page.evaluate(() => scrollY)) -
              (top + viewport.height * sample.fraction),
          ),
        )
        .toBeLessThanOrEqual(0.5);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      // Match the settled external sampling window, including the desktop
      // smoother's ticker adopting an instant programmatic scroll.
      await page.waitForTimeout(200);
      await expect
        .poll(async () => {
          return page.locator(".camps").evaluate((e) => {
            const heading = e.querySelector(".camps__heading")!;
            const style = getComputedStyle(heading);
            return (
              parseFloat(style.fontSize) * new DOMMatrixReadOnly(style.transform).a
            );
          });
        })
        .toBeCloseTo(sample.fontSize, 0);
      const measured = await page.locator(".camps").evaluate((e) => ({
        x: new DOMMatrixReadOnly(
          getComputedStyle(e.querySelector(".camps__track")!).transform,
        ).m41,
        y: parseFloat(getComputedStyle(e.querySelector(".camps__intro-detail")!).top),
        clip: getComputedStyle(e.parentElement!).clipPath,
      }));
      expect(Math.abs(measured.x - sample.trackX)).toBeLessThan(2);
      expect(Math.abs(measured.y - sample.copyY)).toBeLessThan(1);
      const percent = Number(measured.clip.match(/([\d.]+)%/)?.[1] ?? 0);
      expect(Math.abs(percent - sample.inset)).toBeLessThan(0.1);
    }
    // Content-relative trigger framing keeps approved translations independent
    // from the target's string length and resulting paragraph height.
    const quote = page.locator(".last-continent__quote");
    const bounds = await quote.evaluate((e) => ({
      top: e.getBoundingClientRect().top + scrollY,
      height: e.getBoundingClientRect().height,
    }));
    for (const progress of [0, 0.5, 1, 0.5, 0]) {
      const y =
        bounds.top -
        viewport.height * 0.8 +
        progress * (bounds.height + viewport.height * 0.2);
      await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y);
      await expect
        .poll(() =>
          quote.evaluate((e) =>
            Number(getComputedStyle(e).getPropertyValue("--home-copy-reveal")),
          ),
        )
        .toBeCloseTo(-40 + progress * 140, 0);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(quote).toHaveCSS("mask-image", "none");
    await expect(page.locator(".longform")).toHaveCSS("clip-path", "none");
    await expect
      .poll(() =>
        page
          .locator(".camps__heading")
          .evaluate(
            (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).isIdentity,
          ),
      )
      .toBe(true);
    expect(await page.locator("[data-page-content] > *").count()).toBe(7);
    const axe = await new AxeBuilder({ page })
      .include(".last-continent")
      .include(".longform")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("mobile: hero stays pinned when browser chrome changes innerHeight independently of svh", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator('[data-home-motion-ready="true"]').waitFor();
  for (const browserHeight of [844, 924, 844]) {
    await page.evaluate((height) => {
      // Models browser toolbar retraction: the svh layout remains 844px tall.
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        value: height,
      });
      scrollTo({ top: 422, behavior: "instant" });
      window.dispatchEvent(new Event("resize"));
    }, browserHeight);
    await expect
      .poll(() =>
        page
          .locator(".home-hero__wrapper")
          .evaluate((e) => e.getBoundingClientRect().top),
      )
      .toBeCloseTo(0, 1);
    const y = await page
      .locator(".home-hero__content")
      .evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m42);
    expect(y).toBeCloseTo(-126.6, 1);
  }
});

test("tablet: enlarged scroll title keeps its readable fit without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const heading = page.locator(".camps__heading");
    await expect(heading).toHaveCSS("font-size", "48px");
    expect(await heading.evaluate((e) => e.getBoundingClientRect().width)).toBeLessThan(
      768,
    );
  } finally {
    await context.close();
  }
});
