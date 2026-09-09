import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const p = await b.newPage({ viewport: { width, height } });
  await p.goto("https://morght.com/", { waitUntil: "networkidle" });
  await p.waitForTimeout(4500);
  const geometry = await p.locator(".c-home-circle").evaluate((e) => ({
    start: e.getBoundingClientRect().top + scrollY,
    height: e.offsetHeight,
    viewport: innerHeight,
  }));
  const samples = [];
  for (const [state, f] of [
    ["start", 0],
    ["mid", 0.5],
    ["end", 1],
    ["reverse", 0],
  ]) {
    const y = geometry.start + f * (geometry.height - height);
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.waitForTimeout(1600);
    const observed = await p.evaluate(() => ({
      scrollY,
      clip: getComputedStyle(document.querySelector('[x-ref="images"]')).width,
      image: getComputedStyle(document.querySelector('[x-ref="imagesInner"]')).width,
      ring: getComputedStyle(document.querySelector(".c-home-circle__text")).opacity,
    }));
    const path = `references/morght/${width}-circle-${state}.png`;
    await p.screenshot({ path });
    samples.push({ state, ...observed, path });
  }
  await writeFile(
    `references/morght/${width}-motion.json`,
    JSON.stringify({ geometry, samples }, null, 2),
  );
  console.log(width, geometry, samples);
  await p.close();
}
await b.close();
