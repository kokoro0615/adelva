// Research harness: scroll a page on an emulated phone with real touch drags
// (CDP Input.dispatchTouchEvent), record frame pacing, long animation frames
// (with script attribution), layout shifts and scroll jumps that the drags
// did not cause.
// usage: node touch-scroll.mjs <baseURL> <route> <outJson> [cpuRate=4] [width=390] [height=844]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { chromium } = req("@playwright/test");

const [base, route, out, cpu = "4", w = "390", h = "844"] = process.argv.slice(2);
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
const consoleMsgs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleMsgs.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
page.on("pageerror", (e) => consoleMsgs.push(`pageerror: ${e.message.slice(0, 200)}`));
await page.addInitScript(() => {
  const st = (window.__perf = { frames: [], loaf: [], shifts: [], scroll: [], longtasks: 0 });
  let last = performance.now();
  const loop = (t) => { st.frames.push([t, t - last, window.scrollY]); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        st.loaf.push({
          start: e.startTime, dur: e.duration, block: e.blockingDuration, render: e.renderStart ? e.startTime + e.duration - e.renderStart : 0,
          style: e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0,
          scripts: e.scripts.map((s) => ({ inv: s.invoker, src: (s.sourceURL || "").split("/").pop(), fn: s.sourceFunctionName, dur: Math.round(s.duration), fl: Math.round(s.forcedStyleAndLayoutDuration) })),
        });
      }
    }).observe({ type: "long-animation-frame", buffered: true });
  } catch {}
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) st.shifts.push({ t: e.startTime, v: e.value, src: e.sources?.map((s) => s.node?.className?.toString?.().slice(0, 60) || s.node?.nodeName) }); }).observe({ type: "layout-shift", buffered: true });
});
const t0 = Date.now();
await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
const loadMs = Date.now() - t0;
await page.waitForTimeout(3500);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: +cpu });
await page.evaluate(() => { window.__perf.frames.length = 0; window.__perf.loaf.length = 0; window.__perfStart = performance.now(); });

const drags = [];
const x = +w / 2;
let stuck = 0;
for (let i = 0; i < 400; i++) {
  const before = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
  if (before[0] >= before[1] - 2) break;
  const dist = 420;
  const y0 = +h * 0.75, steps = 14;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
  for (let s = 1; s <= steps; s++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 - (dist * s) / steps }] });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(260);
  const after = await page.evaluate(() => scrollY);
  drags.push([Math.round(before[0]), Math.round(after)]);
  if (Math.abs(after - before[0]) < 5) { if (++stuck > 3) break; } else stuck = 0;
}
await page.waitForTimeout(800);
const perf = await page.evaluate(() => ({ ...window.__perf, start: window.__perfStart, docH: document.documentElement.scrollHeight }));
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
const fr = perf.frames.filter((f) => f[0] >= perf.start).map((f) => f[1]);
fr.sort((a, b) => a - b);
const q = (p) => fr[Math.min(fr.length - 1, Math.floor(p * fr.length))] ?? 0;
// scroll jumps: frame-to-frame scrollY change larger than one drag step would produce
const jumps = [];
const fs2 = perf.frames.filter((f) => f[0] >= perf.start);
for (let i = 1; i < fs2.length; i++) { const d = fs2[i][2] - fs2[i - 1][2]; if (d < -20) jumps.push([Math.round(fs2[i][0]), Math.round(fs2[i - 1][2]), Math.round(fs2[i][2])]); }
const loaf = perf.loaf.filter((l) => l.start >= perf.start);
const byScript = {};
for (const l of loaf) for (const s of l.scripts) { const k = `${s.src}:${s.fn || "?"}:${s.inv.slice(0, 50)}`; byScript[k] = byScript[k] || { n: 0, dur: 0, fl: 0 }; byScript[k].n++; byScript[k].dur += s.dur; byScript[k].fl += s.fl; }
const top = Object.entries(byScript).sort((a, b) => b[1].dur - a[1].dur).slice(0, 12);
const res = {
  route, cpu: +cpu, viewport: `${w}x${h}`, loadMs, docH: perf.docH, drags: drags.length, reachedEnd: drags.at(-1)?.[1],
  frames: fr.length, p50: Math.round(q(0.5)), p90: Math.round(q(0.9)), p99: Math.round(q(0.99)), max: Math.round(fr.at(-1) ?? 0),
  over33: fr.filter((v) => v > 34).length, over50: fr.filter((v) => v > 50).length, over100: fr.filter((v) => v > 100).length,
  loafCount: loaf.length, loafTotal: Math.round(loaf.reduce((a, l) => a + l.dur, 0)), loafRenderTotal: Math.round(loaf.reduce((a, l) => a + l.render, 0)),
  loafScriptTotal: Math.round(loaf.reduce((a, l) => a + l.scripts.reduce((b, s) => b + s.dur, 0), 0)),
  cls: +perf.shifts.reduce((a, s) => a + s.v, 0).toFixed(4), shifts: perf.shifts.slice(0, 8), jumps: jumps.slice(0, 12), backJumps: jumps.length,
  topScripts: top, console: consoleMsgs.slice(0, 15),
};
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ route, loadMs, docH: perf.docH, frames: res.frames, p50: res.p50, p90: res.p90, p99: res.p99, over50: res.over50, loaf: res.loafCount, loafTotal: res.loafTotal, scriptT: res.loafScriptTotal, renderT: res.loafRenderTotal, cls: res.cls, backJumps: res.backJumps, console: consoleMsgs.length }));
await browser.close();
