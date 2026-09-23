/**
 * Deterministic captures of /services/management-operations for the reference
 * comparison (docs/specs/adelva-management-operations-spec.md §14–15).
 *
 *   BASE_URL=http://127.0.0.1:4317 node scripts/adelva/capture-management-operations.mjs [out]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const out = process.argv[2] ?? "artifacts/adelva-management-operations/actual";
const route = "/services/management-operations";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const hideImages = "img, picture { visibility: hidden !important; }";
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const visible = [...document.images].filter(
      (image) =>
        image.getClientRects().length > 0 &&
        getComputedStyle(image).visibility !== "hidden",
    );
    await Promise.race([
      Promise.all(visible.map((image) => image.decode().catch(() => {}))),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  });
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
};

async function capture({
  name,
  width,
  height,
  motion = "reduce",
  fullPage = true,
  images = true,
  run,
}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: "networkidle" });
  if (!images) await page.addStyleTag({ content: hideImages });
  // Load every lazy image before a full-page capture.
  if (fullPage) {
    await page.evaluate(() => {
      for (const image of document.images)
        if (image.getClientRects().length > 0) image.loading = "eager";
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  }
  await settle(page);
  if (run) await run(page);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage, caret: "hide" });
  await context.close();
  console.log(name);
}

const which = new Set(process.argv.slice(3));
const want = (key) => which.size === 0 || which.has(key);

for (const [key, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
]) {
  if (want(key)) await capture({ name: `${key}-full`, width, height });
  if (want(`${key}-noimg`))
    await capture({ name: `${key}-full-noimg`, width, height, images: false });
}

/* Pinned process at progress 0 / 0.6 / 1.0 (1440×960 = keyframe viewport). */
if (want("process")) {
  for (const [label, progress] of [
    ["process-00", 0],
    ["process-06", 0.6],
    ["process-10", 1],
  ]) {
    await capture({
      name: label,
      width: 1440,
      height: 960,
      motion: "no-preference",
      fullPage: false,
      run: async (page) => {
        const y = await page.evaluate((p) => {
          const section = document.querySelector("[data-process]");
          const start = section.getBoundingClientRect().top + scrollY;
          return start + p * innerHeight * 5;
        }, progress);
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(1600);
      },
    });
  }
}
await browser.close();
