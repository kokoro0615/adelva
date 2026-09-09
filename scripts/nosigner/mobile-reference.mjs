import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(9000);
await p.locator(".disagree").click();
await p.waitForTimeout(1000);
console.log(
  await p.evaluate(() => ({
    h: document.documentElement.scrollHeight,
    b: document.body.scrollHeight,
    html: getComputedStyle(document.documentElement).cssText,
    body: document.body.getAttribute("style"),
    root: document.documentElement.outerHTML.slice(0, 500),
    containers: [
      ...document.querySelectorAll(".pageContainer,.pageContainerInner"),
    ].map((e) => ({
      style: e.getAttribute("style"),
      height: getComputedStyle(e).height,
    })),
  })),
);
for (const y of [0, 844, 1888, 5324, 8714]) {
  await p.evaluate((y) => document.querySelector(".pageContainer").scrollTo(0, y), y);
  await p.waitForTimeout(1800);
  console.log(
    "requested",
    y,
    "actual",
    await p.evaluate(() => document.querySelector(".pageContainer").scrollTop),
  );
  await p.screenshot({ path: `references/nosigner/mobile-touch-${y}.png` });
}
await b.close();
