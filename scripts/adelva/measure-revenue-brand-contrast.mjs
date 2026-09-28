/** Sample actual text-free backgrounds (including authored scrims) within ink
 * bounds. p95 luminance follows the existing management-operations method. */
import { writeFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4391";
const out =
  process.argv[2] ?? "docs/reports/adelva-revenue-brand-2026-09-28/contrast.json";
const channel = (v) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
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
  const p = await context.newPage();
  await p.goto(base + "/services/revenue-brand");
  await p.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) if (i.getClientRects().length) i.loading = "eager";
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) => i.decode()),
    );
  });
  const texts = await p.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll(
        "main h1,main h2,main h3,main p,main dd,main .unused,main button>span,li[data-step] li",
      ),
    ];
    return nodes
      .filter(
        (n) =>
          n.getBoundingClientRect().width > 1 &&
          !n.closest('[aria-hidden="true"]') &&
          !n.matches('[aria-hidden="true"]'),
      )
      .map((n, i) => {
        n.setAttribute("data-contrast-id", String(i));
        const s = getComputedStyle(n);
        const range = document.createRange();
        range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        return {
          id: i,
          text: n.textContent,
          color: s.color,
          fontSize: parseFloat(s.fontSize),
          weight: parseInt(s.fontWeight),
          x: r.x,
          y: r.y + scrollY,
          width: r.width,
          height: r.height,
        };
      });
  });
  // Transparent text keeps backgrounds, borders, pseudo-element scrims and the
  // glyph-shaped text-shadow halos (part of the rendered background) intact.
  await p.addStyleTag({
    content:
      "main [data-contrast-id],main [data-contrast-id] *{color:transparent!important;-webkit-text-fill-color:transparent!important}",
  });
  const shot = await p.screenshot({ fullPage: true });
  const { data, info } = await sharp(shot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (const t of texts) {
    const color = t.color.match(/[\d.]+/g).map(Number);
    const foreground = lum(color);
    const values = [];
    for (
      let y = Math.max(0, Math.ceil(t.y));
      y < Math.min(info.height, Math.floor(t.y + t.height));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(t.x));
        x < Math.min(info.width, Math.floor(t.x + t.width));
        x++
      ) {
        const k = (y * info.width + x) * 3;
        values.push(lum([data[k], data[k + 1], data[k + 2]]));
      }
    values.sort((a, b) => a - b);
    const background = values[Math.floor(values.length * 0.95)] ?? 0;
    const alpha = color[3] ?? 1;
    const effective = foreground * alpha + background * (1 - alpha);
    const result = ratio(effective, background);
    const target =
      t.fontSize >= 24 || (t.weight >= 700 && t.fontSize >= 18.66) ? 3 : 4.5;
    results.push({
      viewport: width,
      text: t.text,
      fontSize: t.fontSize,
      color: t.color,
      contrast: +result.toFixed(2),
      target,
      pass: result >= target,
    });
  }
  await context.close();
}
await browser.close();
await mkdir(out.slice(0, out.lastIndexOf("/")), { recursive: true });
await writeFile(
  out,
  JSON.stringify(
    {
      method:
        "95th percentile background luminance inside text box; foreground hidden while scrims and surfaces remain. Fully lit reduced-motion state.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      count: results.length,
      failures: results.filter((r) => !r.pass),
      min: Math.min(...results.map((r) => r.contrast)),
    },
    null,
    2,
  ),
);
