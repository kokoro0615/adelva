import { expect, test, type Locator, type Page } from "@playwright/test";

import { detailPages } from "../../src/content/detail-target";
import { brand } from "../../src/content/shared";

/**
 * Regression cover for the four defects found by the independent live-browser
 * audit on 2026-08-31. Each block reproduces the audited failure first and then
 * asserts the contract the implementation must keep:
 *
 *  1. focus must enter the *visible* Close control at every viewport under both
 *     motion preferences (it did not under `reduce`: the dialog was still
 *     `visibility: hidden` when the one-shot focus call ran);
 *  2. the menu scroll lock must survive a programmatic scroll, not only wheel
 *     and keys;
 *  3. first-viewport hero content must be readable and inside the viewport on
 *     the first painted frame, never gated behind an entrance animation;
 *  4. the approved wordmark must render in full at 768 with no ellipsis.
 *
 * Everything here is local-only: no target asset, origin or network call is
 * involved.
 */

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const motionPreferences = ["no-preference", "reduce"] as const;

/** The route renderer consumes the measured detail target, not the retired
 * generic page-document model. Keep typography assertions on that same source
 * of truth so target-specific hero labels remain intentional. */
const journeyDetailPages = detailPages().filter((page) => page.family === "journey");

const homeLandmarks = {
  desktop: { fontSize: 256, lineHeight: 256, x: 137.6, y: 620, width: 1164.7 },
  tablet: { fontSize: 256, lineHeight: 256, x: 81.7, y: 744, width: 604.7 },
  mobile: { fontSize: 80, lineHeight: 80, x: 12, y: 740, width: 366 },
} as const;

/** Essential first-viewport content on `/`, in reading order. */
const essentialHeroContent = [
  { label: "lede", selector: ".home-hero__standfirst" },
  { label: "cue", selector: ".home-hero__film" },
  { label: "title", selector: '[data-fidelity-landmark="hero-title"]' },
] as const;

/**
 * Records the earliest frame on which each essential element exists, straight
 * from the document start, so the assertions below are made against a real
 * first paint rather than a settled page.
 */
const FIRST_PAINT_PROBE = `
window.__firstPaint = { samples: {}, start: performance.now() };
(function sample() {
  const targets = ${JSON.stringify(
    essentialHeroContent.map((entry) => [entry.label, entry.selector]),
  )};
  for (const [label, selector] of targets) {
    if (window.__firstPaint.samples[label]) continue;
    const element = document.querySelector(selector);
    if (!element) continue;
    const box = element.getBoundingClientRect();
    window.__firstPaint.samples[label] = {
      elapsedMs: performance.now() - window.__firstPaint.start,
      opacity: Number.parseFloat(getComputedStyle(element).opacity),
      top: box.top,
      bottom: box.bottom,
      viewportHeight: window.innerHeight,
    };
  }
  requestAnimationFrame(sample);
})();
`;

interface FirstPaintSample {
  readonly elapsedMs: number;
  readonly opacity: number;
  readonly top: number;
  readonly bottom: number;
  readonly viewportHeight: number;
}

interface SeekSample {
  readonly progress: number;
  readonly opacity: number;
  readonly top: number;
  readonly bottom: number;
  readonly viewportHeight: number;
}

/** The visible control that opens the menu at the current viewport. */
async function visibleMenuOpener(page: Page): Promise<Locator> {
  const header = page.locator("header.masthead");
  const compact = header.getByRole("button", { name: /^menu$/i });
  if (await compact.isVisible()) {
    return compact;
  }
  const tab = header.getByRole("button").first();
  await expect(tab).toBeVisible();
  return tab;
}

