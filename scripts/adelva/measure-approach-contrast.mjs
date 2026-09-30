/**
 * Measures the contrast of every text run on /approach against what is
 * actually painted behind it — photographs, scrims and the ridge included,
 * which axe cannot evaluate. For each run the page is captured twice: once as
 * rendered (to locate each line through DOM ranges) and once with all text made
 * transparent. The background is sampled inside every line box; the 95th
 * percentile luminance (the brighter side) is compared with the rendered text
 * colour composited over that background.
 *
 *   BASE_URL=http://127.0.0.1:4318 node scripts/adelva/measure-approach-contrast.mjs [out.json]
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4318";
const out = process.argv[2];
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Text runs, grouped by what they sit on. Large text (≥24px, or ≥18.66px bold) needs 3:1. */
const selectors = [
  "[data-hero-body] li",
  "[data-hero-body] p",
  "[data-hero-body] h1",
  "[data-rail] span",
  "[data-stage-text] p",
  "[data-stage-text] h3",
  "[data-stage-text] li",
  "[data-finder] span",
  "[data-hero-finder-number]",
  "[data-section='responsibilities'] p",
  "[data-section='responsibilities'] h2",
  "[data-section='responsibilities'] dt",
  "[data-section='responsibilities'] dd",
  "[data-section='responsibilities'] [aria-hidden] > span",
  "[data-section='integrated'] p",
  "[data-section='integrated'] h2",
  "[data-section='integrated'] a > span",
  "[data-section='integrated'] li[data-example-item]",
  "[data-section='verification'] h2",
  "[data-section='verification'] h3",
  "[data-section='verification'] p",
  "[data-section='audiences'] a > span",
];

const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base + "/approach", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    for (const image of document.images) image.loading = "eager";
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
  });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  const runs = await page.evaluate((selectors) => {
    const found = [];
    for (const selector of selectors)
      for (const element of document.querySelectorAll(selector)) {
        const style = getComputedStyle(element);
        if (
          style.visibility === "hidden" ||
          element.closest("[aria-hidden='true'] [aria-hidden='true']")
        )
          continue;
        // Text nodes only: decorative children (brackets, ticks) are not text.
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const rects = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          rects.push(
            ...[...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2),
          );
        }
        if (!rects.length) continue;
        const size = parseFloat(style.fontSize);
        const bold = Number(style.fontWeight) >= 700;
        found.push({
          selector,
          text: (element.textContent ?? "").trim().slice(0, 24),
          color: style.color,
          large: size >= 24 || (bold && size >= 18.66),
          rects: rects.map((r) => ({
            x: Math.max(0, Math.round(r.left + scrollX)),
            y: Math.max(0, Math.round(r.top + scrollY)),
            w: Math.round(r.width),
            h: Math.round(r.height),
          })),
        });
      }
    return found;
  }, selectors);
  await page.addStyleTag({
    content:
      "[data-approach] * { color: transparent !important; text-shadow: none !important; }",
  });
  const shot = await page.screenshot({ fullPage: true });
  const { data, info } = await sharp(shot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const run of runs) {
    const values = [];
    for (const box of run.rects)
      for (let y = box.y; y < Math.min(info.height, box.y + box.h); y += 1)
        for (let x = box.x; x < Math.min(info.width, box.x + box.w); x += 1) {
          const k = (y * info.width + x) * 3;
          values.push([data[k], data[k + 1], data[k + 2]]);
        }
    if (!values.length) continue;
    values.sort((a, b) => luminance(a) - luminance(b));
    const background = values[Math.floor(values.length * 0.95)];
    const match = run.color.match(/[\d.]+/g).map(Number);
    const alpha = match[3] ?? 1;
    const text = [0, 1, 2].map((i) => match[i] * alpha + background[i] * (1 - alpha));
    const contrast = ratio(luminance(text), luminance(background));
    results.push({
      viewport: `${width}x${height}`,
      selector: run.selector,
      text: run.text,
      large: run.large,
      contrast: +contrast.toFixed(2),
      pass: contrast >= (run.large ? 3 : 4.5),
    });
  }
  await context.close();
}
await browser.close();
const failures = results.filter((result) => !result.pass);
const lowest = [...results].sort((a, b) => a.contrast - b.contrast).slice(0, 12);
console.log(JSON.stringify({ runs: results.length, failures, lowest }, null, 2));
if (out)
  await writeFile(
    out,
    `${JSON.stringify({ measured: new Date().toISOString().slice(0, 10), results }, null, 2)}\n`,
  );
process.exitCode = failures.length ? 1 : 0;
