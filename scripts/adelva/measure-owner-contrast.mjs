/** Text contrast over the photograph for /challenges/owner (spec §11).
 * Every visible text run is compared with its own text-free background (text made
 * transparent; pools, shades and halos kept). Light text is judged against the
 * p95 background luminance, dark (ink) text against the p5, so the worst side of
 * the photograph behind each run decides. States: nothing chosen, and each of the
 * four phases chosen (its light on the bay, 02 and 03 following).
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4491 node scripts/adelva/measure-owner-contrast.mjs [out.json]
 * Method adapted from scripts/adelva/measure-general-managers-contrast.mjs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4491";
const out = process.argv[2] ?? "docs/reports/adelva-owner-2026-09-30/contrast.json";
const channel = (v) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

async function settle(p) {
  // An 11k-px page: wait for every tile to load (not just decode), or the two
  // full-page captures can differ in which tiles Chromium has painted.
  await p.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) {
      i.loading = "eager";
      i.decoding = "sync";
    }
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) =>
          (i.complete
            ? i.decode()
            : new Promise((r) => {
                i.onload = i.onerror = r;
              })
          ).catch(() => {}),
        ),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await p.mouse.move(0, 0);
  // the light slides for 700 ms after a choice
  await p.waitForTimeout(1000);
}

async function measure(p, label, viewport) {
  const texts = await p.evaluate(() => {
    const rows = [];
    // computed colours may be color(srgb …) (color-mix); normalise to rgba 0–255
    const ctx = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    const rgba = (c) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    };
    let i = 0;
    for (const n of document.querySelectorAll("main *")) {
      const direct = [...n.childNodes].some(
        (c) => c.nodeType === 3 && c.textContent.trim(),
      );
      if (!direct || n.closest("[class*=visuallyHidden],[data-home-footer],header"))
        continue;
      const s = getComputedStyle(n);
      if (s.visibility === "hidden" || s.display === "none") continue;
      let opacity = 1;
      for (let e = n; e; e = e.parentElement)
        opacity *= Number(getComputedStyle(e).opacity);
      if (opacity < 0.05) continue;
      n.setAttribute("data-contrast-id", String(i));
      const fixed = Boolean(n.closest("[data-index]"));
      // one row per rendered line of each own text run (never the union of lines)
      for (const c of n.childNodes) {
        if (c.nodeType !== 3 || !c.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(c);
        for (const b of range.getClientRects()) {
          if (b.width < 4 || b.height < 4) continue;
          rows.push({
            id: i,
            text: c.textContent.trim().slice(0, 40),
            color: rgba(s.color),
            fontSize: parseFloat(s.fontSize),
            weight: parseInt(s.fontWeight),
            decorative: Boolean(n.closest('[aria-hidden="true"]')),
            opacity,
            x: b.x,
            y: b.y + (fixed ? 0 : scrollY),
            width: b.width,
            height: b.height,
          });
        }
      }
      i++;
    }
    return rows;
  });
  const visible = await sharp(await p.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const style = await p.addStyleTag({
    content:
      "main [data-contrast-id]{color:transparent!important;-webkit-text-fill-color:transparent!important;fill:transparent!important;text-decoration-color:transparent!important;transition:none!important}",
  });
  const shot = await p.screenshot({ fullPage: true });
  await style.evaluate((n) => n.remove());
  const { data, info } = await sharp(shot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const t of texts) {
    const color = t.color.match(/[\d.]+/g).map(Number);
    const values = [];
    const glyph = [];
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
        const under = lum([data[k], data[k + 1], data[k + 2]]);
        const shown = lum([visible.data[k], visible.data[k + 1], visible.data[k + 2]]);
        values.push(under);
        glyph.push([Math.abs(shown - under), shown]);
      }
    if (!values.length) continue;
    values.sort((a, b) => a - b);
    glyph.sort((a, b) => b[0] - a[0]);
    const core = glyph.slice(0, Math.max(3, Math.floor(glyph.length * 0.04)));
    const rendered = core.reduce((sum, g) => sum + g[1], 0) / core.length;
    const median = values[Math.floor(values.length / 2)];
    const dark = rendered < median;
    const background = dark
      ? values[Math.floor(values.length * 0.05)]
      : values[Math.floor(values.length * 0.95)];
    const alpha = (color[3] ?? 1) * t.opacity;
    const specified = lum(color) * alpha + background * (1 - alpha);
    const contrast = Math.min(
      ratio(rendered, background),
      t.opacity < 1 ? Infinity : ratio(specified, background),
    );
    const target =
      t.fontSize >= 24 || (t.weight >= 700 && t.fontSize >= 18.66) ? 3 : 4.5;
    rows.push({
      state: label,
      viewport,
      text: t.text,
      y: Math.round(t.y),
      fontSize: t.fontSize,
      decorative: t.decorative,
      ink: dark,
      contrast: +contrast.toFixed(2),
      target,
      pass: contrast >= target,
    });
  }
  return rows;
}

const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [360, 780],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  await p.goto(`${base}/challenges/owner`, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await settle(p);
  results.push(...(await measure(p, "rest", width)));
  for (const id of ["management", "opening", "gm", "investment"]) {
    await p.locator(`input[name="phase"][value="${id}"]`).check({ force: true });
    await settle(p);
    results.push(...(await measure(p, id, width)));
  }
  await context.close();
}
await browser.close();
const failures = results.filter((r) => !r.pass && !r.decorative);
const summary = {
  base,
  method:
    "per rendered line; light text: p95 background luminance, ink text: p5, with the text made transparent (halos, pools and shades kept); against the rendered glyph cores and, for opaque runs, the specified colour, whichever is lower. The fixed chapter index is measured where a full-page capture paints it (top of the page). Runs inside aria-hidden decoration are reported separately",
  measured: results.length,
  failures: failures.length,
  decorativeBelowTarget: results.filter((r) => !r.pass && r.decorative).length,
  minimum: results
    .filter((r) => !r.decorative)
    .sort((a, b) => a.contrast / a.target - b.contrast / b.target)
    .slice(0, 10),
};
await mkdir(out.slice(0, out.lastIndexOf("/")), { recursive: true });
await writeFile(out, JSON.stringify({ ...summary, results }, null, 2) + "\n");
console.log(JSON.stringify({ ...summary, failuresList: failures }, null, 2));
