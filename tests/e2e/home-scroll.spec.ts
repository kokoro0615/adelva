import { expect, test } from "@playwright/test";
import reference from "../fixtures/home-grid-reference.json" with { type: "json" };

for (const viewport of reference.viewports) {
  test(`HOME external grid fidelity and reversible motion ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("[data-home-motion-ready]")).toHaveAttribute(
      "data-home-motion-ready",
      "true",
    );
    await page.evaluate(() => document.fonts.ready);
    const grid = page.locator(".grid-rules");
    await expect(grid).toHaveCSS("opacity", String(reference.opacity));
    await expect(grid).toHaveCSS("mix-blend-mode", reference.blend);
    const lines = await grid.locator("span").evaluateAll((es) =>
      es
        .map((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, width: r.width };
        })
        .filter((r) => r.width > 0)
        .sort((a, b) => a.x - b.x),
    );
    expect(lines).toHaveLength(viewport.lines.length);
    lines.forEach((line, i) => {
      expect(Math.abs(line.x - viewport.lines[i].x)).toBeLessThan(0.6);
      expect(Math.abs(line.width - viewport.lines[i].width)).toBeLessThan(0.1);
    });
    const hero = page.locator(".home-hero__wrapper");
    for (const f of [0.5, 1, 1.5, 0.5]) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        viewport.height * f,
      );
      await expect
        .poll(() => hero.evaluate((e) => e.getBoundingClientRect().top))
        .toBe(0);
    }
    const camp = page.locator(".camps");
    const geometry = await camp.evaluate((e) => ({
      top: e.getBoundingClientRect().top + scrollY,
      distance:
        (e as HTMLElement).offsetHeight -
        document.querySelector<HTMLElement>(".camps__viewport")!.clientHeight,
    }));
    const track = page.locator(".camps__track");
    const getX = () =>
      track.evaluate((e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m41);
    const values: number[] = [];
    for (const f of [0, 0.5, 1, 0.5, 0]) {
      await page.evaluate(
        (y) => scrollTo({ top: y, behavior: "instant" }),
        geometry.top + geometry.distance * f,
      );
      await page.waitForTimeout(100);
      values.push(await getX());
    }
    expect(values[0]).toBeCloseTo(0, 0);
    expect(values[1]).toBeLessThan(-50);
    expect(values[2]).toBeLessThan(values[1]);
    expect(values[3]).toBeCloseTo(values[1], 0);
    expect(values[4]).toBeCloseTo(values[0], 0);
    // Offscreen SVG mask updates used to continue throughout earlier sections.
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(150);
    const mutations = await camp.evaluate(async (e) => {
      let count = 0;
      const observer = new MutationObserver((ms) => {
        count += ms.length;
      });
      observer.observe(e, { attributes: true, subtree: true });
      for (let y = 250; y <= 650; y += 25) {
        scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      observer.disconnect();
      return count;
    });
    expect(mutations).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(hero).toHaveCSS("position", "relative");
    await expect(page.locator(".home-hero__video")).toHaveJSProperty("paused", true);
    await expect(track).toHaveCSS("transform", "none");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("touch pin survives unavailable JavaScript, height changes and menu lock", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL!);
  await expect(page.locator("[data-home-motion-ready]")).toHaveAttribute(
    "data-home-motion-ready",
    "true",
  );
  await page.evaluate(() => document.fonts.ready);
  const cdp = await context.newCDPSession(page);
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: ".home-hero__wrapper",
  });
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 180, y: 650 }],
    });
    for (let y = 625; y >= 200; y -= 25) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 180, y }],
      });
      await page.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(200);
    const box = await cdp.send("DOM.getBoxModel", { nodeId });
    expect(Math.abs(box.model.border[1])).toBeLessThan(1);
  } finally {
    await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
  }
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.setViewportSize({ width: 390, height: 760 });
  await expect
    .poll(() =>
      page
        .locator(".home-hero__wrapper")
        .evaluate((e) => e.getBoundingClientRect().top),
    )
    .toBe(0);
  const opener = page.getByRole("button", { name: "メニューを開く", exact: true });
  await opener.click();
  const held = await page.evaluate(() => scrollY);
  await page.evaluate(() => scrollTo(0, 1400));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(held);
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await context.close();
});
