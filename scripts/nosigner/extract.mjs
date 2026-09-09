import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(10000);
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".disagree").click();
  await p.waitForTimeout(1500);
  const data = await p.evaluate(() => {
    const text = (e, s) => e.querySelector(s)?.textContent.trim();
    const img = (e) => ({
      src: new URL(e.getAttribute("src"), location.href).href,
      srcset: e.getAttribute("srcset"),
      current: e.currentSrc,
      width: e.width,
      height: e.height,
      naturalWidth: e.naturalWidth,
      naturalHeight: e.naturalHeight,
    });
    const rect = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height };
    };
    const styles = (e) => {
      const s = getComputedStyle(e);
      return Object.fromEntries(
        [
          "fontFamily",
          "fontSize",
          "fontWeight",
          "lineHeight",
          "color",
          "backgroundColor",
          "padding",
          "margin",
          "gap",
          "height",
          "display",
          "position",
          "transform",
        ].map((k) => [k, s[k]]),
      );
    };
    const cards = [...document.querySelectorAll(".solutionIssueItem")].map((e, i) => ({
      index: i,
      html: i === 0 ? e.outerHTML.slice(-6000) : undefined,
      promise: text(e, ".solutionIssuePromise"),
      label: text(e, ".solutionIssueLabelText"),
      body: text(e, ".solutionIssueBody"),
      href: e.querySelector("a")?.href,
      rect: rect(e),
      styles: styles(e),
      slider: e.querySelector("infinite-slider")?.outerHTML.slice(0, 1000),
      images: [...e.querySelectorAll(".sliderReal img")].map(img),
    }));
    return {
      width: innerWidth,
      height: innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyStyle: styles(document.body),
      cards,
      hero: [...document.querySelectorAll(".heroSlide")].map((e) => ({
        title: text(e, ".heroSlideTitleText"),
        mode: e.dataset.mode,
        href: e.querySelector("a").href,
        image: img(e.querySelector("img")),
      })),
      landmarks: [
        ...document.querySelectorAll(
          ".introSection,.heroSlideshow,.introKeyvisual,.introKeyvisualCanvas,#section-how,#section-why,.indexNews,footer-el,.footerWrapper,.footerInner,.topHeading,.indexSolutionBody",
        ),
      ].map((e) => ({
        selector: e.id ? "#" + e.id : e.className || e.tagName,
        rect: rect(e),
        styles: styles(e),
      })),
      news: [...document.querySelectorAll(".topNewsUnit")].map((e) => ({
        title: text(e, "h3"),
        date: text(e, "time"),
        datetime: e.querySelector("time").dateTime,
        category: text(e, ".categoryDate span"),
        href: e.querySelector("a").href,
        image: img(e.querySelector("img")),
      })),
      footer: document.querySelector("footer-el").innerText,
      links: [...document.querySelectorAll("menu-nav a,footer-el a")].map((e) => ({
        href: e.href,
        label:
          e.querySelector(".cursorLinkText")?.textContent.trim() ||
          e.textContent.trim(),
      })),
      symbols: document.querySelector(".svgComp").innerHTML,
    };
  });
  await writeFile(
    `references/nosigner/extract-${width}.json`,
    JSON.stringify(data, null, 2),
  );
  // Time-based media are normalized after the site's custom elements initialize.
  await p.evaluate(() => {
    for (const a of document.getAnimations()) a.pause();
    document.querySelector(".optin").style.display = "none";
    document.querySelectorAll(".heroSlide").forEach((e, i) => {
      e.classList.toggle("isActive", i === 0);
      e.style.opacity = i === 0 ? "1" : "0";
    });
    document
      .querySelectorAll(".sliderReal")
      .forEach((e) => (e.style.transform = "translateX(0px)"));
  });
  await p.screenshot({
    path: `references/nosigner/home-${width}-full.png`,
    fullPage: true,
    timeout: 60000,
  });
  for (const [name, y] of [
    ["hero", 0],
    ["intro", height],
    ["intro-end", height * 1.6],
    ["how", data.landmarks.find((x) => x.selector === "#section-how").rect.y],
    ["why", data.landmarks.find((x) => x.selector === "#section-why").rect.y],
    ["news", data.landmarks.find((x) => x.selector === "indexNews").rect.y],
    ["footer", data.scrollHeight - height],
  ]) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(1100);
    await p.screenshot({ path: `references/nosigner/home-${width}-${name}.png` });
  }
  await p.locator(".menuButton").click();
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `references/nosigner/home-${width}-menu.png` });
  await writeFile(
    `references/nosigner/menu-${width}.html`,
    await p.locator("menu-nav").innerHTML(),
  );
  console.log(
    width,
    data.scrollHeight,
    data.cards.length,
    JSON.stringify(data.landmarks.map((x) => [x.selector, x.rect])),
  );
  await p.close();
}
await b.close();
