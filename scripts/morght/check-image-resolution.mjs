import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// This acceptance check must remain red until a genuinely adequate source ships.
const base = process.env.MORGHT_URL || "http://127.0.0.1:3002";
const out = "artifacts/adelva-about/image-quality";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });
    await page.goto(`${base}/about`);
    await page.locator('[data-ready="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(4200);
    for (const [state, progress] of [
      ["start", 0],
      ["end", 1],
    ]) {
      await page.evaluate((p) => {
        const stage = document.querySelector(".mg-circle-track");
        scrollTo(
          0,
          stage.getBoundingClientRect().top +
            scrollY +
            p * (stage.clientHeight - innerHeight),
        );
      }, progress);
      await page.waitForTimeout(400);
      const result = await page
        .locator(".mg-circle-landscape")
        .evaluate(async (img) => {
          await img.decode();
          const size = img.getBoundingClientRect().width;
          return {
            src: img.currentSrc,
            natural: img.naturalWidth,
            rendered: size,
            dpr: devicePixelRatio,
            required: Math.ceil(size * devicePixelRatio),
            scale: (size * devicePixelRatio) / img.naturalWidth,
            sufficient: img.naturalWidth >= Math.ceil(size * devicePixelRatio),
          };
        });
      await page.screenshot({ path: `${out}/${width}-${state}-dpr2.png` });
      results.push({ width, height, state, ...result });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${out}/resolution.json`, JSON.stringify(results, null, 2) + "\n");
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.sufficient)) process.exitCode = 1;
