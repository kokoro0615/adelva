/**
 * Deterministic captures of /approach for the reference comparison
 * (docs/specs/adelva-approach-spec.md §12). Reduced motion renders the
 * finished static descent, which is the state both adopted mocks show.
 *
 *   BASE_URL=http://127.0.0.1:4318 node scripts/adelva/capture-approach.mjs [out] [only]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4318";
const out = process.argv[2] ?? "artifacts/adelva-approach/actual";
const only = process.argv[3];
const route = "/approach";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const visible = [...document.images].filter(
      (image) => image.getClientRects().length > 0,
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
  scale = 1,
  run,
}) {
  if (only && !name.startsWith(only)) return;
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();
  await page.goto(base + route, { waitUntil: "networkidle" });
  if (fullPage) {
    await page.evaluate(() => {
      for (const image of document.images) image.loading = "eager";
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  }
  await settle(page);
  if (run) await run(page);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage, caret: "hide" });
  await context.close();
  console.log(`${out}/${name}.png`);
}

await capture({ name: "desktop-full", width: 1440, height: 900 });
await capture({ name: "desktop-viewport", width: 1440, height: 900, fullPage: false });
await capture({ name: "tablet-full", width: 768, height: 1024 });
await capture({ name: "mobile-full", width: 390, height: 844 });
await capture({ name: "mobile-viewport", width: 390, height: 844, fullPage: false });
await browser.close();
