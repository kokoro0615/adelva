import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  audienceLinks,
  chapters,
  contact,
  hero,
  processCopy,
  requiredStrings,
  route,
  serviceIndex,
} from "../../src/content/adelva-management-operations";

/* /services/management-operations — B 台杉「降りてくる朝」.
   Spec: docs/specs/adelva-management-operations-spec.md. */

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function open(page: Page) {
  const response = await page.goto(route);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
}

/** Every approved string must be DOM text inside main (not an image, not alt). */
async function expectAllStrings(page: Page) {
  const text = await page
    .locator("main")
    .evaluate((main) => (main.textContent ?? "").replace(/\s+/g, ""));
  for (const value of requiredStrings)
    expect(text).toContain(value.replace(/\s+/g, ""));
}

const scrollTo = (page: Page, top: number) =>
  page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    Math.round(top),
  );

for (const viewport of viewports) {
  test.describe(`${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("renders every approved string as text, with semantics and no overflow", async ({
      page,
    }) => {
      await open(page);
      await expect(page).toHaveTitle("経営・運営統括 — ADELVA");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "経営・運営統括",
      );
      await expectAllStrings(page);

      // Breadcrumb: HOME links home, 支援内容 is text (no /services route), current page marked.
      const crumb = page.getByRole("navigation", { name: "パンくずリスト" });
      await expect(crumb.getByRole("link", { name: "HOME" })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(crumb.getByRole("link", { name: "支援内容" })).toHaveCount(0);
      await expect(crumb.locator('[aria-current="page"]')).toHaveText("経営・運営統括");

      // Section headings in reading order.
      const main = page.locator("main");
      await expect(main.getByRole("heading", { level: 2 })).toHaveText([
        serviceIndex.title,
        "サービスの違い",
        processCopy.title,
        audienceLinks.title,
        contact.title,
      ]);

      // The index: four themes (h3) with their eleven services, which are neither
      // links nor focus stops, and whose names are read once.
      const index = page.getByRole("region", { name: serviceIndex.title });
      await expect(index.getByRole("heading", { level: 3 })).toHaveText(
        chapters.map((chapter) => chapter.title),
      );
      const services = index.locator("li[data-service]");
      await expect(services).toHaveCount(11);
      await expect(index.locator("a, [tabindex]")).toHaveCount(0);
      const names = await services.evaluateAll((items) =>
        items.map(
          (item) => item.querySelector("[class*='visuallyHidden']")?.textContent ?? "",
        ),
      );
      expect(names.sort()).toEqual(
        chapters.flatMap((c) => c.services.map((s) => s.name)).sort(),
      );

      // Process: one ordered list of six steps.
      await expect(
        page.getByRole("list", { name: processCopy.stepsLabel }).locator(":scope > li"),
      ).toHaveCount(6);

      // Links keep their destinations.
      await expect(
        main.getByRole("link", { name: hero.cta.label }).first(),
      ).toHaveAttribute("href", "/contact");
      await expect(
        main.getByRole("link", { name: processCopy.link.label }),
      ).toHaveAttribute("href", "/approach");
      for (const item of audienceLinks.items)
        await expect(main.getByRole("link", { name: item.label })).toHaveAttribute(
          "href",
          item.href,
        );
      await expect(main.getByRole("link", { name: contact.cta.label })).toHaveCount(2);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("passes axe (WCAG 2.2 AA tags)", async ({ page }) => {
      await open(page);
      await expect(page.locator('[data-motion="ready"]')).toHaveCount(1, {
        timeout: 20_000,
      });
      const audit = await new AxeBuilder({ page })
        .include("main")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
    });
  });
}

test.describe("reduced motion, desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the representative state without holding the page", async ({ page }) => {
    await open(page);
    const root = page.locator("[data-mo-root]");
    await expect(root).toHaveAttribute("data-motion", "ready");
    await expect(root).not.toHaveAttribute("data-pin", "1");
    // Theme 02 in focus, pair 2 on its knuckle, the process at step 05.
    await expect(page.locator('li[data-theme="2"]')).toHaveAttribute(
      "data-current",
      "1",
    );
    await expect(page.locator('[data-knuckle="2"]')).toHaveAttribute(
      "data-active",
      "1",
    );
    await expect(page.locator('[data-fork="2"]')).toHaveAttribute("data-active", "1");
    await expect(page.locator('[data-step="5"]')).toHaveAttribute(
      "data-state",
      "current",
    );
    await expect(page.locator('[data-step="4"]')).toHaveAttribute(
      "data-state",
      "reached",
    );
    await expect(page.locator("[data-dawn]")).toBeHidden();
    await expect(page.locator("canvas[data-comets]")).toBeHidden();
    // The page is exactly as long as the stage plus the footer: nothing is pinned.
    const extra = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>("[data-track]")!;
      const stage = document.querySelector<HTMLElement>("[data-stage]")!;
      return track.offsetHeight - stage.offsetHeight;
    });
    expect(extra).toBe(0);
  });

  test("keyboard reaches every action with a visible focus ring", async ({ page }) => {
    await open(page);
    const expected = [
      hero.cta.label,
      processCopy.link.label,
      ...audienceLinks.items.map((item) => item.label),
      contact.cta.label,
    ];
    const reached: string[] = [];
    await page.locator("[data-hero] nav a").focus();
    for (let i = 0; i < 12 && reached.length < expected.length; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el?.closest("[data-mo-root]")) return null;
        const style = getComputedStyle(el);
        return { name: el.textContent?.trim() ?? "", outline: style.outlineStyle };
      });
      if (!info) continue;
      expect(info.outline).toBe("solid");
      reached.push(info.name);
    }
    expect(reached).toEqual(expected);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const viewport of [viewports[0], viewports[2]]) {
    test(`reads completely at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route);
      await expectAllStrings(page);
      // Every service name is laid out (the narrow index falls back to a list).
      const hidden = await page.locator("li[data-service]").evaluateAll(
        (items) =>
          items.filter((item) => {
            const box = item.getBoundingClientRect();
            return box.width === 0 || box.height === 0;
          }).length,
      );
      expect(hidden).toBe(0);
    });
  }
});

