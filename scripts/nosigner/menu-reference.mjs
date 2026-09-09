import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const p = await b.newPage({ viewport: { width, height } });
  await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector("html[data-loading-complete=true]");
  await p.evaluate(() => document.fonts.ready);
  await p.locator(".disagree").click();
  await p.locator(".menuButton").click();
  await p.waitForTimeout(1400);
  await p.evaluate(() => (document.querySelector(".menuInner").scrollTop = 0));
  await p.mouse.move(0, 0);
  await p.screenshot({ path: `references/nosigner/reference/${width}-menu.png` });
  const d = await p.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".menuInner,.menuInner div,.menuInner ul,.menuInner input,.menuInner .button,.menuInner .snsList a",
      ),
    ]
      .filter((e) => e.className || e.tagName === "INPUT")
      .map((e) => {
        let s = getComputedStyle(e);
        return {
          tag: e.tagName,
          cl: e.className,
          rect: e.getBoundingClientRect().toJSON(),
          styles: {
            font: s.font,
            padding: s.padding,
            gap: s.gap,
            margin: s.margin,
            display: s.display,
          },
        };
      }),
  );
  await writeFile(
    `references/nosigner/reference/${width}-menu.json`,
    JSON.stringify(d, null, 2),
  );
  console.log(width);
  await p.close();
}
await b.close();
