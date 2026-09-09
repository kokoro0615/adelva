import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const reference = process.argv.includes("--reference");
const origin = process.env.NOSIGNER_TEST_BASE_URL || "http://127.0.0.1:3002";
const directory = "references/nosigner/ambient-2026-09-09";
const label = reference ? "reference" : "actual";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
const onlyWidth = Number(process.env.NS_WIDTH || 0);
const observations = onlyWidth
  ? JSON.parse(
      await readFile(`${directory}/${label}-observations.json`),
    ).observations.filter((sample) => sample.width !== onlyWidth)
  : [];
try {
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    if (onlyWidth && width !== onlyWidth) continue;
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      // Test-only deterministic GPU sampling, installed before any context exists.
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, options) {
        return getContext.call(
          this,
          kind,
          kind.includes("webgl")
            ? { ...options, preserveDrawingBuffer: true }
            : options,
        );
      };
      for (const type of [WebGLRenderingContext, WebGL2RenderingContext]) {
        const names = new Map();
        const get = type.prototype.getUniformLocation,
          set = type.prototype.uniform1f;
        type.prototype.getUniformLocation = function (program, name) {
          const result = get.call(this, program, name);
          names.set(result, name);
          return result;
        };
        type.prototype.uniform1f = function (location, value) {
          return set.call(
            this,
            location,
            ["time", "uTime"].includes(names.get(location)) ? 12 : value,
          );
        };
      }
    });
    await page.goto(reference ? "https://nosigner.com/ja/" : `${origin}/challenges`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(
      reference ? 'html[data-loading-complete="true"]' : '[data-ns-ready="true"]',
    );
    await page.evaluate(() => document.fonts.ready);
    if (reference) await page.waitForTimeout(6000);
    await page.waitForSelector(
      reference
        ? '[data-place="background"] canvas'
        : '.ns-ambient[data-renderer="webgl"]',
    );
    for (const [name, y] of [
      ["intro", 1100],
      ["light", width === 390 ? 4500 : 5800],
      ["news", width === 390 ? 7400 : 9400],
      ["closing", width === 390 ? 8400 : 9900],
      ["reverse", 1100],
    ]) {
      if (name === "news") {
        // Leave the first citation before entering the second: separate source
        // observers otherwise race their release/fix tweens on a large jump.
        await page.evaluate(
          ({ reference, y }) => {
            if (reference && innerWidth < 768)
              document.querySelector(".pageContainer").scrollTop = y;
            else scrollTo(0, y);
          },
          { reference, y: width === 390 ? 6000 : 7000 },
        );
        await page.waitForTimeout(1200);
      }
      await page.evaluate(
        ({ reference, y }) => {
          if (reference && innerWidth < 768)
            document.querySelector(".pageContainer").scrollTop = y;
          else scrollTo(0, y);
        },
        { reference, y },
      );
      await page.waitForTimeout(reference ? 4500 : 1800);
      const sample = await page.evaluate(async (reference) => {
        const canvas = document.querySelector(
          reference ? '[data-place="background"] canvas' : ".ns-ambient",
        );
        const quotes = [
          ...document.querySelectorAll(reference ? ".citation" : ".ns-quote"),
        ].map((e) => e.getBoundingClientRect().toJSON());
        let uniforms;
        if (reference) {
          const { w } = await import("/_astro/webglStores.DHdHc_Ce.js");
          uniforms = Object.fromEntries(
            Object.entries(w.bgWebglApp.fullScreenInstance.material.uniforms).map(
              ([k, v]) => [k, v.value],
            ),
          );
        }
        return {
          image: canvas.toDataURL(),
          canvasWidth: canvas.clientWidth,
          canvasHeight: canvas.clientHeight,
          y:
            reference && innerWidth < 768
              ? document.querySelector(".pageContainer").scrollTop
              : scrollY,
          theme: reference
            ? document.documentElement.dataset.colorMode
            : document.querySelector(".ns-page").dataset.ambientTheme,
          quotes,
          uniforms,
        };
      }, reference);
      const { image, ...data } = sample;
      const path = `${directory}/${label}-${name}-${width}.png`;
      await sharp(Buffer.from(image.split(",")[1], "base64"))
        .resize(data.canvasWidth, data.canvasHeight)
        .png()
        .toFile(path);
      // Keep a composed page checkpoint as distinct evidence of stacking and text.
      if (name === "light" || name === "closing")
        await page.screenshot({
          path: `${directory}/${label}-page-${name}-${width}.png`,
        });
      observations.push({
        width,
        height,
        name,
        path,
        time: 12,
        ...data,
        errors: [...errors],
      });
      console.log(label, width, name, data.theme);
    }
    await page.close();
  }
  await writeFile(
    `${directory}/${label}-observations.json`,
    JSON.stringify(
      {
        url: reference ? "https://nosigner.com/ja/" : `${origin}/challenges`,
        capturedAt: new Date().toISOString(),
        observations,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
