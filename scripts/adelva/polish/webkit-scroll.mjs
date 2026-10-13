// Polish harness (2026-10-13): Safari-engine check on an iPhone 13 profile.
// Scrolls the page in small programmatic steps (WebKit has no CDP touch input),
// records requestAnimationFrame pacing, layout shifts are not available in
// WebKit, so it reports frame pacing, console errors and a screenshot per stop.
// usage (from the repo root): node scripts/adelva/polish/webkit-scroll.mjs <baseURL> <route> <outDir> [stops=8]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { webkit, devices } = req("@playwright/test");

const [base, route, outDir, stops = "8"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ ...devices["iPhone 13"], reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));
await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(3000);
const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const frames = await page.evaluate(async (H) => {
  const out = [];
  let last = performance.now();
  const step = Math.max(6, H / 900);
  await new Promise((resolve) => {
    const tick = (t) => {
      out.push(t - last);
      last = t;
      if (scrollY >= H - 1) return resolve();
      window.scrollBy(0, step);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return out;
}, H);
frames.sort((a, b) => a - b);
const q = (p) => Math.round(frames[Math.min(frames.length - 1, Math.floor(p * frames.length))] ?? 0);
for (let i = 0; i <= +stops; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), (H * i) / +stops);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/${String(i).padStart(2, "0")}.jpg`, type: "jpeg", quality: 80 });
}
const res = { route, frames: frames.length, p50: q(0.5), p90: q(0.9), p99: q(0.99), over50: frames.filter((v) => v > 50).length, errors };
fs.writeFileSync(`${outDir}/webkit.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await browser.close();