test.describe("desktop motion", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    contextOptions: { reducedMotion: "no-preference" },
    // Touch emulation turns the pointer coarse: no snap while the test scrolls.
    hasTouch: true,
  });

  test("the light walks the themes while the stage holds, then descends", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        errors.push(message.text());
    });
    await open(page);
    const root = page.locator("[data-mo-root]");
    await expect(root).toHaveAttribute("data-motion", "ready");
    await expect(root).toHaveAttribute("data-pin", "1");
    const marks = await page.evaluate(() =>
      (
        window as unknown as {
          __mo: { marks: () => Record<string, number & number[]> };
        }
      ).__mo.marks(),
    );
    expect(marks.pinLength).toBeGreaterThan(900 * 3);

    // Before the hold: theme 02 (the hero's light).
    await expect(page.locator('li[data-theme="2"]')).toHaveAttribute(
      "data-current",
      "1",
    );
    const indexTop = () =>
      page
        .locator("[data-index]")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top));
    let held: number | null = null;
    for (const [stop, theme] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ] as const) {
      await scrollTo(page, marks.pinStart + (marks.pinLength * stop) / 3 + 1);
      await expect(page.locator(`li[data-theme="${theme}"]`)).toHaveAttribute(
        "data-current",
        "1",
      );
      await expect(page.locator(`[data-tick="${theme}"]`)).toHaveAttribute(
        "data-current",
        "1",
      );
      // The stage holds: the index stays where it pinned (1107 − 896 at 1440×900).
      const top = await indexTop();
      held ??= top;
      expect(Math.abs(top - held)).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(held! - 211)).toBeLessThanOrEqual(2);

    // After the descent the knuckles light; the pair being read warms its knuckle.
    const at = (stageY: number) =>
      stageY + marks.pinLength + marks.trackTop - marks.vh * 0.52;
    // Late in pair 2's reading range: the comets have reached the knuckles (hq.js
    // warms a knuckle only once the descent is complete).
    await scrollTo(page, at(marks.forks[1]!) + 110 * marks.z);
    await expect(page.locator('[data-fork="2"]')).toHaveAttribute("data-active", "1");
    await expect(page.locator('[data-knuckle="2"]')).toHaveAttribute(
      "data-active",
      "1",
    );
    await expect
      .poll(() =>
        page
          .locator('[data-warm-knuckle="2"]')
          .evaluate((el) => Number(getComputedStyle(el).opacity)),
      )
      .toBeGreaterThan(0.8);
    await expect
      .poll(() =>
        page
          .locator('[data-knuckle="1"] > div')
          .evaluate((el) => Number(getComputedStyle(el).opacity)),
      )
      .toBe(1);

    // The process follows the reading line; 06 is reached last.
    await scrollTo(page, at(marks.steps[2]!) + 4);
    await expect(page.locator('[data-step="3"]')).toHaveAttribute(
      "data-state",
      "reached",
    );
    await expect(page.locator('[data-step="4"]')).toHaveAttribute(
      "data-state",
      "pending",
    );
    await scrollTo(page, at(marks.steps[5]!) + 4);
    await expect(page.locator('[data-step="6"]')).toHaveAttribute(
      "data-state",
      "reached",
    );

    // The routes rise in as the young daisugi lights.
    await scrollTo(page, at(marks.audience + 200));
    await expect
      .poll(() =>
        page
          .locator("[data-routes]")
          .evaluate((el) => Number(getComputedStyle(el).opacity)),
      )
      .toBe(1);
    expect(errors).toEqual([]);
  });
});

