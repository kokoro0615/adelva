import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Focused motion evidence, independent from whole-page fidelity acceptance.
const output = "artifacts/adelva-about/carousel";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const samples = [];
const failures = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    const pair = {};
    for (const role of ["reference", "actual"]) {
      const reference = role === "reference";
      const page = await browser.newPage({
        viewport: { width, height },
        reducedMotion: "no-preference",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const url = reference
        ? "https://morght.com/"
        : `${process.env.MORGHT_URL || "http://127.0.0.1:3002"}/about`;
      const column = reference ? ".c-home-carousel__item" : ".mg-carousel-column";
      await page.goto(url);
      await page.waitForSelector(
        reference ? ".c-home-intro__logoType-type.-show" : '[data-ready="true"]',
      );
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(3500);
      // Use the measured column's vertical center rather than page-specific hero offsets.
      await page
        .locator(column)
        .first()
        .evaluate((e) =>
          scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.25),
        );
      await page.waitForTimeout(200);
      const measure = () =>
        page.locator(column).evaluateAll((els) => ({
          time: performance.now(),
          columns: els.map((e) => {
            const r = e.getBoundingClientRect();
            return { x: r.x, width: r.width, height: r.height };
          }),
        }));
      const start = await measure();
      await page.screenshot({ path: `${output}/${width}-${role}-start.png` });
      await page.waitForTimeout(650);
      const end = await measure();
      await page.screenshot({ path: `${output}/${width}-${role}-end.png` });
      const total = start.columns.reduce((n, c) => n + c.width, 0);
      let displacement = end.columns[0].x - start.columns[0].x;
      if (displacement < -width) displacement += total;
      const speed = (displacement / (end.time - start.time)) * 1000;
      pair[role] = { url, start, end, speed, errors };
      if (speed < (width / 16.5) * 0.6 || speed > (width / 16.5) * 1.25)
        failures.push(`${width} ${role}: unexpected speed ${speed}`);
      if (!reference && errors.length) failures.push(`${width}: local page errors`);
      await page.close();
    }
    pair.reference.start.columns.forEach((c, i) => {
      const actual = pair.actual.start.columns[i];
      if (
        !actual ||
        Math.abs(c.width - actual.width) > 2 ||
        Math.abs(c.height - actual.height) > 2
      )
        failures.push(`${width}: column ${i} geometry drift`);
    });
    samples.push({ width, height, ...pair });
  }
} finally {
  await browser.close();
}
await writeFile(
  `${output}/report.json`,
  JSON.stringify(
    {
      date: new Date().toISOString(),
      scope:
        "Carousel motion and column geometry only; screenshots are time samples, not pixel-normalized whole-page fidelity",
      samples,
      failures,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      samples: samples.map((s) => ({
        width: s.width,
        referenceSpeed: s.reference.speed,
        actualSpeed: s.actual.speed,
      })),
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
