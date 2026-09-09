import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const itineraryTitles = [
  "Baby Penguins & Blue Tunnels",
  "South Pole & Penguins",
  "South Pole & Blue Rivers",
  "The Long Stay",
  "Antarctica in a Day",
  "Discovery Week",
];

const itineraryHrefs = [
  "/itineraries/early-emperor-penguins",
  "/itineraries/south-pole-emperor-penguins",
  "/itineraries/south-pole-blue-rivers",
  "/itineraries/the-long-stay",
  "/itineraries/antarctica-in-a-day",
  "/itineraries/discovery-week",
];

const tripTitles = itineraryTitles.slice(0, 5);
const tripHrefs = itineraryHrefs.slice(0, 5);

const itineraryExcerpts = [
  "Witness the Emperor chicks as they take their first steps and explore the ethereal Blue Ice Tunnels.",
  "Our most popular itinerary, which includes a journey to the South Pole — visited by fewer than 500 people each year —  and a visit to the Emperor Penguin colony.",
  "Our newest itinerary. One that combines our signature journey to the South Pole — visited by fewer than 500 people each year — with a visit to Antarctica’s rarely seen Blue Rivers. ",
  "Experience both of our main camps — Whichaway and Echo — on our longest itinerary, which includes the South Pole and the incredible Blue Rivers.",
  "Cape Town to Antarctica and back — descend into an ice cave, rappel down a glacier and toast with champagne in our ice bar during this extraordinary day trip.",
  "Join a one-of-a-kind week immersed in the awe-inspiring landscapes of Antarctica, led by renowned scientists and guided by a team of seasoned polar experts.",
];

const campTitles = ["Whichaway Camp", "Echo Base", "Explorer Camp"];
const campHrefs = ["/camps/whichaway-camp", "/camps/echo-base", "/camps/explorer-camp"];
const campCoordinates = [
  "[ 70º 48’ 00” S, 11º 23’ 00” E ]",
  "[ 71°32'47\" S, 8°50'11\" E ]",
  "[ 71º 31’ 37” S, 8º 51’ 20” E ]",
];
const campBodies = [
  "Our original camp, newly reimagined. Rare exposed rock and freshwater lakes — this is a side of Antarctica seldom seen.",
  "Inspired by astronauts, used by explorers. As close as you can get to leaving Earth without stepping off the planet.",
  "Polar adventure meets chalet-style. True to our expeditionary roots, a rustic and warm base for the South Pole journey.",
];

const stageHeights = {
  itineraries: {
    desktop: { hero: 1800, intro: 849.55, itineraries: 4690, cta: 900 },
    tablet: { hero: 2048, intro: 996.59, itineraries: 5248, cta: 1024 },
    mobile: { hero: 1688, intro: 655.59, itineraries: 4268, cta: 844 },
  },
  camps: {
    desktop: {
      hero: 1800,
      intro: 786.55,
      camps: 2700,
      "trips-title": 540,
      "trips-cards": 1084.98,
      cta: 900,
    },
    tablet: {
      hero: 2048,
      intro: 891.59,
      camps: 3072,
      "trips-title": 540,
      "trips-cards": 1190.39,
      cta: 1024,
    },
    mobile: {
      hero: 1688,
      intro: 550.59,
      camps: 2852,
      "trips-title": 332.98,
      "trips-cards": 3786.95,
      cta: 844,
    },
  },
} as const;

