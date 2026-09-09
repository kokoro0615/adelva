import { expect, test, type Page } from "@playwright/test";

/**
 * Global-shell acceptance contract for the HOME rebuild.
 *
 * The shell is deliberately tested separately from page-content.  The menu,
 * footer, and film portal are shared by every route, while the HOME hero is
 * the only place where the video/cloud/mist choreography lives.  All waits in
 * this file observe a state or a geometry boundary; none depend on an
 * arbitrary sleep.
 */

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

// A running dev server can be selected for local verification without
// changing the repository's canonical Playwright config.
const configuredBaseURL = process.env.PLAYWRIGHT_TEST_BASE_URL;

type ReducedMotion = "no-preference" | "reduce";

interface LayerState {
  readonly transform: string;
  readonly y: number;
  readonly m22: number;
  readonly m23: number;
  readonly filter: string;
}

interface HeroState {
  readonly scrollY: number;
  readonly near: LayerState;
  readonly far: LayerState;
  readonly mist: LayerState;
}

interface BrowserErrors {
  readonly console: string[];
  readonly page: string[];
  readonly hydration: string[];
}

/**
 * Authorized ADELVA navigation geometry.
 *
 * Every value below comes from `docs/specs/adelva-navigation-spec.md` §4, not
 * from the retired White Desert masthead: the header is an authorized
 * replacement rather than a reconstruction, so the target's drawer geometry no
 * longer governs it.
 */
