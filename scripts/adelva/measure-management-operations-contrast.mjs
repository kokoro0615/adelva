/**
 * Text contrast of /services/management-operations at its reading states.
 *
 *   BASE_URL=http://127.0.0.1:3417 node scripts/adelva/measure-management-operations-contrast.mjs [out.json]
 *
 * Method of the adopted prototypes' own verification (B-hq-mobile
 * `build/verify.mjs`): each state is captured twice, as is and with all text
 * made transparent (text shadows and text pools stay, as they are part of the
 * design). For every visible line box of every text node the background is the
 * 90th percentile of relative luminance inside the box; the text colour is its
 * computed colour composited with its alpha and its ancestors' opacity.
 * WCAG 2.2 AA: 4.5:1, or 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold).
 * The shared header is outside the scope (unchanged component); lines passing
 * under it are skipped.
 *
 * Desktop states run with touch emulation so the pinned index does not snap
 * while the script scrolls programmatically.
 */
import { writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3417";
const out = process.argv[2];
const route = `${base}/services/management-operations`;
const DPR = 2;
/** ONLY=desktop or ONLY=mobile limits the run to one regime. */
const only = process.env.ONLY;

const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

async function visibleLines(page, headerBottom) {
  return page.evaluate((headerBottom) => {
    const lines = [];
    const W = innerWidth;
    const H = innerHeight;
    const root = document.querySelector("[data-mo-root]");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const opacityOf = (el) => {
      let o = 1;
      for (let e = el; e && e !== document.documentElement; e = e.parentElement)
        o *= Number(getComputedStyle(e).opacity);
      return o;
    };
    const clipped = (el) => {
      for (let e = el; e && e !== root; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (
          cs.clipPath !== "none" ||
          cs.display === "none" ||
          cs.visibility === "hidden"
        )
          return true;
      }
      return false;
    };
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (!text) continue;
      const el = node.parentElement;
      if (clipped(el)) continue;
      const cs = getComputedStyle(el);
      const opacity = opacityOf(el);
      if (opacity < 0.05) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const box of range.getClientRects()) {
        if (box.width < 2 || box.height < 2) continue;
        if (box.top < headerBottom || box.bottom > H || box.left < 0 || box.right > W)
          continue;
        const m = cs.color.match(/[\d.]+/g).map(Number);
        lines.push({
          text: text.slice(0, 24),
          x: box.left,
          y: box.top,
          w: box.width,
          h: box.height,
          rgb: m.slice(0, 3),
          a: (m[3] ?? 1) * opacity,
          size: parseFloat(cs.fontSize),
          weight: Number(cs.fontWeight),
        });
      }
    }
    return lines;
  }, headerBottom);
}

async function measure(page, label, headerBottom) {
  const lines = await visibleLines(page, headerBottom);
  await page.addStyleTag({
    content:
      "[data-mo-root] *{-webkit-text-fill-color:transparent!important;transition:none!important}",
  });
  const bg = await page.screenshot();
  await page.evaluate(() =>
    document
      .querySelectorAll("style")
      .forEach(
        (s) => s.textContent.includes("text-fill-color:transparent") && s.remove(),
      ),
  );
  const { data, info } = await sharp(bg)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const results = [];
  for (const line of lines) {
    const x0 = Math.max(0, Math.floor(line.x * DPR));
    const x1 = Math.min(info.width, Math.ceil((line.x + line.w) * DPR));
    const y0 = Math.max(0, Math.floor(line.y * DPR));
    const y1 = Math.min(info.height, Math.ceil((line.y + line.h) * DPR));
    const px = [];
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * info.width + x) * 3;
        px.push([
          lum(data[i], data[i + 1], data[i + 2]),
          data[i],
          data[i + 1],
          data[i + 2],
        ]);
      }
    if (!px.length) continue;
    px.sort((a, b) => a[0] - b[0]);
    const p90 = px[Math.floor(px.length * 0.9)];
    const color = line.rgb.map((c, k) => c * line.a + p90[k + 1] * (1 - line.a));
    const lt = lum(...color);
    const lb = p90[0];
    const ratio = (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
    const large = line.size >= 24 || (line.size >= 18.66 && line.weight >= 700);
    const need = large ? 3 : 4.5;
    results.push({
      state: label,
      text: line.text,
      size: line.size,
      ratio: +ratio.toFixed(2),
      need,
      pass: ratio >= need,
    });
  }
  return results;
}

