// Research harness: record a Chrome trace while touch-scrolling a page on an
// emulated phone and summarise main-thread rendering work: style recalcs,
// layouts (forced ones with their JS call site), paints, image decodes.
// usage: node trace-scroll.mjs <baseURL> <route> <outPrefix> [width=390] [height=844] [maxDrags=400]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { chromium } = req("@playwright/test");

const [base, route, outPrefix, w = "390", h = "844", maxDrags = "400"] =
  process.argv.slice(2);
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
await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
await page.waitForTimeout(3500);
const cdp = await ctx.newCDPSession(page);
const events = [];
cdp.on("Tracing.dataCollected", (d) => {
  for (const e of d.value) events.push(e);
});
const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
await cdp.send("Tracing.start", {
  transferMode: "ReportEvents",
  traceConfig: {
    includedCategories: [
      "devtools.timeline",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-devtools.timeline.stack",
      "blink",
      "cc",
      "gpu",
      "v8.execute",
    ],
    excludedCategories: ["*"],
  },
});
const x = +w / 2;
let stuck = 0,
  drags = 0;
const t0 = Date.now();
for (let i = 0; i < +maxDrags; i++) {
  const before = await page.evaluate(() => [
    scrollY,
    document.documentElement.scrollHeight - innerHeight,
  ]);
  if (before[0] >= before[1] - 2) break;
  const y0 = +h * 0.75,
    steps = 14,
    dist = 420;
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
  await page.waitForTimeout(200);
  drags++;
  const after = await page.evaluate(() => scrollY);
  if (Math.abs(after - before[0]) < 5) {
    if (++stuck > 3) break;
  } else stuck = 0;
}
const scrolled = await page.evaluate(() => scrollY);
await cdp.send("Tracing.end");
await done;
const secs = (Date.now() - t0) / 1000;
// main renderer thread = the thread with most FireAnimationFrame/Layout events in the page's renderer
const byTid = {};
for (const e of events)
  if (
    e.name === "UpdateLayoutTree" ||
    e.name === "Layout" ||
    e.name === "FireAnimationFrame"
  )
    byTid[e.pid + ":" + e.tid] = (byTid[e.pid + ":" + e.tid] || 0) + 1;
const main = Object.entries(byTid).sort((a, b) => b[1] - a[1])[0]?.[0];
const sum = {};
const add = (k, d) => {
  sum[k] = sum[k] || { n: 0, ms: 0 };
  sum[k].n++;
  sum[k].ms += d / 1000;
};
const forced = {};
const decodes = [];
const paintsBy = {};
for (const e of events) {
  const onMain = e.pid + ":" + e.tid === main;
  const d = e.dur || 0;
  if (e.ph !== "X") continue;
  if (
    onMain &&
    [
      "UpdateLayoutTree",
      "Layout",
      "Paint",
      "PrePaint",
      "Layerize",
      "Commit",
      "FireAnimationFrame",
      "FunctionCall",
      "EventDispatch",
      "HitTest",
      "ParseHTML",
      "EvaluateScript",
      "v8.execute",
      "MajorGC",
      "MinorGC",
      "V8.GCScavenger",
      "ScrollLayer",
      "UpdateLayer",
      "IntersectionObserverController::computeIntersections",
      "ResizeObserverController::BroadcastObservations",
    ].includes(e.name)
  )
    add(e.name, d);
  if (/Decode|ImageDecode|DecodeImage/.test(e.name)) {
    add("decode:" + e.name, d);
    if (d > 8000)
      decodes.push({
        name: e.name,
        ms: +(d / 1000).toFixed(1),
        url: (e.args?.data?.url || e.args?.imageUrl || e.args?.data?.imageUrl || "")
          .split("/")
          .pop(),
      });
  }
  if (/Raster/.test(e.name)) add("raster:" + e.name, d);
  if (onMain && e.name === "Layout") {
    const st = e.args?.beginData?.stackTrace;
    if (st && st.length) {
      const f = st[0];
      const k = `${(f.url || "").split("/").pop()}:${f.functionName || "?"}:${f.lineNumber}:${f.columnNumber}`;
      forced[k] = forced[k] || { n: 0, ms: 0 };
      forced[k].n++;
      forced[k].ms += d / 1000;
    }
  }
  if (onMain && e.name === "Paint") {
    const c = e.args?.data?.clip;
    const k = c ? `${Math.round(c[2] - c[0])}x${Math.round(c[5] - c[1])}` : "?";
    paintsBy[k] = (paintsBy[k] || 0) + 1;
  }
}
for (const k in sum) sum[k].ms = +sum[k].ms.toFixed(1);
const forcedTop = Object.entries(forced)
  .sort((a, b) => b[1].ms - a[1].ms)
  .slice(0, 15)
  .map(([k, v]) => [k, v.n, +v.ms.toFixed(1)]);
const res = {
  route,
  viewport: `${w}x${h}`,
  drags,
  scrolled,
  secs: +secs.toFixed(1),
  sum,
  forcedTop,
  forcedTotal: Object.values(forced).reduce((a, v) => a + v.n, 0),
  decodes: decodes.sort((a, b) => b.ms - a.ms).slice(0, 20),
  paintsBy: Object.entries(paintsBy)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10),
};
fs.writeFileSync(outPrefix + ".json", JSON.stringify(res, null, 1));
const s = (k) => (sum[k] ? `${sum[k].ms}ms/${sum[k].n}` : "0");
console.log(
  `${route} scrolled=${scrolled} style=${s("UpdateLayoutTree")} layout=${s("Layout")} forced=${res.forcedTotal} paint=${s("Paint")} prepaint=${s("PrePaint")} raf=${s("FireAnimationFrame")} evt=${s("EventDispatch")} gc=${s("MinorGC")}+${s("MajorGC")} decodes>8ms=${decodes.length}`,
);
await browser.close();
