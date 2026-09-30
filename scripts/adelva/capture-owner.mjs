/** Full-page captures of /challenges/owner in the mock's reference state (spec §3):
 * 01 on GM不在 (02 実行責任者, 03 row 3 follow).
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4491 node scripts/adelva/capture-owner.mjs [outDir] [--widths=1440,390] [--state=reference|rest]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4491";
const outDir =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? process.argv[2]
    : "docs/reports/adelva-owner-2026-09-30";
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const widths = arg("widths", "1440,390").split(",").map(Number);
const heightOf = (w) =>
  Number(arg(`h${w}`, 0)) ||
  (w >= 1024
    ? w === 1024
      ? 768
      : w >= 1920
        ? 1080
        : 900
    : w >= 600
      ? 1024
      : w <= 360
        ? 780
        : 844);
const state = arg("state", "reference");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
for (const width of widths) {
  const height = heightOf(width);
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await page.goto(`${base}/challenges/owner`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) i.loading = "eager";
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) => i.decode().catch(() => {})),
    );
  });
  if (state === "reference") {
    await page.locator('input[name="phase"][value="gm"]').check({ force: true });
    await page.waitForTimeout(900);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  const path = `${outDir}/actual-${state}-${width}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(path);
  await page.close();
}
await browser.close();
