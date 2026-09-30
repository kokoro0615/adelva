import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  chapters,
  processCopy,
  requiredStrings,
  route,
} from "../../src/content/adelva-dx-it-procurement";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
async function open(page: Page) {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}
async function strings(page: Page) {
  const text = await page
    .locator("main")
    .evaluate((m) => (m.textContent ?? "").replace(/\s+/g, ""));
  for (const s of requiredStrings) expect(text).toContain(s.replace(/\s+/g, ""));
}
async function tip(page: Page, value: number) {
  await page.evaluate((value) => {
    const r = document.querySelector("[data-process]")!.getBoundingClientRect();
    scrollTo({
      top: r.top + scrollY + (value * r.width) / 1536 - innerHeight * 0.6,
      behavior: "instant",
    });
  }, value);
}
for (const viewport of viewports) {
  test.describe(`dx ${viewport.name}`, () => {
    test.use({ viewport });
    test("approved copy, semantic structure, links, static tags and reserved images", async ({
      page,
    }) => {
      await open(page);
      await expect(page).toHaveTitle("DX・IT・調達基盤 — ADELVA");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText("DX・IT・調達基盤");
      await strings(page);
      const crumb = page.getByRole("navigation", { name: "パンくず" });
      await expect(crumb.getByRole("link", { name: "HOME" })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(crumb.getByRole("link", { name: "支援内容" })).toHaveCount(0);
      await expect(crumb.locator('[aria-current="page"]')).toHaveText(
        "DX・IT・調達基盤",
      );
      for (const chapter of chapters) {
        const section = page.locator(`#${chapter.id}`);
        await expect(section.getByRole("heading", { level: 2 })).toHaveText(
          chapter.title,
        );
        await expect(section.locator("a,button,[tabindex]")).toHaveCount(0);
      }
      await expect(page.locator("li[data-row]")).toHaveCount(2);
      await expect(page.locator("[data-chips] li")).toHaveCount(17);
      await expect(page.locator('[data-section="boundaries"] dl')).toHaveCount(2);
      await expect(page.locator('[data-section="boundaries"] dt')).toHaveCount(4);
      await expect(page.locator('[data-section="boundaries"] dd')).toHaveCount(4);
      const steps = page.getByRole("list", { name: "支援の工程" }).locator(">li");
      await expect(steps).toHaveCount(6);
      for (const [i, s] of processCopy.steps.entries()) {
        await expect(steps.nth(i).getByRole("heading", { level: 3 })).toHaveText(
          s.name,
        );
        await expect(steps.nth(i).locator("ul>li")).toHaveText(s.tags);
      }
      await expect(page.locator('[data-card="01"] a')).toHaveAttribute(
        "href",
        "/services/management-operations",
      );
      await expect(page.locator('[data-card="02"] a')).toHaveAttribute(
        "href",
        "/services/revenue-brand",
      );
      for (const [label, href] of [
        ["問い合わせを送信", "/contact"],
        ["支援の進め方を見る", "/approach"],
        ["オーナー・経営者の方へ", "/challenges/owners"],
        ["総支配人・現場責任者の方へ", "/challenges/general-managers"],
      ])
        await expect(
          page.locator("main").getByRole("link", { name: label, exact: true }),
        ).toHaveAttribute("href", href);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      expect(
        await page
          .locator("main img")
          .evaluateAll((imgs) =>
            imgs.every(
              (i) =>
                i.getAttribute("alt") === "" &&
                i.closest('[aria-hidden="true"]') &&
                i.hasAttribute("width") &&
                i.hasAttribute("height"),
            ),
          ),
      ).toBe(true);
      expect(
        await page.locator('meta[name="robots"]').getAttribute("content"),
      ).toContain("noindex");
    });
    test("reduce has full light, drawn UI, all checks and no hidden copy", async ({
      page,
    }) => {
      await open(page);
      await expect(page.locator("[data-motion]")).toHaveCount(0);
      expect(
        await page
          .locator("li[data-step]")
          .evaluateAll((n) => n.map((e) => e.getAttribute("data-state"))),
      ).toEqual(Array(6).fill("passed"));
      expect(
        await page
          .locator("[data-room-veil],[data-mobile-room],[data-dawn]")
          .evaluateAll((n) => n.every((e) => getComputedStyle(e).opacity === "0")),
      ).toBe(true);
      await expect(page.locator("[data-power-off]")).toBeHidden();
      await expect(page.locator('[data-off-clip="desktop"]')).toBeHidden();
      await expect(page.locator('[data-off-clip="mobile"]')).toBeHidden();
      await expect(page.locator("[data-process-title] span")).toHaveCount(0);
      await strings(page);
    });
    test("loads only the matching photographic composition", async ({ page }) => {
      const urls: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("/media/adelva/dx-it-procurement/")) urls.push(r.url());
      });
      await open(page);
      await page.evaluate(() => {
        for (const i of document.images)
          if (i.getClientRects().length) i.loading = "eager";
      });
      await page.waitForLoadState("networkidle");
      expect(
        urls.some((u) => u.includes(viewport.width >= 1024 ? "/d-map" : "/m-body-0")),
      ).toBe(true);
      expect(
        urls.filter((u) =>
          viewport.width >= 1024 ? /\/m-(body|core)/.test(u) : /\/d-/.test(u),
        ),
      ).toEqual([]);
    });
    test("image removal retains DOM text, lines, controls and checks", async ({
      page,
    }) => {
      await open(page);
      await page.addStyleTag({
        content:
          "img, picture {visibility:hidden!important;} nextjs-portal {display:none!important;}",
      });
      await strings(page);
      await expect(page.locator("h1")).toBeVisible();
      await expect(
        page.locator('[data-section="hero"] a[href="/contact"]'),
      ).toBeVisible();
      const lines = page.locator(
        `[data-landings="${viewport.width >= 1024 ? "desktop" : "mobile"}"]`,
      );
      await expect(lines).toBeVisible();
      expect(
        await lines
          .locator("[data-step-line]")
          .first()
          .evaluate((node) => {
            const style = getComputedStyle(node);
            return (
              (node as SVGPathElement).getTotalLength() > 0 &&
              style.stroke !== "none" &&
              style.opacity !== "0"
            );
          }),
      ).toBe(true);
    });
    test("axe checks the page at the required viewport", async ({ page }) => {
      await open(page);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
    });
    test("keyboard traverses every main link with visible focus and 44px targets", async ({
      page,
    }) => {
      await open(page);
      const links = page.locator("main a:visible");
      const expected = await links.evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("href")),
      );
      await links.first().focus();
      const visited = [];
      for (let i = 0; i < expected.length; i++) {
        const active = page.locator(":focus");
        visited.push(await active.getAttribute("href"));
        expect(await active.evaluate((n) => getComputedStyle(n).outlineStyle)).not.toBe(
          "none",
        );
        await page.keyboard.press("Tab");
      }
      expect(visited).toEqual(expected);
      for (const link of await page.locator("main a:visible").all()) {
        if (await link.evaluate((n) => Boolean(n.closest('[aria-label="パンくず"]'))))
          continue;
        const box = await link.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    });
    if (viewport.width < 1024)
      test("index anchors reach all three chapters", async ({ page }) => {
        await open(page);
        for (const ch of chapters) {
          await page.evaluate(() => scrollTo(0, 0));
          await page.locator(`[data-index-link="${ch.id}"]`).click();
          await expect(page).toHaveURL(new RegExp(`#${ch.id}$`));
          await expect(page.locator(`#${ch.id} h2`)).toBeInViewport();
        }
      });
  });
  test.describe(`dx ${viewport.name} without JS`, () => {
    test.use({ viewport, javaScriptEnabled: false });
    test("SSR is complete and every text section is visible", async ({ page }) => {
      await page.goto(route);
      await strings(page);
      for (const ch of chapters)
        await expect(page.locator(`#${ch.id} h2`)).toBeVisible();
      await expect(page.locator("[data-process]")).toHaveAttribute(
        "data-progress",
        "complete",
      );
      await expect(page.locator("[data-power-off]")).toBeHidden();
      expect(
        await page
          .locator("li[data-step]")
          .evaluateAll((n) =>
            n.every((e) => e.getAttribute("data-state") === "passed"),
          ),
      ).toBe(true);
    });
  });
}
test.describe("dx desktop motion", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    contextOptions: { reducedMotion: "no-preference" },
  });
  test("power completes; scrolling progresses monotonically without pinning", async ({
    page,
  }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await expect(page.locator("[data-power-off]")).toBeHidden({ timeout: 6000 });
    for (const [y, expected] of [
      [160, ["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]],
      [755, ["passed", "passed", "passed", "current", "upcoming", "upcoming"]],
      [1262, Array(6).fill("passed")],
    ] as const) {
      await tip(page, y);
      await expect
        .poll(() =>
          page
            .locator("li[data-step]")
            .evaluateAll((n) => n.map((e) => e.getAttribute("data-state"))),
        )
        .toEqual(expected);
      await expect(page.locator('li[aria-current="step"]')).toHaveCount(
        y < 1262 ? 1 : 0,
      );
    }
    await tip(page, 160);
    await expect(page.locator("[data-process]")).toHaveAttribute(
      "data-progress",
      "complete",
    );
    await expect(page.locator("[data-dx-it-procurement] .pin-spacer")).toHaveCount(0);
  });
  test("focus completes the process and preference changes restore SSR", async ({
    page,
  }) => {
    await open(page);
    await page.locator("[data-process] a").focus();
    await expect(page.locator("[data-process]")).toHaveAttribute(
      "data-progress",
      "complete",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("[data-motion]")).toHaveCount(0);
    await expect(page.locator('[data-off-clip="desktop"]')).toBeHidden();
    await expect(page.locator("[data-process-title] span")).toHaveCount(0);
  });
  test("upcoming steps remain accessible mid-process", async ({ page }) => {
    await open(page);
    await tip(page, 755);
    await expect(page.locator('li[data-step="4"]')).toHaveAttribute(
      "data-state",
      "current",
    );
    const result = await new AxeBuilder({ page })
      .include("[data-process]")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
});
test("dx 200% equivalent reflow at 720 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 450 });
  await open(page);
  await strings(page);
  await expect(page.getByRole("navigation", { name: "章索引" })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
});
