import { expect, test, type Page } from "@playwright/test";

/**
 * Independent HOME review gate — Opus 5 Max, 2026-08-31.
 *
 * This suite is deliberately narrow and adversarial. It exists because the
 * accepted evidence set could not observe the two defects the client reported:
 *
 *  1. every external reference and the local visual gate captured
 *     `fullPage: false` at `scrollY = 0`, and the target hero is itself two
 *     viewports tall, so **no below-hero HOME content** could appear in any
 *     accepted artefact — Our Trips included;
 *  2. the hero's cloud / mist atmosphere only exists *after* the first
 *     viewport of scroll, so a `scrollY = 0` raster proves nothing about it.
 *
 * Every assertion below therefore either scrolls, samples motion at declared
 * checkpoints, or drives a real interaction. Numbers come from a fresh
 * read-only measurement of `https://white-desert.com/` at the three release
 * viewports on 2026-08-31 (16 pin fractions and 7 hero checkpoints per
 * viewport); they are predeclared here and must not be widened after observing
 * a mismatch.
 */

/** Exactly five HOME `card-flick` items, with the live target's own copy. */
const TRIPS = [
  {
    title: "Baby Penguins & Blue Tunnels",
    path: "/itineraries/early-emperor-penguins",
    price: "US $75,250",
    season: "Early Season",
    excerpt:
      "Witness the Emperor chicks as they take their first steps and explore the ethereal Blue Ice Tunnels.",
  },
  {
    title: "South Pole & Penguins",
    path: "/itineraries/south-pole-emperor-penguins",
    price: "US $115,500",
    season: null,
    excerpt:
      "Our most popular itinerary, which includes a journey to the South Pole — visited by fewer than 500 people each year — and a visit to the Emperor Penguin colony.",
  },
  {
    title: "South Pole & Blue Rivers",
    path: "/itineraries/south-pole-blue-rivers",
    price: "US $115,500",
    season: "Late Season",
    excerpt:
      "Our newest itinerary. One that combines our signature journey to the South Pole — visited by fewer than 500 people each year — with a visit to Antarctica’s rarely seen Blue Rivers.",
  },
  {
    title: "The Long Stay",
    path: "/itineraries/the-long-stay",
    price: "US $110,500",
    season: "Late Season",
    excerpt:
      "Experience both of our main camps — Whichaway and Echo — on our longest itinerary, which includes the South Pole and the incredible Blue Rivers.",
  },
  {
    title: "Antarctica in a Day",
    path: "/itineraries/antarctica-in-a-day",
    price: "US $16,500",
    season: "Entire Season",
    excerpt:
      "Cape Town to Antarctica and back — descend into an ice cave, rappel down a glacier and toast with champagne in our ice bar during this extraordinary day trip.",
  },
] as const;

type ViewportName = "desktop" | "tablet" | "mobile";

interface ViewportSpec {
  readonly name: ViewportName;
  readonly width: number;
  readonly height: number;
  /** Measured `.card-flick` field: active card, then each inactive card. */
  readonly cardWidths: readonly number[];
  readonly cardFieldHeight: number;
  /** Measured Our Camps pin: document start, vertical reserve, terminal x. */
  readonly campsStart: number;
  readonly campsPin: number;
  readonly campsTravel: number;
}

const VIEWPORTS: readonly ViewportSpec[] = [
  {
    name: "desktop",
    width: 1440,
    height: 900,
    cardWidths: [708, 177, 177, 177, 177],
    cardFieldHeight: 765,
    campsStart: 6196.42,
    campsPin: 8550,
    campsTravel: 4200,
  },
  {
    name: "tablet",
    width: 768,
    height: 1024,
    cardWidths: [372, 93, 93, 93, 93],
    cardFieldHeight: 870.39,
    campsStart: 7087.17,
    campsPin: 6340,
    campsTravel: 2520,
  },
  {
    name: "mobile",
    width: 390,
    height: 844,
    cardWidths: [366, 366, 366, 366, 366],
    cardFieldHeight: 3626.95,
    campsStart: 8244.16,
    campsPin: 4450,
    campsTravel: 1560,
  },
];

