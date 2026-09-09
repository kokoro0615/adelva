import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import sharp from "sharp";
const directory = "references/adelva/about-refresh-2026-09-09";
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: "reduce" });
const results = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(`${process.env.MORGHT_URL || "http://127.0.0.1:3014"}/about`);
  await page.waitForSelector(
    '[data-morght-version="2026-09-09-adelva-v3"][data-ready=true]',
  );
  await page.addStyleTag({ content: "nextjs-portal {display:none !important}" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => {
        i.loading = "eager";
        return i.decode().catch(() => {});
      }),
    );
  });
  await page.screenshot({ path: `${directory}/actual-${width}-hero.png` });
  for (const [name, selector] of [
    ["purpose", "#role"],
    ["signature", ".mg-purpose-signature"],
    ["circle", ".mg-circle-track"],
    ["company", "#mg-company-title"],
    ["footer", "[data-home-footer]"],
  ]) {
    await page
      .locator(selector)
      .evaluate((e) =>
        window.scrollTo(
          0,
          e.getBoundingClientRect().top +
            scrollY -
            (e.id === "mg-company-title" ? 0 : 110),
        ),
      );
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${directory}/actual-${width}-${name}.png` });
  }
  const result = await page.evaluate(() => {
    const r = (e) => {
      const b = e.getBoundingClientRect();
      return { x: b.x, width: b.width };
    };
    return {
      width: innerWidth,
      heading: r(document.querySelector(".mg-company-info h2")),
      dl: r(document.querySelector(".mg-company-info dl")),
      hero: r(document.querySelector(".mg-hero-heading")),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  const reference = JSON.parse(
    await fs.readFile(`${directory}/company-reference.json`, "utf8"),
  ).find((x) => x.viewport[0] === width);
  result.referenceDeltas = {
    headingX: result.heading.x - reference.heading.x,
    dlX: result.dl.x - reference.dl.x,
    dlWidth: result.dl.width - reference.dl.width,
  };
  result.pass =
    Object.values(result.referenceDeltas).every((x) => Math.abs(x) <= 2) &&
    Math.abs(result.hero.x + result.hero.width / 2 - width / 2) <= 1 &&
    !result.overflow;
  const actual = `${directory}/actual-${width}-company.png`;
  const refPixels = await sharp(`${directory}/company-reference-${width}.png`)
    .removeAlpha()
    .raw()
    .toBuffer();
  const actualPixels = await sharp(actual).removeAlpha().raw().toBuffer();
  const overlay = Buffer.alloc(refPixels.length),
    difference = Buffer.alloc(refPixels.length);
  for (let i = 0; i < refPixels.length; i++) {
    overlay[i] = Math.round((refPixels[i] + actualPixels[i]) / 2);
    difference[i] = Math.min(255, Math.abs(refPixels[i] - actualPixels[i]) * 3);
  }
  for (const [name, pixels] of [
    ["overlay", overlay],
    ["difference", difference],
  ])
    await sharp(pixels, { raw: { width, height, channels: 3 } })
      .png()
      .toFile(`${directory}/company-${name}-${width}.png`);
  results.push(result);
}
await fs.writeFile(
  `${directory}/fidelity.json`,
  JSON.stringify(results, null, 2) + "\n",
);
await browser.close();
console.log(JSON.stringify(results, null, 2));
if (results.some((x) => !x.pass)) process.exitCode = 1;
