// Research: touch-scroll a page on an emulated phone and save a screenshot
// after each step, then a contact sheet.
// usage: node sweep.mjs <baseURL> <route> <outDir> [stepPx=520] [width=390] [height=844] [settleMs=700] [cols=6]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { chromium } = req("@playwright/test");
const sharp = req("sharp");

const [
  base,
  route,
  outDir,
  stepPx = "520",
  w = "390",
  h = "844",
  settle = "700",
  cols = "6",
] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const mobile = +w < 1024;
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: "no-preference",
  userAgent: mobile
    ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
    : undefined,
});
const page = await ctx.newPage();
await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(4000);
const cdp = await ctx.newCDPSession(page);
const shots = [];
const x = +w / 2;
let stuck = 0;
for (let i = 0; i < 200; i++) {
  const f = `${outDir}/${String(i).padStart(3, "0")}.jpg`;
  await page.screenshot({ path: f, type: "jpeg", quality: 82 });
  shots.push(f);
  const before = await page.evaluate(() => [
    scrollY,
    document.documentElement.scrollHeight - innerHeight,
  ]);
  if (before[0] >= before[1] - 2) break;
  if (mobile) {
    const y0 = +h * 0.8,
      steps = 16,
      dist = +stepPx;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: y0 }],
    });
    for (let s = 1; s <= steps; s++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y0 - (dist * s) / steps }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.move(x, +h / 2);
    for (let k = 0; k < 8; k++) {
      await page.mouse.wheel(0, +stepPx / 8);
      await page.waitForTimeout(40);
    }
  }
  await page.waitForTimeout(+settle);
  const after = await page.evaluate(() => scrollY);
  if (Math.abs(after - before[0]) < 5) {
    if (++stuck > 2) break;
  } else stuck = 0;
}
await browser.close();
const C = +cols,
  TW = mobile ? 260 : 480,
  TH = Math.round((TW * +h) / +w);
const rows = Math.ceil(shots.length / C);
const layers = [];
for (let i = 0; i < shots.length; i++)
  layers.push({
    input: await sharp(shots[i]).resize(TW, TH, { fit: "fill" }).jpeg().toBuffer(),
    left: (i % C) * (TW + 6),
    top: Math.floor(i / C) * (TH + 6),
  });
await sharp({
  create: {
    width: C * (TW + 6),
    height: rows * (TH + 6),
    channels: 3,
    background: "#444",
  },
})
  .composite(layers)
  .jpeg({ quality: 78 })
  .toFile(`${outDir}-sheet.jpg`);
console.log(route, shots.length, `${outDir}-sheet.jpg`);