async function scrollDocumentTo(page: Page, top: number): Promise<void> {
  await page.evaluate((target) => {
    window.scrollTo({ top: target, left: 0, behavior: "instant" });
  }, top);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(top);
  // A coordinate can update before the browser dispatches the matching scroll
  // event. Give the event handler and its requestAnimationFrame evaluation one
  // frame each, otherwise two consecutive helper calls can be coalesced into a
  // single downward event and fail to create the intended upward arrival.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/**
 * Arrives at `top` with the masthead on screen.
 *
 * The masthead is direction-aware by design: it clears itself on the way down
 * and returns on the way up, so a reader reaches the menu from an upward move.
 * Reproducing that here keeps the scroll-lock assertions about the lock instead
 * of about the masthead.
 */
async function scrollToWithMastheadShown(page: Page, top: number): Promise<void> {
  await scrollDocumentTo(page, top + 200);
  await scrollDocumentTo(page, top);
  await expect(page.locator("header.masthead")).not.toHaveAttribute(
    "data-retracted",
    "true",
  );
}

function scrollY(page: Page): Promise<number> {
  return page.evaluate(() => Math.round(window.scrollY));
}

/**
 * Samples an element while its own entrance animation is seeked to fixed points
 * on its timeline. This is the deterministic complement to the first-paint
 * probe: it cannot pass merely because the harness sampled late.
 */
function seekEntranceSamples(
  page: Page,
  selector: string,
  progressPoints: readonly number[],
): Promise<readonly SeekSample[]> {
  return page.evaluate(
    ({ selector: target, progressPoints: points }) => {
      const element = document.querySelector(target);
      if (!element) {
        throw new Error(`Expected first-viewport element: ${target}`);
      }
      const animations = element.getAnimations();
      const samples = points.map((progress) => {
        for (const animation of animations) {
          const timing = animation.effect?.getComputedTiming();
          if (!timing) {
            continue;
          }
          animation.pause();
          const delay = typeof timing.delay === "number" ? timing.delay : 0;
          const active =
            typeof timing.activeDuration === "number" ? timing.activeDuration : 0;
          animation.currentTime = delay + active * progress;
        }
        const box = element.getBoundingClientRect();
        return {
          progress,
          opacity: Number.parseFloat(getComputedStyle(element).opacity),
          top: box.top,
          bottom: box.bottom,
          viewportHeight: window.innerHeight,
        };
      });
      for (const animation of animations) {
        animation.play();
      }
      return samples;
    },
    { selector, progressPoints },
  );
}

test.describe("menu focus enters the visible dialog", () => {
  for (const viewport of viewports) {
    for (const reducedMotion of motionPreferences) {
      test(`${viewport.name} / ${reducedMotion}: focus lands on the visible Close control`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion });
        await page.goto("/");

        const opener = await visibleMenuOpener(page);
        await opener.focus();
        await opener.click();

        const menu = page.locator("#site-menu");
        const close = menu.getByRole("button", { name: /close/i });

        await expect(menu).toBeVisible();
        await expect(close).toBeVisible();

        const exposure = await page.evaluate(async () => {
          const panel = document.querySelector<HTMLElement>("#site-menu");
          const closeButton = document.querySelector<HTMLButtonElement>(".menu__close");
          if (!panel || !closeButton) {
            throw new Error("Expected menu panel and Close control");
          }

          const samples: {
            focused: boolean;
            fullyExposed: boolean;
            panelRight: number;
            left: number;
            right: number;
          }[] = [];

          for (let frame = 0; frame < 90; frame += 1) {
            const box = closeButton.getBoundingClientRect();
            const clip = panel.getBoundingClientRect();
            const ring = {
              left: box.left - 6,
              top: box.top - 6,
              right: box.right + 6,
              bottom: box.bottom + 6,
            };
            const focused = document.activeElement === closeButton;
            const fullyExposed =
              ring.left >= 0 &&
              ring.top >= 0 &&
              ring.right <= window.innerWidth &&
              ring.bottom <= window.innerHeight &&
              ring.left >= clip.left &&
              ring.top >= clip.top &&
              ring.right <= clip.right &&
              ring.bottom <= clip.bottom;
            samples.push({
              focused,
              fullyExposed,
              panelRight: clip.right,
              left: box.left,
              right: box.right,
            });
            if (focused && fullyExposed) {
              return samples;
            }
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            );
          }

          return samples;
        });
        const firstExposedFrame = exposure.findIndex((sample) => sample.fullyExposed);
        const firstFocusedFrame = exposure.findIndex((sample) => sample.focused);

        expect(
          exposure.filter((sample) => sample.focused && !sample.fullyExposed),
          "Close must never own focus while its label or focus ring is viewport- or panel-clipped",
        ).toEqual([]);
        expect(
          exposure.at(-1)?.focused && exposure.at(-1)?.fullyExposed,
          "focus must move to Close as soon as the wipe fully exposes it",
        ).toBe(true);
        expect(
          firstExposedFrame,
          "the wipe must fully expose Close",
        ).toBeGreaterThanOrEqual(0);
        expect(
          firstFocusedFrame,
          "focus must eventually enter the dialog",
        ).toBeGreaterThanOrEqual(firstExposedFrame);
        expect(
          firstFocusedFrame - firstExposedFrame,
          "Close must receive focus on the first fully exposed frame (allowing one rAF ordering frame)",
        ).toBeLessThanOrEqual(1);
        await expect(close).toBeFocused();

        // The control focus lands on must actually be rendered, not merely
        // present: a `visibility: hidden` panel silently refuses focus.
        expect(
          await menu.evaluate((element) => getComputedStyle(element).visibility),
        ).toBe("visible");

        // Focus containment survives the fix.
        for (let step = 0; step < 4; step += 1) {
          await page.keyboard.press("Tab");
          expect(
            await menu.evaluate((element) => element.contains(document.activeElement)),
            "focus must stay inside the modal menu",
          ).toBe(true);
        }

        // Escape dismisses and focus returns to the control that opened it.
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(opener).toHaveAttribute("aria-expanded", "false");
        await expect(opener).toBeFocused();

        // The geometry watcher resets cleanly for a second opening; no stale
        // rAF may strand focus after an interrupted close/reopen cycle.
        await opener.click();
        await expect(menu).toBeVisible();
        await expect(close).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(opener).toBeFocused();
      });
    }
  }
});