for (const route of ["itineraries", "camps"] as const) {
  test.describe(`${route} index topology and content`, () => {
    test(`matches the measured direct-child order at all required viewports`, async ({
      page,
    }) => {
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`/${route}`, { waitUntil: "networkidle" });

        const content = page.locator("[data-index-page-content]");
        await expect(content).toHaveCount(1);
        await expect(content.locator("[data-index-stage='hero'] h1")).toHaveText(
          route === "itineraries" ? "OUR TRIPS" : "OUR Camps",
        );
        await expect(content.locator("[data-index-stage='hero'] h2")).toHaveText(
          route === "itineraries" ? "Our Core Journeys" : "THREE UNIQUE OUTPOSTS",
        );

        const stages = await content.evaluate((root) =>
          Array.from(root.children).map((element) =>
            element.getAttribute("data-index-stage"),
          ),
        );
        expect(stages).toEqual(
          route === "itineraries"
            ? ["hero", "intro", "itineraries", "cta"]
            : ["hero", "intro", "camps", "trips-title", "trips-cards", "cta"],
        );
      }
    });

    test("serves only local target media and the exact route links", async ({
      page,
    }) => {
      await page.goto(`/${route}`, { waitUntil: "networkidle" });
      const root = page.locator("[data-index-page-content]");
      const media = await root
        .locator("img")
        .evaluateAll((images) =>
          images.map((image) => decodeURIComponent(image.getAttribute("src") ?? "")),
        );
      expect(media.every((src) => src.includes("/media/target/"))).toBe(true);
      expect(media.some((src) => src.includes("http"))).toBe(false);

      if (route === "itineraries") {
        const cards = root.locator("[data-index-itinerary]");
        await expect(cards).toHaveCount(6);
        await expect(cards.locator(".itinerary-item_title")).toHaveText(
          itineraryTitles,
        );
        await expect(cards.locator(".itinerary-item_excerpt")).toHaveText(
          itineraryExcerpts,
        );
        expect(
          await cards
            .locator("a.itinerary-item_link")
            .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
        ).toEqual(itineraryHrefs);
        expect(
          await cards
            .locator("img")
            .evaluateAll((images) => images.map((image) => image.getAttribute("alt"))),
        ).toEqual(itineraryTitles);
        await expect(root.locator("[data-index-cta-link]")).toHaveAttribute(
          "href",
          "/enquire",
        );
      } else {
        const camps = root.locator("[data-index-camp]");
        await expect(camps).toHaveCount(3);
        await expect(camps.locator(".card-title")).toHaveText(campTitles);
        await expect(camps.locator(".camp-coordinates")).toHaveText(campCoordinates);
        await expect(camps.locator(".card-excerpt_wrap")).toHaveText(campBodies);
        expect(
          await camps.evaluateAll((links) =>
            links.map((link) => link.getAttribute("href")),
          ),
        ).toEqual(campHrefs);
        expect(
          await camps
            .locator("img")
            .evaluateAll((images) => images.map((image) => image.getAttribute("alt"))),
        ).toEqual(campTitles);

        const trips = root.locator("[data-index-trip]");
        await expect(trips).toHaveCount(5);
        await expect(trips.locator(".card-flick_title")).toHaveText(tripTitles);
        expect(
          await trips.evaluateAll((links) =>
            links.map((link) => link.getAttribute("href")),
          ),
        ).toEqual(tripHrefs);
        expect(
          await trips
            .locator("img")
            .evaluateAll((images) => images.map((image) => image.getAttribute("alt"))),
        ).toEqual(tripTitles);
        await expect(root.locator("[data-index-trip='discovery-week']")).toHaveCount(0);
        await expect(root.locator("[data-index-cta-link]")).toHaveAttribute(
          "href",
          "/enquire",
        );
      }
    });
  });

  for (const viewport of viewports) {
    test(`${route} stage geometry at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/${route}`, { waitUntil: "networkidle" });

      const expected = stageHeights[route][viewport.name];
      const actual = await page
        .locator("[data-index-stage]")
        .evaluateAll((elements) =>
          Object.fromEntries(
            elements.map((element) => [
              element.getAttribute("data-index-stage"),
              element.getBoundingClientRect().height,
            ]),
          ),
        );
      for (const [stage, height] of Object.entries(expected)) {
        expect(actual[stage]).toBeDefined();
        expect(
          Math.abs(Number(actual[stage]) - height),
          `${route}/${stage}`,
        ).toBeLessThanOrEqual(2);
      }

      await expect(page.locator("[data-index-stage='hero']")).toHaveCSS(
        "height",
        `${viewport.height * 2}px`,
      );
      await expect(page.locator("[data-motion-layer='cloud-near']")).toHaveCount(1);
      await expect(page.locator("[data-motion-layer='cloud-far']")).toHaveCount(1);
      await expect(page.locator("[data-motion-layer='mist-plane']")).toHaveCount(1);
    });
  }
}

test.describe("index scroll choreography", () => {
  test("resolves the hero layers at start, middle, end, and reverse without queued motion", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/itineraries", { waitUntil: "networkidle" });

    const sample = async (fraction: number) => {
      await page.evaluate(
        (fraction) => window.scrollTo(0, window.innerHeight * fraction),
        fraction,
      );
      await page.waitForTimeout(100);
      return page.locator("[data-index-stage='hero']").evaluate((hero) => {
        const read = (name: string) =>
          hero.querySelector<HTMLElement>(`[data-motion-layer='${name}']`)?.style
            .transform;
        return {
          scrollY: window.scrollY,
          wrapper: read("hero-wrapper"),
          mid: read("hero-mid"),
          near: read("cloud-near"),
          far: read("cloud-far"),
          mist: read("mist-plane"),
        };
      });
    };

    const start = await sample(0);
    expect(start.wrapper).toContain("0svh");
    expect(start.mid).toContain("0svh");
    expect(start.near).toContain("100%");
    expect(start.far).toContain("100%");
    expect(start.mist).toContain("90deg");

    const middle = await sample(1);
    expect(middle.wrapper).toContain("100svh");
    expect(middle.mid).toContain("-30svh");
    expect(middle.near).toContain("10%");
    expect(middle.far).toContain("45%");
    expect(middle.mist).toContain("64.2857deg");

    const end = await sample(2);
    expect(end.wrapper).toContain("200svh");
    expect(end.mid).toContain("-60svh");
    expect(end.near).toContain("-80%");
    expect(end.far).toContain("-10%");
    expect(end.mist).toContain("0deg");

    const reverse = await sample(0);
    expect(reverse.wrapper).toContain("0svh");
    expect(reverse.mid).toContain("0svh");
    expect(reverse.near).toContain("100%");
    expect(reverse.mist).toContain("90deg");
  });

  test("activates a collapsed trip on keyboard focus and pointer entry", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/camps", { waitUntil: "networkidle" });
    const trips = page.locator("[data-index-trip]");
    await expect(trips.nth(0)).toHaveAttribute("data-active", "true");

    await trips.nth(2).hover();
    await expect(trips.nth(2)).toHaveAttribute("data-active", "true");
    await expect(trips.nth(0)).toHaveAttribute("data-active", "false");
    await page.waitForTimeout(650);

    const widths = await trips.evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().width),
    );
    expect(widths[2]).toBeCloseTo((1440 - 24) * 0.5, 0);
    expect(widths[0]).toBeCloseTo((1440 - 24) * 0.125, 0);

    await trips.nth(4).focus();
    await expect(trips.nth(4)).toHaveAttribute("data-active", "true");
    await expect(trips.nth(2)).toHaveAttribute("data-active", "false");
  });

  test("keeps all five trip cards readable in the stacked mobile state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/camps", { waitUntil: "networkidle" });
    const cards = page.locator("[data-index-trip]");
    await expect(cards).toHaveCount(5);
    expect(
      await cards.nth(0).evaluate((card) => card.getBoundingClientRect().height),
    ).toBeCloseTo(717.39, 1);
    for (const card of await cards.all()) {
      await expect(card.locator(".card-flick_content")).toHaveCSS("opacity", "1");
    }
  });
});
