import { chromium } from "@playwright/test";
const b = await chromium.launch();
for (const width of [768, 390])
  for (const target of [true, false]) {
    const p = await b.newPage({
      viewport: { width, height: width === 768 ? 1024 : 844 },
      reducedMotion: "reduce",
    });
    await p.goto(
      target ? "https://nosigner.com/ja/" : "http://127.0.0.1:3002/challenges",
      { waitUntil: "domcontentloaded" },
    );
    await p.waitForTimeout(2200);
    await p.evaluate(() => document.fonts.ready);
    console.log(
      width,
      target,
      await p.evaluate((target) => {
        const sels = target
          ? [
              ".footerNav",
              ".footerLogo",
              ".footerLinks",
              ".footerLinksSub",
              ".footerLinksMain",
              ".footerLinksMainUnit",
              ".footerConversions",
              ".footerButtons",
              ".footerSocials",
              ".footerCopy",
            ]
          : [
              ".ns-footer-nav",
              ".ns-footer-logo",
              ".ns-footer-links",
              ".ns-footer-sub",
              ".ns-footer-main",
              ".ns-footer-main > div",
              ".ns-footer-conversion",
              ".ns-conversions",
              ".ns-socials",
              ".ns-footer-copy",
            ];
        return sels.map((s) => {
          const e = document.querySelector(s);
          const r = e.getBoundingClientRect();
          return [
            s,
            {
              x: r.x,
              w: r.width,
              h: r.height,
              y: r.y,
              p: getComputedStyle(e).padding,
              gap: getComputedStyle(e).gap,
            },
          ];
        });
      }, target),
    );
    await p.close();
  }
await b.close();