test.describe("home preserves the measured two-viewport monument stage", () => {
  for (const viewport of viewports) {
    for (const reducedMotion of motionPreferences) {
      test(`${viewport.name} / ${reducedMotion}: stage and settled landmark geometry match`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion });
        await page.goto("/");
        await page.evaluate(async () => document.fonts.ready);

        const geometry = await page.evaluate(() => {
          const hero = document.querySelector<HTMLElement>(
            '[data-fidelity-section="hero"]',
          );
          const title = document.querySelector<HTMLElement>(
            '[data-fidelity-landmark="hero-title"]',
          );
          if (!hero || !title) {
            throw new Error("Expected home hero and title landmarks");
          }
          for (const animation of title.getAnimations()) {
            animation.finish();
          }
          const box = title.getBoundingClientRect();
          const style = getComputedStyle(title);
          return {
            heroHeight: hero.getBoundingClientRect().height,
            fontSize: Number.parseFloat(style.fontSize),
            lineHeight: Number.parseFloat(style.lineHeight),
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            opacity: Number.parseFloat(style.opacity),
            overflow:
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          };
        });

        const expected = homeLandmarks[viewport.name];
        expect(geometry.heroHeight).toBeCloseTo(viewport.height * 2, 0);
        expect(geometry.fontSize).toBeCloseTo(expected.fontSize, 0);
        expect(geometry.lineHeight).toBeCloseTo(expected.lineHeight, 0);
        expect(geometry.x).toBeCloseTo(expected.x, 0);
        expect(geometry.width).toBeCloseTo(expected.width, 0);
        if ("y" in expected) {
          expect(geometry.y).toBeCloseTo(expected.y, 0);
        }
        expect(geometry.height).toBeCloseTo(expected.lineHeight, 0);
        expect(geometry.opacity).toBeGreaterThanOrEqual(0.99);
        expect(geometry.y).toBeGreaterThanOrEqual(-1);
        expect(geometry.y + geometry.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(geometry.overflow).toBeLessThanOrEqual(0);
      });
    }
  }

  for (const viewport of viewports) {
    test(`${viewport.name}: departure progresses across the full stage`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      await page.evaluate(async () => document.fonts.ready);

      const sampleAt = async (top: number) => {
        await page.evaluate((scrollTop) => {
          window.scrollTo({ top: scrollTop, behavior: "instant" });
        }, top);
        await page.waitForTimeout(700);
        return page.evaluate(() => {
          const wrapper = document.querySelector<HTMLElement>(
            '[data-motion-layer="hero-wrapper"]',
          );
          const content = document.querySelector<HTMLElement>(
            '[data-motion-layer="hero-content"]',
          );
          const title = document.querySelector<HTMLElement>(
            '[data-motion-layer="hero-title"]',
          );
          const near = document.querySelector<HTMLElement>(
            '[data-motion-layer="cloud-near"]',
          );
          if (!wrapper || !content || !title || !near) {
            throw new Error("Expected target-specific HOME motion layers");
          }
          const y = (element: HTMLElement) => {
            const transform = getComputedStyle(element).transform;
            return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
          };
          return {
            wrapperY: y(wrapper),
            contentY: y(content),
            nearY: y(near),
            titleFilter: getComputedStyle(title).filter,
          };
        });
      };

      const middle = await sampleAt(viewport.height);
      const end = await sampleAt(Math.round(viewport.height * 1.95));

      expect(middle.wrapperY).toBeGreaterThan(viewport.height * 0.9);
      expect(end.wrapperY).toBeGreaterThan(middle.wrapperY + viewport.height * 0.8);
      expect(middle.contentY).toBeLessThan(-viewport.height * 0.25);
      expect(end.contentY).toBeLessThan(middle.contentY - viewport.height * 0.2);
      expect(end.nearY).toBeLessThan(middle.nearY - viewport.height * 0.5);
      const middleBlur = Number(
        /blur\(([\d.]+)px\)/.exec(middle.titleFilter)?.[1] ?? 0,
      );
      const endBlur = Number(/blur\(([\d.]+)px\)/.exec(end.titleFilter)?.[1] ?? 0);
      expect(middleBlur).toBeGreaterThanOrEqual(4.5);
      expect(endBlur).toBeGreaterThan(middleBlur + 3);
    });
  }
});

