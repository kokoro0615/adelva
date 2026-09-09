import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const b = await chromium.launch();
await mkdir("references/nosigner/actual", { recursive: true });
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const p = await b.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  let errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.NS_URL || "http://127.0.0.1:3002/challenges", {
    waitUntil: "domcontentloaded",
  });
  await p.waitForSelector('[data-ns-ready="true"]');
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (img) => {
        img.loading = "eager";
        await img.decode().catch(() => {});
      }),
    );
  });
  await p.getByRole("button", { name: "必要なクッキーのみ" }).click();
  await p.mouse.move(0, 0);
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const data = await p.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    landmarks: [...document.querySelectorAll("[data-ns-section],[data-ns-shell]")].map(
      (e) => {
        const r = e.getBoundingClientRect();
        return {
          id: e.dataset.nsSection || e.dataset.nsShell,
          tag: e.tagName,
          parent: e.parentElement.className,
          x: r.x,
          y: r.y + scrollY,
          width: r.width,
          height: r.height,
          items: e.querySelectorAll(":scope > ul > li").length,
        };
      },
    ),
  }));
  await writeFile(
    `references/nosigner/actual/${width}.json`,
    JSON.stringify({ ...data, errors }, null, 2),
  );
  for (const [name, y] of [
    ["hero", 0],
    ["intro", height],
    ["intro-end", height * 1.6],
    ["how", data.landmarks.find((e) => e.id === "how").y],
    ["why", data.landmarks.find((e) => e.id === "why").y],
    ["news", data.landmarks.find((e) => e.id === "news").y],
    ["quote-form", data.landmarks.find((e) => e.id === "quote-form").y],
    ["quote-future", data.landmarks.find((e) => e.id === "quote-future").y],
    ["footer", data.scrollHeight - height],
  ]) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `references/nosigner/actual/${width}-${name}.png` });
  }
  for (let i = 0; i < 16; i++) {
    const item = p.locator(".ns-strip").nth(i);
    await p.evaluate(
      (y) => window.scrollTo(0, y),
      data.landmarks.find((e) => e.id === `strip-${i}`).y,
    );
    await p.waitForTimeout(300);
    await p.mouse.move(0, 0);
    await item.screenshot({
      path: `references/nosigner/actual/${width}-strip-${i}.png`,
    });
  }
  const tiles = [];
  for (let y = 0; y < data.scrollHeight; y += height) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(200);
    const path = `references/nosigner/actual/${width}-checkpoint-${tiles.length}.png`;
    tiles.push({ y: await p.evaluate(() => scrollY), path });
    await p.screenshot({ path });
  }
  await writeFile(
    `references/nosigner/actual/${width}.json`,
    JSON.stringify(
      {
        ...data,
        tiles,
        errors,
        observedAt: new Date().toISOString(),
        source: process.env.NS_URL || "http://127.0.0.1:3002/challenges",
      },
      null,
      2,
    ),
  );
  await p.getByRole("button", { name: "メニューを開く" }).click();
  await p.screenshot({ path: `references/nosigner/actual/${width}-menu.png` });
  console.log(width, data.scrollHeight, errors);
  await p.close();
}
await b.close();
