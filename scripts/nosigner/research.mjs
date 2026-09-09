import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "references/nosigner";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto("https://nosigner.com/ja/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(7000);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${out}/home-${width}-top.png` });
  const info = await page.evaluate(() => ({
    title: document.title,
    height: document.documentElement.scrollHeight,
    bodyClass: document.body.className,
    html: document.documentElement.outerHTML,
    styles: [...document.styleSheets].map((s) => s.href),
    scripts: [...document.scripts].map((s) => s.src),
    headings: [...document.querySelectorAll("h1,h2,h3")].map((x) => ({
      text: x.innerText,
      tag: x.tagName,
      cls: x.className,
      rect: x.getBoundingClientRect().toJSON(),
    })),
    children: [...document.body.children].map((x) => ({
      tag: x.tagName,
      cls: x.className,
      id: x.id,
    })),
    links: [...document.querySelectorAll("a")].map((x) => ({
      text: x.innerText,
      href: x.href,
    })),
  }));
  await writeFile(`${out}/home-${width}.json`, JSON.stringify(info, null, 2));
  console.log(
    width,
    info.height,
    JSON.stringify(info.children),
    JSON.stringify(info.headings).slice(0, 5000),
  );
  await page.close();
}
await browser.close();
