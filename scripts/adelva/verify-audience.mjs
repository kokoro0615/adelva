import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
// Authored from the supplied Figma V3 node coordinates, not browser goldens.
const bands = [
  "hero",
  "challenges",
  "decisions",
  "support",
  "roles",
  "execution",
  "verification",
];
const references = [
  {
    route: "owner",
    width: 1440,
    height: 3727,
    starts: [0, 865, 1384, 1953, 2629, 3025, 3449, 3727],
    heads: [237, 78, 105, 90, 78, 90, 64, 66],
    fonts: [64, 52, 52, 52, 52, 64, 52, 44],
  },
  {
    route: "owner",
    width: 390,
    height: 5951,
    starts: [0, 780, 1460, 2240, 3740, 4470, 5371, 5951],
    heads: [154, 91, 110, 101, 110, 102, 111, 46],
    fonts: [32, 30, 32, 32, 28, 38, 38, 32],
  },
  {
    route: "general-managers",
    width: 1440,
    height: 4121,
    starts: [0, 915, 1382, 1835, 2847, 3264, 3835, 4121],
    heads: [217, 98, 67, 103, 78, 149, 85, 91],
    fonts: [64, 52, 52, 52, 52, 44, 44, 44],
  },
  {
    route: "general-managers",
    width: 390,
    height: 6754,
    starts: [0, 780, 1681, 2480, 4279, 5180, 6094, 6754],
    heads: [168, 86, 324, 136, 115, 211, 113, 99],
    fonts: [34, 32, 32, 32, 32, 32, 32, 32],
  },
];
const browser = await chromium.launch();
const report = [];
for (const reference of references) {
  const page = await browser.newPage({
    viewport: { width: reference.width, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(
    `${process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3002"}/challenges/${reference.route}`,
  );
  await page.evaluate(() => document.fonts.ready);
  const actual = await page.evaluate(() => ({
    height: document.querySelector("main").getBoundingClientRect().height,
    bands: [...document.querySelectorAll("[data-section]")].map((s) => {
      const h = s.querySelector("h1,h2");
      return {
        name: s.dataset.section,
        y: s.getBoundingClientRect().y,
        heading: h ? h.getBoundingClientRect().y - s.getBoundingClientRect().y : null,
        font: h ? parseFloat(getComputedStyle(h).fontSize) : null,
      };
    }),
  }));
  const checks = bands.map((name, i) => {
    const band = actual.bands.find((b) => b.name === name);
    return {
      name,
      sectionDelta: band.y - reference.starts[i],
      headingDelta: band.heading - reference.heads[i],
      fontDelta: band.font - reference.fonts[i],
    };
  });
  report.push({
    route: reference.route,
    width: reference.width,
    heightDelta: actual.height - reference.height,
    checks,
    pass:
      Math.abs(actual.height - reference.height) <= 4 &&
      checks.every(
        (c) =>
          Math.abs(c.sectionDelta) <= 4 &&
          Math.abs(c.headingDelta) <= 4 &&
          Math.abs(c.fontDelta) <= 1,
      ),
  });
  await page.close();
}
await browser.close();
await writeFile(
  "artifacts/adelva-audience-v4/reference-geometry.json",
  JSON.stringify(
    {
      source:
        "Figma V3 original coordinates; headers and section starts, not exhaustive text-node equality",
      thresholds: { section: 4, heading: 4, font: 1 },
      report,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.every((r) => r.pass) ? 0 : 1;
