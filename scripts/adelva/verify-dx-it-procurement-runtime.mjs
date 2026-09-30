/** Production runtime evidence: monotonic progress, native scroll, responsive cleanup, LCP, CLS, frame pacing. */
import { writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname } from "node:path";
import { chromium } from "@playwright/test";
const base = process.env.BASE_URL ?? "http://127.0.0.1:4328";
const out =
  process.argv[2] ?? "docs/reports/adelva-dx-it-procurement-2026-09-28/runtime.json";
const browser = await chromium.launch();
const report = {
  measured: new Date().toISOString(),
  runtime: {},
  performance: [],
  loading: [],
};
const state = (page) =>
  page.evaluate(() => ({
    scrollY,
    tip: document.querySelector("[data-process]").dataset.tip,
    states: [...document.querySelectorAll("li[data-step]")].map((n) => n.dataset.state),
    current: document.querySelectorAll('[aria-current="step"]').length,
    pins: document.querySelectorAll(".pin-spacer").length,
    motion: document.querySelector("[data-motion]")?.dataset.motion,
    offHref: document.querySelector("[data-power-off]").getAttribute("href"),
    edges: [...document.querySelectorAll("[data-room-edge]")].map((n) =>
      n.getAttribute("style"),
    ),
  }));
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/services/dx-it-procurement", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.waitForTimeout(3000);
  report.runtime.hero = await state(page);
  report.runtime.forward = [];
  for (const y of [160, 755, 1262]) {
    await page.evaluate((y) => {
      const r = document.querySelector("[data-process]").getBoundingClientRect();
      scrollTo({
        top: r.top + scrollY + (y * r.width) / 1536 - innerHeight * 0.6,
        behavior: "instant",
      });
    }, y);
    await page.waitForTimeout(750);
    report.runtime.forward.push(await state(page));
  }
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(1000);
  report.runtime.backward = await state(page);
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("lenis-scrolling"),
  );
  await page.keyboard.press("End");
  await page.waitForTimeout(1600);
  report.runtime.end = await page.evaluate(() => ({
    atBottom:
      Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 2,
  }));
  await page.keyboard.press("Home");
  await page.waitForTimeout(1600);
  report.runtime.home = await state(page);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(2000);
  report.runtime.tablet = await state(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  report.runtime.reduce = await state(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForTimeout(2000);
  report.runtime.resumed = await state(page);
  await page.getByRole("link", { name: "問い合わせを送信", exact: true }).focus();
  await page.waitForTimeout(200);
  report.runtime.focus = await state(page);
  report.runtime.errors = errors;
  await context.close();
}
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__lcp = null;
    window.__cls = 0;
    window.__shifts = [];
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      window.__lcp = {
        ms: e.startTime,
        element: e.element?.tagName,
        url: e.url?.replace(location.origin, ""),
      };
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (!e.hadRecentInput) {
          window.__cls += e.value;
          window.__shifts.push({
            value: e.value,
            sources: e.sources.map((s) => ({
              node: (s.node instanceof Element
                ? s.node.outerHTML
                : s.node?.textContent
              )?.slice(0, 200),
              previous: [
                s.previousRect.x,
                s.previousRect.y,
                s.previousRect.width,
                s.previousRect.height,
              ],
              current: [
                s.currentRect.x,
                s.currentRect.y,
                s.currentRect.width,
                s.currentRect.height,
              ],
            })),
          });
        }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(base + "/services/dx-it-procurement", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  report.loading.push({
    viewport: `${width}x${height}`,
    ...(await page.evaluate(() => ({
      lcp: window.__lcp,
      cls: window.__cls,
      shifts: window.__shifts,
      images: performance
        .getEntriesByType("resource")
        .filter((r) => r.name.includes("/media/adelva/dx-it-procurement/"))
        .map((r) => ({
          url: r.name.replace(location.origin, ""),
          bytes: r.transferSize,
          duration: r.duration,
        })),
      preloads: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map(
        (n) => ({ href: n.getAttribute("href"), media: n.getAttribute("media") }),
      ),
    }))),
  });
  await context.close();
}
for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  if (process.env.PERFORMANCE_TRACE === "1")
    await client.send("Tracing.start", {
      categories: "devtools.timeline,blink.user_timing",
      transferMode: "ReturnAsStream",
    });
  await page.addInitScript(() => {
    window.__heroFrames = [];
    window.__heroLong = [];
    window.__heroStop = false;
    window.__motionReady = 0;
    const readyObserver = new MutationObserver(() => {
      if (document.querySelector("[data-motion=ready]") && !window.__motionReady)
        window.__motionReady = performance.now();
    });
    readyObserver.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (!window.__heroStop)
          window.__heroLong.push({ start: e.startTime, duration: e.duration });
    }).observe({ type: "longtask", buffered: true });
    let last;
    function tick(now) {
      if (last) window.__heroFrames.push({ time: now, delta: now - last });
      last = now;
      if (!window.__heroStop) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await page.goto(base + "/services/dx-it-procurement", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.waitForTimeout(3200);
  const hero = await page.evaluate(() => {
    window.__heroStop = true;
    const frames = window.__heroFrames
      .filter((f) => f.time >= window.__motionReady)
      .map((f) => f.delta)
      .sort((a, b) => a - b);
    return {
      frames: frames.length,
      p50: frames[Math.floor(frames.length * 0.5)],
      p95: frames[Math.floor(frames.length * 0.95)],
      over33ms: frames.filter((f) => f > 33.4).length,
      longTasks: window.__heroLong.filter((t) => t.start >= window.__motionReady),
      initialLoadingLongTasks: window.__heroLong.filter(
        (t) => t.start < window.__motionReady,
      ),
      motionReady: window.__motionReady,
    };
  });
  await page.evaluate(() => {
    window.__frames = [];
    window.__long = [];
    window.__stop = false;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__long.push(e.duration);
    }).observe({ type: "longtask", buffered: false });
    let last = performance.now();
    function loop(now) {
      window.__frames.push(now - last);
      last = now;
      if (!window.__stop) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
  for (let i = 0; i < 35; i++) {
    await page.mouse.wheel(0, width < 1024 ? 170 : 130);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(800);
  report.performance.push({
    viewport: `${width}x${height}`,
    cpuThrottle: 4,
    hero,
    traceEnabled: process.env.PERFORMANCE_TRACE === "1",
    ...(await page.evaluate(() => {
      window.__stop = true;
      const frames = window.__frames.slice(2);
      const sorted = [...frames].sort((a, b) => a - b);
      return {
        frames: frames.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        over33ms: frames.filter((f) => f > 33.4).length,
        longTasks: window.__long,
      };
    })),
  });
  if (process.env.PERFORMANCE_TRACE === "1") {
    const complete = new Promise((resolve) =>
      client.once("Tracing.tracingComplete", resolve),
    );
    await client.send("Tracing.end");
    const { stream } = await complete;
    const chunks = [];
    while (true) {
      const chunk = await client.send("IO.read", { handle: stream });
      chunks.push(
        chunk.base64Encoded
          ? Buffer.from(chunk.data, "base64")
          : Buffer.from(chunk.data),
      );
      if (chunk.eof) break;
    }
    await client.send("IO.close", { handle: stream });
    await writeFile(
      dirname(out) + `/runtime-${width}.trace.json.gz`,
      gzipSync(Buffer.concat(chunks)),
    );
  }
  await context.close();
}
await browser.close();
report.budgets = {
  clsZero: report.loading.every((v) => v.cls === 0),
  activeLongTasksUnder50ms: report.performance.every(
    (v) => v.longTasks.length === 0 && v.hero.longTasks.length === 0,
  ),
  note: "The no-long-task target is separate from functional assertions; initial page loading and trace overhead are reported explicitly.",
};
await writeFile(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (
  report.runtime.errors.length ||
  !report.runtime.end.atBottom ||
  report.runtime.hero.offHref ||
  report.runtime.reduce.states.some((s) => s !== "passed") ||
  report.runtime.forward.at(-1).states.some((s) => s !== "passed")
)
  process.exitCode = 1;
