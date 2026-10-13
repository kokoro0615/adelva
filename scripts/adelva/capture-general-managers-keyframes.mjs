/** Motion keyframes of /challenges/general-managers with motion enabled (spec §13,
 * "one line of first light"), captured from a running server into one sheet.
 * Nothing is tapped: every state below is reached by scrolling alone.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4482 node scripts/adelva/capture-general-managers-keyframes.mjs [out.png]
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4482";
const out =
  process.argv[2] ??
  "docs/reports/adelva-general-managers-2026-10-01/motion-keyframes.png";
const browser = await chromium.launch();
const frames = [];
const top = (p, sel) =>
  p.evaluate(
    (s) => document.querySelector(s).getBoundingClientRect().top + scrollY,
    sel,
  );
/** Scrolls in small steps so every scroll trigger on the way fires in order. */
const glide = async (p, y) => {
  const from = await p.evaluate(() => scrollY);
  const steps = Math.max(1, Math.round(Math.abs(y - from) / 60));
  for (let i = 1; i <= steps; i++) {
    await p.evaluate((t) => scrollTo(0, t), from + ((y - from) * i) / steps);
    await p.waitForTimeout(16);
  }
};
/** Puts an element's centre (or top) on a line at `ratio` of the viewport. */
const onLine = (p, sel, ratio, edge = "centre") =>
  p.evaluate(
    ([s, r, e]) => {
      const box = [...document.querySelectorAll(s)]
        .find((n) => n.getBoundingClientRect().width > 0)
        .getBoundingClientRect();
      const at = e === "top" ? box.top : box.top + box.height / 2;
      return scrollY + at - innerHeight * r;
    },
    [sel, ratio, edge],
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
await d.waitForTimeout(1250);
frames.push([
  "1440 読み込み：夜明けの青から、水面に朝日。見出しが行ごとに立ち上がる",
  await d.screenshot(),
]);
await d.waitForTimeout(2500);
await glide(d, await onLine(d, 'label[data-issue="people"] [data-ring]', 0.5));
await d.waitForTimeout(1400);
frames.push(["1440 01：読む位置の田にだけ朝の光（タップ不要）", await d.screenshot()]);
await glide(d, await onLine(d, 'label[data-issue="productivity"] [data-ring]', 0.5));
await d.waitForTimeout(330);
frames.push(["1440 01：光の滴が畦を越えて下の田へ渡る", await d.screenshot()]);
await d.waitForTimeout(1500);
await glide(d, await onLine(d, '[data-step="priority"]', 0.5, "top"));
await d.waitForTimeout(1300);
frames.push([
  "1440 02：読んでいる論点に合わせて印が描かれる（優先順位）",
  await d.screenshot(),
]);
await glide(d, await onLine(d, '[data-step="authority"]', 0.5, "top"));
await d.waitForTimeout(1300);
frames.push(["1440 02：判断の境界", await d.screenshot()]);
await glide(d, (await top(d, "#gm-support-1")) - 900 * 0.55);
await d.waitForTimeout(450);
frames.push([
  "1440 03：行に光が走り、図が描かれる。関係する課題は常に表示",
  await d.screenshot(),
]);
const g = await gates(d);
await glide(d, g.top - 900 * 0.75 + g.h * 0.55);
await d.waitForTimeout(1300);
frames.push(["1440 05：スクロールに合わせ、光が落ち口を下る", await d.screenshot()]);
await glide(d, (await top(d, "[data-check]")) - 900 * 0.62);
await d.waitForTimeout(1000);
frames.push(["1440 06：罫線を光が進み、届いた項目に印", await d.screenshot()]);
await d.close();

const m = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "no-preference",
  hasTouch: true,
  isMobile: true,
});
await m.goto(`${base}/challenges/general-managers`, { waitUntil: "networkidle" });
await m.waitForTimeout(3500);
await glide(m, await onLine(m, 'label[data-issue="people"] [data-ring]', 0.55));
await m.waitForTimeout(1500);
frames.push(["390 01：読む行の田が灯る", await m.screenshot()]);
await glide(m, await onLine(m, '[data-step="priority"]', 0.66, "top"));
await m.waitForTimeout(1300);
frames.push(["390 02：論点と印が連動", await m.screenshot()]);
const mg = await gates(m);
await glide(m, mg.top - 844 * 0.75 + mg.h * 0.5);
await m.waitForTimeout(1300);
frames.push(["390 05：届いた落ち口が灯る", await m.screenshot()]);
await glide(m, (await top(m, "#gm-07")) - 844 * 0.25);
await m.waitForTimeout(1600);
frames.push(["390 07：送信後の流れが順に灯る", await m.screenshot()]);
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
const rowY = G + Math.ceil(desk.length / 2) * (H + CAP + G);
const mobileGap =
  (G * 3 + W * 2 - G * 2 - MW * mob.length) / Math.max(1, mob.length - 1);
for (const [i, [cap, buf]] of mob.entries()) {
  const x = G + i * (MW + mobileGap);
  comps.push({
    input: await sharp(buf).resize(MW, MH).png().toBuffer(),
    left: Math.round(x),
    top: rowY,
  });
  comps.push({
    input: caption(cap, MW + 150),
    left: Math.round(x),
    top: rowY + MH + 2,
  });
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