const browser = await chromium.launch();
const report = [];

for (const [width, height] of only === "mobile"
  ? []
  : [
      [1440, 900],
      [1280, 800],
      [1024, 768],
      [1920, 1080],
    ]) {
  const page = await (
    await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: DPR,
      hasTouch: true,
    })
  ).newPage();
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = "eager";
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
  });
  await page.waitForTimeout(2500);
  const M = await page.evaluate(() => window.__mo.marks());
  const at = (stageY) => Math.round(stageY + M.pinLength + M.trackTop - M.vh * 0.52);
  const states = [
    ["hero", 0],
    ...[0, 1, 2, 3].map((i) => [
      `index ${i + 1}`,
      Math.round(M.pinStart + (M.pinLength * i) / 3) + 1,
    ]),
    ...M.forks.map((y, i) => [`pair ${i + 1}`, at(y)]),
    ...M.steps.map((y, i) => [`step ${i + 1}`, at(y) + 4]),
    ["audience", at(M.audience + 200)],
    ["contact", 999999],
  ];
  const lines = [];
  for (const [label, y] of states) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(1900);
    lines.push(...(await measure(page, label, 68)));
  }
  report.push({ viewport: `${width}x${height}`, lines });
  await page.context().close();
}

for (const [width, height] of only === "desktop"
  ? []
  : [
      [390, 844],
      [375, 812],
      [360, 740],
      [430, 932],
      [768, 1024],
    ]) {
  const page = await (
    await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: DPR,
      isMobile: true,
      hasTouch: true,
    })
  ).newPage();
  await page.goto(route, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.waitForTimeout(3500);
  const M = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mo.marks)));
  const states = [
    ["hero", 0],
    ...M.st.map(([a, b], i) => [`station ${i + 1}`, Math.round((a + b) / 2)]),
    ["full view", Math.round(M.descentEnd)],
    ...M.forks.map((y, i) => [`fork ${i + 1}`, Math.round(y)]),
    ...M.steps.map((y, i) => [`step ${i + 1}`, Math.round(y)]),
    ["process top", Math.round(M.procStart + height * 0.25)],
    ["process link", Math.round(M.procEnd)],
    ["audience", Math.round(M.aud)],
    ["contact", Math.round(M.contStart + height * 0.3)],
    ["contact end", Math.round(M.end - 260)],
  ];
  const lines = [];
  for (const [label, y] of states) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(450);
    lines.push(...(await measure(page, label, 72)));
  }
  report.push({ viewport: `${width}x${height}`, lines });
  await page.context().close();
}
await browser.close();

const summary = report.map(({ viewport, lines }) => ({
  viewport,
  lines: lines.length,
  fails: lines.filter((line) => !line.pass).length,
  min: Math.min(...lines.map((line) => line.ratio)),
  failList: lines.filter((line) => !line.pass),
}));
if (out) await writeFile(out, `${JSON.stringify({ summary, report }, null, 2)}\n`);
for (const row of summary) {
  console.log(
    `${row.viewport.padEnd(10)} lines ${row.lines} fails ${row.fails} min ${row.min}`,
  );
  for (const fail of row.failList.slice(0, 12))
    console.log(
      `   ${fail.state} | ${fail.text} | ${fail.size}px ${fail.ratio} < ${fail.need}`,
    );
}
process.exitCode = summary.every((row) => row.fails === 0) ? 0 : 1;
