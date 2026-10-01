/**
 * Reference-vs-implementation comparison for /services/management-operations
 * (B 台杉「降りてくる朝」).
 *
 *   BASE_URL=http://127.0.0.1:3417 node scripts/adelva/compare-management-operations.mjs [out-dir]
 *
 * The references are the adopted prototypes themselves, driven to the same
 * scroll position and state as the implementation: the desktop prototype's
 * `?static=1` page and `HQ.frame(y, t)` capture hook, the mobile prototype's
 * `__render(y, 0)` hook. Both rasters are measured by the same function: mean
 * absolute RGB difference (0–1) outside the header band, where the shared
 * production header intentionally replaces the prototypes' (spec §9).
 * Thresholds are the ones declared in docs/specs/adelva-management-operations-spec.md
 * §10 before implementation.
 *
 * The implementation runs with touch emulation so the pinned index does not
 * snap during programmatic scrolling (snap is for mouse and trackpad only).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3417";
const out = resolve(
  process.argv[2] ?? "artifacts/adelva-management-operations/fidelity",
);
const mocks = resolve("references/adelva/mockups");
const desktopProto = pathToFileURL(
  `${mocks}/management-operations-B-hq-2026-10-01/build/index.html`,
).href;
const mobileProto = pathToFileURL(
  `${mocks}/management-operations-B-hq-mobile-2026-10-01/build/index.html`,
).href;
const route = `${base}/services/management-operations`;
await mkdir(out, { recursive: true });

/** Mean absolute RGB difference (0–1) below `skipTop` rows, plus a diff image. */
async function compare(label, refPath, actPath, skipTop) {
  const ref = sharp(refPath).removeAlpha();
  const meta = await ref.metadata();
  const act = sharp(actPath)
    .removeAlpha()
    .resize(meta.width, meta.height, { fit: "fill" });
  const [a, b] = await Promise.all([ref.raw().toBuffer(), act.raw().toBuffer()]);
  const diff = Buffer.alloc(a.length);
  let sum = 0;
  let count = 0;
  const start = skipTop * meta.width * 3;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    diff[i] = Math.min(255, d * 4);
    if (i >= start) {
      sum += d;
      count++;
    }
  }
  const mae = sum / count / 255;
  await sharp(diff, { raw: { width: meta.width, height: meta.height, channels: 3 } })
    .png()
    .toFile(`${out}/${label}-diff.png`);
  const half = Math.round(meta.width / 2);
  const scaledHeight = Math.round((meta.height * half) / meta.width);
  const [ra, rb] = await Promise.all(
    [refPath, actPath].map((path) => sharp(path).resize(half, scaledHeight).toBuffer()),
  );
  await sharp({
    create: {
      width: half * 2 + 8,
      height: scaledHeight,
      channels: 3,
      background: "#ff0000",
    },
  })
    .composite([
      { input: ra, left: 0, top: 0 },
      { input: rb, left: half + 8, top: 0 },
    ])
    .png()
    .toFile(`${out}/${label}-side-by-side.png`);
  return {
    label,
    mae: +mae.toFixed(4),
    width: meta.width,
    height: meta.height,
    skipTop,
  };
}

const settle = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    for (const image of document.images) image.loading = "eager";
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
  });

const browser = await chromium.launch();
const results = [];
const hideDevChrome = "nextjs-portal{display:none!important}";

/* ------------------------------------------------ desktop, reduced motion, full page */
{
  const refPage = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 } })
  ).newPage();
  await refPage.goto(`${desktopProto}?static=1`);
  await refPage.waitForFunction(() => window.HQ?.ready, null, { timeout: 60000 });
  await refPage.screenshot({
    path: `${out}/desktop-reduced-ref.png`,
    clip: { x: 0, y: 0, width: 1440, height: 7682 },
    fullPage: true,
  });
  const actPage = await (
    await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    })
  ).newPage();
  await actPage.goto(route, { waitUntil: "networkidle" });
  await actPage.addStyleTag({ content: hideDevChrome });
  await actPage.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await settle(actPage);
  await actPage.waitForTimeout(600);
  await actPage.screenshot({
    path: `${out}/desktop-reduced-act.png`,
    clip: { x: 0, y: 0, width: 1440, height: 7682 },
    fullPage: true,
  });
  results.push({
    ...(await compare(
      "desktop-reduced",
      `${out}/desktop-reduced-ref.png`,
      `${out}/desktop-reduced-act.png`,
      96,
    )),
    threshold: 0.03,
  });
}

