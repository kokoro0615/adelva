import { expect, test, type Page } from "@playwright/test";

import {
  audienceLinks,
  integrated,
  requiredStrings,
  responsibilities,
  route,
  stages,
  verification,
} from "../../src/content/adelva-approach-page";
import { sitePage } from "../../src/content/site-pages";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function open(page: Page) {
  const response = await page.goto(route);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  return response;
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
      await open(page);
      await expect(page).toHaveTitle(`${sitePage("/approach").title}｜ADELVA`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("支援の進め方");
      await expectAllStrings(page);

      const crumb = page.getByRole("navigation", { name: "パンくず" });
      await expect(crumb.getByRole("link", { name: "HOME" })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(crumb.locator('[aria-current="page"]')).toHaveText("支援の進め方");

      // The descent scale: six anchors, each to an existing stage.
      const rail = page.getByRole("navigation", { name: /^工程/ });
      await expect(rail.getByRole("link")).toHaveCount(6);
      for (const stage of stages.items) {
        await expect(
          rail.getByRole("link", { name: `${stage.number} ${stage.name}` }),
        ).toHaveAttribute("href", `#${stage.id}`);
        await expect(page.locator(`#${stage.id}`)).toHaveCount(1);
      }

      // Six stages: an ordered list, each with an h3 and its tags as a list.
      const list = page.getByRole("list", { name: "支援の工程" });
      await expect(list.locator("> li")).toHaveCount(6);
      for (const [index, stage] of stages.items.entries()) {
        const item = list.locator("> li").nth(index);
        await expect(item.getByRole("heading", { level: 3 })).toHaveText(stage.name);
        await expect(item.locator("[data-stage-text] ul > li")).toHaveText([
          ...stage.tags,
        ]);
      }

      // Finders are links to the stage they frame (hero → 01 … 05 → 06).
      for (const stage of stages.items) {
        await expect(
          page
            .locator("main")
            .getByRole("link", { name: `${stage.number} ${stage.name}へ` }),
        ).toHaveAttribute("href", `#${stage.id}`);
      }

      // Responsibilities: a definition list of four roles; bars are decorative.
      const roles = page.locator("[data-section='responsibilities'] dl");
      await expect(roles.locator("dt")).toHaveText(
        responsibilities.roles.map((role) => role.name),
      );
      await expect(roles.locator("dd")).toHaveText(
        responsibilities.roles.map((role) => role.scope),
      );
      await expect(page.locator("[data-bar]")).toHaveCount(5);

      // Integrated support keeps its IA anchor and links the three domains.
      await expect(page.locator(`section#${integrated.id}`)).toHaveCount(1);
      for (const domain of integrated.domains)
        await expect(page.locator(`[data-domain="${domain.id}"]`)).toHaveAttribute(
          "href",
          domain.href,
        );
      await expect(page.locator("[data-example-item]")).toHaveText([
        ...integrated.example.items,
      ]);

      await expect(page.locator("[data-check] h3")).toHaveText(
        verification.items.map((item) => item.name),
      );
      for (const item of audienceLinks.items)
        await expect(
          page.locator("main").getByRole("link", { name: item.label }),
        ).toHaveAttribute("href", item.href);
      await expect(
        page.locator("main").getByRole("link", { name: "問い合わせを送信" }),
      ).toHaveAttribute("href", "/contact");

      // Shared shell and layout integrity.
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);

      // Photographs describe their scale; the hero and backgrounds are decorative.
      const images = await page.locator("main img").evaluateAll((nodes) =>
        nodes.map((node) => ({
          alt: node.getAttribute("alt"),
          width: node.getAttribute("width"),
          height: node.getAttribute("height"),
        })),
      );
      expect(images.filter((image) => image.alt).map((image) => image.alt)).toEqual(
        stages.items.map((stage) => stage.alt),
      );
      expect(images.every((image) => image.width && image.height)).toBe(true);
    });

    test("reduced motion renders the finished, static descent", async ({ page }) => {
      await open(page);
      await expect(page.locator("[data-motion]")).toHaveCount(0);
      await expect(page.locator(".pin-spacer")).toHaveCount(0);
      const hidden = await page.locator("[data-reveal], [data-frame]").evaluateAll(
        (nodes) =>
          nodes.filter((node) => {
            const style = getComputedStyle(node);
            return (
              style.opacity !== "1" ||
              style.clipPath !== "none" ||
              style.transform !== "none"
            );
          }).length,
      );
      expect(hidden).toBe(0);
      const bars = await page
        .locator("[data-bar]")
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().width),
        );
      expect(bars.every((width) => width > 20)).toBe(true);
      // Every magnification line is drawn and lands on a photograph's corner.
      const variant = viewport.width >= 1024 ? "desktop" : "mobile";
      const lines = page.locator(`[data-lines="${variant}"] [data-line]`);
      await expect(lines).toHaveCount(12);
      const misses = await page.evaluate((variant) => {
        const frames = [...document.querySelectorAll("[data-frame]")].map((frame) =>
          frame.getBoundingClientRect(),
        );
        const out: number[] = [];
        for (const line of document.querySelectorAll<HTMLElement>(
          `[data-lines="${variant}"] [data-line]`,
        )) {
          const box = line.getBoundingClientRect();
          if (!box.width) out.push(-1);
          const pair = Number(
            line.closest<HTMLElement>("[data-line-pair]")!.dataset.linePair,
          );
          const frame = frames[pair]!;
          const end = {
            x: line.dataset.side === "left" ? frame.left : frame.right,
            y: frame.top,
          };
          // The far end of a rotated box is its lowest corner on that side.
          const tip = {
            x: line.dataset.side === "left" ? box.left : box.right,
            y: box.bottom,
          };
          out.push(Math.hypot(tip.x - end.x, tip.y - end.y));
        }
        return out;
      }, variant);
      expect(misses.every((miss) => miss >= 0 && miss < 4)).toBe(true);
    });

    test("images hidden: text and controls remain", async ({ page }) => {
      await open(page);
      await page.addStyleTag({
        content: "img, picture { visibility: hidden !important; }",
      });
      await expectAllStrings(page);
      await expect(
        page.locator("main").getByRole("link", { name: "問い合わせを送信" }),
      ).toBeVisible();
    });
  });
}

