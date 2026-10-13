// Polish harness (2026-10-13, shared chrome): header label contrast over every
// page's own imagery. For each route and state (top, scrolled under the bar,
// over the footer) it screenshots the page twice — once as is, once with the
// bar's ink made transparent — and measures each label (brand word, contact
// call, menu control or primary items) against its real backdrop: light ink
// against the light end (90th percentile) of the pixels under it, dark ink
// against the dark end (10th percentile). axe cannot see photographs, canvas
// or film, so this is the measurement of record for the bar.
// usage (repo root): node scripts/adelva/polish/measure-header-contrast.mjs <base> <out.json> [w=390] [h=844] [routes]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { chromium } = req("@playwright/test");
const sharp = req("sharp");

const [base, out, w = "390", h = "844", list] = process.argv.slice(2);
const routes = (
  list ||
  "/,/challenges,/challenges/owner,/challenges/general-managers,/services/management-operations,/services/revenue-brand,/services/dx-it-procurement,/approach,/about,/contact"
).split(",");
const mobile = +w < 1024;
const lin = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const rows = [];
for (const route of routes) {
  const ctx = await browser.newContext({
    viewport: { width: +w, height: +h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(2500);
  const footerY = await page.evaluate(() => {
    const f = document.querySelector("[data-site-footer]");
    return f ? f.getBoundingClientRect().top + scrollY + 40 : null;
  });
  for (const [state, y] of [
    ["top", 0],
    ["scrolled", Math.round(+h * 1.3)],
    ["footer", footerY],
  ]) {
    if (y === null) continue;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(1000);
    const labels = await page.evaluate(() => {
      const header = document.querySelector(
        "header[data-fidelity-landmark='header-nav']",
      );
      const pick = [
        ...header.querySelectorAll(
          "[data-brand-word], [class*='ctaCompact'], [class*='cta_'], [class*='__cta'], [class*='__item'], [class*='__burger'] span",
        ),
      ];
      return pick
        .map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const isBurger = el.parentElement?.className.includes("burger");
          const color = isBurger ? cs.backgroundColor : cs.color;
          return {
            name: (el.textContent || "burger").trim().slice(0, 10) || "burger",
            x: r.left,
            y: r.top,
            w: r.width,
            h: Math.max(r.height, 2),
            color,
            visible:
              r.width > 0 &&
              cs.visibility !== "hidden" &&
              cs.display !== "none" &&
              Number(cs.opacity) > 0.5,
          };
        })
        .filter((l) => l.visible && l.y < 120);
    });
    const shotA = await page.screenshot();
    const style = await page.addStyleTag({
      content:
        "header[data-fidelity-landmark] .bar *, header[data-fidelity-landmark] [class*='__bar'] *{color:transparent!important;text-shadow:none!important;border-color:transparent!important;outline:none!important} header[data-fidelity-landmark] [class*='__bar'] [class*='burger'] span, header[data-fidelity-landmark] [class*='brandMark']{background-color:transparent!important} header[data-fidelity-landmark] [class*='__bar'] *::before, header[data-fidelity-landmark] [class*='__bar'] *::after{opacity:0!important}",
    });
    await page.waitForTimeout(150);
    const shotB = await page.screenshot();
    await style.evaluate((n) => n.remove());
    const { data, info } = await sharp(shotB)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (const l of labels) {
      const [r, g, b] = (l.color.match(/[\d.]+/g) || ["0", "0", "0"]).map(Number);
      const ink = lum(r, g, b);
      const lums = [];
      for (
        let yy = Math.max(0, Math.floor(l.y));
        yy < Math.min(info.height, Math.ceil(l.y + l.h));
        yy++
      )
        for (
          let xx = Math.max(0, Math.floor(l.x));
          xx < Math.min(info.width, Math.ceil(l.x + l.w));
          xx++
        ) {
          const i = (yy * info.width + xx) * info.channels;
          lums.push(lum(data[i], data[i + 1], data[i + 2]));
        }
      lums.sort((a, b) => a - b);
      const light = ink > 0.5;
      const bg = light
        ? lums[Math.floor(lums.length * 0.9)]
        : lums[Math.floor(lums.length * 0.1)];
      rows.push({
        route,
        state,
        label: l.name,
        ink: l.color,
        ratio: +ratio(ink, bg ?? 0).toFixed(2),
      });
    }
    void shotA;
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
const worst = [...rows].sort((a, b) => a.ratio - b.ratio).slice(0, 8);
console.log(
  `labels=${rows.length} below4.5=${rows.filter((r) => r.ratio < 4.5).length} min=${worst[0]?.ratio}`,
);
for (const r of worst)
  console.log(`  ${r.ratio}  ${r.route} ${r.state} ${r.label} ${r.ink}`);
