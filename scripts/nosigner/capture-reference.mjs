import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const b = await chromium.launch();
await mkdir("references/nosigner/reference", { recursive: true });
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  if (process.env.NS_WIDTH && Number(process.env.NS_WIDTH) !== width) continue;
  const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector('html[data-loading-complete="true"]');
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (img) => {
        img.loading = "eager";
        await img.decode().catch(() => {});
      }),
    );
  });
  await p.waitForTimeout(2500);
  await p.locator(".disagree").click();
  await p.mouse.move(0, 0);
  await p.waitForTimeout(800);
  await p.addStyleTag({
    content:
      ".heroSlide{opacity:0!important;transition:none!important}.heroSlide:first-child{opacity:1!important}.heroSlide img{animation:none!important;object-position:50% 50%!important}.sliderReal{animation:none!important;transform:translateX(0)!important}.sliderDecoy{display:none!important}.heroProgressBar{width:0!important;transition:none!important}.optin{display:none!important}",
  });
  const data = await p.evaluate(() => {
    const root =
      innerWidth < 768
        ? document.querySelector(".pageContainer")
        : document.documentElement;
    const cards = [...document.querySelectorAll(".solutionIssueItem")];
    const sels = [
      ".introSection",
      ".sectionSolution",
      "#section-citation",
      "#section-why",
      ".indexNews",
      "index-main > citation-layer",
      "footer-el",
    ];
    const ids = ["intro", "how", "quote-form", "why", "news", "quote-future", "footer"];
    return {
      width: innerWidth,
      height: innerHeight,
      scrollHeight: root.scrollHeight,
      scrollRoot: innerWidth < 768 ? ".pageContainer" : "document",
      landmarks: [
        ...sels.map((s, i) => ({ el: document.querySelector(s), id: ids[i] })),
        ...cards.map((el, i) => ({ el, id: "strip-" + i })),
      ].map(({ el: e, id }) => {
        const r = e.getBoundingClientRect();
        return {
          id,
          tag: e.tagName,
          x: r.x,
          y: r.y + root.scrollTop,
          width: r.width,
          height: r.height,
          items: e.querySelectorAll(".solutionIssueItem,.topNewsUnit").length,
        };
      }),
    };
  });
  const scroll = async (y) => {
    await p.evaluate((y) => {
      const root = innerWidth < 768 ? document.querySelector(".pageContainer") : window;
      root.scrollTo(0, y);
    }, y);
    await p.waitForTimeout(1800);
  };
  for (const row of data.landmarks.filter((e) => e.id.startsWith("strip"))) {
    await scroll(row.y);
    await p
      .locator(".solutionIssueItem")
      .nth(Number(row.id.split("-")[1]))
      .screenshot({ path: `references/nosigner/reference/${width}-${row.id}.png` });
  }
  for (const [name, y] of [
    ["hero", 0],
    ["intro", height],
    ["intro-end", height * 1.6],
    ["how", data.landmarks.find((e) => e.id === "how").y],
    ["why", data.landmarks.find((e) => e.id === "why").y],
    ["news", data.landmarks.find((e) => e.id === "news").y],
    ["footer", data.scrollHeight - height],
    ["quote-form", data.landmarks.find((e) => e.id === "quote-form").y],
    ["quote-future", data.landmarks.find((e) => e.id === "quote-future").y],
  ]) {
    await scroll(y);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `references/nosigner/reference/${width}-${name}.png` });
  }
  // Whole-page evidence for the actual scroll root: tile real viewport captures;
  // no relabeling of mobile scrollY=0 frames as full-page evidence.
  const tiles = [];
  for (let y = 0; y < data.scrollHeight; y += height) {
    await scroll(y);
    const actual = await p.evaluate(() =>
      innerWidth < 768 ? document.querySelector(".pageContainer").scrollTop : scrollY,
    );
    tiles.push({
      y: actual,
      path: `references/nosigner/reference/${width}-checkpoint-${tiles.length}.png`,
    });
    await p.screenshot({ path: tiles.at(-1).path });
  }
  await writeFile(
    `references/nosigner/reference/${width}.json`,
    JSON.stringify(
      {
        ...data,
        tiles,
        source: "https://nosigner.com/ja/",
        observedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  await p.locator(".menuButton").click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `references/nosigner/reference/${width}-menu.png` });
  console.log(width, data.scrollHeight);
  await p.close();
}
await b.close();
