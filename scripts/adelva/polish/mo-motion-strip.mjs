// /services/management-operations narrow camera: record the screen while a
// slow touch drag crosses a signature moment (CDP screencast), then lay the
// frames out as a strip to check for steps, jumps and flashes by eye.
// usage: node scripts/adelva/polish/mo-motion-strip.mjs <baseURL> <outPrefix> <markExpr> [spanPx=500] [width=390] [height=844]
//   markExpr: JS evaluated against window.__mo.marks as M, e.g. "M.forks[1]" or "M.st[1][1]"
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const pw = req("@playwright/test");
const sharp = req("sharp");

const [base, outPrefix, markExpr, span = "500", w = "390", h = "844"] =
  process.argv.slice(2);
const browser = await pw.chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
await page.goto(`${base}/services/management-operations`, { waitUntil: "load" });
await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
await page.waitForTimeout(2500);
const mark = await page.evaluate((expr) => {
  const M = window.__mo.marks;
  return Math.round(Function("M", `return (${expr});`)(M));
}, markExpr);
const start = Math.max(0, mark - +span / 2);
await page.evaluate((y) => scrollTo(0, y), start);
await page
  .waitForFunction(() => window.__mo.idle(), null, { timeout: 15000 })
  .catch(() => {});
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data, y: 0 });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 70,
  everyNthFrame: 1,
});
// one slow drag of `span` px over ~1.6 s, finger lifted without fling
const x = +w / 2;
const y0 = +h * 0.8;
const steps = 48;
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x, y: y0 }],
});
for (let s = 1; s <= steps; s++) {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y0 - (+span * s) / steps }],
  });
  await page.waitForTimeout(33);
}
await page.waitForTimeout(120);
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await page.waitForTimeout(700);
await cdp.send("Page.stopScreencast");
const endY = await page.evaluate(() => scrollY);
await browser.close();
const pick = 16;
const chosen =
  frames.length <= pick
    ? frames
    : Array.from(
        { length: pick },
        (_, i) => frames[Math.round((i * (frames.length - 1)) / (pick - 1))],
      );
const TW = 180,
  TH = Math.round((TW * +h) / +w);
const layers = [];
for (let i = 0; i < chosen.length; i++) {
  const img = await sharp(Buffer.from(chosen[i].data, "base64"))
    .resize(TW, TH, { fit: "fill" })
    .jpeg()
    .toBuffer();
  layers.push({
    input: img,
    left: (i % 8) * (TW + 4),
    top: Math.floor(i / 8) * (TH + 4),
  });
}
const rows = Math.ceil(chosen.length / 8);
await sharp({
  create: {
    width: 8 * (TW + 4),
    height: rows * (TH + 4),
    channels: 3,
    background: "#444",
  },
})
  .composite(layers)
  .jpeg({ quality: 80 })
  .toFile(`${outPrefix}.jpg`);
fs.writeFileSync(
  `${outPrefix}.json`,
  JSON.stringify({
    mark,
    start,
    endY,
    frames: frames.length,
    intervals: frames.slice(1).map((f, i) => Math.round((f.t - frames[i].t) * 1000)),
  }),
);
console.log(JSON.stringify({ mark, start, endY, frames: frames.length }));