test.describe("narrow motion", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    contextOptions: { reducedMotion: "no-preference" },
    isMobile: true,
    hasTouch: true,
  });

  test("the camera walks the stations, the pairs and the process by scrolling", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning")
        errors.push(message.text());
    });
    await open(page);
    const root = page.locator("[data-mo-root]");
    await expect(root).toHaveAttribute("data-motion", "ready", { timeout: 20_000 });
    await expect(root).toHaveAttribute("data-ready", "1");
    const marks = await page.evaluate(
      () =>
        JSON.parse(
          JSON.stringify(
            (window as unknown as { __mo: { marks: unknown } }).__mo.marks,
          ),
        ) as { st: [number, number][]; forks: number[]; steps: number[]; aud: number },
    );
    for (const [i, [a, b]] of marks.st.entries()) {
      await scrollTo(page, (a + b) / 2);
      await expect(page.locator(`li[data-theme="${i + 1}"]`)).toHaveAttribute(
        "data-current",
        "1",
      );
      await expect(page.locator(`[data-tick="${i + 1}"]`)).toHaveAttribute(
        "data-current",
        "1",
      );
      // The columns ride on the photograph inside the viewport.
      const placed = await page
        .locator(`li[data-theme="${i + 1}"] li[data-service]`)
        .evaluateAll((items) =>
          items.every((item) => {
            const box = item.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth && box.height > 60;
          }),
        );
      expect(placed).toBe(true);
    }
    for (const [i, y] of marks.forks.entries()) {
      await scrollTo(page, y);
      await expect(page.locator(`[data-fork="${i + 1}"]`)).toHaveAttribute(
        "data-active",
        "1",
      );
      await expect(page.locator(`[data-ring="${i + 1}"]`)).toHaveAttribute(
        "data-lit",
        "1",
      );
    }
    await scrollTo(page, marks.steps[3]!);
    await expect(page.locator('[data-step="4"]')).toHaveAttribute(
      "data-state",
      "current",
    );
    await expect(page.locator('[data-step="3"]')).toHaveAttribute(
      "data-state",
      "reached",
    );
    await scrollTo(page, marks.aud);
    await expect(
      page.locator("main").getByRole("link", { name: audienceLinks.items[0]!.label }),
    ).toBeInViewport();
    expect(errors).toEqual([]);
  });
});
