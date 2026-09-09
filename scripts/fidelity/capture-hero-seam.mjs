import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const [role = "reference", origin = "https://white-desert.com/"] =
  process.argv.slice(2);
const out = `artifacts/hero-seam/${role}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => {
      const e = document.querySelector(".hero-banner_wrapper, .home-hero__wrapper");
      return e && getComputedStyle(e).transform !== "none";
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.querySelectorAll(".home-hero img, .hero-banner img")].map((i) => {
          i.loading = "eager";
          return i.decode().catch(() => {});
        }),
      );
      for (const v of document.querySelectorAll("video")) {
        v.pause();
        v.currentTime = 0;
      }
    });
    const frames = [];
    for (const f of [0.5, 0.8, 1, 1.1, 1.3, 1.5, 1.8]) {
      await page.evaluate((y) => window.scrollTo(0, y), height * f);
      await page.waitForTimeout(600);
      frames.push(
        await page.evaluate(
          (f) => ({
            f,
            scrollY: window.scrollY,
            layers: [
              ...document.querySelectorAll(
                ".home-hero__mist-stage, .home-hero__mist, .home-hero__mist-image, .home-hero__cloud, .home-hero__cloud img, .mist-transition, .mist-transition_inner, .mist-transition_image, .clouds-overlay_wrap, .clouds-overlay_wrap img",
              ),
            ].map((e) => {
              const s = getComputedStyle(e);
              return {
                cls: e.className,
                rect: e.getBoundingClientRect().toJSON(),
                src: e.currentSrc,
                styles: Object.fromEntries(
                  [
                    "position",
                    "zIndex",
                    "height",
                    "width",
                    "transform",
                    "transformOrigin",
                    "backgroundColor",
                    "objectFit",
                    "objectPosition",
                    "overflow",
                  ].map((k) => [k, s[k]]),
                ),
              };
            }),
          }),
          f,
        ),
      );
      await page.screenshot({ path: `${out}/${name}-${f}.png` });
    }
    await writeFile(`${out}/${name}.json`, JSON.stringify(frames, null, 2));
    console.log(`${role}: ${name} captured`);
    await page.close();
  }
} finally {
  await browser.close();
}
