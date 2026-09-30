/**
 * Text-over-art contrast for /about (spec §10–11). For each text box in <main>,
 * the page is re-shot with all text made transparent; the 10th-percentile
 * background luminance inside the box (the darkest backing the glyphs meet) is
 * compared with the text colour composited over that backing.
 *
 * Usage: node scripts/adelva/measure-about-contrast.mjs [baseURL] > report.json
 * States: static full page (reduced motion) at 1440/768/390, and the held front
 * at 0 / 0.5 / 1 (motion) at 1440 and 390.
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const lum = (r, g, b) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

async function textBoxes(page, fullPage) {
  return page.evaluate((full) => {
    const out = [];
    // In viewport shots the fixed header covers the top band: text under it is
    // not visible and is measured when the page scrolls, so skip it here.
    const headerBottom = full
      ? 0
      : (document.querySelector("header")?.getBoundingClientRect().bottom ?? 0);
    const walker = document.createTreeWalker(
      document.querySelector("main"),
      NodeFilter.SHOW_TEXT,
    );
    const seen = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (
        !n.textContent.trim() ||
        seen.has(el) ||
        el.closest("[aria-hidden='true'], .visuallyHidden")
      )
        continue;
      const cs = getComputedStyle(el);
      if (
        cs.visibility === "hidden" ||
        cs.display === "none" ||
        el.closest("[class*='visuallyHidden']")
      )
        continue;
      seen.add(el);
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue;
        const top = r.top + (full ? scrollY : 0);
        if (!full && (r.top < headerBottom || r.bottom > innerHeight)) continue;
        out.push({
          text: el.textContent.trim().slice(0, 24),
          color: cs.color,
          size: parseFloat(cs.fontSize),
          weight: Number(cs.fontWeight),
          box: [Math.max(0, r.left), Math.max(0, top), r.width, r.height],
        });
      }
    }
    return out;
  }, fullPage);
}

async function measure(page, fullPage, state) {
  const boxes = await textBoxes(page, fullPage);
  const tag = await page.addStyleTag({
    content:
      "main, main * { color: transparent !important; text-shadow: none !important; } main svg text { fill: transparent !important; }",
  });
  const png = await page.screenshot({ fullPage, animations: "disabled" });
  await tag.evaluate((n) => n.remove());
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const b of boxes) {
    const [x, y, w, h] = b.box.map(Math.round);
    const lums = [];
    const px = [];
    for (let yy = y; yy < Math.min(info.height, y + h); yy += 1)
      for (let xx = x; xx < Math.min(info.width, x + w); xx += 1) {
        const i = (yy * info.width + xx) * 3;
        lums.push(lum(data[i], data[i + 1], data[i + 2]));
        px.push(i);
      }
    if (!lums.length) continue;
    const order = lums.map((l, i) => [l, i]).sort((a, c) => a[0] - c[0]);
    const [l10, i10] = order[Math.floor(order.length * 0.1)];
    const [l90, i90] = order[Math.floor(order.length * 0.9)];
    const m = b.color.match(/[\d.]+/g).map(Number);
    const alpha = m[3] ?? 1;
    const worst = [l10, i10, l90, i90].reduce((acc, _, k, arr) => {
      if (k % 2) return acc;
      const i = px[arr[k + 1]];
      const bg = [data[i], data[i + 1], data[i + 2]];
      const fg = [0, 1, 2].map((c) => m[c] * alpha + bg[c] * (1 - alpha));
      const r = ratio(lum(...fg), arr[k]);
      return Math.min(acc, r);
    }, Infinity);
    const large = b.size >= 24 || (b.size >= 18.66 && b.weight >= 700);
    rows.push({
      state,
      text: b.text,
      size: b.size,
      ratio: +worst.toFixed(2),
      need: large ? 3 : 4.5,
    });
  }
  return rows;
}

const browser = await chromium.launch();
const results = [];
for (const [w, h] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    reducedMotion: "reduce",
  });
  await page.goto(`${base}/about`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) await page.evaluate((t) => scrollTo(0, t), y);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  results.push(...(await measure(page, true, `static-${w}`)));
  await page.close();
}
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    reducedMotion: "no-preference",
  });
  await page.goto(`${base}/about`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const g = await page.evaluate(() => {
    const pin = document.querySelector("[data-pin]"),
      seg = pin.querySelector("[data-seg='b']");
    return {
      top:
        pin.getBoundingClientRect().top +
        scrollY -
        (parseFloat(getComputedStyle(seg).top) || 0),
      d: pin.offsetHeight - seg.offsetHeight,
    };
  });
  for (const f of [0, 0.5, 1]) {
    const target = Math.round(g.top + g.d * f);
    const from = await page.evaluate(() => scrollY);
    for (let i = 1; i <= 10; i++) {
      await page.evaluate((t) => scrollTo(0, t), from + ((target - from) * i) / 10);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(1600);
    results.push(...(await measure(page, false, `front-${f}-${w}`)));
  }
  await page.close();
}
await browser.close();
const failing = results.filter((r) => r.ratio < r.need);
const minimum = results.reduce(
  (a, r) => (r.ratio / r.need < a.ratio / a.need ? r : a),
  results[0],
);
console.log(
  JSON.stringify(
    {
      measured: results.length,
      failing: failing.map(
        (r) => `${r.state} ${r.ratio}/${r.need} ${r.size}px ${r.text}`,
      ),
      tightest: minimum,
    },
    null,
    1,
  ),
);