/* ------------------------------------------------ desktop, motion states */
{
  // pinStart 896 and pinLength 3060 at 1440×900 (hq.js); the stops of the
  // pinned index, the descent, pair 2, step 3 and the audience routes.
  const states = [
    ["hero", 0],
    ["index-01", 897],
    ["index-02", 1916],
    ["index-03", 2936],
    ["index-04", 3956],
    ["descent", 4570],
    ["pair-2", 5220],
    ["step-3", 6638],
    ["audience", 8309],
  ];
  const refPage = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 } })
  ).newPage();
  await refPage.goto(`${desktopProto}?capture=1`);
  await refPage.waitForFunction(() => window.HQ?.ready, null, { timeout: 60000 });
  const actPage = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true })
  ).newPage();
  await actPage.goto(route, { waitUntil: "networkidle" });
  await actPage.addStyleTag({ content: hideDevChrome });
  await actPage.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await settle(actPage);
  await actPage.waitForTimeout(2500);
  let t = 3;
  for (const [name, y] of states) {
    await refPage.evaluate(
      ([y, t]) => {
        window.HQ.frame(y, t);
        window.HQ.frame(y, t + 3);
      },
      [y, t],
    );
    t += 10;
    await refPage.screenshot({ path: `${out}/desktop-${name}-ref.png` });
    await actPage.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await actPage.waitForTimeout(2200);
    await actPage.screenshot({ path: `${out}/desktop-${name}-act.png` });
    results.push({
      ...(await compare(
        `desktop-${name}`,
        `${out}/desktop-${name}-ref.png`,
        `${out}/desktop-${name}-act.png`,
        96,
      )),
      threshold: 0.04,
    });
  }
}

/* ------------------------------------------------ mobile, motion states */
{
  const refPage = await (
    await browser.newContext({ viewport: { width: 390, height: 844 } })
  ).newPage();
  await refPage.goto(`${mobileProto}?capture`);
  await refPage.waitForFunction(() => document.body.dataset.ready === "1", null, {
    timeout: 60000,
  });
  const actPage = await (
    await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
  ).newPage();
  await actPage.goto(route, { waitUntil: "networkidle" });
  await actPage.addStyleTag({ content: hideDevChrome });
  await actPage.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await actPage.waitForTimeout(3500);
  const marks = await refPage.evaluate(() => window.__marks);
  const states = [
    ["hero", 0],
    ["crowns", 900],
    ["station-1", marks.st[0][0] + 100],
    ["station-2", marks.st[1][0] + 100],
    ["station-3", marks.st[2][0] + 100],
    ["station-4", marks.st[3][0] + 100],
    ["descent", Math.round((marks.pullEnd + marks.descentEnd) / 2)],
    ["full", marks.descentEnd + 100],
    ["pair-1", marks.forks[0] + 60],
    ["pair-2", Math.round(marks.forks[1])],
    ["pair-3", marks.forks[2]],
    ["process", Math.round(marks.steps[2])],
    ["audience", Math.round(marks.aud)],
    ["contact", Math.round(marks.contStart + 300)],
  ];
  for (const [name, y] of states) {
    await refPage.evaluate((y) => {
      window.scrollTo(0, y);
      window.__setAnimTime(5000);
      window.__render(y, 0);
    }, y);
    await refPage.screenshot({ path: `${out}/mobile-${name}-ref.png` });
    await actPage.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await actPage.waitForTimeout(500);
    await actPage.screenshot({ path: `${out}/mobile-${name}-act.png` });
    results.push({
      ...(await compare(
        `mobile-${name}`,
        `${out}/mobile-${name}-ref.png`,
        `${out}/mobile-${name}-act.png`,
        72,
      )),
      threshold: 0.04,
    });
  }
}

await browser.close();
for (const result of results) result.pass = result.mae <= result.threshold;
await writeFile(`${out}/metrics.json`, `${JSON.stringify(results, null, 2)}\n`);
for (const result of results)
  console.log(
    `${result.pass ? "PASS" : "FAIL"} ${result.label.padEnd(22)} MAE ${result.mae} (≤ ${result.threshold})`,
  );
process.exitCode = results.every((result) => result.pass) ? 0 : 1;
