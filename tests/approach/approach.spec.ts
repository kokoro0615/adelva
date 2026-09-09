import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const evidence = "docs/reports/adelva-approach-implementation-2026-09-10/evidence";
const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
const steps = ["課題把握", "判断", "実行・実装", "運用", "検証", "引継ぎ"];
// Only the isolated section capture suppresses global fixed UI. The viewport
// captures retain it, to detect real overlaps. Never hide scene content.
const isolate =
  '[data-fidelity-landmark="header-nav"], [data-fidelity-landmark="header-nav"] *, [data-skip-link], .how-it-works, [data-how-it-works], nextjs-portal { visibility: hidden !important; }';

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-approach]")).toHaveAttribute(
    "data-approach-ready",
    "true",
  );
  await page
    .locator("[data-approach-photo]")
    .evaluate((el) => (el as HTMLImageElement).decode());
}
async function scrollScene(page: Page, fraction: number, readingLine = 0.58) {
  const top = await page.locator("[data-approach-scene]").evaluate(
    (el, args) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top +
        scrollY +
        rect.height * args.fraction -
        innerHeight * args.readingLine
      );
    },
    { fraction, readingLine },
  );
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(Math.round(top), 0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

for (const viewport of viewports) {
  test(`${viewport.width}: composition, six stages, photographic source, axe and adjacent sections`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.locator("[data-approach]").scrollIntoViewIfNeeded();
    await settle(page);
    const scene = page.locator("[data-approach-scene]");
    const root = page.locator("[data-approach]");
    await expect(root.getByRole("heading", { level: 2 })).toHaveText(
      "From Strategy to Action",
    );
    const labels = root.getByRole("listitem");
    await expect(labels).toHaveCount(6);
    for (let i = 0; i < 6; i++) await expect(labels.nth(i)).toContainText(steps[i]);
    const geometry = await scene.boundingBox();
    expect(geometry!.width).toBe(viewport.width);
    expect(geometry!.height).toBeCloseTo(
      viewport.width * (viewport.width < 600 ? 3 : 4 / 3),
      0,
    );
    const photo = await page.locator("[data-approach-photo]").evaluate((el) => {
      const image = el as HTMLImageElement;
      return {
        src: image.currentSrc,
        width: image.naturalWidth,
        height: image.naturalHeight,
        complete: image.complete,
      };
    });
    expect(photo.src).toContain(
      viewport.width < 600 ? "/mobile.webp" : "/desktop.webp",
    );
    expect(photo.complete).toBe(true);
    expect(photo.width / photo.height).toBeCloseTo(
      viewport.width < 600 ? 1 / 3 : 3 / 4,
      5,
    );
    const boxes = await labels.evaluateAll((els) =>
      els.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          x: rect.x,
          right: rect.right,
          y: rect.y,
          bottom: rect.bottom,
          font: parseFloat(getComputedStyle(el).fontSize),
        };
      }),
    );
    boxes.forEach((box, i) => {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(viewport.width - 76);
      expect(box.font).toBeGreaterThanOrEqual(16);
      if (i > 0) expect(box.y).toBeGreaterThan(boxes[i - 1].bottom);
    });
    await expect(root).not.toHaveAttribute("data-motion", "active");
    const sequence = await page
      .locator(".longform > [data-fidelity-section]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("data-fidelity-section")));
    expect(sequence).toEqual(["our-camps", "travel-globe", "planning-cta"]);
    await expect(page.locator(".page-content > *")).toHaveCount(7);
    await expect(
      page.locator(
        '[data-fidelity-section="cpt-wfr-bridge"], [data-fidelity-section="mist-divider"]',
      ),
    ).toHaveCount(0);
    for (const [state, fraction, line] of [
      ["start", 0, -0.065],
      ["middle", 0.52, 0.58],
      ["end", 0.91, 0.38],
    ] as const) {
      await scrollScene(page, fraction, line);
      const axe = await new AxeBuilder({ page })
        .include("#approach")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations, JSON.stringify(axe.violations)).toEqual([]);
      await page.screenshot({ path: `${evidence}/${viewport.width}-${state}.png` });
    }
    // Hide fixed global overlays only, not the new scene, for reference matching.
    await scene.screenshot({
      path: `${evidence}/scene-${viewport.width}.png`,
      style: isolate,
    });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });

  test(`${viewport.width}: path follows reading position, reverses, and resets for reduced motion`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.locator("[data-approach]").scrollIntoViewIfNeeded();
    await settle(page);
    const root = page.locator("[data-approach]");
    await expect(root).toHaveAttribute("data-motion", "active");
    const progress = async () => Number(await root.getAttribute("data-progress"));
    await scrollScene(page, 0.15);
    await expect.poll(progress).toBe(0);
    await scrollScene(page, 0.5);
    await expect.poll(progress).toBeGreaterThan(0.2);
    const middle = await progress();
    expect(middle).toBeLessThan(0.9);
    // The visible cursor must sit at the reading line, not at arbitrary path length.
    const cursor = page.locator(
      `[data-route="${viewport.width < 600 ? "mobile" : "desktop"}"] [data-path-cursor]`,
    );
    const cursorBox = await cursor.boundingBox();
    expect(cursorBox!.y + cursorBox!.height / 2).toBeCloseTo(viewport.height * 0.58, 0);
    await page.screenshot({ path: `${evidence}/${viewport.width}-motion.png` });
    await scrollScene(page, 0.9);
    await expect.poll(progress).toBe(1);
    await scrollScene(page, 0.5);
    expect(Math.abs((await progress()) - middle)).toBeLessThan(0.005);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(root).not.toHaveAttribute("data-motion", "active");
    expect(
      await page
        .locator("[data-path-flown]")
        .evaluateAll((els) =>
          els.every((el) => !(el as SVGElement).style.strokeDashoffset),
        ),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(root).toHaveAttribute("data-motion", "active");
    // The preceding CampsFlow changes height between stacked and moving modes.
    // Re-establish the same reading position after that authorized reflow.
    await scrollScene(page, 0.5);
    await expect.poll(progress).toBeGreaterThan(0.2);
  });
}

