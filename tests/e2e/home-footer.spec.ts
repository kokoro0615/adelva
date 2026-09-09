import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
for (const viewport of viewports) {
  test.describe(`${viewport.width}px HOME footer`, () => {
    test.use({ viewport });
    test("approved content, responsive layout, keyboard, fonts and axe", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      const footer = page.locator("[data-home-footer]");
      await footer.scrollIntoViewIfNeeded();
      await footer.locator("img").evaluate((i) => (i as HTMLImageElement).decode());
      await expect(page.locator("footer")).toHaveCount(1);
      await expect(page.locator(".colophon")).toHaveCount(0);
      await expect(page.locator("[data-page-content] > *")).toHaveCount(7);
      await expect(
        footer.getByRole("heading", { name: "Start with a conversation" }),
      ).toBeVisible();
      const links = footer.locator("nav a");
      await expect(links).toHaveCount(6);
      await expect(
        footer.getByRole("link", { name: "お問い合わせ", exact: true }),
      ).toHaveAttribute("href", "/contact");
      await expect(links.first()).toHaveAttribute("href", "/challenges/owners");
      await expect(links.last()).toHaveAttribute("href", "/about");
      for (const link of await links.all()) {
        await link.focus();
        await expect(link).toBeFocused();
        expect(await link.evaluate((n) => getComputedStyle(n).outlineStyle)).toBe(
          "solid",
        );
        const b = await link.boundingBox();
        expect(b!.x).toBeGreaterThanOrEqual(0);
        expect(b!.x + b!.width).toBeLessThanOrEqual(viewport.width);
        expect(b!.height).toBeGreaterThanOrEqual(24);
      }
      const groups = await footer.locator("nav section").evaluateAll((ns) =>
        ns.map((n) => ({
          x: n.getBoundingClientRect().x,
          y: n.getBoundingClientRect().y,
        })),
      );
      if (viewport.width >= 1024)
        expect(Math.abs(groups[0].y - groups[2].y)).toBeLessThan(1);
      else {
        expect(groups[1].y).toBeGreaterThan(groups[0].y);
        expect(groups[2].x).toBe(groups[0].x);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const { root } = await cdp.send("DOM.getDocument");
      for (const selector of [
        "[data-home-footer] h2 span",
        "[data-home-footer] nav a",
        "[data-home-footer] nav h3",
      ]) {
        const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
          nodeId: root.nodeId,
          selector,
        });
        for (const nodeId of nodeIds) {
          const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
          expect(fonts.filter((f) => !f.isCustomFont)).toEqual([]);
        }
      }
      const axe = await new AxeBuilder({ page })
        .include("[data-home-footer]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
    test("contact stays clickable, utility restores focus, reduced motion and top anchor", async ({
      page,
    }) => {
      await page.goto("/");
      const footer = page.locator("[data-home-footer]");
      await footer.scrollIntoViewIfNeeded();
      const contact = footer.getByRole("link", { name: "お問い合わせ", exact: true });
      await contact.scrollIntoViewIfNeeded();
      const circle = contact.locator("svg");
      const box = await circle.boundingBox();
      expect(
        await page.evaluate(
          ({ x, y }) =>
            Boolean(document.elementFromPoint(x, y)?.closest("[data-home-footer] a")),
          { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 },
        ),
      ).toBe(true);
      const utility = page.getByRole("button", { name: "How it works", exact: true });
      await utility.click();
      await expect(page.getByRole("dialog", { name: "How it works" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(utility).toBeFocused();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await contact.hover();
      expect(await circle.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await contact.hover();
      await expect
        .poll(() => circle.evaluate((n) => getComputedStyle(n).transform))
        .not.toBe("none");
      await footer.getByRole("link", { name: "ページの先頭へ戻る" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
    });
  });
}
test("320px and enlarged footer text stay readable without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await page.addStyleTag({
    content:
      "[data-home-footer] h2{font-size:76px!important;overflow-wrap:anywhere}[data-home-footer] nav a,[data-home-footer] nav h3{font-size:30px!important}",
  });
  const footer = page.locator("[data-home-footer]");
  await footer.scrollIntoViewIfNeeded();
  expect(await footer.evaluate((n) => n.scrollWidth <= n.clientWidth)).toBe(true);
  for (const a of await footer.locator("nav a").all()) await expect(a).toBeVisible();
});
test("legacy routes keep their footer on navigation and return to HOME correctly", async ({
  page,
}) => {
  await page.goto("/prices");
  await expect(page.locator(".colophon")).toHaveCount(1);
  await expect(page.locator("[data-home-footer]")).toHaveCount(0);
  await page.goto("/");
  await expect(page.locator("[data-home-footer]")).toHaveCount(1);
  await expect(page.locator(".colophon")).toHaveCount(0);
});
