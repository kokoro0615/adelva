import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
const out = "artifacts/adelva-audience-v4";
await mkdir(out, { recursive: true });
const base = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:3002";
const browser = await chromium.launch();
const report = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  let reference;
  for (const route of ["", "challenges/owner", "challenges/general-managers"]) {
    const name = route.split("/").pop() || "home";
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await page.goto(`${base}/${route}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: "nextjs-portal,.how-it-works__trigger{display:none}",
    });
    const header = await page
      .locator('header[data-fidelity-landmark="header-nav"]')
      .evaluate((e) => ({
        height: e.getBoundingClientRect().height,
        font: getComputedStyle(e).fontFamily,
        links: [...e.querySelectorAll("a,button")]
          .filter((x) => x.getBoundingClientRect().height > 0)
          .map((x) => ({
            text: x.textContent.trim(),
            x: x.getBoundingClientRect().x,
            width: x.getBoundingClientRect().width,
            font: getComputedStyle(x).fontSize,
          })),
      }));
    const footer = page.locator("[data-home-footer]");
    await footer.evaluate(async (e) => {
      await Promise.all(
        [...e.querySelectorAll("img")].map(async (i) => {
          i.loading = "eager";
          await i.decode();
        }),
      );
      e.scrollIntoView();
    });
    const geometry = await footer.evaluate((e) => ({
      width: e.getBoundingClientRect().width,
      height: e.getBoundingClientRect().height,
      text: e.textContent,
      children: [...e.querySelectorAll('h2,h3,nav,[role="img"]')].map((x) => ({
        x: x.getBoundingClientRect().x,
        y: x.getBoundingClientRect().y - e.getBoundingClientRect().y,
        width: x.getBoundingClientRect().width,
        height: x.getBoundingClientRect().height,
        font: getComputedStyle(x).fontFamily,
        size: getComputedStyle(x).fontSize,
      })),
    }));
    // Match the footer's physical pixel origin, without rescaling. Exclude the
    // fractional final raster row; HOME's separate floating trigger is not footer content.
    const clip = await footer.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const y = r.top + scrollY;
      e.style.transform = `translateY(${Math.ceil(y) - y}px)`;
      return {
        x: 0,
        y: Math.ceil(y),
        width: Math.floor(r.width),
        height: Math.floor(r.height) - 1,
      };
    });
    const screenshot = await page.screenshot({
      path: `${out}/${name}-${width}-footer.png`,
      clip,
      fullPage: true,
    });
    const raster = await sharp(screenshot)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (!route) reference = { header, geometry, raster };
    else {
      const headerMatch = JSON.stringify(header) === JSON.stringify(reference.header);
      const footerMatch =
        geometry.text === reference.geometry.text &&
        Math.abs(geometry.height - reference.geometry.height) <= 1 &&
        geometry.children.every((c, i) => {
          const r = reference.geometry.children[i];
          return (
            c.font === r.font &&
            c.size === r.size &&
            ["x", "y", "width", "height"].every((k) => Math.abs(c[k] - r[k]) <= 1)
          );
        });
      let mae = null;
      if (raster.data.length === reference.raster.data.length) {
        let sum = 0;
        for (let i = 0; i < raster.data.length; i++)
          sum += Math.abs(raster.data[i] - reference.raster.data[i]);
        mae = sum / raster.data.length / 255;
      }
      report.push({
        route,
        width,
        headerMatch,
        footerMatch,
        footerMeanPixelDifference: mae,
        pass: headerMatch && footerMatch && mae !== null && mae <= 0.01,
      });
    }
    await page.close();
  }
}
await browser.close();
await writeFile(
  `${out}/home-shell-comparison.json`,
  JSON.stringify(
    {
      reference:
        "Current HOME SiteHeader/HomeFooter, matching viewport, reduced motion and fully loaded fonts/images",
      tolerances: {
        header: "identical visible control geometry and font values",
        footerGeometryPixels: 1,
        footerPixelMAE: 0.01,
      },
      report,
    },
    null,
    2,
  ) + "\n",
);
console.log(report);
process.exitCode = report.every((x) => x.pass) ? 0 : 1;
