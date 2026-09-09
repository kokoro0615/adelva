import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "references/morght";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.goto("https://morght.com/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(4500);
  const data = await page.evaluate(() => {
    const rect = (e) => {
      const r = e.getBoundingClientRect();
      const c = getComputedStyle(e);
      return {
        tag: e.tagName,
        class: e.className,
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
        font: c.font,
        fontFamily: c.fontFamily,
        lineHeight: c.lineHeight,
        letterSpacing: c.letterSpacing,
        color: c.color,
        background: c.background,
        padding: c.padding,
        margin: c.margin,
        transform: c.transform,
        position: c.position,
      };
    };
    return {
      url: location.href,
      observedAt: new Date().toISOString(),
      width: innerWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      sections: [...document.querySelectorAll("main > *, footer")].map((e) => ({
        ...rect(e),
        text: e.innerText,
        html: e.outerHTML,
        children: [...e.children].map(rect),
        details: [
          ...e.querySelectorAll("h1,h2,p,img,[class*=heading],[class*=title]"),
        ].map((e) => ({
          ...rect(e),
          src: e.currentSrc,
          alt: e.alt,
          text: e.tagName === "IMG" ? undefined : e.textContent?.slice(0, 300),
        })),
      })),
      links: [...document.querySelectorAll("a[href]")].map((e) => ({
        href: e.href,
        text: e.textContent.trim(),
        class: e.className,
      })),
      assets: [...document.images].map((e) => ({
        src: e.src,
        currentSrc: e.currentSrc,
        srcset: e.srcset,
        width: e.naturalWidth,
        height: e.naturalHeight,
        alt: e.alt,
      })),
      fonts: [...document.fonts].map((f) => ({
        family: f.family,
        weight: f.weight,
        status: f.status,
      })),
      styles: [...document.querySelectorAll("link[rel=stylesheet]")].map((e) => e.href),
      header: document.querySelector("header")?.outerHTML,
      footer: document.querySelector("footer")?.outerHTML,
    };
  });
  await page.screenshot({ path: `${out}/${width}-top.png` });
  for (let y = 0; y < data.scrollHeight; y += height * 0.8) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${width}-full.png`, fullPage: true });
  for (let i = 0; i < data.sections.length; i++) {
    const s = data.sections[i];
    await page.evaluate((y) => scrollTo(0, y), s.y);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${width}-section-${i}.png` });
  }
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${width}-menu.png` });
  data.menu = await page.evaluate(() => ({
    html: document.querySelector('[x-data="siteMenu"]')?.outerHTML,
    links: [...document.querySelectorAll("a")]
      .filter((e) => e.getBoundingClientRect().width)
      .map((e) => ({ href: e.href, text: e.innerText })),
  }));
  await writeFile(`${out}/${width}.json`, JSON.stringify(data, null, 2));
  console.log(
    width,
    data.scrollHeight,
    data.sections.map((e) => [e.tag, e.class, e.y, e.height]),
  );
  await page.close();
}
await browser.close();
