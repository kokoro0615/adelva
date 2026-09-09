import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const;

async function ready(page: Page) {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("[data-support-section] img").evaluate(async (node) => {
    await (node as HTMLImageElement).decode();
  });
}

async function scroll(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(150);
}

async function landscapeState(page: Page) {
  return page.locator('[data-motion-layer="support-landscape"]').evaluate((el) => {
    const value = getComputedStyle(el).transform;
    const matrix = value === "none" ? null : new DOMMatrixReadOnly(value);
    return { transform: value, y: matrix?.m42 ?? 0, scale: matrix?.m11 ?? 1 };
  });
}

for (const viewport of viewports) {
  test.describe(`${viewport.width}px support section`, () => {
    test.use({ viewport });

    test("semantic copy, responsive entrances, keyboard and accessibility", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await ready(page);
      const section = page.locator("[data-support-section]");
      await expect(
        section.getByRole("heading", { name: "Who We Support" }),
      ).toBeVisible();
      await expect(section).toContainText("支援対象");
      await expect(section).toContainText(
        "経営と現場で共有できる改善計画につなげます。",
      );
      await expect(section).not.toContainText("November");
      await expect(page.locator("[data-page-content] > *")).toHaveCount(7);

      const links = section.locator("[data-support-audience]");
      await expect(links).toHaveCount(2);
      await expect(links.nth(0)).toHaveAccessibleName(/オーナー・\s*経営者の方へ/);
      await expect(links.nth(1)).toHaveAccessibleName(/総支配人・\s*現場責任者の方へ/);
      await expect(links.nth(0)).toHaveAttribute("href", "/challenges/owners");
      await expect(links.nth(1)).toHaveAttribute(
        "href",
        "/challenges/general-managers",
      );
      await expect(links.nth(0)).toHaveAttribute("data-route-status", "available");

      const boxes = await links.evaluateAll((nodes) =>
        nodes.map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
      expect(Math.abs(boxes[0].width - boxes[1].width)).toBeLessThan(1);
      if (viewport.width < 600) {
        expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height + 24);
      } else {
        expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(1);
        expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);

      await links.nth(0).focus();
      await expect(links.nth(0)).toBeFocused();
      expect(
        await links.nth(0).evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe("solid");
      await page.keyboard.press("Tab");
      await expect(links.nth(1)).toBeFocused();
      const axe = await new AxeBuilder({ page })
        .include("[data-support-section]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(axe.violations).toEqual([]);
      expect(errors).toEqual([]);
    });

    test("landscape scrubs, reverses and reverts when motion preference changes", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await ready(page);
      const section = page.locator("[data-support-section]");
      const bounds = await section.evaluate((el) => ({
        top: el.getBoundingClientRect().top + scrollY,
        height: el.getBoundingClientRect().height,
      }));
      await scroll(page, bounds.top - viewport.height * 0.6);
      const entry = await landscapeState(page);
      await scroll(page, bounds.top + bounds.height * 0.6);
      const exit = await landscapeState(page);
      expect(exit.y - entry.y).toBeGreaterThan(viewport.width < 600 ? 10 : 20);
      expect(entry.scale).toBeGreaterThan(exit.scale);

      await scroll(page, bounds.top - viewport.height * 0.6);
      expect(Math.abs((await landscapeState(page)).y - entry.y)).toBeLessThan(3);
      for (const fraction of [0, 0.4, 0.8]) {
        await scroll(page, bounds.top + bounds.height * fraction);
        const covered = await section.evaluate((root) => {
          const image = root
            .querySelector('[data-motion-layer="support-landscape"]')!
            .getBoundingClientRect();
          const box = root.getBoundingClientRect();
          return (
            image.top <= box.top &&
            image.bottom >= box.bottom &&
            image.left <= box.left &&
            image.right >= box.right
          );
        });
        expect(covered, "overscan never exposes an empty image edge").toBe(true);
      }
      await expect(section.locator("h2")).toHaveCSS("opacity", "1");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect
        .poll(async () => (await landscapeState(page)).transform)
        .toBe("none");
      await scroll(page, bounds.top);
      expect((await landscapeState(page)).transform).toBe("none");
      await expect(section.locator("h2")).toHaveCSS("opacity", "1");
      await expect(section.locator("[data-support-rule]").first()).toHaveCSS(
        "transform",
        "none",
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect
        .poll(async () => (await landscapeState(page)).transform)
        .not.toBe("none");
    });
  });
}

test("320px reflow and 200% text remain readable without clipping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await ready(page);
  await page.locator("[data-support-section]").evaluate((section) => {
    for (const el of section.querySelectorAll<HTMLElement>(
      "h2, p, a > span:not([aria-hidden]), a > span > span",
    )) {
      el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * 2}px`;
    }
  });
  const fit = await page.locator("[data-support-section]").evaluate((section) => {
    const rect = section.getBoundingClientRect();
    return (
      [...section.querySelectorAll("[data-support-audience]")].every((el) => {
        const box = el.getBoundingClientRect();
        return box.left >= 0 && box.right <= innerWidth && box.bottom <= rect.bottom;
      }) && section.scrollWidth <= innerWidth
    );
  });
  expect(fit).toBe(true);
});

for (const viewport of viewports) {
  test(`${viewport.width}px uses delivered fonts and keeps the shared vertical rules visible`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await ready(page);
    const section = page.locator("[data-support-section]");
    await section.evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + scrollY,
        behavior: "instant",
      }),
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector:
        "[data-support-section] h2, [data-support-section] p, [data-support-section] span, .home-title-ja",
    });
    let glyphs = 0;
    for (const nodeId of nodeIds) {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      for (const font of fonts) {
        glyphs += font.glyphCount;
        expect(font.isCustomFont, `${font.familyName}: ${font.glyphCount} glyphs`).toBe(
          true,
        );
      }
    }
    expect(glyphs).toBeGreaterThan(100);
    await cdp.detach();
    // Compare the same quiet sky strip with/without the shared rules. This
    // detects actual occlusion, which DOM visibility and z-index assertions miss.
    const clip = { x: 24, y: 180, width: viewport.width - 100, height: 40 };
    const visible = await page.screenshot({ clip, animations: "disabled" });
    await page.locator(".grid-rules").evaluate((el) => {
      (el as HTMLElement).style.visibility = "hidden";
    });
    const hidden = await page.screenshot({ clip, animations: "disabled" });
    expect(visible.equals(hidden)).toBe(false);
    await page.locator(".grid-rules").evaluate((el) => {
      (el as HTMLElement).style.removeProperty("visibility");
    });
  });
}
