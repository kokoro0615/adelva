import { expect, test } from "@playwright/test";

const routes = [
  "/about/founders",
  "/about/foundation",
  "/about/sustainability",
  "/antarctica/behind-the-scenes",
  "/antarctica/direct-flights-to-antarctica",
  "/camps/echo-base",
  "/camps/explorer-camp",
  "/camps/whichaway-camp",
  "/itineraries/discovery-week",
  "/itineraries/south-pole-emperor-penguins",
  "/itineraries/south-pole-blue-rivers",
  "/itineraries/antarctica-in-a-day",
  "/itineraries/early-emperor-penguins",
  "/itineraries/the-long-stay",
  "/antarctica/wolfs-fang-runway-mountains",
  "/antarctica/schirmacher-oasis",
  "/antarctica/polar-plateau",
  "/antarctica/atka-penguin-colony",
  "/antarctica/fuel-depot",
  "/prices",
  "/enquire",
] as const;

const directChildCounts: Record<string, number> = {
  "/about/founders": 8,
  "/about/foundation": 5,
  "/about/sustainability": 6,
  "/antarctica/behind-the-scenes": 2,
  "/antarctica/direct-flights-to-antarctica": 10,
  "/camps/echo-base": 8,
  "/camps/explorer-camp": 8,
  "/camps/whichaway-camp": 8,
  "/itineraries/discovery-week": 10,
  "/itineraries/south-pole-emperor-penguins": 10,
  "/itineraries/south-pole-blue-rivers": 10,
  "/itineraries/antarctica-in-a-day": 8,
  "/itineraries/early-emperor-penguins": 10,
  "/itineraries/the-long-stay": 10,
  "/antarctica/wolfs-fang-runway-mountains": 6,
  "/antarctica/schirmacher-oasis": 6,
  "/antarctica/polar-plateau": 6,
  "/antarctica/atka-penguin-colony": 6,
  "/antarctica/fuel-depot": 6,
  "/prices": 4,
  "/enquire": 2,
};

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const familyMasters = [
  {
    path: "/about/founders",
    title: "Our Story",
    nav: ["Our Story", "Foundation", "Sustainability"],
    desktopSize: 120,
    mobileSize: 40,
  },
  {
    path: "/antarctica/behind-the-scenes",
    title: "Behind the Scenes",
    nav: [],
    desktopSize: 120,
    mobileSize: 40,
  },
  {
    path: "/antarctica/direct-flights-to-antarctica",
    title: "Aviation",
    nav: [],
    desktopSize: 120,
    mobileSize: 72,
  },
  {
    path: "/camps/echo-base",
    title: "Echo Base",
    nav: [],
    desktopSize: 60,
    mobileSize: 40,
  },
  {
    path: "/itineraries/discovery-week",
    title: "Discovery Week",
    nav: ["Overview", "Curriculum", "Itinerary", "More Info"],
    desktopSize: 60,
    mobileSize: 32,
  },
  {
    path: "/antarctica/wolfs-fang-runway-mountains",
    title: "The Mountains",
    nav: [
      "The Mountains",
      "The Rock Oasis",
      "The High Polar Plateau",
      "Emperor Penguin Ice Fields",
      "Ice Shelf Coast",
    ],
    desktopSize: 120,
    mobileSize: 40,
  },
  {
    path: "/prices",
    title: "Dates & Rates",
    nav: [],
    desktopSize: 62,
    mobileSize: 32,
    compact: true,
  },
  {
    path: "/enquire",
    title: "Start Planning",
    nav: [],
    desktopSize: 62,
    mobileSize: 32,
  },
] as const;

test.describe("detail clone route contract", () => {
  for (const path of routes) {
    test(`${path} renders its measured shell`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main .stage")).toBeAttached();
      await expect(page.locator("main .stage > *")).toHaveCount(
        directChildCounts[path],
      );

      const externalImages = await page
        .locator("main img")
        .evaluateAll(
          (images) =>
            images.filter((image) => /^https?:/i.test(image.getAttribute("src") ?? ""))
              .length,
        );
      expect(externalImages).toBe(0);
    });
  }
});

