import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const [role = "reference", origin = "https://white-desert.com/"] =
  process.argv.slice(2);
const out = `artifacts/last-continent/${role}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    const selector = role === "reference" ? ".home-section" : ".last-continent";
    await page.locator(selector).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    // The live target and implementation both attach scroll-linked transforms
    // after hydration. Observe them before sampling any client-owned state.
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForFunction(() => {
      const layer = document.querySelector(
        '[data-motion-layer="hero-wrapper"], .hero-banner_wrapper',
      );
      return layer && getComputedStyle(layer).transform !== "none";
    });
    const samples = [];
    for (const [state, offset] of [
      ["entry", -height / 2],
      ["start", 0],
      ["center", 200],
      ["reverse", 0],
    ]) {
      const top = await page
        .locator(selector)
        .first()
        .evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
      await page.evaluate((y) => window.scrollTo(0, y), top + offset);
      await page.waitForTimeout(1600);
      samples.push(
        await page
          .locator(selector)
          .first()
          .evaluate((e, state) => {
            const measure = (el) => {
              const cs = getComputedStyle(el);
              return {
                tag: el.tagName,
                class: el.className,
                rect: el.getBoundingClientRect().toJSON(),
                style: Object.fromEntries(
                  [
                    "backgroundColor",
                    "backgroundImage",
                    "position",
                    "zIndex",
                    "padding",
                    "margin",
                    "width",
                    "fontFamily",
                    "fontSize",
                    "fontWeight",
                    "lineHeight",
                    "textIndent",
                    "color",
                    "transform",
                  ].map((k) => [k, cs[k]]),
                ),
              };
            };
            return {
              state,
              scrollY: window.scrollY,
              section: measure(e),
              children: [
                ...e.querySelectorAll(
                  "section, .container-large, .home-intro_col, .v-flex_left-med, p, h3, svg",
                ),
              ].map(measure),
              edges: [1, innerWidth - 1].map((x) =>
                document
                  .elementsFromPoint(x, innerHeight / 2)
                  .slice(0, 6)
                  .map((el) => el.className),
              ),
            };
          }, state),
      );
      await page.screenshot({ path: `${out}/${name}-${state}.png` });
    }
    await writeFile(
      `${out}/${name}.json`,
      JSON.stringify({ viewport: { width, height }, errors, samples }, null, 2),
    );
    console.log(JSON.stringify({ role, name, errors, start: samples[1] }));
    await page.close();
  }
} finally {
  await browser.close();
}
