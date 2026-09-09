import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}: centered band copy and complete Japanese font coverage`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".ns-quote")).not.toContainText([
      "太刀川英輔",
      "進化思考",
    ]);
    for (const row of await page.locator(".ns-strip").all()) {
      const link = row.locator(".ns-strip-link");
      await row.scrollIntoViewIfNeeded();
      for (const state of ["default", "hover", "focus"]) {
        if (state === "default") await page.mouse.move(0, 0);
        if (state === "hover") await link.hover();
        if (state === "focus") await link.focus();
        const offsets = await row.evaluate((el) => {
          const a = el.getBoundingClientRect(),
            b = el.querySelector(".ns-strip-bottom")!.getBoundingClientRect();
          return {
            x: Math.abs(b.x + b.width / 2 - a.x - a.width / 2),
            y: Math.abs(b.y + b.height / 2 - a.y - a.height / 2),
            inside: b.top >= a.top && b.bottom <= a.bottom,
          };
        });
        expect(offsets.x).toBeLessThanOrEqual(1);
        expect(offsets.y).toBeLessThanOrEqual(1);
        expect(offsets.inside).toBe(true);
        await expect(link.locator(".ns-strip-description")).toBeVisible();
        await expect(link.locator(".ns-strip-description")).toHaveCSS("opacity", "1");
      }
    }
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    for (const selector of [
      ".ns-strip-label",
      ".ns-strip-description",
      ".ns-statement-lead",
      ".ns-statement-body",
    ]) {
      const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
        nodeId: root.nodeId,
        selector,
      });
      for (const nodeId of nodeIds) {
        const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
        expect(fonts.length).toBeGreaterThan(0);
        expect(fonts.filter((f) => !f.isCustomFont)).toEqual([]);
      }
    }
    await expect(page.locator("#ns-how-title .ns-chapter-english")).toHaveText(
      "Your Challenges",
    );
    await expect(page.locator("#ns-why-title .ns-chapter-english")).toHaveText(
      "Our Expertise",
    );
    const mark = await page.locator(".ns-keyvisual-mark").boundingBox();
    const target = viewport.width < 768 ? 176 : 328;
    expect(Math.abs(mark!.width - target) / target).toBeLessThan(0.05);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    );
  });
}
