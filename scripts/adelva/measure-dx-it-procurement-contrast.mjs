/** Real background pixels under DOM text; no image modification or flat-colour proxy. */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const base = process.env.BASE_URL ?? "http://127.0.0.1:4328";
const out =
  process.argv[2] ?? "docs/reports/adelva-dx-it-procurement-2026-09-28/contrast.json";
const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (rgb) =>
  0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const browser = await chromium.launch();
const results = [];
for (const [width, height, motion] of [
  [1440, 900, "reduce"],
  [768, 1024, "reduce"],
  [390, 844, "reduce"],
  [1440, 900, "no-preference"],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
  });
  const page = await context.newPage();
  await page.goto(base + "/services/dx-it-procurement", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
    );
  });
  if (motion === "no-preference") {
    await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
    await page.evaluate(() => {
      const r = document.querySelector("[data-process]").getBoundingClientRect();
      scrollTo({
        top: r.top + scrollY + (755 * r.width) / 1536 - innerHeight * 0.6,
        behavior: "instant",
      });
    });
    await page.waitForTimeout(2400);
  }
  const boxes = await page.evaluate(() => {
    const main = document.querySelector("main");
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const result = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (!node.textContent.trim() || !el || el.closest('[aria-hidden="true"],svg'))
        continue;
      const style = getComputedStyle(el);
      if (style.visibility !== "visible" || style.clipPath === "inset(50%)") continue;
      let opacity = 1;
      for (let p = el; p && p !== main.parentElement; p = p.parentElement)
        opacity *= Number(getComputedStyle(p).opacity);
      if (opacity === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = [...range.getClientRects()]
        .filter((r) => r.width > 1 && r.height > 1)
        .map((r) => ({ x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }));
      if (!rects.length) continue;
      el.setAttribute("data-contrast-text", "");
      const state = el.closest("[data-step]")?.getAttribute("data-state");
      const large =
        parseFloat(style.fontSize) >= 24 ||
        (parseInt(style.fontWeight) >= 700 && parseFloat(style.fontSize) >= 18.66);
      result.push({
        text: node.textContent.trim(),
        section:
          el.closest("[data-section],[data-chapter]")?.getAttribute("data-section") ||
          el.closest("[data-chapter]")?.id ||
          "other",
        state,
        color: style.color,
        opacity,
        fontSize: style.fontSize,
        required: state === "upcoming" ? 4.5 : large ? 3 : 4.5,
        rects,
      });
    }
    return result;
  });
  // A black/white ink pair identifies actual glyph pixels (>=50% coverage).
  // The third render retains the actual background under those glyphs.
  const ink = await page.addStyleTag({
    content:
      "[data-contrast-text] {color:#000!important;-webkit-text-fill-color:#000!important;text-shadow:none!important;} nextjs-portal{display:none!important;}",
  });
  const black = await sharp(await page.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer();
  await ink.evaluate((n) => (n.textContent = n.textContent.replaceAll("#000", "#fff")));
  const white = await sharp(await page.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer();
  await ink.evaluate(
    (n) => (n.textContent = n.textContent.replaceAll("#fff", "transparent")),
  );
  const { data, info } = await sharp(await page.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const measured = boxes.map((box) => {
    const rgba = box.color.match(/[\d.]+/g).map(Number);
    const a = (rgba[3] ?? 1) * box.opacity;
    const values = [];
    for (const r of box.rects)
      for (
        let y = Math.max(0, Math.ceil(r.y));
        y < Math.min(info.height, Math.floor(r.y + r.h));
        y++
      )
        for (
          let x = Math.max(0, Math.ceil(r.x));
          x < Math.min(info.width, Math.floor(r.x + r.w));
          x++
        ) {
          const k = (y * info.width + x) * 3;
          if (Math.abs(white[k] - black[k]) < 128) continue;
          const bg = [data[k], data[k + 1], data[k + 2]];
          const fg = bg.map((v, i) => v * (1 - a) + rgba[i] * a);
          values.push(ratio(luminance(fg), luminance(bg)));
        }
    values.sort((a, b) => a - b);
    const minimum = values[0] ?? 0;
    const p05 = values[Math.floor(values.length * 0.05)] ?? 0;
    return {
      ...box,
      minimum: +minimum.toFixed(3),
      p05: +p05.toFixed(3),
      pass: minimum >= box.required,
    };
  });
  results.push({
    viewport: `${width}x${height}`,
    motion,
    measured,
    failures: measured.filter((b) => !b.pass),
  });
  console.log(
    `${width} ${motion}: ${measured.length - results.at(-1).failures.length}/${measured.length}, failures: ` +
      results
        .at(-1)
        .failures.map((b) => `${b.text} ${b.minimum}/${b.required}`)
        .join("; "),
  );
  await context.close();
}
await browser.close();
await writeFile(
  out,
  JSON.stringify(
    {
      measured: new Date().toISOString(),
      method:
        "minimum contrast at rendered glyph pixels (black/white coverage >= 50%), retaining backgrounds and all photo/scrim layers",
      results,
    },
    null,
    2,
  ) + "\n",
);
if (results.some((r) => r.failures.length)) process.exitCode = 1;