test.describe("shared itinerary-detail typography", () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: every journey builder document uses title-case italic geometry`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });

      for (const pageDocument of journeyDetailPages) {
        await page.goto(pageDocument.path);
        await page.evaluate(async () => document.fonts.ready);
        const title = page.locator('[data-fidelity-landmark="hero-title"]');
        await expect(title).toHaveText(pageDocument.title);
        await expect(title).toHaveCSS("font-style", "italic");
        await expect(title).toHaveCSS("text-transform", "none");
        await expect(title).toHaveCSS(
          "font-size",
          viewport.name === "mobile" ? "32px" : "60px",
        );
        await expect(title).toHaveCSS(
          "line-height",
          viewport.name === "mobile" ? "32px" : "60px",
        );
      }
    });
  }
});

test.describe("menu scroll lock is complete", () => {
  for (const viewport of viewports) {
    for (const reducedMotion of motionPreferences) {
      test(`${viewport.name} / ${reducedMotion}: the reading position is held against every scroll source`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion });
        await page.goto("/");
        await page.evaluate(async () => document.fonts.ready);

        expect(
          await page.evaluate(
            () => document.documentElement.scrollHeight > window.innerHeight + 800,
          ),
          "the home route must be tall enough to prove a scroll lock",
        ).toBe(true);

        const anchor = 400;
        await scrollToWithMastheadShown(page, anchor);

        const beforeLock = await page.evaluate(() => ({
          documentTop: Math.round(document.body.getBoundingClientRect().top),
          scrollHeight: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
        }));

        const opener = await visibleMenuOpener(page);
        await opener.click();
        const menu = page.locator("#site-menu");
        await expect(menu).toBeVisible();
        await expect(menu.getByRole("button", { name: /close/i })).toBeFocused();

        await expect(page.locator("html")).toHaveAttribute(
          "data-scroll-locked",
          "true",
        );
        expect(await scrollY(page)).toBe(anchor);

        // 1. Programmatic scrolling — the gap the audit found.
        await page.evaluate(() => window.scrollTo(0, 700));
        await expect.poll(() => scrollY(page)).toBe(anchor);

        // 2. `scrollIntoView` from script.
        await page.evaluate(() => {
          document.querySelector("[data-site-footer]")?.scrollIntoView();
        });
        await expect.poll(() => scrollY(page)).toBe(anchor);

        // 3. Wheel and keys.
        await page.mouse.wheel(0, 600);
        await expect.poll(() => scrollY(page)).toBe(anchor);
        await page.keyboard.press("PageDown");
        await page.keyboard.press("End");
        await expect.poll(() => scrollY(page)).toBe(anchor);

        // The lock must be layout stable: the document keeps its height and its
        // position, so nothing may be pinned with a compensating offset.
        const duringLock = await page.evaluate(() => ({
          documentTop: Math.round(document.body.getBoundingClientRect().top),
          scrollHeight: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(duringLock).toEqual(beforeLock);

        // 4. Release restores the exact position and native scrolling.
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-scroll-locked",
          "true",
        );
        expect(await scrollY(page)).toBe(anchor);

        await scrollDocumentTo(page, anchor + 300);
      });
    }
  }
});

test.describe("first-viewport content is never motion-gated", () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: hero copy is readable and in view on the first painted frame`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.addInitScript(FIRST_PAINT_PROBE);
      await page.goto("/");

      const samples = await page.evaluate(
        () =>
          (window as unknown as { __firstPaint: { samples: Record<string, unknown> } })
            .__firstPaint.samples,
      );

      for (const entry of essentialHeroContent) {
        const sample = samples[entry.label] as FirstPaintSample | undefined;
        expect(sample, `no first-paint sample for ${entry.label}`).toBeTruthy();
        if (!sample) {
          continue;
        }

        expect(
          sample.opacity,
          `${entry.label} must be readable at first paint (${sample.elapsedMs.toFixed(0)}ms)`,
        ).toBeGreaterThanOrEqual(0.99);
        expect(
          sample.top,
          `${entry.label} must start inside the viewport at first paint`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          sample.bottom,
          `${entry.label} must fit inside the viewport at first paint`,
        ).toBeLessThanOrEqual(sample.viewportHeight + 1);
      }

      // Deterministic complement: seek each entrance to fixed points on its own
      // timeline, so a slow harness cannot turn a settled page into a pass.
      for (const entry of essentialHeroContent) {
        const seeked = await seekEntranceSamples(page, entry.selector, [0, 0.25, 0.6]);
        for (const sample of seeked) {
          expect(
            sample.opacity,
            `${entry.label} must stay readable at ${sample.progress * 100}% of its entrance`,
          ).toBeGreaterThanOrEqual(0.99);
          expect(
            sample.top,
            `${entry.label} must stay in the viewport at ${sample.progress * 100}% of its entrance`,
          ).toBeGreaterThanOrEqual(-1);
          expect(
            sample.bottom,
            `${entry.label} must stay in the viewport at ${sample.progress * 100}% of its entrance`,
          ).toBeLessThanOrEqual(sample.viewportHeight + 1);
        }
      }
    });
  }
});

