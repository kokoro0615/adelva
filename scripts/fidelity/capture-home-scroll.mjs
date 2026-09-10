import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs/promises";
const out = "artifacts/home-scroll-2026-09-10/final";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const evidence = [];
for (const [width, height] of [
  [390, 844],
  [768, 1024],
  [1440, 900],
]) {
  const captures = [];
  for (const [name, url] of [
    ["reference", "https://white-desert.com/"],
    ["actual", process.env.HOME_SCROLL_URL ?? "http://127.0.0.1:4197/"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "domcontentloaded" });
    console.log(name, width, "loaded");
    await page.waitForFunction(() => document.fonts.status === "loaded", undefined, {
      timeout: 15000,
    });
    await page.waitForTimeout(1200);
    const states =
      name === "reference"
        ? ["hero", "purpose"]
        : [
            "hero",
            "mist",
            "purpose",
            "support",
            "expertise-entry",
            "expertise-mid",
            "expertise-end",
            "expertise-reverse",
            "approach",
            "footer",
          ];
    const frames = [];
    for (const state of states) {
      console.log(name, width, state);
      await page.evaluate(
        async ({ state, height }) => {
          document.querySelectorAll("video").forEach((v) => {
            v.pause();
            v.currentTime = 0;
          });
          let y = 0;
          if (state === "mist") y = height * 0.9;
          if (state === "purpose") y = height * 2 + 100;
          const select = {
            support: "[data-support-section]",
            approach: "#approach",
            footer: "[data-home-footer]",
          };
          if (select[state]) {
            const e = document.querySelector(select[state]);
            y = scrollY + e.getBoundingClientRect().top;
          }
          if (state.startsWith("expertise")) {
            const e = document.querySelector(".camps");
            const h = document.querySelector(".camps__viewport").clientHeight;
            const f = {
              "expertise-entry": 0,
              "expertise-mid": 0.5,
              "expertise-end": 1,
              "expertise-reverse": 0.5,
            }[state];
            y = scrollY + e.getBoundingClientRect().top + (e.offsetHeight - h) * f;
          }
          scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          );
          await Promise.all(
            [...document.images]
              .filter((i) => {
                const r = i.getBoundingClientRect();
                return (
                  r.bottom > 0 &&
                  r.top < innerHeight &&
                  r.right > 0 &&
                  r.left < innerWidth
                );
              })
              .map((i) => {
                i.loading = "eager";
                return i.decode().catch(() => {});
              }),
          );
        },
        { name, state, height },
      );
      await page.waitForTimeout(160);
      const png = await page.screenshot();
      if (name === "reference")
        await fs.writeFile(`${out}/reference-${width}-${state}.png`, png);
      if (state === "hero" || state === "purpose") captures.push({ name, state, png });
      frames.push(png);
      evidence.push({
        name,
        width,
        height,
        state,
        scrollY: await page.evaluate(() => scrollY),
        errors: [...errors],
      });
    }
    if (name === "actual") {
      const tileWidth = width === 390 ? 390 : 480;
      const tileHeight = Math.round((height * tileWidth) / width);
      const columns = 5;
      const tiles = await Promise.all(
        frames.map((png) => sharp(png).resize(tileWidth, tileHeight).toBuffer()),
      );
      await sharp({
        create: {
          width: columns * tileWidth,
          height: 2 * tileHeight,
          channels: 3,
          background: "#ffffff",
        },
      })
        .composite(
          tiles.map((input, i) => ({
            input,
            left: (i % columns) * tileWidth,
            top: Math.floor(i / columns) * tileHeight,
          })),
        )
        .png()
        .toFile(`${out}/actual-${width}-sequence.png`);
    }
    await page.close();
  }
  for (const state of ["hero", "purpose"]) {
    const ref = captures.find((c) => c.name === "reference" && c.state === state).png;
    const actual = captures.find((c) => c.name === "actual" && c.state === state).png;
    await sharp({
      create: { width: width * 2, height, channels: 3, background: "#fff" },
    })
      .composite([
        { input: ref, left: 0, top: 0 },
        { input: actual, left: width, top: 0 },
      ])
      .png()
      .toFile(`${out}/compare-${width}-${state}.png`);
  }
}
await fs.writeFile(`${out}/captures.json`, JSON.stringify(evidence, null, 2));
await browser.close();
console.log(
  `${evidence.length} states captured; reference left / actual right; sequence order hero, mist, purpose, support, expertise entry, mid, end, reverse, approach, footer.`,
);
