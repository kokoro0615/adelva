/**
 * Measures the contrast of the 06 step (name and tags) at the end of the
 * pinned sequence, where the dawn layer is brightest. The background is
 * sampled with the step text hidden, inside each text box; the worst (95th
 * percentile) luminance is reported against the rendered text colour.
 *
 *   BASE_URL=http://127.0.0.1:4317 node scripts/adelva/measure-management-operations-contrast.mjs out.json
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const out = process.argv[2];
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [1440, 960],
  [1440, 900],
  [1280, 800],
  [1920, 1080],
]) {
  const page = await (
    await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    })
  ).newPage();
  await page.goto(base + "/services/management-operations");
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    const top = section.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top + innerHeight * 5, behavior: "instant" });
  });
  await page.waitForTimeout(1800);
  const boxes = await page.evaluate(() => {
    const step = document.querySelector('li[data-step="6"]');
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };
    return {
      state: step.dataset.state,
      name: rect(step.querySelector("h3")),
      tags: [...step.querySelectorAll("ul li")].map(rect),
      nameColor: getComputedStyle(step.querySelector("h3")).color,
      tagColor: getComputedStyle(step.querySelector("ul li")).color,
    };
  });
  await page.addStyleTag({
    content: 'li[data-step="6"] { visibility: hidden !important; }',
  });
  const shot = await page.screenshot();
  const { data, info } = await sharp(shot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const worst = (box, overlay) => {
    const values = [];
    for (let y = box.y; y < box.y + box.h; y++)
      for (let x = box.x; x < box.x + box.w; x++) {
        const k = (y * info.width + x) * 3;
        let pixel = [data[k], data[k + 1], data[k + 2]];
        if (overlay)
          pixel = pixel.map((v, i) => v * (1 - overlay.a) + overlay.rgb[i] * overlay.a);
        values.push(luminance(pixel));
      }
    values.sort((a, b) => a - b);
    return values[Math.floor(values.length * 0.95)];
  };
  const white = luminance([255, 255, 255]);
  const nameBg = worst(boxes.name);
  const tagBg = Math.max(
    ...boxes.tags.map((box) => worst(box, { a: 0.55, rgb: [12, 16, 22] })),
  );
  results.push({
    viewport: `${width}x${height}`,
    state: boxes.state,
    nameColor: boxes.nameColor,
    tagColor: boxes.tagColor,
    nameContrast: +ratio(white, nameBg).toFixed(2),
    tagContrast: +ratio(white, tagBg).toFixed(2),
  });
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
if (out)
  await writeFile(
    out,
    JSON.stringify({ measured: "2026-09-24", dawnMax: 0.85, results }, null, 2) + "\n",
  );
