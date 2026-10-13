// /services/management-operations narrow camera: capture the signature states
// (from window.__mo.marks) after the camera settles, plus a contact sheet.
// usage: node scripts/adelva/polish/mo-states.mjs <baseURL> <outDir> [width=390] [height=844] [engine=chromium]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const pw = req("@playwright/test");
const sharp = req("sharp");

const [base, outDir, w = "390", h = "844", engine = "chromium"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser =
  engine === "webkit"
    ? await pw.webkit.launch({ headless: true })
    : await pw.chromium.launch({
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
  deviceScaleFactor: 2,
  isMobile: engine !== "webkit",
  hasTouch: true,
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const log = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type()))
    log.push(`${m.type()}: ${m.text().slice(0, 240)}`);
});
page.on("pageerror", (e) => log.push(`pageerror: ${e.message}`));
await page.goto(`${base}/services/management-operations`, {
  waitUntil: "load",
  timeout: 120000,
});
await page.waitForSelector('[data-motion="ready"]', {
  state: "attached",
  timeout: 60000,
});
await page.waitForTimeout(2600);
const M = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mo.marks)));
const H = +h;
const states = [
  ["hero", 0],
  ["crowns", Math.round(H * 0.62)],
  ["zoom", Math.round(M.st[0][0] - 120)],
  ...M.st.map(([a, b], i) => [`station ${i + 1}`, Math.round((a + b) / 2)]),
  ["pull", Math.round((M.pullStart + M.pullEnd) / 2)],
  ["descent", Math.round(M.pullEnd + (M.descentEnd - M.pullEnd) * 0.45)],
  ["full view", Math.round(M.descentEnd)],
  ["to forks", Math.round((M.descentEnd + M.forks[0]) / 2 + 80)],
  ...M.forks.map((y, i) => [`fork ${i + 1}`, Math.round(y)]),
  ["process top", Math.round(M.procStart + H * 0.25)],
  ...M.steps
    .filter((_, i) => i % 2 === 1)
    .map((y, i) => [`step ${2 * i + 2}`, Math.round(y)]),
  ["process link", Math.round(M.procEnd)],
  ["audience", Math.round(M.aud)],
  ["contact", Math.round(M.contStart + H * 0.3)],
  ["contact end", Math.round(M.end - 260)],
];
const files = [];
for (const [label, y] of states) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await page
    .waitForFunction(() => window.__mo?.idle?.(), null, {
      timeout: 15000,
      polling: 100,
    })
    .catch(() => log.push(`not idle: ${label}`));
  await page.waitForTimeout(120);
  const f = `${outDir}/${String(files.length).padStart(2, "0")}.jpg`;
  await page.screenshot({ path: f, type: "jpeg", quality: 82 });
  files.push([f, label]);
}
const stats = await page.evaluate(() => window.__mo.stats());
await browser.close();
const C = 7,
  TW = Math.round(1400 / C) - 6,
  TH = Math.round((TW * H) / +w);
const layers = [];
for (let i = 0; i < files.length; i++) {
  const svg = Buffer.from(
    `<svg width="${TW}" height="20"><rect width="${TW}" height="20" fill="#000" fill-opacity="0.6"/><text x="4" y="14" font-size="12" fill="#fff" font-family="sans-serif">${files[i][1]}</text></svg>`,
  );
  const img = await sharp(files[i][0])
    .resize(TW, TH, { fit: "fill" })
    .composite([{ input: svg, top: TH - 20, left: 0 }])
    .jpeg()
    .toBuffer();
  layers.push({
    input: img,
    left: (i % C) * (TW + 6),
    top: Math.floor(i / C) * (TH + 6),
  });
}
const rows = Math.ceil(files.length / C);
await sharp({
  create: {
    width: C * (TW + 6),
    height: rows * (TH + 6),
    channels: 3,
    background: "#444",
  },
})
  .composite(layers)
  .jpeg({ quality: 80 })
  .toFile(`${outDir}-sheet.jpg`);
console.log(JSON.stringify({ states: files.length, stats, log: log.slice(0, 20) }));