test.describe("phone header", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("turns to smoked glass once the page scrolls under it", async ({ page }) => {
    for (const path of [route, "/services/revenue-brand"]) {
      await page.goto(path);
      await expect(page.locator("header[data-surface='glass']")).toHaveCount(1);
      // The bar is the menu button's own row.
      const bar = page.getByRole("button", { name: "メニューを開く" }).locator("..");
      const alpha = () =>
        bar.evaluate((n) => {
          const match = getComputedStyle(n).backgroundColor.match(/[\d.]+/g) ?? [];
          return match.length === 4 ? Number(match[3]) : match.length ? 1 : 0;
        });
      expect(await alpha()).toBe(0);
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
      await expect(page.locator("header[data-compact='true']")).toHaveCount(1);
      await expect.poll(alpha).toBeGreaterThan(0.5);
      // Phones get a pre-composited smoked fill: no backdrop-filter over moving content.
      expect(await bar.evaluate((n) => getComputedStyle(n).backdropFilter)).toBe(
        "none",
      );
    }
  });
});

test.describe("keyboard", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("finder and rail links move focus to their stage", async ({ page }) => {
    await open(page);
    await page.locator("main").getByRole("link", { name: "01 課題把握へ" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#stage-01$/);
    await expect(page.locator("#stage-01")).toBeInViewport();

    await page.locator("main").getByRole("link", { name: "03 実行・実装へ" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#stage-03$/);
    await expect(page.locator("#stage-03")).toBeInViewport();
  });
});

test.describe("motion", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    contextOptions: { reducedMotion: "no-preference" },
  });

  test("the dive sticks, lands frame 01 where it rests and hands the page back", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await open(page);
    await expect(page.locator("[data-motion='on'][data-dive='on']")).toHaveCount(1);
    // A sticky stage, not a pin: no spacer, no fixed swap.
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    const geometry = () =>
      page.evaluate(() => {
        const frame = document.querySelector("[data-stage='1'] [data-frame]")!;
        const box = frame.getBoundingClientRect();
        const probe = document.querySelector("[data-dive-probe]")!;
        const stage = document.querySelector("[data-dive-stage]")!;
        return {
          top: box.top + window.scrollY,
          width: box.width,
          stageTop: stage.getBoundingClientRect().top,
          stickyTop: parseFloat(getComputedStyle(stage).top),
          end: probe.getBoundingClientRect().bottom + window.scrollY,
        };
      });
    const rest = await page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>(
        "[data-stage='1'] [data-frame]",
      )!;
      return { width: frame.offsetWidth };
    });

    // Mid-dive: the stage holds its sticky offset and frame 01 is a small window.
    const start = await geometry();
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      start.end / 2,
    );
    await expect
      .poll(async () => (await geometry()).width)
      .toBeLessThan(rest.width * 0.8);
    const mid = await geometry();
    expect(Math.abs(mid.stageTop - mid.stickyTop)).toBeLessThan(1);

    // Landed: frame 01 rests at full size where the static page has it.
    await page.evaluate(
      (y) => window.scrollTo({ top: y + 40, behavior: "instant" }),
      start.end,
    );
    await expect
      .poll(async () => (await geometry()).width)
      .toBeGreaterThan(rest.width - 1);
    const landed = await geometry();
    const staticTop = await page.evaluate(() => {
      // 985.8 design units at 1440 (spec §5.1).
      const unit = Math.min(window.innerWidth, 1920) / 1440;
      return 985.8 * unit;
    });
    expect(Math.abs(landed.top - staticTop)).toBeLessThan(1.5);
    await expect
      .poll(() =>
        page
          .locator("[data-stage='1'] [data-reveal]")
          .evaluateAll((nodes) =>
            nodes.every((node) => getComputedStyle(node).opacity === "1"),
          ),
      )
      .toBe(true);

    // A keyboard return to the hero brings the page back to the top.
    await page
      .getByRole("navigation", { name: "パンくず" })
      .getByRole("link", { name: "HOME" })
      .focus();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
    expect(errors).toEqual([]);
  });
});