test("resize reselects the photographic composition and path; keyboard menu still restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator("[data-approach]").scrollIntoViewIfNeeded();
  await settle(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await settle(page);
  await scrollScene(page, 0.5);
  await expect(page.locator('[data-route="mobile"]')).toBeVisible();
  await expect(page.locator('[data-route="desktop"]')).toBeHidden();
  expect(
    await page
      .locator("[data-approach-photo]")
      .evaluate((el) => (el as HTMLImageElement).currentSrc),
  ).toContain("mobile.webp");
  const opener = page.getByRole("button", { name: "メニューを開く", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "サイトメニュー" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked", "true");
});

test("six stages and complete route remain available without JavaScript", async ({
  browser,
}) => {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      javaScriptEnabled: false,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4191/#approach");
    await expect(page.locator("#approach li")).toHaveCount(6);
    await expect(page.locator("#approach h2")).toBeVisible();
    await expect(page.locator("#approach")).not.toHaveAttribute(
      "data-motion",
      "active",
    );
    const path = page.locator(
      `[data-route="${viewport.width < 600 ? "mobile" : "desktop"}"] [data-path-flown]`,
    );
    await expect(path).toBeVisible();
    await expect(path).not.toHaveAttribute("style");
    await context.close();
  }
});

test("200% desktop reflow equivalent and 320px minimum width keep all labels readable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 720, height: 450 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.locator("#approach").scrollIntoViewIfNeeded();
    await settle(page);
    const bounds = await page.locator("#approach li").evaluateAll((els) =>
      els.map((el) => ({
        x: el.getBoundingClientRect().x,
        right: el.getBoundingClientRect().right,
      })),
    );
    expect(bounds.every((box) => box.x >= 0 && box.right <= viewport.width)).toBe(true);
    expect(
      await page
        .locator("#approach")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await expect(page.locator("[data-approach-summary]")).toContainText(
      "お客様自身が継続して改善できる状態",
    );
  }
});

test("direct section link lands after the preceding animated layout settles", async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#approach");
    await settle(page);
    await expect
      .poll(async () => (await page.locator("#approach").boundingBox())!.y)
      .toBeLessThan(100);
    await expect(page.locator("#approach h2")).toBeInViewport();
  }
});