function collectBrowserErrors(page: Page): BrowserErrors {
  const errors: BrowserErrors = {
    console: [],
    page: [],
    hydration: [],
  };

  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") {
      errors.console.push(text);
    }
    if (/hydration|hydrat(?:e|ed|ing)/i.test(text)) {
      errors.hydration.push(`console: ${text}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.page.push(error.message);
    if (/hydration|hydrat(?:e|ed|ing)/i.test(error.message)) {
      errors.hydration.push(`page: ${error.message}`);
    }
  });

  return errors;
}

function expectNoBrowserErrors(errors: BrowserErrors): void {
  expect(errors.console, "browser console errors").toEqual([]);
  expect(errors.page, "uncaught page errors").toEqual([]);
  expect(errors.hydration, "hydration errors").toEqual([]);
}

async function loadHome(
  page: Page,
  viewport: (typeof viewports)[number],
  reducedMotion: ReducedMotion,
): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.emulateMedia({ reducedMotion });
  await page.goto(
    configuredBaseURL ? new URL("/", configuredBaseURL).toString() : "/",
    { waitUntil: "load" },
  );
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-fidelity-landmark="header-nav"]')).toHaveCount(1);
  await expect(page.locator("main#main-content")).toHaveCount(1);
  await expect(page.locator("[data-site-footer]")).toHaveCount(1);
}

async function scrollInstant(page: Page, top: number): Promise<void> {
  await page.evaluate((target) => {
    window.scrollTo({ top: target, left: 0, behavior: "instant" as ScrollBehavior });
  }, top);
  await expect
    .poll(() => page.evaluate(() => Math.round(window.scrollY)), {
      message: `document did not reach scrollY=${Math.round(top)}`,
    })
    .toBe(Math.round(top));
}

async function readHeroState(page: Page): Promise<HeroState> {
  return page.evaluate(() => {
    const read = (id: string): LayerState => {
      const element = document.querySelector<HTMLElement>(
        `[data-motion-layer="${id}"]`,
      );
      if (!element) throw new Error(`Missing hero motion layer: ${id}`);
      const style = getComputedStyle(element);
      const matrix =
        style.transform === "none" ? null : new DOMMatrixReadOnly(style.transform);
      return {
        transform: style.transform,
        y: matrix?.m42 ?? 0,
        m22: matrix?.m22 ?? 1,
        m23: matrix?.m23 ?? 0,
        filter: style.filter,
      };
    };

    return {
      scrollY: window.scrollY,
      near: read("cloud-near"),
      far: read("cloud-far"),
      mist: read("mist-plane"),
    };
  });
}

async function waitForHeroState(
  page: Page,
  top: number,
  predicate: (state: HeroState) => boolean,
): Promise<HeroState> {
  await expect
    .poll(
      async () => {
        const state = await readHeroState(page);
        return Math.round(state.scrollY) === Math.round(top) && predicate(state);
      },
      { message: `hero motion did not resolve at scrollY=${Math.round(top)}` },
    )
    .toBe(true);
  return readHeroState(page);
}

test.describe("HOME hero media, cloud/mist scroll state, and film dialog", () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: video plays and cloud/mist state reverses deterministically`, async ({
      page,
    }) => {
      const errors = collectBrowserErrors(page);
      await loadHome(page, viewport, "no-preference");

      const video = page.locator('[data-fidelity-section="hero"] video');
      await expect(video).toHaveCount(1);
      await expect
        .poll(
          () =>
            video.evaluate((element) => {
              const player = element as HTMLVideoElement;
              return (
                player.autoplay &&
                player.loop &&
                player.muted &&
                player.playsInline &&
                !player.paused &&
                player.currentTime > 0
              );
            }),
          {
            message: `${viewport.name} hero video never entered the playing state`,
            timeout: 10_000,
          },
        )
        .toBe(true);

      const start = await waitForHeroState(page, 0, () => true);
      const halfwayTop = Math.round(viewport.height * 0.2);
      await scrollInstant(page, halfwayTop);
      const direct = await waitForHeroState(
        page,
        halfwayTop,
        (state) =>
          Math.abs(state.near.y - start.near.y) > 1 &&
          Math.abs(state.far.y - start.far.y) > 1,
      );
      await scrollInstant(page, viewport.height);
      const middle = await waitForHeroState(
        page,
        viewport.height,
        (state) =>
          Math.abs(state.near.y - start.near.y) > 1 &&
          Math.abs(state.far.y - start.far.y) > 1 &&
          Math.abs(state.mist.m23 - start.mist.m23) > 0.03,
      );

      expect(Math.abs(middle.near.y - start.near.y)).toBeGreaterThan(1);
      expect(Math.abs(middle.far.y - start.far.y)).toBeGreaterThan(1);
      expect(Math.abs(middle.mist.m23 - start.mist.m23)).toBeGreaterThan(0.03);
      expect(middle.near.transform).not.toBe(start.near.transform);
      expect(middle.far.transform).not.toBe(start.far.transform);
      expect(middle.mist.transform).not.toBe(start.mist.transform);

      await scrollInstant(page, halfwayTop);
      const reversed = await waitForHeroState(
        page,
        halfwayTop,
        (state) =>
          Math.abs(state.near.y - direct.near.y) <= 1.5 &&
          Math.abs(state.far.y - direct.far.y) <= 1.5 &&
          Math.abs(state.mist.m23 - direct.mist.m23) <= 0.02,
      );

      expect(Math.abs(reversed.near.y - direct.near.y)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(reversed.far.y - direct.far.y)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(reversed.mist.m23 - direct.mist.m23)).toBeLessThanOrEqual(0.02);
      expectNoBrowserErrors(errors);
    });
  }

  for (const viewport of viewports) {
    test(`${viewport.name}: Watch Film opens a local video dialog and restores focus`, async ({
      page,
    }) => {
      const errors = collectBrowserErrors(page);
      await loadHome(page, viewport, "no-preference");

      const trigger = page.locator('[data-fidelity-section="hero"] [data-watch-film]');
      const dialog = page.locator("dialog.film-dialog");
      const dialogVideo = dialog.locator("video");
      await expect(trigger).toHaveCount(1);
      await trigger.click();
      await expect
        .poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).open))
        .toBe(true);
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Close", exact: true }),
      ).toBeFocused();
      await expect(dialogVideo).toHaveCount(1);
      await expect(dialogVideo).toHaveAttribute("controls", "");
      const source = await dialogVideo.evaluate(
        (element) =>
          (element as HTMLVideoElement).currentSrc ||
          element.querySelector("source")?.getAttribute("src") ||
          "",
      );
      expect(new URL(source, page.url()).pathname).toMatch(/^\/media\/video\/.*\.mp4$/);
      await expect(page.locator("html")).toHaveAttribute("data-scroll-locked", "true");

      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect
        .poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).open))
        .toBe(false);
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-scroll-locked",
        "true",
      );
      expectNoBrowserErrors(errors);
    });
  }

  for (const viewport of viewports) {
    test(`${viewport.name}: legacy Newsletter Signup toggles and returns focus`, async ({
      page,
    }) => {
      const errors = collectBrowserErrors(page);
      await loadHome(page, viewport, "no-preference");

      await page.goto("/prices");
      const footer = page.locator("[data-site-footer]");
      const trigger = footer.getByRole("button", {
        name: "Newsletter Signup",
        exact: true,
      });
      const panel = footer.locator("#newsletter-panel");
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(panel).toBeHidden();
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(panel).toHaveAttribute("data-open", "true");
      await expect(panel).toBeVisible();
      await expect(panel).not.toHaveAttribute("inert");
      await expect(
        panel.getByRole("heading", { name: "Newsletter Signup" }),
      ).toBeVisible();
      await expect(panel.getByPlaceholder("Name & Surname")).toBeVisible();
      await expect(panel.getByPlaceholder("Email Address")).toBeVisible();

      const close = panel.getByRole("button", {
        name: "Close newsletter signup",
        exact: true,
      });
      await close.click();
      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      expectNoBrowserErrors(errors);
    });
  }
});

for (const viewport of viewports) {
  test(`${viewport.name}: ADELVA header preserves direct links, disclosures and focus`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const header = page.locator('[data-fidelity-landmark="header-nav"]');
    await expect(header).toBeVisible();
    await expect(
      header.getByRole("link", { name: "導入事例", exact: true }),
    ).toHaveCount(0);
    if (viewport.width >= 1024) {
      await expect(
        header.getByRole("link", { name: "ADELVAについて", exact: true }),
      ).toHaveAttribute("href", "/about");
      await expect(
        header.getByRole("button", { name: "ADELVAについて", exact: true }),
      ).toHaveCount(0);
      const trigger = header.getByRole("button", { name: "課題から探す", exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.getByRole("link", { name: "課題一覧を見る", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    } else {
      const trigger = page.getByRole("button", { name: "メニューを開く", exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "サイトメニュー" });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("link", { name: "ADELVAについて", exact: true }),
      ).toHaveAttribute("href", "/about");
      await expect(
        dialog.getByRole("button", { name: "ADELVAについて", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("data-scroll-locked", "true");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-scroll-locked",
        "true",
      );
    }
  });
}
