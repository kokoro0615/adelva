import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  chapters,
  processCopy,
  requiredStrings,
  route,
} from "../../src/content/adelva-management-operations";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const services = chapters.flatMap((chapter) => chapter.services);

async function open(page: Page) {
  await page.goto(route);
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

for (const viewport of viewports) {
  test.describe(`${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("renders every approved string as text, with semantics and no overflow", async ({
      page,
    }) => {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveTitle("経営・運営統括 — ADELVA");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "経営・運営統括",
      );
      await expectAllStrings(page);

      // Breadcrumb: HOME links home, 支援内容 is text (no /services route), current page marked.
      const crumb = page.getByRole("navigation", { name: "パンくず" });
      await expect(crumb.getByRole("link", { name: "HOME" })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(crumb.getByRole("link", { name: "支援内容" })).toHaveCount(0);
      await expect(crumb.locator('[aria-current="page"]')).toHaveText("経営・運営統括");

      // Four chapters: h2 + list; eleven rows that are neither links nor focus stops.
      for (const chapter of chapters) {
        const section = page.locator(`section#${chapter.id}`);
        await expect(section.getByRole("heading", { level: 2 })).toHaveText(
          chapter.title,
        );
        await expect(section.locator("ul > li[data-row]")).toHaveCount(
          chapter.services.length,
        );
      }
      const rows = page.locator("li[data-row]");
      await expect(rows).toHaveCount(11);
      await expect(page.locator("li[data-row] a, li[data-row][tabindex]")).toHaveCount(
        0,
      );
      for (const service of services)
        await expect(page.locator(`li[data-row="${service.number}"]`)).toContainText(
          service.name,
        );

      // Boundaries: three <dl>, each with two terms and two definitions.
      const pairs = page.locator("[data-section='boundaries'] dl");
      await expect(pairs).toHaveCount(3);
      for (let index = 0; index < 3; index++) {
        await expect(pairs.nth(index).locator("dt")).toHaveCount(2);
        await expect(pairs.nth(index).locator("dd")).toHaveCount(2);
      }

      // Process: an ordered list of six steps, each with number, h3 and a tag list.
      const steps = page.getByRole("list", { name: "支援の工程" });
      await expect(steps.locator("> li")).toHaveCount(6);
      for (const [index, step] of processCopy.steps.entries()) {
        const item = steps.locator("> li").nth(index);
        await expect(item.getByRole("heading", { level: 3 })).toHaveText(step.name);
        await expect(item.locator("ul > li")).toHaveText([...step.tags]);
      }
      await expect(
        page.locator("main").getByRole("link", { name: "支援の進め方を見る" }),
      ).toHaveAttribute("href", "/approach");
      await expect(
        page.locator("main").getByRole("link", { name: "問い合わせを送信" }),
      ).toHaveAttribute("href", "/contact");
      await expect(
        page.locator("main").getByRole("link", { name: "オーナー・経営者の方へ" }),
      ).toHaveAttribute("href", "/challenges/owners");
      await expect(
        page.locator("main").getByRole("link", { name: "総支配人・現場責任者の方へ" }),
      ).toHaveAttribute("href", "/challenges/general-managers");

      // Shared shell.
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      // Decorative imagery only.
      const alts = await page
        .locator("main img")
        .evaluateAll((images) => images.map((image) => image.getAttribute("alt")));
      expect(alts.every((alt) => alt === "")).toBe(true);
    });

    test("reduced motion shows the finished 06 state", async ({ page }) => {
      await open(page);
      await expect(page.locator("[data-stage]")).toHaveAttribute(
        "data-progress",
        "complete",
      );
      const states = await page
        .locator("li[data-step]")
        .evaluateAll((items) => items.map((item) => item.getAttribute("data-state")));
      expect(states).toEqual(Array(6).fill("passed"));
      await expect(page.locator("[data-motion]")).toHaveCount(0);
      await expect(page.locator("[data-process-title] span")).toHaveCount(0);
    });

    test("images hidden: text and UI remain", async ({ page }) => {
      await open(page);
      await page.addStyleTag({
        content: "img, picture { visibility: hidden !important; }",
      });
      await expectAllStrings(page);
      await expect(
        page.locator("main").getByRole("link", { name: "問い合わせを送信" }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("heading", { name: "支援の進め方" })).toBeVisible();
    });
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  test("every string is visible and the process is complete", async ({ page }) => {
    await page.goto(route);
    await expectAllStrings(page);
    for (const service of services)
      await expect(page.locator(`li[data-row="${service.number}"]`)).toBeVisible();
    for (const step of processCopy.steps)
      await expect(
        page.getByRole("heading", { level: 3, name: step.name }),
      ).toBeVisible();
    await expect(page.locator("[data-stage]")).toHaveAttribute(
      "data-progress",
      "complete",
    );
  });
});

