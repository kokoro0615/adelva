/**
 * Render each page's social preview (1200×630) from its own hero.
 *
 * Usage: `pnpm build && node scripts/seo/build-og-images.mjs`
 * (or `OG_BASE_URL=http://127.0.0.1:3000 node scripts/seo/build-og-images.mjs`
 * against a server that is already running).
 *
 * Each page is captured at 1440×756 (the 1.905:1 preview ratio at the desktop
 * design width) in its reduced-motion settled state, with the navigation
 * hidden and only the ADELVA brand left in the header, then scaled to
 * 1200×630. Rerun after a hero, the logo or a page title changes.
 */
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "../..");

/** path → output file; must match `ogImage` in src/content/site-pages.ts. */
const pages = [
  ["/", "home"],
  ["/challenges", "challenges"],
  ["/challenges/owner", "challenges-owner"],
  ["/challenges/general-managers", "challenges-general-managers"],
  ["/services/management-operations", "services-management-operations"],
  ["/services/revenue-brand", "services-revenue-brand"],
  ["/services/dx-it-procurement", "services-dx-it-procurement"],
  ["/approach", "approach"],
  ["/about", "about"],
  ["/contact", "contact"],
];

const hideNavigation = `
  [data-fidelity-landmark="header-nav"] nav,
  [data-fidelity-landmark="header-nav"] [class*="__cta"],
  [data-fidelity-landmark="header-nav"] [class*="__burger"],
  [data-fidelity-landmark="header-nav"] [class*="__shelf"],
  [data-skip-link], .route-progress, .route-curtain {
    visibility: hidden !important;
  }
`;

async function startServer() {
  if (process.env.OG_BASE_URL) return { url: process.env.OG_BASE_URL, stop() {} };
  const port = 4391;
  const server = spawn("pnpm", ["start", "--port", String(port)], {
    cwd: root,
    stdio: "ignore",
    detached: true,
  });
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 240; attempt++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* not listening yet */
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  return { url, stop: () => process.kill(-server.pid) };
}

const server = await startServer();
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 756 },
    reducedMotion: "reduce",
  });
  await mkdir(resolve(root, "public/og"), { recursive: true });
  for (const [path, name] of pages) {
    const page = await context.newPage();
    // HOME's hero video keeps the network busy, so wait for load, then for
    // fonts and the images inside the first viewport.
    await page.goto(new URL(path, server.url).toString(), { waitUntil: "load" });
    await page.addStyleTag({ content: hideNavigation });
    await page.evaluate(() => document.fonts.ready);
    // decode() never settles for a lazy image that has not started loading,
    // so poll `complete` on the images inside the first viewport instead.
    await page
      .waitForFunction(
        () =>
          [...document.images]
            .filter((image) => image.getBoundingClientRect().top < innerHeight)
            .every((image) => image.complete),
        undefined,
        { timeout: 15_000 },
      )
      .catch(() => console.warn(`${path}: some hero images were still loading`));
    await page.waitForTimeout(800);
    const shot = await page.screenshot({ type: "png" });
    const output = resolve(root, `public/og/${name}.jpg`);
    await sharp(shot)
      .resize(1200, 630)
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(output);
    console.log(`${path} → public/og/${name}.jpg`);
    await page.close();
  }
} finally {
  await browser.close();
  server.stop();
}