test.describe("masthead brand is never clipped", () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: the approved wordmark renders in full`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.evaluate(async () => document.fonts.ready);

      const lockup = await page.evaluate(() => {
        const words = Array.from(
          document.querySelectorAll<HTMLElement>(".masthead__brand .brandmark__word"),
        ).filter((element) => getComputedStyle(element).display !== "none");
        const bar = document.querySelector<HTMLElement>(".masthead__bar");
        return {
          visibleWords: words.map((element) => ({
            text: element.textContent ?? "",
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
          })),
          barClientWidth: bar?.clientWidth ?? 0,
          barScrollWidth: bar?.scrollWidth ?? 0,
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });

      expect(lockup.visibleWords).toHaveLength(1);
      const word = lockup.visibleWords[0];

      // No ellipsis: the rendered box must be wide enough for the whole string.
      expect(
        word.scrollWidth,
        `"${word.text}" is clipped (${word.clientWidth}px box for ${word.scrollWidth}px of text)`,
      ).toBeLessThanOrEqual(word.clientWidth);

      // The full approved wordmark is required from the tablet breakpoint up;
      // below it the compact lockup is the authored identity.
      expect(word.text).toBe(viewport.width >= 768 ? brand.wordmark : brand.shortName);

      // Header geometry stays intact: the bar itself must not overflow, and the
      // document must not gain a horizontal scrollbar.
      expect(lockup.barScrollWidth).toBeLessThanOrEqual(lockup.barClientWidth + 1);
      expect(lockup.documentOverflow).toBeLessThanOrEqual(0);

      await expect(page.locator(".masthead__brand")).toHaveAccessibleName(
        viewport.width >= 768 ? brand.wordmark : brand.shortName,
      );
    });
  }
});