test.describe("detail clone nested interaction contract", () => {
  test("rates expose all season cards and planning links without leaving the route", async ({
    page,
  }) => {
    await page.goto("/prices", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".rates-body .split-slider_item")).toHaveCount(8);
    await expect(page.locator('a[href^="/enquire?itinerary="]')).toHaveCount(6);
  });

  test("enquiry keeps the four keyboard-first fieldsets local", async ({ page }) => {
    await page.goto("/enquire", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".enquiry-fieldset")).toHaveCount(4);
    await expect(
      page.locator("legend", { hasText: "When do you want to travel?" }),
    ).toBeVisible();
    await expect(page.locator("legend", { hasText: "Travel Month?" })).toBeVisible();
    await expect(
      page.locator("legend", { hasText: "What are you interested in?" }),
    ).toBeVisible();
    await expect(
      page.locator("legend", { hasText: "Contact Information" }),
    ).toBeVisible();
    await expect(page.locator('[class*="enquiryForm"]')).toHaveAttribute("id", /.+/);
  });

  test("gallery controls update an announced slide without hiding controls", async ({
    page,
  }) => {
    await page.goto("/camps/echo-base", { waitUntil: "domcontentloaded" });
    const counter = page.locator('[aria-live="polite"]');
    await expect(counter).toContainText("01 / 04");
    await page.getByRole("button", { name: "Next Inside camp image" }).click();
    await expect(counter).toContainText("02 / 04");
    await expect(
      page.getByRole("button", { name: "Previous Inside camp image" }),
    ).toBeVisible();
  });

  test("accordions expose the target labels and remain native details", async ({
    page,
  }) => {
    await page.goto("/about/sustainability", { waitUntil: "domcontentloaded" });
    await expect(page.locator("details.accordion-item")).toHaveCount(36);
    await expect(
      page.locator("summary", { hasText: "Environmental Impact and Monitoring" }),
    ).toBeVisible();
    await page
      .locator("summary", { hasText: "Environmental Impact and Monitoring" })
      .click();
    await expect(
      page.locator("details[open]", { hasText: "Environmental Impact and Monitoring" }),
    ).toHaveCount(1);
  });

  test("secondary film media is opt-in and hero images fill their stages", async ({
    page,
  }) => {
    for (const path of ["/camps/echo-base", "/itineraries/early-emperor-penguins"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const videoPreloads = await page
        .locator("main video")
        .evaluateAll((videos) => videos.map((video) => video.getAttribute("preload")));
      expect(videoPreloads.length).toBeGreaterThan(0);
      expect(videoPreloads.every((preload) => preload === "none")).toBe(true);
      await page.locator("[data-hero] img").evaluate(async (image) => {
        await (image as HTMLImageElement).decode();
      });
      const geometry = await page.locator("[data-hero]").evaluate((hero) => {
        const image = hero.querySelector("img");
        if (!(image instanceof HTMLImageElement)) return null;
        const heroRect = hero.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        return {
          heroWidth: heroRect.width,
          heroHeight: heroRect.height,
          imageWidth: imageRect.width,
          imageHeight: imageRect.height,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          display: getComputedStyle(image).display,
        };
      });
      expect(geometry).not.toBeNull();
      expect(geometry?.display).toBe("block");
      expect(geometry?.imageWidth).toBeCloseTo(geometry?.heroWidth ?? 0, 0);
      expect(geometry?.imageHeight).toBeCloseTo(geometry?.heroHeight ?? 0, 0);
      expect(geometry?.naturalWidth).toBeGreaterThan(0);
      expect(geometry?.naturalHeight).toBeGreaterThan(0);
    }
  });

  test("detail-owned interactions stay free of post-hydration diagnostics", async ({
    page,
  }) => {
    await page.goto("/camps/echo-base", { waitUntil: "networkidle" });
    const diagnostics: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") {
        diagnostics.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => diagnostics.push(`pageerror: ${error.message}`));

    await page.getByRole("button", { name: "Next Inside camp image" }).click();
    await page.locator('[data-detail-section="camp-gallery"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    expect(diagnostics).toEqual([]);
  });
});

