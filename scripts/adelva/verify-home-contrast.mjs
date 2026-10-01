// HOME (A2r3) text contrast over the photographs, per reading state (author: Opus 5.5).
// axe cannot see the WebGL and photographic backgrounds, so for each state this draws the page at a
// scene progress in capture mode, screenshots it with and without text, and measures every visible
// text run: light text against the light end (90th percentile) of its background, dark text against
// the dark end (10th percentile), with the text colour composited by its alpha (the method of
// home-r3-mobile-2026-10-02/tools/verify.mjs).
// Usage: node scripts/adelva/verify-home-contrast.mjs <baseURL> <width> <height> <out.json> scene:p ...
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

import { chromium } from "@playwright/test";

const sharp = createRequire(import.meta.url)("sharp");
const [base, w, h, out, ...marks] = process.argv.slice(2);
const W = Number(w);
const H = Number(h);
const browser = await chromium.launch({
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.emulateMedia({ reducedMotion: "no-preference" });
await page.goto(`${base}/?capture`, { waitUntil: "load" });
await page.waitForTimeout(3500);
await page.waitForFunction(() => Boolean(window.__home));
await page.evaluate(async () => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  await window.__home.ready;
  window.scrollTo(0, 0);
});

const lum = (r, g, b) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const report = [];
for (const mk of marks) {
  const [scene, ps] = mk.split(":");
  const p = Number(ps);
  const y = await page.evaluate(
    async ([name, progress]) => {
      const el = document.querySelector(`[data-scene="${name}"]`);
      const top = el.getBoundingClientRect().top + window.scrollY;
      const target = Math.round(
        top + progress * (el.offsetHeight - window.innerHeight),
      );
      for (let i = 0; i < 80; i++) {
        if (
          Math.abs(window.scrollY - target) < 1 &&
          !document.documentElement.classList.contains("lenis-scrolling")
        )
          break;
        window.scrollTo(0, target);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.__home.frame(target, 20);
      return target;
    },
    [scene, p],
  );
  await page.waitForTimeout(700);
  await page.evaluate((t) => window.__home.frame(t, 20), y);
  // visible text runs: elements with their own text (character-split headings are measured per line)
  const runs = await page.evaluate(() => {
    const out = [];
    const effOpacity = (el) => {
      let o = 1;
      for (let e = el; e && e !== document.documentElement; e = e.parentElement)
        o *= Number(getComputedStyle(e).opacity);
      return o;
    };
    const roots = [
      document.querySelector("main"),
      document.querySelector('[data-fidelity-landmark="header-nav"]'),
    ];
    for (const root of roots) {
      for (const el of root.querySelectorAll("*")) {
        // the opening quotation mark is pure decoration (1.4.3 exempts it); the giant ADELVA is the brand mark
        if (
          el.closest("[class*=srOnly]") ||
          el.closest("[data-giant]") ||
          el.closest("[data-quote-mark]")
        )
          continue;
        const own = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim(),
        );
        if (!own) continue;
        if (el.hasAttribute("data-ch")) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== "visible" || cs.display === "none") continue;
        // the element's own text only (not its dots, rules or arrows)
        const range = document.createRange();
        let r = null;
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          range.selectNodeContents(n);
          const b = range.getBoundingClientRect();
          r = r
            ? {
                left: Math.min(r.left, b.left),
                top: Math.min(r.top, b.top),
                right: Math.max(r.right, b.right),
                bottom: Math.max(r.bottom, b.bottom),
              }
            : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
        }
        if (!r) continue;
        r.width = r.right - r.left;
        r.height = r.bottom - r.top;
        if (
          r.width < 2 ||
          r.height < 2 ||
          r.bottom < 0 ||
          r.top > innerHeight ||
          r.right < 0 ||
          r.left > innerWidth
        )
          continue;
        const o = effOpacity(el);
        if (o < 0.9) continue;
        out.push({
          text: el.textContent.trim().slice(0, 24),
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          color: cs.color,
          size: parseFloat(cs.fontSize),
          weight: Number(cs.fontWeight),
          o,
        });
      }
      // character-split lines: one run per line, coloured like its characters
      for (const line of root.querySelectorAll(
        "[data-statement] [aria-hidden] > span, [data-founder-lead] [aria-hidden] > span",
      )) {
        const ch = line.querySelector("[data-ch]");
        if (!ch) continue;
        const o = effOpacity(ch);
        const r = line.getBoundingClientRect();
        if (o < 0.9 || r.width < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        const cs = getComputedStyle(ch);
        out.push({
          text: line.textContent.trim().slice(0, 24),
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          color: cs.color,
          size: parseFloat(cs.fontSize),
          weight: Number(cs.fontWeight),
          o,
        });
      }
    }
    return out;
  });
  const withText = await page.screenshot();
  await page.addStyleTag({
    content:
      "main *, header *{color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important} .tagsHidden{}",
  });
  await page.evaluate(() => {
    document
      .querySelectorAll("main svg path, [data-tag]")
      .forEach((e) => (e.dataset.verifyHidden = "1"));
  });
  // redraw and let backdrop-filtered layers (the glass bar, the final link) re-composite without text
  await page.evaluate((t) => window.__home.frame(t, 20), y);
  await page.waitForTimeout(500);
  const bare = await page.screenshot();
  await page.evaluate(() =>
    document
      .querySelectorAll("style")
      .forEach((s) => s.textContent.includes(".tagsHidden") && s.remove()),
  );
  const { data } = await sharp(bare)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const run of runs) {
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(
      run.color,
    );
    if (!m) continue;
    const [tr, tg, tb, ta = 1] = m
      .slice(1)
      .map((v) => (v === undefined ? 1 : Number(v)));
    const lums = [];
    const x0 = Math.max(0, Math.floor(run.x));
    const y0 = Math.max(0, Math.floor(run.y));
    const x1 = Math.min(W, Math.ceil(run.x + run.w));
    const y1 = Math.min(H, Math.ceil(run.y + run.h));
    const px = [];
    for (let yy = y0; yy < y1; yy += 2)
      for (let xx = x0; xx < x1; xx += 2) {
        const i = (yy * W + xx) * 3;
        px.push([data[i], data[i + 1], data[i + 2]]);
        lums.push(lum(data[i], data[i + 1], data[i + 2]));
      }
    if (!lums.length) continue;
    const order = lums.map((l, i) => [l, i]).sort((a, b) => a[0] - b[0]);
    const textL = lum(tr, tg, tb);
    const light = textL > order[order.length >> 1][0];
    const pick =
      order[Math.min(order.length - 1, Math.floor(order.length * (light ? 0.9 : 0.1)))];
    const bg = px[pick[1]];
    const alpha = ta * run.o;
    const comp = [0, 1, 2].map((k) => alpha * [tr, tg, tb][k] + (1 - alpha) * bg[k]);
    const cr = ratio(lum(...comp), lum(...bg));
    const large = run.size >= 24 || (run.size >= 18.66 && run.weight >= 700);
    const need = large ? 3 : 4.5;
    rows.push({
      text: run.text,
      size: run.size,
      cr: +cr.toFixed(2),
      need,
      pass: cr >= need,
    });
  }
  const fails = rows.filter((r) => !r.pass);
  report.push({
    mark: mk,
    runs: rows.length,
    min: rows.length ? Math.min(...rows.map((r) => r.cr)) : null,
    fails,
  });
  console.log(
    mk,
    rows.length,
    "runs; min",
    report.at(-1).min,
    fails.length ? `FAIL ${JSON.stringify(fails)}` : "ok",
  );
  void withText;
}
writeFileSync(out, JSON.stringify({ viewport: [W, H], report, errors }, null, 1));
await browser.close();
