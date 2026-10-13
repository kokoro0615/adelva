// Polish harness (2026-10-13, shared chrome): load each route on a phone (or
// desktop) profile and list what it downloads within a few seconds of load —
// RSC prefetches, images/media/fonts with sizes, stylesheets — plus console
// warnings ("preloaded but not used"). Other routes' media in the list means a
// prefetch leaked that route's preload() hints into this page.
// usage (from the repo root): node scripts/adelva/polish/net-audit.mjs <base> <out.json> [w=390] [h=844] [routes,comma,separated]
import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(`${process.cwd()}/package.json`);
const { chromium } = req("@playwright/test");

const [base, out, w = "390", h = "844", list] = process.argv.slice(2);
const routes = (
  list ||
  "/,/challenges,/challenges/owner,/challenges/general-managers,/services/management-operations,/services/revenue-brand,/services/dx-it-procurement,/approach,/about,/contact"
).split(",");
const mobile = +w < 1024;
const browser = await chromium.launch({
  headless: true,
  channel: "chromium",
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const res = [];
for (const route of routes) {
  const ctx = await browser.newContext({
    viewport: { width: +w, height: +h },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
    userAgent: mobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  const page = await ctx.newPage();
  const warnings = [];
  const reqs = [];
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) warnings.push(m.text().slice(0, 220));
  });
  page.on("requestfinished", async (r) => {
    const u = new URL(r.url());
    if (u.origin !== new URL(base).origin) return;
    let size = 0;
    try {
      size = (await r.sizes()).responseBodySize;
    } catch {}
    reqs.push({
      t: r.resourceType(),
      u: u.pathname + (u.search.includes("_rsc") ? "?_rsc" : ""),
      size,
    });
  });
  await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
  await page.waitForTimeout(6000);
  const rsc = reqs.filter((r) => r.u.includes("_rsc"));
  const media = reqs.filter(
    (r) =>
      ["image", "media", "font"].includes(r.t) ||
      /\.(avif|webp|png|jpg|mp4|woff2)$/.test(r.u),
  );
  const css = reqs.filter((r) => r.t === "stylesheet");
  const sum = (a) => Math.round(a.reduce((s, r) => s + r.size, 0) / 1024);
  res.push({
    route,
    warnings,
    rsc: rsc.map((r) => r.u),
    media: media.map((r) => `${r.t} ${r.u} ${Math.round(r.size / 1024)}KB`),
    mediaKB: sum(media),
    css: css.map((r) => r.u),
    totalKB: sum(reqs),
    requests: reqs.length,
  });
  console.log(
    `${route} warnings=${warnings.length} rsc=${rsc.length} media=${media.length}/${sum(media)}KB css=${css.length} total=${sum(reqs)}KB`,
  );
  await ctx.close();
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
await browser.close();