test.describe("detail clone measured family fidelity", () => {
  for (const viewport of viewports) {
    test(`${viewport.name} family masters preserve title, nav, media, and geometry`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      for (const fixture of familyMasters) {
        await page.goto(fixture.path, { waitUntil: "domcontentloaded" });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });

        const hero = page.locator("[data-hero]");
        const title = hero.locator("h1");
        await expect.soft(title).toHaveText(fixture.title);

        const metrics = await hero.evaluate((element) => {
          const heroRect = element.getBoundingClientRect();
          const heading = element.querySelector("h1");
          const image = element.querySelector("img");
          if (!(heading instanceof HTMLElement) || !(image instanceof HTMLElement)) {
            return null;
          }
          const titleRect = heading.getBoundingClientRect();
          const imageRect = image.getBoundingClientRect();
          const titleStyle = getComputedStyle(heading);
          return {
            hero: { width: heroRect.width, height: heroRect.height },
            title: {
              center: titleRect.left + titleRect.width / 2,
              top: titleRect.top,
              fontFamily: titleStyle.fontFamily,
              fontSize: Number.parseFloat(titleStyle.fontSize),
            },
            image: { width: imageRect.width, height: imageRect.height },
            overflow: document.documentElement.scrollWidth - window.innerWidth,
          };
        });

        expect.soft(metrics).not.toBeNull();
        const expectedHeroHeight =
          "compact" in fixture && fixture.compact
            ? viewport.name === "desktop"
              ? 585
              : viewport.name === "tablet"
                ? 666
                : 549
            : viewport.height;
        const expectedFontSize =
          viewport.name === "mobile" ? fixture.mobileSize : fixture.desktopSize;
        expect.soft(metrics?.hero.height).toBeCloseTo(expectedHeroHeight, 0);
        expect.soft(metrics?.image.width).toBeCloseTo(viewport.width, 0);
        expect.soft(metrics?.image.height).toBeCloseTo(expectedHeroHeight, 0);
        expect.soft(metrics?.title.center).toBeCloseTo(viewport.width / 2, 0);
        expect.soft(metrics?.title.fontFamily).toContain("Cardinal");
        expect.soft(metrics?.title.fontSize).toBeCloseTo(expectedFontSize, 0);
        expect.soft(metrics?.title.top).toBeGreaterThan(expectedHeroHeight * 0.2);
        expect.soft(metrics?.title.top).toBeLessThan(expectedHeroHeight * 0.75);
        expect.soft(metrics?.overflow).toBeLessThanOrEqual(0);

        const nav = page.locator("main nav");
        if (fixture.nav.length === 0) {
          await expect.soft(nav).toHaveCount(0);
        } else {
          await expect.soft(nav.locator("a")).toHaveText(fixture.nav);
          const navBox = await nav.boundingBox();
          expect.soft(navBox?.height).toBe(80);
          expect.soft(navBox?.y).toBeCloseTo(expectedHeroHeight - 80, 0);
        }
      }
    });
  }

  test("rates and enquiry begin at the measured hero boundary", async ({ page }) => {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/prices", { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Select your season:")).toBeVisible();
      await expect(page.locator('[aria-label="Season"] > span')).toHaveCount(2);
      await expect(
        page.locator(".rates-body .split-slider_item").first().locator("img"),
      ).toBeVisible();

      await page.goto("/enquire", { waitUntil: "domcontentloaded" });
      const formPanel = page.locator('[data-detail-section="enquiry-form"] > div');
      const panelBox = await formPanel.boundingBox();
      const expectedTop =
        viewport.name === "desktop" ? 585 : viewport.name === "tablet" ? 666 : 549;
      expect.soft(panelBox?.y).toBeCloseTo(expectedTop, 0);
      await expect(
        page.locator(".enquiry-fieldset").first().locator("legend"),
      ).toHaveCSS("font-family", /Arial|Helvetica|sans-serif/);
    }
  });
});
