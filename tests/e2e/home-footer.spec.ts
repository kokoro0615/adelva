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
      // HOME A2r3 owns its scenes; the footer follows the one main landmark
      await expect(page.locator("main")).toHaveCount(1);
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
    test("contact stays clickable, no inherited utility tab, reduced motion and top anchor", async ({
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
      // The inherited White Desert "How it works" flyout carried the source
      // operator's copy and booking link; it must not return.
      await expect(page.getByRole("button", { name: "How it works" })).toHaveCount(0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await contact.hover();
      expect(await circle.evaluate((n) => getComputedStyle(n).transform)).toBe("none");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      // Restoring the pinned sections changes document height. Scroll anchoring
      // may move the footer after hover() returns; reacquire the target while
      // that layout settles, then verify the same actual hover transform.
      // HOME's scroll scenes come back with motion (the page grows about threefold)
      // and desktop smoothing restarts: bring the link to the middle and let the
      // scroll settle before the pointer moves onto it.
      await page.waitForFunction(
        () =>
          document.querySelector("[data-home-root]")?.getAttribute("data-motion") !==
          "still",
      );
      await contact.evaluate(async (a) => {
        // the footer at the top of the screen: HOME's last WebGL scene is then fully gone
        // (headless software rendering draws it at a few frames per second). Instant:
        // with motion allowed the document scrolls smoothly (globals.css).
        // (scrollIntoView would honour the header's scroll-padding and leave the scene's last rows on screen)
        const footerEl = a.closest("footer")!;
        const lift = Math.min(
          120,
          a.getBoundingClientRect().top - footerEl.getBoundingClientRect().top - 160,
        );
        window.scrollTo({
          top: footerEl.getBoundingClientRect().top + window.scrollY + lift,
          behavior: "instant",
        });
        for (let i = 0; i < 40; i++) {
          if (!document.documentElement.classList.contains("lenis-scrolling")) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
      await expect(async () => {
        await contact.hover();
        // the 180 ms hover transition starts from none
        await expect
          .poll(() => circle.evaluate((n) => getComputedStyle(n).transform), {
            timeout: 1500,
          })
          .not.toBe("none");
      }).toPass({ timeout: 15000 });
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
test("the not-found page carries the ADELVA footer", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-home-footer]")).toHaveCount(1);
  await expect(page.locator(".colophon")).toHaveCount(0);
});
