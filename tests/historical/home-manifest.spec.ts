import { expect, test, type Page } from "@playwright/test";

/**
 * Target-derived acceptance for the authorized HOME rebuild — `home-target-v1`.
 *
 * Evidence: `.Codex/docs/research/home-fidelity-gap-forensics.md`, mirrored into
 * the binding block of `docs/specs/clone-implementation-spec.md`.
 *
 * Scope rule: HOME topology is `main .page-content` ONLY. Global flyouts,
 * navigation data and footer links are not HOME sections. An earlier revision of
 * this suite derived its manifest from the whole served heading stream and was
 * wrong in three ways — it invented a `how-it-works` HOME section (a global
 * flyout), required six trip cards (the live count is five), and asserted mist
 * translation on `m42` (the target rotates the mist on X and never translates
 * it). Those are corrected here.
 *
 * Root cause this suite closes: every external reference and the local visual
 * gate captured `fullPage:false`, and the target hero is itself two viewports
 * tall — so no below-hero HOME content could appear in any accepted evidence.
 */

/** Ten page-content semantic stages, in document order. */
const HOME_STAGES = [
  "hero",
  "last-continent",
  "our-season",
  "our-trips",
  "founder-quote",
  "our-camps",
  "cpt-wfr-bridge",
  "mist-divider",
  "travel-globe",
  "planning-cta",
] as const;

/** Nested stages and their declared parents. */
const NESTED: ReadonlyArray<readonly [string, string]> = [
  ["title-field", "our-trips"],
  ["card-list", "our-trips"],
  ["intro", "our-camps"],
  ["whichaway", "our-camps"],
  ["echo", "our-camps"],
  ["explorer", "our-camps"],
  ["camp-quote", "our-camps"],
];

/** Exactly five HOME `card-flick` items. Discovery Week is NOT one of them. */
const TRIPS = [
  {
    title: "Baby Penguins & Blue Tunnels",
    path: "/itineraries/early-emperor-penguins",
  },
  { title: "South Pole & Penguins", path: "/itineraries/south-pole-emperor-penguins" },
  { title: "South Pole & Blue Rivers", path: "/itineraries/south-pole-blue-rivers" },
  { title: "The Long Stay", path: "/itineraries/the-long-stay" },
  { title: "Antarctica in a Day", path: "/itineraries/antarctica-in-a-day" },
] as const;

/** Predeclared tolerances. Never widen these after observing a mismatch. */
const SCROLL_TOLERANCE = 0.03;
const BOUNDS_TOLERANCE = 0.04;

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, scrollHeight: 20782 },
  { name: "tablet", width: 768, height: 1024, scrollHeight: 20085 },
  { name: "mobile", width: 390, height: 844, scrollHeight: 19296 },
] as const;

/** Target direct-child document bounds (`documentY`) per viewport. */
const STAGE_START: Record<string, Record<string, number>> = {
  hero: { desktop: 0, tablet: 0, mobile: 0 },
  "last-continent": { desktop: 1800.0, tablet: 2048.0, mobile: 1688.0 },
  "our-season": { desktop: 2585.55, tablet: 3085.59, mobile: 2279.59 },
  "our-trips": { desktop: 3935.55, tablet: 4621.59, mobile: 3545.59 },
  "founder-quote": { desktop: 5240.52, tablet: 6031.98, mobile: 7505.53 },
  "our-camps": { desktop: 6196.42, tablet: 7087.17, mobile: 8244.16 },
  "cpt-wfr-bridge": { desktop: 15646.42, tablet: 14451.17, mobile: 13538.16 },
  "mist-divider": { desktop: 16074.41, tablet: 14879.17, mobile: 14038.16 },
  "travel-globe": { desktop: 16974.41, tablet: 15903.17, mobile: 14882.16 },
  "planning-cta": { desktop: 18941.36, tablet: 18036.91, mobile: 16340.5 },
};

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

