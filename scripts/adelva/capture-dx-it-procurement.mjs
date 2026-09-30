/** Adapted from capture-management-operations.mjs. One owned BASE_URL, fixed
 * viewport/DPR, fonts+images decoded, no dev chrome. Original mocks never ship. */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const base = process.env.BASE_URL ?? "http://127.0.0.1:4328";
const out =
  process.argv[2] ?? "docs/reports/adelva-dx-it-procurement-2026-09-28/actual";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${base}/services/dx-it-procurement`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal {display:none!important;}" });
  await page.evaluate(async () => {
    const images = [...document.images].filter((i) => i.getClientRects().length > 0);
    for (const i of images) i.loading = "eager";
    await Promise.all(images.map((i) => i.decode().catch(() => {})));
  });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  const geometry = await page.locator("main").evaluate((main) => ({
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    column: main.querySelector("[data-column]").getBoundingClientRect().toJSON(),
    landmarks: [
      ...main.querySelectorAll(
        "h1,h2,[data-section],[data-row],[data-chapter],li[data-step]",
      ),
    ].map((el) => ({
      name:
        el.dataset.section ||
        el.dataset.chapter ||
        el.dataset.row ||
        el.dataset.step ||
        el.textContent,
      rect: el.getBoundingClientRect().toJSON(),
    })),
    images: [...main.querySelectorAll("img")]
      .filter((i) => i.getClientRects().length)
      .map((i) => ({
        src: i.currentSrc.replace(location.origin, ""),
        complete: i.complete,
        naturalWidth: i.naturalWidth,
      })),
  }));
  await page.addStyleTag({ content: "img, picture { visibility:hidden!important; }" });
  await page.screenshot({ path: `${out}/${name}-full-noimg.png`, fullPage: true });
  report.push({ name, width, height, ...geometry });
  await context.close();
  console.log(`${name}: full, images hidden, geometry`);
}
for (const [label, tip] of [
  ["01", 160],
  ["04", 755],
  ["end", 1262],
]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${base}/services/dx-it-procurement`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.addStyleTag({ content: "nextjs-portal {display:none!important;}" });
  await page.evaluate(async () => {
    const images = [...document.images].filter((i) => i.getClientRects().length);
    for (const i of images) i.loading = "eager";
    await Promise.all(images.map((i) => i.decode().catch(() => {})));
  });
  await page.evaluate((tip) => {
    const p = document.querySelector("[data-process]").getBoundingClientRect();
    scrollTo({
      top: p.top + scrollY + (tip * p.width) / 1536 - innerHeight * 0.6,
      behavior: "instant",
    });
  }, tip);
  await page.waitForTimeout(2300);
  // The three viewport captures are retained as Playwright goldens; only the
  // complete 04 section is an additional reference-comparison artifact.
  if (label === "04") {
    const full = await page.screenshot({ fullPage: true });
    await sharp(full)
      .extract({ left: 0, top: 2758, width: 1440, height: 1560 })
      .png()
      .toFile(`${out}/process-04-section.png`);
  }
  report.push({
    name: `process-${label}`,
    tip,
    states: await page
      .locator("li[data-step]")
      .evaluateAll((a) => a.map((n) => n.dataset.state)),
    actualTip: await page.locator("[data-process]").getAttribute("data-tip"),
  });
  await context.close();
  console.log(`process ${label}`);
}
await browser.close();
await writeFile(
  `${out}/capture.json`,
  JSON.stringify({ base, measured: new Date().toISOString(), report }, null, 2) + "\n",
);