test.describe("mobile interactions", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("chapter index anchors move to their chapter", async ({ page }) => {
    await open(page);
    const index = page.getByRole("navigation", { name: "章索引" });
    await expect(index.getByRole("link")).toHaveCount(4);
    for (const chapter of chapters) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await index.getByRole("link", { name: new RegExp(chapter.title) }).click();
      await expect(page).toHaveURL(new RegExp(`#${chapter.id}$`));
      await expect(page.locator(`section#${chapter.id} h2`)).toBeInViewport();
    }
  });

  test("the room carousel works from the keyboard and lights its rows", async ({
    page,
  }) => {
    await open(page);
    const chapter = page.locator("section#operations-improvement");
    await expect(chapter).toHaveAttribute("data-active-room", "lobby");
    const next = page.getByRole("button", { name: "次の部屋" });
    const previous = page.getByRole("button", { name: "前の部屋" });
    for (const button of [next, previous]) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(chapter).toHaveAttribute("data-active-room", "restaurant");
    await expect(next).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(chapter).toHaveAttribute("data-active-room", "guest");
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await previous.focus();
    await page.keyboard.press("Space");
    await expect(chapter).toHaveAttribute("data-active-room", "restaurant");
    // The track itself is a focusable scroll region.
    await expect(page.getByRole("group", { name: "部屋の写真" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });
});

test.describe("mobile motion", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    contextOptions: { reducedMotion: "no-preference" },
  });

  test("floors light as the reader descends and the cabin rides the reading line", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page);
    await expect(page.locator("[data-motion='ready']")).toHaveCount(1);
    const veils = page.locator("svg:not([data-map-overlay]) [data-floor-veil]");
    await expect(veils).toHaveCount(6);
    const opacityOf = (index: number) =>
      veils.nth(index).evaluate((n) => Number(getComputedStyle(n).opacity));
    await page.waitForTimeout(1500);
    // The lowest floor is still below the fold: its lights are not on yet.
    expect(await opacityOf(5)).toBeGreaterThan(0.5);
    for (let y = 0; y <= 1400; y += 200) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(60);
    }
    for (let index = 0; index < 6; index++)
      await expect.poll(() => opacityOf(index)).toBeLessThan(0.05);

    // Reading line halfway between landing 02 and 03 (plate px 1208 / 1523).
    const target = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("[data-process] [data-stage]")!;
      const box = stage.getBoundingClientRect();
      return Math.round(
        box.top + scrollY + ((1208 + 1523) / 2) * (box.width / 853) - innerHeight / 2,
      );
    });
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), target);
    const cabinPlateY = () =>
      page.locator("[data-mobile-cabin]").evaluate((cabin) => {
        const stage = cabin.closest<HTMLElement>("[data-stage]")!;
        const ty = new DOMMatrix(getComputedStyle(cabin).transform).m42;
        return ty / (stage.clientWidth / 853) + 171.5;
      });
    await expect.poll(cabinPlateY).toBeGreaterThan(1300);
    expect(await cabinPlateY()).toBeLessThan(1430);
    await expect(page.locator("[data-process] li[data-step='2']")).toHaveAttribute(
      "data-state",
      "current",
    );
    expect(errors).toEqual([]);
  });
});