test.describe("home-target-v1 topology", () => {
  /**
   * Target bounds were measured under `no-preference`. Under `reduce` this
   * implementation intentionally drops the camps pin, so the document is
   * shorter by that reserved scroll distance — an authored accessibility
   * deviation recorded in the spec, not a geometry regression.
   */
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("page-content exposes exactly seven direct children", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const count = await page.locator("[data-page-content] > *").count();
    expect(count, "target `.page-content` has exactly 7 direct children").toBe(7);
  });

  test("semantic stages match the target manifest exactly, in order", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const ids = await page
      .locator("[data-fidelity-section]:not([data-fidelity-parent])")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute("data-fidelity-section")),
      );

    expect(ids, "no missing, no extra, no reorder").toEqual([...HOME_STAGES]);
  });

  test("nested stages declare the correct parents", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    for (const [id, parent] of NESTED) {
      const node = page.locator(
        `[data-fidelity-section="${id}"][data-fidelity-parent="${parent}"]`,
      );
      await expect(node, `${id} must declare parent ${parent}`).toHaveCount(1);
    }
  });

  test("global flyout content is not a HOME section", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    await expect(
      page.locator('[data-fidelity-section="how-it-works"]'),
      "How it works is a global flyout, never HOME page content",
    ).toHaveCount(0);
  });

  for (const viewport of VIEWPORTS) {
    test(`scroll height matches the target at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await settle(page);

      const actual = await page.evaluate(() => document.documentElement.scrollHeight);
      const lo = viewport.scrollHeight * (1 - SCROLL_TOLERANCE);
      const hi = viewport.scrollHeight * (1 + SCROLL_TOLERANCE);

      expect(
        actual,
        `target ${viewport.scrollHeight}px +/-${SCROLL_TOLERANCE * 100}% at ${viewport.name}`,
      ).toBeGreaterThanOrEqual(lo);
      expect(actual).toBeLessThanOrEqual(hi);
    });

    test(`stage bounds track the target at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await settle(page);

      const slack = viewport.scrollHeight * BOUNDS_TOLERANCE;
      for (const id of HOME_STAGES) {
        const expected = STAGE_START[id][viewport.name];
        const actual = await page
          .locator(`[data-fidelity-section="${id}"]`)
          .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
        expect(
          Math.abs(actual - expected),
          `${id} starts near ${expected} at ${viewport.name} (got ${Math.round(actual)})`,
        ).toBeLessThanOrEqual(slack);
      }
    });

    test(`no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await settle(page);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("hero composition", () => {
  test("hero ships the authorized video from a local origin", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const video = page.locator('[data-fidelity-section="hero"] video');
    await expect(video).toHaveCount(1);

    const spec = await video.evaluate((el: HTMLVideoElement) => ({
      loop: el.loop,
      muted: el.muted,
      playsInline: el.playsInline,
      preload: el.preload,
      src: el.currentSrc || el.querySelector("source")?.getAttribute("src") || "",
    }));

    expect(spec.loop).toBe(true);
    expect(spec.muted).toBe(true);
    expect(spec.playsInline).toBe(true);
    expect(spec.preload).toBe("metadata");
    expect(spec.src, "video must be local, never hotlinked").not.toMatch(
      /white-desert\.com|cloudflarestream|sanity\.io/,
    );
    expect(spec.src).toMatch(/\.mp4($|\?)/);
  });

  test("hero carries one mist plane and two cloud wraps", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    await expect(page.locator('[data-motion-layer="mist-plane"]')).toHaveCount(1);
    await expect(page.locator('[data-motion-layer="cloud-near"]')).toHaveCount(1);
    await expect(page.locator('[data-motion-layer="cloud-far"]')).toHaveCount(1);
  });

  test("Watch Film control is labelled and keyboard operable", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const control = page
      .locator('[data-fidelity-landmark="hero"]')
      .getByRole("button", { name: /watch film/i });
    await expect(control).toHaveCount(1);
    await control.focus();
    await expect(control).toBeFocused();
  });
});

test.describe("hero scroll choreography", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  /** Sample the exact measured layer state at `f = scrollY / innerHeight`. */
  async function sampleAt(page: Page, f: number) {
    await page.evaluate((factor) => {
      window.scrollTo({
        top: window.innerHeight * factor,
        behavior: "instant" as ScrollBehavior,
      });
    }, f);
    await page.waitForTimeout(250);

    return page.evaluate(() => {
      const read = (id: string) => {
        const el = document.querySelector<HTMLElement>(`[data-motion-layer="${id}"]`);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const m = cs.transform === "none" ? null : new DOMMatrixReadOnly(cs.transform);
        return {
          y: m ? m.m42 : 0,
          // rotateX: m22 = cos(theta), m23 = sin(theta)
          rotX: m ? (Math.atan2(m.m23, m.m22) * 180) / Math.PI : 0,
          filter: cs.filter,
        };
      };
      return {
        wrapper: read("hero-wrapper"),
        content: read("hero-content"),
        title: read("hero-title"),
        near: read("cloud-near"),
        far: read("cloud-far"),
        mist: read("mist-plane"),
        vh: window.innerHeight,
      };
    });
  }

  test("layers follow the measured linear functions across the hero stage", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settle(page);

    const at0 = await sampleAt(page, 0);
    const at1 = await sampleAt(page, 1);
    const at2 = await sampleAt(page, 2);

    // Mist holds rotateX(90deg) at rest and settles to 0deg by f=1.5.
    expect(
      Math.abs((at0.mist?.rotX ?? 0) - 90),
      "mist starts at rotateX(90deg)",
    ).toBeLessThan(8);
    const at15 = await sampleAt(page, 1.5);
    expect(
      Math.abs(at15.mist?.rotX ?? 90),
      "mist settles to rotateX(0deg) by f=1.5",
    ).toBeLessThan(8);

    // Wrapper translates positively to cancel document scroll.
    expect(
      (at1.wrapper?.y ?? 0) - (at0.wrapper?.y ?? 0),
      "wrapper lifts ~+100svh by f=1",
    ).toBeGreaterThan(at0.vh * 0.6);

    // Content lifts negatively.
    expect(
      (at1.content?.y ?? 0) - (at0.content?.y ?? 0),
      "content lifts ~-30svh by f=1",
    ).toBeLessThan(-at0.vh * 0.15);

    // Both clouds rise, near faster than far.
    const nearDelta = (at2.near?.y ?? 0) - (at0.near?.y ?? 0);
    const farDelta = (at2.far?.y ?? 0) - (at0.far?.y ?? 0);
    expect(nearDelta, "near cloud rises").toBeLessThan(-50);
    expect(farDelta, "far cloud rises").toBeLessThan(-20);
    expect(Math.abs(nearDelta), "near cloud outruns far cloud").toBeGreaterThan(
      Math.abs(farDelta),
    );

    // H1 blur ramps to the measured 10px clamp.
    expect(at0.title?.filter ?? "none", "no blur at rest").toMatch(/none|blur\(0/);
    const blur = /blur\(([\d.]+)px\)/.exec(at2.title?.filter ?? "");
    expect(blur, "H1 blurs across the hero stage").not.toBeNull();
    expect(Number(blur?.[1] ?? 0)).toBeGreaterThan(6);
  });

  test("reversal resolves directly with no catch-up tween", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await settle(page);

    await sampleAt(page, 1);
    const reversed = await sampleAt(page, 0.2);
    const direct = await sampleAt(page, 0.2);

    // Arriving at f=0.2 by reversal must equal arriving there directly.
    expect(
      Math.abs((reversed.wrapper?.y ?? 0) - (direct.wrapper?.y ?? 0)),
    ).toBeLessThan(4);
    expect(Math.abs((reversed.near?.y ?? 0) - (direct.near?.y ?? 0))).toBeLessThan(4);
  });
});

test.describe("reduced motion", () => {
  test("hero is readable and unanimated under reduce", async ({ page }) => {
    await page.goto("/"); // config default context is reducedMotion: reduce
    await settle(page);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    expect(await h1.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    expect(
      await h1.evaluate((el) => getComputedStyle(el).filter),
      "no blur gate on the title under reduce",
    ).toMatch(/none|blur\(0/);

    const autoplays = await page
      .locator('[data-fidelity-section="hero"] video')
      .evaluate((el: HTMLVideoElement) => el.autoplay);
    expect(autoplays, "authored deviation: no autoplay under reduce").toBe(false);
  });
});

test.describe("founder signature choreography", () => {
  const signature = ".founder__signature";

  async function signatureProgress(page: Page) {
    return page.locator(`${signature} path`).evaluateAll((paths: SVGPathElement[]) =>
      paths.map((path) => {
        const drawn = Number.parseFloat(getComputedStyle(path).strokeDasharray);
        return {
          drawn: Number.isFinite(drawn) ? drawn : path.getTotalLength(),
          length: path.getTotalLength(),
        };
      }),
    );
  }

  for (const viewport of VIEWPORTS) {
    test(`${viewport.name}: draws on entry and reverses above the trigger`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/");
      await settle(page);

      await expect(page.locator(".founder__name")).toHaveText("kokoro nakagawa");
      const initial = await signatureProgress(page);
      expect(
        initial,
        "kokoro nakagawa has fourteen letters and a flourish",
      ).toHaveLength(15);
      expect(
        initial.every(({ drawn, length }) => drawn <= length * 0.01),
        "paths start undrawn before the quote enters",
      ).toBe(true);

      const triggerY = await page
        .locator(".founder__figure")
        .evaluate(
          (figure) =>
            figure.getBoundingClientRect().top +
            window.scrollY -
            window.innerHeight * 0.75 +
            2,
        );
      await page.evaluate(
        (top) => window.scrollTo({ top, behavior: "instant" }),
        triggerY,
      );

      await expect
        .poll(
          async () => {
            const progress = await signatureProgress(page);
            return (
              progress[0].drawn > progress[0].length * 0.01 &&
              progress[progress.length - 1].drawn <=
                progress[progress.length - 1].length * 0.01
            );
          },
          { timeout: 1_000 },
        )
        .toBe(true);

      await expect
        .poll(
          async () =>
            (await signatureProgress(page)).every(
              ({ drawn, length }) => drawn >= length * 0.99,
            ),
          { timeout: 4_000 },
        )
        .toBe(true);

      await page.evaluate(
        (top) => window.scrollTo({ top, behavior: "instant" }),
        triggerY - 4,
      );
      await expect
        .poll(
          async () =>
            (await signatureProgress(page)).every(
              ({ drawn, length }) => drawn <= length * 0.01,
            ),
          { timeout: 4_000 },
        )
        .toBe(true);
    });

    test(`${viewport.name}: is complete and static under reduced motion`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await settle(page);

      const before = await signatureProgress(page);
      expect(
        before.every(({ drawn, length }) => drawn >= length * 0.99),
        "reduced-motion fallback never hides the signature",
      ).toBe(true);

      await page.locator(signature).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      expect(await signatureProgress(page)).toEqual(before);
    });
  }
});

test.describe("target content stages", () => {
  test("Our Trips renders exactly the five HOME cards", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const titleField = page.locator('[data-fidelity-section="title-field"]');
    await expect(
      titleField.getByRole("heading", { name: "Your Challenges 課題から探す" }),
    ).toBeVisible();

    const cards = page.locator('[data-fidelity-section="card-list"] [data-trip-card]');
    await expect(cards, "live target count is five").toHaveCount(5);

    for (const trip of TRIPS) {
      const card = page.locator("[data-trip-card]", { hasText: trip.title });
      await expect(card, `trip card: ${trip.title}`).toHaveCount(1);
      await expect(card.locator(`a[href="${trip.path}"]`)).toHaveCount(1);
      await expect(card.locator("img")).toHaveCount(1);
    }

    await expect(
      page.locator("[data-trip-card]", { hasText: "Discovery Week" }),
      "Discovery Week is nav/footer data, not a HOME card",
    ).toHaveCount(0);
  });

  test("Our Camps renders the five pinned panels in order", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const panels = page.locator('[data-fidelity-parent="our-camps"]');
    await expect(panels).toHaveCount(5);

    const ids = await panels.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-fidelity-section")),
    );
    expect(ids).toEqual(["intro", "whichaway", "echo", "explorer", "camp-quote"]);
  });

  test("CPT-WFR bridge and travel globe own their measured content", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);

    const bridge = page.locator('[data-fidelity-section="cpt-wfr-bridge"]');
    await expect(bridge).toContainText("CPT");
    await expect(bridge).toContainText("WFR");
    await expect(bridge.locator("[data-route-stat]")).toHaveCount(0);

    const globe = page.locator('[data-fidelity-section="travel-globe"]');
    await expect(globe.locator("[data-route-stat]")).toHaveCount(3);
    await expect(globe).toContainText("05:30");
    await expect(globe).toContainText("4,220");
    await expect(globe).toContainText("-5");
  });

  test("second mist divider and travel globe exist", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    await expect(page.locator('[data-fidelity-section="mist-divider"]')).toHaveCount(1);
    await expect(page.locator('[data-fidelity-section="travel-globe"]')).toHaveCount(1);
  });

  test("planning CTA links to the enquiry route", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    const cta = page.locator('[data-fidelity-section="planning-cta"]');
    await expect(cta.locator('a[href="/enquire"]')).toHaveCount(1);
  });

  test("footer sits outside page-content", async ({ page }) => {
    await page.goto("/");
    await settle(page);

    await expect(page.locator("[data-page-content] footer")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(1);
  });
});

test.describe("production hygiene", () => {
  test("no production request leaves the local origin", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      const url = r.url();
      if (
        !url.startsWith("http://127.0.0.1") &&
        !url.startsWith("data:") &&
        !url.startsWith("blob:")
      ) {
        external.push(url);
      }
    });

    await page.goto("/");
    await settle(page);
    await page.evaluate(() =>
      window.scrollTo({ top: 8000, behavior: "instant" as ScrollBehavior }),
    );
    await page.waitForTimeout(600);

    expect(external, "authorized assets must be served locally").toEqual([]);
  });
});
