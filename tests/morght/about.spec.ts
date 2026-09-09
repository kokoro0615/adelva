import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  test(`${width}: complete content, local media, keyboard menu and axe`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/about");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("main>section")).toHaveCount(4);
    await expect(
      page.locator(".mg-news,.mg-service,.mg-hero-symbol,.mg-more,.mg-career-copy"),
    ).toHaveCount(0);
    await expect(page.locator("[data-home-footer]")).toHaveCount(1);
    await expect(page.locator(".mg-purpose-signature svg")).toHaveCount(1);
    await expect(page.locator(".mg-purpose-lead .mg-purpose-signature")).toHaveCount(1);
    await expect(
      page.locator(".mg-purpose-lead .mg-purpose-title + .mg-purpose-signature"),
    ).toHaveCount(1);
    await expect(page.locator(".mg-company-info")).toContainText("ADELVA 合同会社");
    await expect(page.locator(".mg-company-info")).toContainText("2026年07月28日");
    await expect(page.locator(".mg-company-info")).toContainText("100万円");
    await expect(page.locator(".mg-company-info")).toContainText("中川　心");
    await expect(page.locator(".mg-company-info")).toContainText(
      "兵庫県川西市けやき坂2-67-6",
    );
    const center = await page.locator(".mg-hero-heading").evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.x + r.width / 2 - innerWidth / 2;
    });
    expect(Math.abs(center)).toBeLessThan(1);
    await expect(page.locator(".mg-carousel-photo")).toHaveCount(16);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    expect(
      await page
        .locator(".morght-page img")
        .evaluateAll((images) =>
          images.every((i) =>
            (i as HTMLImageElement).src.startsWith(location.origin + "/media/"),
          ),
        ),
    ).toBe(true);
    await expect(page.locator(".mg-header,.mg-tagline,.mg-intro-clock")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "ADELVA", exact: true }),
    ).toHaveCount(1);
    await expect(page.locator(".mg-circle-landscape")).toHaveAttribute(
      "src",
      "/media/adelva/about/coast-lossless.webp",
    );
    await expect(page.locator(".mg-circle-ring")).toHaveAttribute(
      "aria-label",
      "ADELVA — HOSPITALITY MANAGEMENT PARTNER —",
    );
    const opener =
      width >= 1024
        ? page.getByRole("button", { name: "ADELVAについて", exact: true })
        : page.locator('header button[aria-controls="site-menu"]');
    await opener.focus();
    await page.keyboard.press("Enter");
    const panel =
      width >= 1024
        ? page.locator("#site-menu-about")
        : page.getByRole("dialog", { name: "サイトメニュー" });
    await expect(panel).toBeVisible();
    if (width < 1024) {
      await expect(page.locator("#main-content")).toHaveAttribute("inert", "");
      for (let i = 0; i < 20; i++) await page.keyboard.press("Tab");
      expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(
        true,
      );
    }
    const menuAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(menuAxe.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(opener).toBeFocused();
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
      );
    });
    expect(
      await page
        .locator(".morght-page img")
        .evaluateAll((es) => es.every((e) => (e as HTMLImageElement).naturalWidth > 0)),
    ).toBe(true);
    await expect(page.locator(".mg-photo-deco")).toHaveCount(0);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(errors).toEqual([]);
  });

  test(`${width}: reduced motion allows explicit carousel play and pause`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/about");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await page.locator(".mg-carousel").scrollIntoViewIfNeeded();
    const button = page.locator(".mg-pause");
    const column = page.locator(".mg-carousel-column").first();
    const x = () => column.evaluate((e) => e.getBoundingClientRect().x);
    const expectStill = async () => {
      await page.waitForTimeout(100);
      const before = await x();
      await page.waitForTimeout(300);
      expect(await x()).toBeCloseTo(before, 1);
    };
    await expect(button).toHaveText("Play motion");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveCSS("opacity", "1");
    await expectStill();
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveText("Pause motion");
    const before = await x();
    await page.waitForTimeout(400);
    expect((await x()) - before).toBeGreaterThan(width * 0.01);
    await expect(page.locator(".mg-photo-deco")).toHaveCount(0);
    await expect(page.locator(".mg-circle-ring")).toBeHidden();
    await page.keyboard.press("Enter");
    await expect(button).toHaveText("Play motion");
    await expectStill();
    await button.click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(page.locator(".mg-photo-deco")).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(button).toHaveText("Play motion");
    await expectStill();
  });

  test(`${width}: reversible circle, pause and pointer menu`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/about");
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await page.waitForTimeout(4200);
    const carouselCenterDelta = await page.locator(".mg-carousel").evaluate((e) => {
      const frame = e.getBoundingClientRect();
      const column = e.querySelector(".mg-carousel-column")!.getBoundingClientRect();
      return Math.abs(frame.y + frame.height / 2 - column.y - column.height / 2);
    });
    expect(carouselCenterDelta).toBeLessThan(1);
    const track = await page.locator(".mg-circle-track").evaluate((e) => ({
      top: e.getBoundingClientRect().top + scrollY,
      height: e.getBoundingClientRect().height,
    }));
    const measure = async (y: number) => {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(150);
      return page
        .locator(".mg-circle-crop")
        .evaluate((e) => e.getBoundingClientRect().width);
    };
    const initial = await measure(track.top);
    const end = await measure(track.top + track.height - height);
    const reverse = await measure(track.top);
    expect(initial).toBeCloseTo(Math.min(width * 0.4, height), 0);
    expect(end).toBeCloseTo(Math.hypot(width, height), 0);
    expect(reverse).toBeCloseTo(initial, 0);
    await page.evaluate(() => scrollTo(0, 0));
    const column = page.locator(".mg-carousel-column").first();
    const before = await column.getAttribute("style");
    await page.waitForTimeout(200);
    expect(await column.getAttribute("style")).not.toBe(before);
    await page.locator(".mg-pause").evaluate((e: HTMLButtonElement) => e.click());
    await expect(page.locator(".mg-pause")).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(200);
    const paused = await column.getAttribute("style");
    await page.waitForTimeout(200);
    expect(await column.getAttribute("style")).toBe(paused);
    const opener =
      width >= 1024
        ? page.getByRole("button", { name: "ADELVAについて", exact: true })
        : page.locator('header button[aria-controls="site-menu"]');
    await opener.click();
    await expect(opener).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(opener).toHaveAttribute("aria-expanded", "false");
  });
}

for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  test(`${width}: HOME signature draws, reverses and respects reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/about");
    await expect(page.locator("[data-ready=true]")).toBeVisible();
    const signature = page.locator(".mg-purpose-signature");
    const path = signature.locator("path").first();
    const drawn = () =>
      path.evaluate((e) => {
        const dash = getComputedStyle(e).strokeDasharray;
        return dash === "none"
          ? 1
          : parseFloat(dash) / (e as SVGPathElement).getTotalLength();
      });
    await expect.poll(drawn).toBeLessThan(0.01);
    await signature.evaluate((e) =>
      window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.55),
    );
    await expect.poll(drawn).toBeGreaterThan(0.99);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(drawn).toBeLessThan(0.01);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(drawn).toBeGreaterThan(0.99);
    await signature.scrollIntoViewIfNeeded();
    await expect(signature.getByText("kokoro nakagawa", { exact: true })).toBeVisible();
  });
}