test.describe("desktop pinned process", () => {
  test.use({
    viewport: { width: 1440, height: 960 },
    contextOptions: { reducedMotion: "no-preference" },
  });

  const progressAt = (page: Page) =>
    page.evaluate(() => {
      const section = document.querySelector<HTMLElement>("[data-process]")!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      return {
        relative: (window.scrollY - top) / (window.innerHeight * 5),
        step: document.querySelector<HTMLElement>("[data-stage]")!.dataset.progress,
      };
    });

  async function scrollToProgress(page: Page, value: number) {
    await page.evaluate((fraction) => {
      const section = document.querySelector<HTMLElement>("[data-process]")!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: top + fraction * window.innerHeight * 5,
        behavior: "instant",
      });
    }, value);
  }

  test("pins, snaps to landings both ways and changes state through layers", async ({
    page,
  }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-smooth-scroll", "true");
    for (const [target, landing] of [
      [0.13, 0.2],
      [0.55, 0.6],
      [0.97, 1],
      [0.62, 0.6],
      [0.05, 0],
    ] as const) {
      await scrollToProgress(page, target);
      await expect
        .poll(async () => (await progressAt(page)).relative, { timeout: 4000 })
        .toBeCloseTo(landing, 2);
      await expect(page.locator("[data-stage]")).toHaveAttribute(
        "data-progress",
        String(Math.round(landing * 5) + 1),
      );
      const current = page.locator('li[data-step][data-state="current"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute(
        "data-step",
        String(Math.round(landing * 5) + 1),
      );
    }
    // One photograph set serves every state: layers change, sources never swap.
    const visibleSources = () =>
      page
        .locator("[data-plate] img")
        .evaluateAll((images) =>
          [
            ...new Set(
              images
                .filter((image) => image.getClientRects().length > 0)
                .map((image) => new URL((image as HTMLImageElement).src).pathname),
            ),
          ].sort(),
        );
    const atStart = await visibleSources();
    await scrollToProgress(page, 1);
    await expect(page.locator("[data-stage]")).toHaveAttribute("data-progress", "6");
    expect(await visibleSources()).toEqual(atStart);
    expect(atStart).toEqual([
      "/media/adelva/management-operations/cabin.webp",
      "/media/adelva/management-operations/process-base.webp",
      "/media/adelva/management-operations/process-lit.webp",
    ]);
  });

  test("wheel scrolling through Lenis settles on a landing", async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await scrollToProgress(page, 0);
    await page.mouse.move(720, 480);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(2200);
    const { relative } = await progressAt(page);
    expect(Math.abs(relative * 5 - Math.round(relative * 5))).toBeLessThan(0.02);
    await page.keyboard.press("End");
    await page.waitForTimeout(1500);
    await page.keyboard.press("Home");
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBe(0);
  });

  test("arrow keys step one landing each way", async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await scrollToProgress(page, 0);
    await page.waitForTimeout(1200);
    await page.mouse.click(1300, 600);
    for (const [key, landing] of [
      ["ArrowDown", 0.2],
      ["ArrowDown", 0.4],
      ["ArrowUp", 0.2],
    ] as const) {
      await page.keyboard.press(key);
      await expect
        .poll(async () => (await progressAt(page)).relative, { timeout: 4000 })
        .toBeCloseTo(landing, 2);
    }
  });

  test("back and forward return to the same landing", async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await scrollToProgress(page, 0.8);
    await expect(page.locator("[data-stage]")).toHaveAttribute("data-progress", "5");
    await page.waitForTimeout(800);
    // Client-side navigation away through the always-visible header, then back.
    await page.locator('header a[href="/contact"]:visible').first().click();
    await page.waitForURL("**/contact");
    await page.goBack();
    await page.waitForURL(`**${route}`);
    await expect
      .poll(async () => (await progressAt(page)).relative, { timeout: 6000 })
      .toBeCloseTo(0.8, 2);
    // Full document navigation away, then back.
    await page.goto("/contact");
    await page.goBack();
    await expect
      .poll(async () => (await progressAt(page)).relative, { timeout: 6000 })
      .toBeCloseTo(0.8, 2);
    // A fresh visit is not a traversal and starts at the top.
    await page.goto(route);
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("axe passes mid-sequence (upcoming steps stay AA)", async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-motion="ready"]')).toHaveCount(1);
    await scrollToProgress(page, 0);
    await page.waitForTimeout(1200);
    const audit = await new AxeBuilder({ page })
      .include("[data-process]")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
});
