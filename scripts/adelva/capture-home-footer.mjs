import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.FOOTER_BASE_URL || "http://127.0.0.1:4197";
const out = "artifacts/adelva-home-footer";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const measurements = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.locator('[data-home-footer="adelva-2026-09-09"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  const footer = page.locator("[data-home-footer]");
  await footer.scrollIntoViewIfNeeded();
  await footer.locator("img").evaluate((i) => i.decode());
  await page.waitForTimeout(500);
  await page.evaluate(() =>
    window.scrollTo({
      top:
        document.querySelector("[data-home-footer]").getBoundingClientRect().top +
        scrollY,
      behavior: "instant",
    }),
  );
  await page.screenshot({ path: `${out}/${width}-viewport.png` });
  const style = await page.addStyleTag({
    content:
      "header,.how-it-works,nextjs-portal{visibility:hidden!important} *{caret-color:transparent!important}",
  });
  await footer.screenshot({
    path: `${out}/${width}-footer.png`,
    animations: "disabled",
  });
  const info = await footer.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      height: box.height,
      width: box.width,
      documentTop: box.top + scrollY,
      items: [...el.querySelectorAll("h2,h3,nav,a,nav section")].map((n) => {
        const b = n.getBoundingClientRect();
        const s = getComputedStyle(n);
        return {
          tag: n.tagName,
          text: n.textContent,
          x: b.x - box.x,
          y: b.y - box.y,
          width: b.width,
          height: b.height,
          font: s.fontFamily,
          fontSize: s.fontSize,
        };
      }),
    };
  });
  measurements.push({
    viewport: { width, height },
    base,
    marker: "adelva-2026-09-09",
    ...info,
    errors,
  });
  await style.evaluate((n) => n.remove());
  await page.close();
}
await writeFile(`${out}/capture.json`, JSON.stringify(measurements, null, 2) + "\n");
await browser.close();
console.log(
  JSON.stringify(
    measurements.map((m) => ({ width: m.width, height: m.height, errors: m.errors })),
    null,
    2,
  ),
);