/** Predeclared tolerances. Do not widen after observing a mismatch. */
const GEOMETRY_PX = 2;
const MOTION_PX = 3;
const TRAVEL_PX = 4;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/** Scroll to an absolute document position and let one frame of linkage run. */
async function scrollTo(page: Page, y: number) {
  await page.evaluate((top) => {
    window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  }, y);
  await page.waitForTimeout(220);
}

interface LayerSample {
  readonly y: number;
  readonly x: number;
  readonly rotX: number;
  readonly height: number;
  readonly filter: string;
}

/** Read every hero layer's resolved transform at the current scroll offset. */
async function readHeroLayers(page: Page) {
  return page.evaluate(() => {
    const read = (id: string) => {
      const el = document.querySelector<HTMLElement>(`[data-motion-layer="${id}"]`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const m = cs.transform === "none" ? null : new DOMMatrixReadOnly(cs.transform);
      return {
        y: m ? m.m42 : 0,
        x: m ? m.m41 : 0,
        // rotateX about the element's own X axis: m22 = cos, m23 = sin.
        rotX: m ? (Math.atan2(m.m23, m.m22) * 180) / Math.PI : 0,
        height: el.getBoundingClientRect().height,
        filter: cs.filter,
      };
    };
    return {
      vh: window.innerHeight,
      scrollY: window.scrollY,
      wrapper: read("hero-wrapper"),
      content: read("hero-content"),
      title: read("hero-title"),
      near: read("cloud-near"),
      far: read("cloud-far"),
      mist: read("mist-plane"),
    };
  });
}

function blurPx(sample: LayerSample | null): number {
  const match = /blur\(([\d.]+)px\)/.exec(sample?.filter ?? "");
  return match ? Number(match[1]) : 0;
}

/* -------------------------------------------------------------------------- */
/* 1. Our Trips — the stage the top-frame gate could never see                 */
/* -------------------------------------------------------------------------- */

test.describe("Our Trips is present, complete and correct", () => {
  test("the stage exists below the two-viewport hero, not just in the DOM", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settle(page);

    const field = page.locator('[data-fidelity-section="card-list"]');
    const box = await field.boundingBox();
    expect(box, "Our Trips card field renders").not.toBeNull();

    // The regression that shipped: this stage starts ~2.5 hero-heights down,
    // so a `scrollY = 0` / `fullPage:false` raster cannot observe it at all.
    const documentY = await field.evaluate(
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );
    expect(documentY, "target document position of the card field").toBeGreaterThan(
      900 * 2,
    );

    await scrollTo(page, documentY - 100);
    await expect(field.locator("[data-trip-card]").first()).toBeInViewport();
  });

  test("the title field is a separate section from the card list", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const title = page.locator('[data-fidelity-section="title-field"]');
    const cards = page.locator('[data-fidelity-section="card-list"]');

    await expect(title).toHaveCount(1);
    await expect(cards).toHaveCount(1);
    await expect(
      title.getByRole("heading", { name: "Your Challenges 課題から探す" }),
    ).toHaveCount(1);
    await expect(title).toHaveAttribute("data-fidelity-parent", "our-trips");
    await expect(cards).toHaveAttribute("data-fidelity-parent", "our-trips");

    // The two are siblings in `.page-content`, never nested.
    const nested = await title.locator('[data-fidelity-section="card-list"]').count();
    expect(nested, "card list is not nested inside the title field").toBe(0);
  });

  test("exactly five cards carry the target's copy, meta and destinations", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const cards = page.locator('[data-fidelity-section="card-list"] [data-trip-card]');
    await expect(cards, "live target count is five, never six").toHaveCount(5);

    for (const [index, trip] of TRIPS.entries()) {
      const card = cards.nth(index);
      await expect(card.getByRole("heading", { level: 3 })).toHaveText(trip.title);
      await expect(card).toContainText(trip.price);
      await expect(card).toContainText(trip.excerpt);

      // The target card is itself the link; assert the effective destination
      // rather than forcing a particular wrapper element.
      const href = await card.evaluate((el) => {
        const anchor = el.matches("a[href]") ? el : el.querySelector("a[href]");
        return anchor?.getAttribute("href") ?? null;
      });
      expect(href, `${trip.title} destination`).toBe(trip.path);

      if (trip.season) {
        await expect(card).toContainText(trip.season);
      } else {
        await expect(
          card,
          "South Pole & Penguins carries exactly one meta item on the target",
        ).not.toContainText(/Season/i);
      }
    }

    await expect(
      page.locator("[data-trip-card]", { hasText: "Discovery Week" }),
      "Discovery Week is global nav data and a footer link, not a HOME card",
    ).toHaveCount(0);
  });

  for (const viewport of VIEWPORTS) {
    test(`card field geometry matches the target at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await settle(page);

      const field = page.locator('[data-fidelity-section="card-list"]');
      const height = await field.evaluate((el) => el.getBoundingClientRect().height);
      expect(
        Math.abs(height - viewport.cardFieldHeight),
        `card field height at ${viewport.name}`,
      ).toBeLessThanOrEqual(GEOMETRY_PX);

      const widths = await page
        .locator("[data-trip-card]")
        .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width));

      expect(widths).toHaveLength(viewport.cardWidths.length);
      for (const [index, expected] of viewport.cardWidths.entries()) {
        expect(
          Math.abs(widths[index] - expected),
          `card ${index} width at ${viewport.name}`,
        ).toBeLessThanOrEqual(GEOMETRY_PX);
      }
    });
  }

  test("hover switches the active card and settles over ~600ms", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settle(page);

    const cards = page.locator("[data-trip-card]");
    await expect(cards.nth(0)).toHaveAttribute("data-active", "true");

    await cards.nth(2).hover();
    await expect(cards.nth(2), "activation is immediate").toHaveAttribute(
      "data-active",
      "true",
    );

    // Measured: the widths settle over roughly 600ms; sample after the tween.
    await page.waitForTimeout(900);
    const widths = await cards.evaluateAll((nodes) =>
      nodes.map((n) => n.getBoundingClientRect().width),
    );
    expect(Math.abs(widths[2] - 708)).toBeLessThanOrEqual(GEOMETRY_PX);
    expect(Math.abs(widths[0] - 177)).toBeLessThanOrEqual(GEOMETRY_PX);
  });

  test("keyboard focus activates a collapsed card (authored deviation)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settle(page);

    const cards = page.locator("[data-trip-card]");
    await cards.nth(3).locator("a").focus();
    await expect(
      cards.nth(3),
      "the target leaves an inactive card inert on focus; the rebuild does not",
    ).toHaveAttribute("data-active", "true");
  });
});

/* -------------------------------------------------------------------------- */
/* 2. Hero atmosphere — the cloud / mist stack                                 */
/* -------------------------------------------------------------------------- */

test.describe("hero cloud, fog and mist atmosphere", () => {
  test("one video, one mist plane and two independent cloud planes exist", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const hero = page.locator('[data-fidelity-section="hero"]');
    await expect(hero.locator("video")).toHaveCount(1);
    await expect(hero.locator('[data-motion-layer="mist-plane"]')).toHaveCount(1);
    await expect(hero.locator('[data-motion-layer="cloud-near"]')).toHaveCount(1);
    await expect(hero.locator('[data-motion-layer="cloud-far"]')).toHaveCount(1);

    // Cloud planes start fully below the hero composition — invisible from a
    // `scrollY = 0` capture, which is exactly why the gap survived review.
    const offsets = await hero
      .locator("[data-motion-layer^='cloud-']")
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
    for (const top of offsets) {
      expect(top, "cloud planes rest below the fold at rest").toBeGreaterThanOrEqual(0);
    }
  });

  test("every hero media layer is served from this origin", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/white-desert\.com|cdn\.sanity\.io|cloudflarestream/.test(url)) {
        external.push(url);
      }
    });

    await page.goto("/");
    await settle(page);
    await scrollTo(page, 1800);

    expect(external, "production must never hotlink the target or its CDNs").toEqual(
      [],
    );

    const sources = await page
      .locator(
        '[data-fidelity-section="hero"] video source, [data-fidelity-section="hero"] img',
      )
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("src") ?? n.getAttribute("srcset") ?? ""),
      );
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/^https?:\/\//);
    }
  });

  test("cloud planes span the full hero viewport", async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await settle(page);

      const heights = await page
        .locator("[data-motion-layer^='cloud-']")
        .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().height));

      for (const height of heights) {
        expect(
          Math.abs(height - viewport.height),
          `cloud plane height at ${viewport.name}`,
        ).toBeLessThanOrEqual(GEOMETRY_PX);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* 3. Hero scroll choreography — start / mid / end / reverse                   */
/* -------------------------------------------------------------------------- */

test.describe("hero motion follows the measured linear functions", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  for (const viewport of VIEWPORTS) {
    test(`start, mid, end and clamp at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await settle(page);

      for (const f of [0, 0.4, 0.8, 1, 1.5, 2, 2.5]) {
        await scrollTo(page, f * viewport.height);
        const sample = await readHeroLayers(page);
        const vh = sample.vh;
        const clamped = Math.min(f, 2);

        for (const [id, layer] of Object.entries({
          wrapper: sample.wrapper,
          content: sample.content,
          near: sample.near,
          far: sample.far,
          mist: sample.mist,
          title: sample.title,
        })) {
          expect(
            layer,
            `${id} layer must exist before it can be compared`,
          ).not.toBeNull();
        }

        expect(
          Math.abs((sample.wrapper?.y ?? 0) - 100 * clamped * (vh / 100)),
          `wrapper translateY(100f svh) at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(MOTION_PX);

        expect(
          Math.abs((sample.content?.y ?? 0) - -30 * clamped * (vh / 100)),
          `content translateY(-30f svh) at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(MOTION_PX);

        expect(
          Math.abs(blurPx(sample.title) - 5 * clamped),
          `h1 blur(5f px) at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(0.2);

        // Cloud planes travel as a percentage of their own box, exactly as the
        // target authors them: near 100 - 90f %, far 100 - 55f %.
        const near = sample.near;
        const far = sample.far;
        expect(
          Math.abs((near?.y ?? 0) - ((100 - 90 * clamped) / 100) * (near?.height ?? 0)),
          `near cloud translateY(100-90f %) at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(MOTION_PX);
        expect(
          Math.abs((far?.y ?? 0) - ((100 - 55 * clamped) / 100) * (far?.height ?? 0)),
          `far cloud translateY(100-55f %) at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(MOTION_PX);

        // Mist: hold 90deg through 0.8, settle linearly to 0deg by 1.5, hold.
        const expectedRot =
          clamped <= 0.8 ? 90 : clamped >= 1.5 ? 0 : 90 - 90 * ((clamped - 0.8) / 0.7);
        expect(
          Math.abs((sample.mist?.rotX ?? 0) - expectedRot),
          `mist rotateX at f=${f} / ${viewport.name}`,
        ).toBeLessThanOrEqual(1.5);
      }
    });

    test(`reversal resolves directly with no catch-up at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await settle(page);

      await scrollTo(page, 0.2 * viewport.height);
      const direct = await readHeroLayers(page);

      await scrollTo(page, 1.6 * viewport.height);
      await scrollTo(page, 0.2 * viewport.height);
      const reversed = await readHeroLayers(page);

      for (const id of ["wrapper", "content", "near", "far", "mist"] as const) {
        const a = direct[id];
        const b = reversed[id];
        expect(a, `${id} sampled directly`).not.toBeNull();
        expect(b, `${id} sampled after reversal`).not.toBeNull();
        expect(
          Math.abs((b?.y ?? 0) - (a?.y ?? 0)),
          `${id} reversal is not a queued tween at ${viewport.name}`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs((b?.rotX ?? 0) - (a?.rotX ?? 0)),
          `${id} rotation reversal at ${viewport.name}`,
        ).toBeLessThanOrEqual(0.5);
      }
      expect(
        Math.abs(blurPx(reversed.title) - blurPx(direct.title)),
      ).toBeLessThanOrEqual(0.05);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 4. Our Camps pinned horizontal flow — start / mid / end / reverse           */
/* -------------------------------------------------------------------------- */

test.describe("Our Camps pin travels exactly as measured", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  async function trackX(page: Page) {
    return page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(
        '[data-motion-layer="camps-track"]',
      );
      if (!el) return null;
      const cs = getComputedStyle(el);
      if (cs.transform === "none") return 0;
      return new DOMMatrixReadOnly(cs.transform).m41;
    });
  }

  for (const viewport of VIEWPORTS) {
    test(`start, mid, end and reverse at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await settle(page);

      const track = page.locator('[data-motion-layer="camps-track"]');
      await expect(track).toHaveCount(1);
      await expect(page.locator('[data-fidelity-parent="our-camps"]')).toHaveCount(5);

      await scrollTo(page, viewport.campsStart);
      expect(await trackX(page), `track rests at x=0 at the pin start`).toBeCloseTo(
        0,
        0,
      );

      await scrollTo(page, viewport.campsStart + viewport.campsPin / 2);
      const mid = (await trackX(page)) ?? 0;
      expect(mid, "track has travelled at the pin midpoint").toBeLessThan(-1);
      expect(mid, "track has not overrun at the pin midpoint").toBeGreaterThan(
        -viewport.campsTravel,
      );

      await scrollTo(page, viewport.campsStart + viewport.campsPin);
      const end = (await trackX(page)) ?? 0;
      expect(
        Math.abs(end + viewport.campsTravel),
        `terminal x at ${viewport.name}`,
      ).toBeLessThanOrEqual(TRAVEL_PX);

      // Past the pin the track holds its terminal offset and leaves in flow.
      await scrollTo(page, viewport.campsStart + viewport.campsPin * 1.05);
      expect(
        Math.abs(((await trackX(page)) ?? 0) + viewport.campsTravel),
        "terminal offset holds past the pin",
      ).toBeLessThanOrEqual(TRAVEL_PX);

      // Reversal resolves directly to the scroll-linked value.
      await scrollTo(page, viewport.campsStart + viewport.campsPin / 2);
      const reversed = (await trackX(page)) ?? 0;
      expect(
        Math.abs(reversed - mid),
        `camps reversal is not a queued tween at ${viewport.name}`,
      ).toBeLessThanOrEqual(1);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 5. Watch Film — the measured control and its dialog                         */
/* -------------------------------------------------------------------------- */

test.describe("Watch Film control and film dialog", () => {
  test("the film is not fetched until it is asked for", async ({ page }) => {
    const filmRequests: string[] = [];
    page.on("request", (request) => {
      if (/white-desert-film\.mp4/.test(request.url()))
        filmRequests.push(request.url());
    });

    await page.goto("/");
    await settle(page);
    await scrollTo(page, 4000);
    await page.waitForTimeout(1200);

    // Measured regression this closes: the film master is a 235 MB MP4 whose
    // `moov` atom sits at the end of the file, so an eagerly mounted source
    // pulled 224.76 MB onto every HOME load before anyone pressed play.
    expect(filmRequests, "the film must not be on the HOME page-load budget").toEqual(
      [],
    );

    await scrollTo(page, 0);
    const trigger = page.locator('[data-fidelity-section="hero"] [data-watch-film]');
    await trigger.focus();
    await trigger.press("Enter");
    await expect(page.locator("dialog.film-dialog")).toHaveJSProperty("open", true);
    await expect
      .poll(() => filmRequests.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
  });

  test("the hero and the travel globe each expose a Watch Film control", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    await expect(
      page.locator('[data-fidelity-section="hero"] [data-watch-film]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-fidelity-section="travel-globe"] [data-watch-film]'),
    ).toHaveCount(1);

    // Scoped to page content: the global footer carries a third Watch Film
    // control, which belongs to the shell manifest, not to HOME.
    const controls = page
      .locator("[data-page-content]")
      .getByRole("button", { name: /watch film/i });
    await expect(controls).toHaveCount(2);
    for (const control of await controls.all()) {
      await expect(control).toHaveAttribute("aria-haspopup", "dialog");
    }
  });

  test("opening moves focus into the dialog and Escape returns it", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const trigger = page.locator('[data-fidelity-section="hero"] [data-watch-film]');
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await trigger.press("Enter");

    const dialog = page.locator("dialog.film-dialog");
    await expect(dialog).toHaveJSProperty("open", true);

    const close = dialog.getByRole("button", { name: /close/i });
    await expect(close).toBeFocused();

    // The film must be a real, local, controllable video — not a decorative loop.
    const film = dialog.locator("video");
    await expect(film).toHaveJSProperty("controls", true);
    const source = await film.evaluate(
      (el: HTMLVideoElement) =>
        el.currentSrc || el.querySelector("source")?.getAttribute("src") || "",
    );
    expect(new URL(source, page.url()).pathname).toMatch(/^\/media\/video\/.+\.mp4$/);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveJSProperty("open", false);
    await expect(trigger, "focus returns to the invoking control").toBeFocused();
    await expect(film).toHaveJSProperty("paused", true);
  });

  test("the close control dismisses and restores focus", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const trigger = page.locator(
      '[data-fidelity-section="travel-globe"] [data-watch-film]',
    );
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    const dialog = page.locator("dialog.film-dialog");
    await expect(dialog).toHaveJSProperty("open", true);

    await dialog.getByRole("button", { name: /close/i }).click();
    await expect(dialog).toHaveJSProperty("open", false);
    await expect(trigger).toBeFocused();
  });
});

/* -------------------------------------------------------------------------- */
/* 6. Reduced motion and page boundary                                         */
/* -------------------------------------------------------------------------- */

test.describe("authored reduced-motion fallback", () => {
  test("no scripted layer transform is written under reduce", async ({ page }) => {
    await page.goto("/"); // config default context is reducedMotion: reduce
    await settle(page);
    await scrollTo(page, 1400);

    const inline = await page.locator("[data-motion-layer]").evaluateAll((nodes) =>
      nodes.map((n) => ({
        id: n.getAttribute("data-motion-layer"),
        transform: (n as HTMLElement).style.transform,
        filter: (n as HTMLElement).style.filter,
      })),
    );

    expect(inline.length).toBeGreaterThan(0);
    for (const layer of inline) {
      expect(layer.transform, `${layer.id} carries no scripted transform`).toBe("");
      expect(layer.filter, `${layer.id} carries no scripted filter`).toBe("");
    }

    // Content stays readable and reachable without any motion.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-trip-card]")).toHaveCount(5);
    const autoplays = await page
      .locator('[data-fidelity-section="hero"] video')
      .evaluate((el: HTMLVideoElement) => el.autoplay);
    expect(autoplays, "authored deviation: no autoplay under reduce").toBe(false);
  });
});

test.describe("HOME page boundary", () => {
  test("global shell interactions are not HOME page-content stages", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const inside = await page
      .locator("[data-page-content] [data-fidelity-section]")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("data-fidelity-section")),
      );

    expect(
      inside,
      "`how-it-works` is a global flyout, never a HOME page-content stage",
    ).not.toContain("how-it-works");

    // The global footer participates in document height but not in page content.
    const footerInside = await page.locator("[data-page-content] footer").count();
    expect(footerInside, "the site footer sits outside `.page-content`").toBe(0);
  });
});
