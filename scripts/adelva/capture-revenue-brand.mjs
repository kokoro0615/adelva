/** Production capture, owned server at 4391. Run after pnpm build/start. */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4391";
const out = process.argv[2] ?? "docs/reports/adelva-revenue-brand-2026-09-28/actual";
const quick = process.argv.includes("--quick");
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ...(quick
    ? []
    : [
        ["small", 360, 780],
        ["boundary", 1024, 768],
        ["wide", 1920, 1080],
        ["zoom-equivalent", 720, 450],
      ]),
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) errors.push(m.text());
  });
  await page.goto(base + "/services/revenue-brand", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images].filter((i) => i.getClientRects().length);
    for (const i of images) i.loading = "eager";
    await Promise.all(images.map((i) => i.decode()));
  });
  const metrics = await page.evaluate(() => ({
    title: document.title,
    scrollWidth: document.documentElement.scrollWidth,
    width: innerWidth,
    stageHeight: document.querySelector("[data-stage]").getBoundingClientRect().height,
    landmarks: [...document.querySelectorAll("[data-landmark]")].map((n) => {
      const r = n.getBoundingClientRect();
      return {
        id: n.dataset.landmark,
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      };
    }),
    overflow: [
      ...document.querySelectorAll(
        "main h1,main h2,main h3,main p,main button,main li",
      ),
    ]
      .filter((n) => {
        const r = n.getBoundingClientRect();
        return (
          r.width > 0 &&
          (r.left < -0.5 || r.right > innerWidth + 0.5) &&
          getComputedStyle(n).visibility !== "hidden"
        );
      })
      .map((n) => ({ text: n.textContent, rect: n.getBoundingClientRect().toJSON() })),
  }));
  await page.screenshot({
    path: `${out}/${name}-full.png`,
    fullPage: true,
    caret: "hide",
  });
  if (!quick && ["desktop", "tablet", "mobile"].includes(name)) {
    await page.addStyleTag({ content: "img,picture{visibility:hidden!important}" });
    await page.screenshot({ path: `${out}/${name}-noimg.png`, fullPage: true });
  }
  results.push({ name, viewport: { width, height }, errors, ...metrics });
  await context.close();
  console.log(name, errors.length, metrics.overflow.length);
}
if (!quick)
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/services/revenue-brand", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('[data-motion="on"]');
    for (const [state, selector] of [
      ["hero", "#rb-title"],
      ["ch1", "#rb-ch1-title"],
      ["ch2", "#rb-ch2-title"],
      ["ch3", "#rb-ch3-title"],
      ["process-04", '[data-step="4"]'],
      ["end", "[data-process] > a"],
    ]) {
      await page.evaluate(
        ({ selector, state }) => {
          const n = document.querySelector(selector);
          if (state === "process-04") {
            const svg = [...document.querySelectorAll("[data-river]")].find(
              (n) => n.getBoundingClientRect().width > 0,
            );
            const dot = svg.querySelector('[data-process-node="4"] circle');
            const r = svg.getBoundingClientRect();
            window.scrollTo({
              top:
                r.top +
                scrollY +
                (dot.cy.baseVal.value * r.height) / svg.viewBox.baseVal.height -
                innerHeight * 0.58 +
                4,
              behavior: "instant",
            });
            return;
          }
          window.scrollTo({
            top:
              state === "hero"
                ? 0
                : n.getBoundingClientRect().top + scrollY - innerHeight * 0.35,
            behavior: "instant",
          });
        },
        { selector, state },
      );
      await page.waitForTimeout(state === "ch3" ? 3200 : 2400);
      await page.screenshot({ path: `${out}/${name}-motion-${state}.png` });
      const status = await page.evaluate(() => ({
        scrollY,
        steps: [...document.querySelectorAll("li[data-step]")].map((n) => ({
          step: n.dataset.step,
          state: n.dataset.state,
        })),
        counter: document.querySelector("[data-counter]").textContent,
        lines: [...document.querySelectorAll('[data-main-line="core"]')].map((n) => ({
          visible: n.getBoundingClientRect().width > 0,
          offset: n.style.strokeDashoffset,
          length: n.getTotalLength(),
        })),
      }));
      results.push({ name, state, ...status, errors: [...errors] });
    }
    await context.close();
  }
await browser.close();
await writeFile(
  `${out}/capture.json`,
  JSON.stringify({ base, route: "/services/revenue-brand", results }, null, 2) + "\n",
);
