import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { compareImagePair } from "./compare-reference.mjs";

const out = "artifacts/home-mobile-motion-2026-09-09/final";
const actualURL = process.env.HOME_MOTION_URL || "http://127.0.0.1:3002/";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const evidence = [];
try {
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    const pairs = {};
    for (const [role, url] of [
      ["reference", "https://white-desert.com/"],
      ["actual", actualURL],
    ]) {
      if (role === "reference" && process.env.HOME_MOTION_REUSE_REFERENCE === "1") {
        const saved = await readFile(
          `${out}/${width}-${role}-evidence.json`,
          "utf8",
        ).catch(() => null);
        if (saved) {
          const entry = JSON.parse(saved);
          evidence.push(entry);
          for (const state of entry.states)
            (pairs[state.state] ||= {}).reference = state.file;
          continue;
        }
      }
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
        isMobile: width === 390,
        hasTouch: width === 390,
        reducedMotion: "no-preference",
      });
      const errors = [];
      page.setDefaultTimeout(20000);
      page.on("pageerror", (e) => errors.push(e.message));
      console.log(`${width} ${role}: navigating`);
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const reference = role === "reference";
      await page
        .locator(
          reference
            ? '.horizontal-scroll_container[style*="transform"]'
            : '[data-home-motion-ready="true"]',
        )
        .waitFor();
      await page.waitForFunction(() => document.fonts.status === "loaded");
      console.log(`${width} ${role}: hydrated and fonts loaded`);
      if (!reference) {
        // This below-fold <picture> otherwise selects a source during the same
        // scroll frame as decode(). Resolve it before the full-page sweep.
        await page.locator("footer img").evaluateAll((images) => {
          for (const image of images) image.loading = "eager";
        });
        await page.waitForFunction(() =>
          [...document.querySelectorAll("footer img")].every(
            (i) => i.complete && i.naturalWidth > 0,
          ),
        );
      }
      const selectors = reference
        ? {
            quote: ".text-scroll-fade",
            camps: ".horizontal-scroll_outer",
            track: ".horizontal-scroll_container",
            title: ".horizontal-scroll_title",
            copy: ".panel-1_text-wrap",
            footer: ".footer-component",
          }
        : {
            quote: ".last-continent__quote",
            camps: ".longform",
            track: ".camps__track",
            title: ".camps__heading",
            copy: ".camps__intro-detail",
            footer: "footer",
          };
      const bounds = await page.evaluate(
        (s) =>
          Object.fromEntries(
            Object.entries(s).map(([k, v]) => {
              const e = document.querySelector(v);
              const r = e.getBoundingClientRect();
              return [k, { top: r.top + scrollY, height: r.height }];
            }),
          ),
        selectors,
      );
      const pin = width === 390 ? 4450 : width === 768 ? 6340 : 8550;
      const checkpoints = {
        top: 0,
        heroMid: height * 0.5,
        heroEnd: height * 1.5,
        quoteMid:
          bounds.quote.top - height * 0.8 + 0.5 * (bounds.quote.height + height * 0.2),
        entry: bounds.camps.top - height * 0.5,
        start: bounds.camps.top,
        mid: bounds.camps.top + height * 1.5,
        end: bounds.camps.top + pin,
        reverse: bounds.camps.top - height * 0.5,
        // Start inside the footer, not a rounded-down fractional sliver of the
        // preceding lazy photograph (which may be entirely clipped).
        footer: Math.ceil(bounds.footer.top),
      };
      const states = [];
      for (const [state, y] of Object.entries(checkpoints)) {
        await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
        await page.waitForTimeout(400);
        await page.evaluate(() => {
          for (const image of document.images) {
            const r = image.getBoundingClientRect();
            if (
              r.bottom > 0 &&
              r.top < innerHeight &&
              r.right > 0 &&
              r.left < innerWidth
            )
              image.loading = "eager";
          }
          for (const video of document.querySelectorAll("video")) {
            video.pause();
            if (video.readyState >= 2) video.currentTime = 0;
          }
        });
        // Decode only after source selection/load. Calling decode on a still
        // source-less responsive lazy image can leave its promise pending.
        await page.waitForFunction(() =>
          [...document.images].every((image) => {
            const r = image.getBoundingClientRect();
            return (
              !(
                r.bottom > 0 &&
                r.top < innerHeight &&
                r.right > 0 &&
                r.left < innerWidth
              ) ||
              (image.complete && image.naturalWidth > 0)
            );
          }),
        );
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images]
              .filter((image) => image.complete && image.naturalWidth > 0)
              .map((image) => image.decode()),
          );
        });
        const measurements = await page.evaluate((s) => {
          const style = (k) => getComputedStyle(document.querySelector(s[k]));
          const title = style("title");
          const matrix = new DOMMatrixReadOnly(title.transform);
          const gradient = style("quote").maskImage;
          return {
            scrollY,
            mask: gradient,
            maskPosition: Number(gradient.match(/\)\s*(-?[\d.]+)%/)?.[1] ?? 100),
            titleSize: parseFloat(title.fontSize) * matrix.a,
            copyY: parseFloat(style("copy").top),
            trackX: new DOMMatrixReadOnly(style("track").transform).m41,
            clip: style("camps").clipPath,
          };
        }, selectors);
        const file = `${out}/${width}-${state}-${role}.png`;
        await page.screenshot({ path: file });
        (pairs[state] ||= {})[role] = file;
        states.push({ state, file, ...measurements });
      }
      await page.screenshot({
        path: `${out}/${width}-full-${role}.png`,
        fullPage: true,
      });
      const topology = await page.locator(".page-content").evaluate((e) => ({
        children: [...e.children].map((n) => ({
          tag: n.tagName,
          identity: n.getAttribute("data-fidelity-section") || n.className,
          top: n.getBoundingClientRect().top + scrollY,
          height: n.getBoundingClientRect().height,
        })),
        scrollHeight: document.documentElement.scrollHeight,
      }));
      evidence.push({
        role,
        url,
        viewport: { width, height },
        dpr: 1,
        readiness: reference
          ? "observed animated track"
          : "application-owned data-home-motion-ready",
        bounds,
        states,
        topology,
        errors,
      });
      await writeFile(
        `${out}/${width}-${role}-evidence.json`,
        JSON.stringify(evidence.at(-1), null, 2),
      );
      await page.close();
    }
    for (const [state, pair] of Object.entries(pairs))
      await compareImagePair({
        referencePath: pair.reference,
        actualPath: pair.actual,
        label: `${width}-${state}`,
        outputRoot: `${out}/diff`,
      });
    console.log(
      `${width}: independent reference / actual start, mid, end, reverse, full page and footer captured`,
    );
  }
} finally {
  await browser.close();
}
const results = [];
for (const width of [390, 768, 1440]) {
  const ref = evidence.find(
    (e) => e.role === "reference" && e.viewport.width === width,
  );
  const actual = evidence.find(
    (e) => e.role === "actual" && e.viewport.width === width,
  );
  for (const state of ["quoteMid", "entry", "start", "mid", "end", "reverse"]) {
    const r = ref.states.find((s) => s.state === state),
      a = actual.states.find((s) => s.state === state);
    const checks =
      state === "quoteMid"
        ? { mask: { delta: Math.abs(a.maskPosition - r.maskPosition), tolerance: 1 } }
        : {
            title: { delta: Math.abs(a.titleSize - r.titleSize), tolerance: 0.2 },
            copy: { delta: Math.abs(a.copyY - r.copyY), tolerance: 1 },
            track: { delta: Math.abs(a.trackX - r.trackX), tolerance: 2 },
            clip: {
              delta: Math.abs(
                Number(a.clip.match(/([\d.]+)%/)?.[1] ?? 0) -
                  Number(r.clip.match(/([\d.]+)%/)?.[1] ?? 0),
              ),
              tolerance: 0.1,
            },
          };
    results.push({
      width,
      state,
      checks,
      pass: Object.values(checks).every((c) => c.delta <= c.tolerance),
    });
  }
}
await writeFile(
  `${out}/evidence.json`,
  JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      evidence,
      results,
      pixelComparison:
        "diagnostic: ADELVA copy, approved shell/support/footer, video and image encoding differ; no global pixel equality",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results));
if (
  results.some((r) => !r.pass) ||
  evidence.some((e) => e.role === "actual" && e.errors.length)
)
  process.exitCode = 1;
