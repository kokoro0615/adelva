/** Motion keyframes of /challenges/general-managers with motion enabled (spec §9),
 * captured from a running server into one sheet.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4482 node scripts/adelva/capture-general-managers-keyframes.mjs
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4482";
const out = "docs/reports/adelva-general-managers-2026-09-30/motion-keyframes.png";
const browser = await chromium.launch();
const frames = [];
const top = (p, sel) =>
  p.evaluate(
    (s) => document.querySelector(s).getBoundingClientRect().top + scrollY,
    sel,
  );
const gates = (p) =>
  p.evaluate(() => {
    const r = [...document.querySelectorAll('[data-marks="gates"]')]
      .find((e) => e.getBoundingClientRect().width > 0)
      .getBoundingClientRect();
    return { top: r.top + scrollY, h: r.height };
  });

const d = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
await d.goto(`${base}/challenges/general-managers`, { waitUntil: "networkidle" });
await d.reload({ waitUntil: "domcontentloaded" });
await d.waitForFunction(
  () => document.querySelector("[data-general-managers]")?.dataset.motion === "on",
);
await d.waitForTimeout(900);
frames.push([
  "1440 読み込み：朝の光が水鏡を横切り、見出しが行ごとに現れる",
  await d.screenshot(),
]);
await d.evaluate((y) => scrollTo(0, y), (await top(d, "#gm-01")) - 60);
await d.waitForTimeout(1200);
await d.locator('input[value="sales"]').check({ force: true });
await d.waitForTimeout(420);
frames.push([
  "1440 01：選んだ田に、輪から朝の光が広がる（波紋）",
  await d.screenshot(),
]);
await d.waitForTimeout(1400);
await d.evaluate((y) => scrollTo(0, y), (await top(d, "#gm-02")) - 80);
await d.waitForTimeout(1500);
frames.push(["1440 02：点線が現象から上流の取水口へ", await d.screenshot()]);
await d.locator('input[value="authority"]').check({ force: true });
await d.waitForTimeout(700);
frames.push(["1440 02：論点を切り替えると、判断の境界の印に", await d.screenshot()]);
const g = await gates(d);
await d.evaluate((y) => scrollTo(0, y), g.top - 900 * 0.75 + g.h * 0.55);
await d.waitForTimeout(1300);
frames.push(["1440 05：スクロールに合わせ、光が落ち口を下る", await d.screenshot()]);
await d.close();

const m = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "no-preference",
});
await m.goto(`${base}/challenges/general-managers`, { waitUntil: "networkidle" });
await m.waitForTimeout(1500);
await m.evaluate((y) => scrollTo(0, y), (await top(m, "#gm-01")) + 420);
await m.waitForTimeout(900);
await m.locator('input[value="quality"]').check({ force: true });
await m.locator('input[value="people"]').check({ force: true });
await m.waitForTimeout(1500);
frames.push([
  "390 01：一枚の田＝一行。選ぶと灯り、画面下に選択トレイ",
  await m.screenshot(),
]);
const mg = await gates(m);
await m.evaluate((y) => scrollTo(0, y), mg.top - 844 * 0.75 + mg.h * 0.5);
await m.waitForTimeout(1300);
frames.push(["390 05：線が届いた落ち口だけが灯る", await m.screenshot()]);
await m.getByRole("button", { name: /章の一覧を開く/ }).click();
await m.waitForTimeout(600);
frames.push(["390 水位計：押すと章の一覧のシート", await m.screenshot()]);
await m.close();
await browser.close();

const W = 720,
  H = 450,
  MW = 208,
  MH = 450,
  CAP = 40,
  G = 20;
const comps = [];
const desk = frames.filter(([c]) => c.startsWith("1440"));
const mob = frames.filter(([c]) => c.startsWith("390"));
const caption = (text, w) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${CAP}"><text x="0" y="26" font-family="Noto Sans CJK JP, Noto Sans JP, sans-serif" font-size="15" fill="#f1efea">${text}</text></svg>`,
  );
for (const [i, [cap, buf]] of desk.entries()) {
  const x = G + (i % 2) * (W + G);
  const y = G + Math.floor(i / 2) * (H + CAP + G);
  comps.push({
    input: await sharp(buf).resize(W, H).png().toBuffer(),
    left: x,
    top: y,
  });
  comps.push({ input: caption(cap, W), left: x, top: y + H + 2 });
}
const rowY = G + 3 * (H + CAP + G);
for (const [i, [cap, buf]] of mob.entries()) {
  const x = G + i * (MW + 300);
  comps.push({
    input: await sharp(buf).resize(MW, MH).png().toBuffer(),
    left: x,
    top: rowY,
  });
  comps.push({ input: caption(cap, MW + 280), left: x, top: rowY + MH + 2 });
}
await sharp({
  create: {
    width: G * 3 + W * 2,
    height: rowY + MH + CAP + G,
    channels: 3,
    background: "#0e1118",
  },
})
  .composite(comps)
  .png()
  .toFile(out);
console.log(out, frames.length);
