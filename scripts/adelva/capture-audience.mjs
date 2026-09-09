import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3002";
const out = "artifacts/adelva-audience-v4";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const route of ["owner", "general-managers"]) {
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await page.goto(`${base}/challenges/${route}`);
    await page.locator("[data-audience-v3]").waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map(async (image) => {
          image.loading = "eager";
          await image.decode().catch(() => {});
        }),
      );
    });
    await page.addStyleTag({ content: "nextjs-portal {display:none}" });
    await page.screenshot({ path: `${out}/${route}-${width}.png`, fullPage: true });
    results.push({
      route,
      width,
      height,
      ...(await page.evaluate(() => ({
        documentHeight: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        sections: [...document.querySelectorAll("[data-section]")].map((s) => ({
          name: s.dataset.section,
          y: s.getBoundingClientRect().y,
          height: s.getBoundingClientRect().height,
        })),
      }))),
    });
    await page.close();
  }
}
await browser.close();
await writeFile(`${out}/geometry.json`, JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results));
