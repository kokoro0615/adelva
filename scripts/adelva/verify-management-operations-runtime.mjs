/**
 * Runtime evidence for /services/management-operations (spec §9, §12):
 * Lenis + ScrollTrigger snapping (wheel round trip, End/Home, resize,
 * back/forward restore), frame pacing and long tasks through the pinned
 * sequence, and LCP per viewport.
 *
 *   BASE_URL=http://127.0.0.1:4317 node scripts/adelva/verify-management-operations-runtime.mjs out.json
 */
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4317";
const route = `${base}/services/management-operations`;
const out = process.argv[2];
const browser = await chromium.launch();
const report = {
  measured: new Date().toISOString(),
  snapping: {},
  performance: {},
  lcp: {},
};

const state = (page) =>
  page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    const top = section.getBoundingClientRect().top + window.scrollY;
    const t = ((window.scrollY - top) / (window.innerHeight * 5)) * 5;
    return {
      t: +t.toFixed(3),
      onLanding: Math.abs(t - Math.round(t)) < 0.02 || t < 0 || t > 5,
      progress: document.querySelector("[data-stage]").dataset.progress,
      lenis: document.documentElement.dataset.smoothScroll === "true",
      pinned: document.documentElement.dataset.moStage === "pinned",
    };
  });
const settle = (page, ms = 1800) => page.waitForTimeout(ms);

/* ------------------------------------------------------------ snapping */
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto(route);
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 200,
      behavior: "instant",
    });
  });
  await settle(page, 600);
  await page.mouse.move(720, 480);
  const forward = [];
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel(0, 480);
    await settle(page);
    forward.push(await state(page));
  }
  const backward = [];
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel(0, -480);
    await settle(page);
    backward.push(await state(page));
  }
  // Land mid-sequence, then End and Home.
  await page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + window.innerHeight * 5 * 0.47, behavior: "instant" });
  });
  await settle(page);
  const midJump = await state(page);
  await page.keyboard.press("End");
  await settle(page, 2500);
  const end = await page.evaluate(() => ({
    atBottom:
      Math.abs(
        window.scrollY + window.innerHeight - document.documentElement.scrollHeight,
      ) < 2,
  }));
  await page.keyboard.press("Home");
  await settle(page, 2500);
  const home = await page.evaluate(() => ({ scrollY: window.scrollY }));
  // Resize while pinned at landing 3.
  await page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + window.innerHeight * 5 * 0.4, behavior: "instant" });
  });
  await settle(page);
  const beforeResize = await state(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await settle(page, 2500);
  const afterResize = await state(page);
  await page.setViewportSize({ width: 1440, height: 960 });
  await settle(page, 2500);
  const afterRestore = await state(page);
  // Back / forward restoration.
  await page.evaluate(() => {
    const section = document.querySelector("[data-process]");
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + window.innerHeight * 5 * 0.8, behavior: "instant" });
  });
  await settle(page);
  const beforeLeave = await state(page);
  await page.goto(`${base}/contact`);
  await page.waitForLoadState("networkidle");
  await page.goBack();
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await settle(page, 2500);
  const afterBack = await state(page);
  report.snapping = {
    forward,
    backward,
    midJump,
    end,
    home,
    beforeResize,
    afterResize,
    afterRestore,
    beforeLeave,
    afterBack,
  };
  await context.close();
}

/* --------------------------------------------------------- performance */
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(route);
  await page.waitForSelector('[data-motion="ready"]', { state: "attached" });
  await page.evaluate(() => {
    window.__frames = [];
    window.__long = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        window.__long.push(Math.round(entry.duration));
    }).observe({ type: "longtask", buffered: false });
    const section = document.querySelector("[data-process]");
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - 100,
      behavior: "instant",
    });
  });
  await settle(page, 800);
  await page.mouse.move(720, 480);
  await page.evaluate(() => {
    let last = performance.now();
    const loop = (now) => {
      window.__frames.push(now - last);
      last = now;
      if (window.__frames.length < 100000 && !window.__stop)
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, 170);
    await page.waitForTimeout(120);
  }
  await settle(page, 1500);
  const result = await page.evaluate(() => {
    window.__stop = true;
    const frames = window.__frames.slice(2);
    const sorted = [...frames].sort((a, b) => a - b);
    return {
      frames: frames.length,
      p50: +sorted[Math.floor(sorted.length * 0.5)].toFixed(1),
      p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
      over33ms: frames.filter((f) => f > 33.4).length,
      longTasks: window.__long,
    };
  });
  report.performance = { cpuThrottle: 4, ...result };
  await context.close();
}

/* ----------------------------------------------------------------- LCP */
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(route, { waitUntil: "networkidle" });
  report.lcp[name] = await page.evaluate(
    () =>
      new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          resolve({
            ms: Math.round(last.startTime),
            element: last.element?.tagName,
            url: last.url?.replace(location.origin, "") || null,
          });
        }).observe({ type: "largest-contentful-paint", buffered: true });
      }),
  );
  report.lcp[name].preloaded = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((link) => ({
      href: link.getAttribute("href"),
      media: link.getAttribute("media"),
    })),
  );
  await context.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (out) await writeFile(out, JSON.stringify(report, null, 2) + "\n");
