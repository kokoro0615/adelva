import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { compareImagePair } from "./compare-reference.mjs";

// Full, unmasked frames: the approved ADELVA header and target consent overlay
// remain visible. These are diagnostic reference comparisons, not goldens.
const outputRoot = "artifacts/home-lower-2026-09-08";
await mkdir(outputRoot, { recursive: true });
const previous =
  process.env.HOME_LOWER_REUSE_REFERENCE === "1"
    ? JSON.parse(await readFile(`${outputRoot}/capture.json`, "utf8"))
    : null;
const browser = await chromium.launch();
const evidence = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    const pairs = {};
    for (const [kind, url] of [
      ["reference", "https://white-desert.com/"],
      ["actual", process.env.HOME_LOWER_URL || "http://127.0.0.1:3002/"],
    ]) {
      if (kind === "reference" && previous) {
        const saved = previous.evidence.find(
          (e) => e.kind === kind && e.viewport.width === viewport.width,
        );
        if (!saved) throw new Error("Missing independent reference evidence");
        evidence.push({ ...saved, reusedFrom: previous.capturedAt });
        for (const state of Object.keys(saved.checkpoints)) {
          (pairs[state] ||= {}).reference =
            `${outputRoot}/${viewport.width}-${state}-reference.png`;
        }
        continue;
      }
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      if (kind === "actual")
        await page.locator('.camps__track[style*="transform"]').waitFor();
      else
        await page
          .locator('.horizontal-scroll_container[style*="transform"]')
          .waitFor();
      const selectors =
        kind === "reference"
          ? {
              camps: ".horizontal-scroll",
              globe: ".travel-globe",
              planning: ".basic-banner",
              footer: ".footer-component",
            }
          : {
              camps: ".camps",
              globe: ".globe",
              planning: ".planning",
              footer: "footer",
            };
      await page.locator(selectors.footer).waitFor({ state: "attached" });
      await page.locator(selectors.planning).waitFor({ state: "attached" });
      const bounds = await page.evaluate(
        (selectors) =>
          Object.fromEntries(
            Object.entries(selectors).map(([key, selector]) => {
              const e = document.querySelector(selector);
              const r = e.getBoundingClientRect();
              return [key, { top: r.top + scrollY, height: r.height }];
            }),
          ),
        selectors,
      );
      const pin = viewport.width === 1440 ? 8550 : viewport.width === 768 ? 6340 : 4450;
      const checkpoints = {
        intro: bounds.camps.top,
        wipe: bounds.camps.top + viewport.height,
        cards: bounds.camps.top + pin * 0.58,
        quote: bounds.camps.top + pin,
        bridge: bounds.camps.top + pin + viewport.height + 550,
        globe: bounds.globe.top + 720,
        planning: bounds.planning.top + viewport.height * 0.25,
        footer: bounds.footer.top,
      };
      for (const [state, y] of Object.entries(checkpoints)) {
        await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(700);
        await page.evaluate(async () => {
          await Promise.all(
            [...document.images]
              .filter((img) => {
                const r = img.getBoundingClientRect();
                return (
                  r.width > 0 &&
                  r.height > 0 &&
                  r.right > 0 &&
                  r.left < innerWidth &&
                  r.bottom > 0 &&
                  r.top < innerHeight
                );
              })
              .map((img) => img.decode().catch(() => {})),
          );
        });
        const path = `${outputRoot}/${viewport.width}-${state}-${kind}.png`;
        await page.screenshot({ path });
        (pairs[state] ||= {})[kind] = path;
      }
      evidence.push({ kind, url, viewport, bounds, checkpoints, errors });
      await context.close();
    }
    for (const [state, pair] of Object.entries(pairs)) {
      await compareImagePair({
        referencePath: pair.reference,
        actualPath: pair.actual,
        label: `${viewport.width}-${state}`,
        outputRoot,
      });
    }
    console.log(
      `${viewport.width}: eight external-reference pairs captured and compared`,
    );
  }
  await writeFile(
    `${outputRoot}/capture.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        policy:
          "DPR1, no-preference, fonts and visible images loaded, instant scroll plus 700ms settle, unmasked full viewport",
        evidence,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