test.describe("phone motion", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    contextOptions: { reducedMotion: "no-preference" },
  });

  test("touch scrolling runs the whole page without pins, shifts or hidden copy", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as Array<{
          value: number;
          hadRecentInput: boolean;
        }>)
          if (!entry.hadRecentInput)
            (window as unknown as { __cls: number }).__cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await open(page);
    await expect(page.locator("[data-motion='on'][data-dive='on']")).toHaveCount(1);
    await expect(page.locator(".pin-spacer")).toHaveCount(0);

    const cdp = await page.context().newCDPSession(page);
    const drag = async (distance: number) => {
      const x = 195;
      const y0 = 520;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y: y0 }],
      });
      for (let step = 1; step <= 10; step++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y0 - (distance * step) / 10 }],
        });
        await page.waitForTimeout(16);
      }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(220);
    };

    // During the dive the stage holds still under the finger.
    const { begin, end } = await page.evaluate(() => {
      const probe = document
        .querySelector("[data-dive-probe]")!
        .getBoundingClientRect();
      return { begin: probe.top + window.scrollY, end: probe.bottom + window.scrollY };
    });
    const stageTops: number[] = [];
    while ((await page.evaluate(() => window.scrollY)) < end - 120) {
      await drag(160);
      const sample = await page.evaluate(() => {
        const stage = document.querySelector("[data-dive-stage]")!;
        return {
          y: window.scrollY,
          offset:
            stage.getBoundingClientRect().top - parseFloat(getComputedStyle(stage).top),
        };
      });
      if (sample.y > begin + 1 && sample.y < end - 1) stageTops.push(sample.offset);
    }
    expect(stageTops.length).toBeGreaterThan(1);
    expect(stageTops.every((offset) => Math.abs(offset) < 1)).toBe(true);

    // Then all the way down.
    let last = -1;
    for (let guard = 0; guard < 80; guard++) {
      const y = await page.evaluate(() => window.scrollY);
      if (y === last) break;
      last = y;
      await drag(420);
    }
    const max = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(last).toBeGreaterThan(max - 4);
    await page.waitForTimeout(600);
    await expect(
      page.locator(
        "[data-reveal-pending], [data-bars-pending], [data-example-pending], [data-checks-pending], [data-handover-pending]",
      ),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => (window as unknown as { __cls: number }).__cls),
    ).toBe(0);
    expect(errors).toEqual([]);
  });
});
