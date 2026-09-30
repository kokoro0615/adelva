/** Full-page captures of /challenges/general-managers in the mock's reference state
 * (spec §3): 01 with 品質 and システム定着 checked, 02 on 現象と原因, 人材 hovered at 1440.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4481 node scripts/adelva/capture-general-managers.mjs [outDir] [--widths=1440,390] [--state=reference|rest]
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4481";
const outDir =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? process.argv[2]
    : "docs/reports/adelva-general-managers-2026-09-30";
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
  await page.goto(`${base}/challenges/general-managers`, { waitUntil: "networkidle" });
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
    for (const id of ["quality", "system"])
      await page.locator(`input[name="issue"][value="${id}"]`).check({ force: true });
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  if (state === "reference" && width >= 1024) {
    // hover without scrolling the page: the label sits below the first screen
    await page.locator('input[name="issue"][value="people"]').evaluate((input) => {
      input
        .closest("label")
        ?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    await page.addStyleTag({
      content: `label:has(input[value="people"]) > span:nth-of-type(2){text-decoration-color:currentColor!important}label:has(input[value="people"]) > span:first-of-type{border-width:2px!important;box-shadow:0 0 0 5px rgb(241 239 234 / 16%)!important}`,
    });
  }
  if (state === "reference" && width < 1024)
    // the mock draws the tray in the page right after the issues (A2-mobile geometry)
    await page.addStyleTag({
      content:
        "[data-tray]{position:absolute!important;top:1762px!important;bottom:auto!important}",
    });
  await page.waitForTimeout(400);
  const path = `${outDir}/actual-${state}-${width}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(path);
  await page.close();
}
await browser.close();
