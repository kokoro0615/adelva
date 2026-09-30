/** Reference fidelity for /challenges/owner (spec §11): every text run the B2 mocks
 * set in HTML (`measure-owner-mock.mjs`) is found in the implementation, in the
 * mock's reference state (GM不在 chosen), and its offset is reported; the gate is
 * ±8 px. Also writes a mock | implementation sheet per viewport.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4491 node scripts/adelva/compare-owner.mjs [out-dir]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4491";
const out = process.argv[2] ?? "docs/reports/adelva-owner-2026-09-30";
const mocks = "references/adelva/mockups/owner-2026-09-29";
const viewports = {
  desktop: { width: 1440, height: 900, full: `${mocks}/B2/B2-full.png`, body: 10266 },
  mobile: {
    width: 390,
    height: 844,
    full: `${mocks}/B2-mobile/B2-mobile-full-390.png`,
    body: 8104,
  },
};
// Text-bearing rows of the mock geometry (the fixed index is compared separately).
const selectors = new Set([
  ".crumb",
  ".audience",
  "h1 .ln",
  ".hero .lead",
  ".hero .btn",
  ".chapter",
  "h2",
  ".lead2",
  ".bays .nm",
  ".bays .ds",
  ".scale .nm",
  ".combo th",
  ".combo td",
  ".cards h3",
  ".cards dd",
  ".note",
  ".hearth .r",
  ".agree",
  ".link",
  ".embers .nm",
  ".checks li",
  ".contact .btn",
]);
const norm = (t) => t.replace(/\s+/g, "").replace(/→$/, "");

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = {};
for (const [name, v] of Object.entries(viewports)) {
  const mock = JSON.parse(
    await readFile(
      `docs/reports/adelva-owner-2026-09-30/mock-geometry-${name}.json`,
      "utf8",
    ),
  ).filter((r) => selectors.has(r.sel) && norm(r.text));
  const page = await browser.newPage({
    viewport: { width: v.width, height: v.height },
    reducedMotion: "reduce",
  });
  await page.goto(`${base}/challenges/owner`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.locator('input[name="phase"][value="gm"]').check({ force: true });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) {
      i.loading = "eager";
      i.decoding = "sync";
    }
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) =>
          (i.complete
            ? i.decode()
            : new Promise((r) => {
                i.onload = i.onerror = r;
              })
          ).catch(() => {}),
        ),
    );
    scrollTo(0, 0);
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1000);
  const actual = await page.evaluate(() => {
    const rows = [];
    for (const n of document.querySelectorAll("main *")) {
      if (
        n.closest("[class*=visuallyHidden],[data-index]") ||
        !n.getClientRects().length
      )
        continue;
      const r = n.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      rows.push({
        text: n.textContent,
        x: r.x,
        y: r.y + scrollY,
        w: r.width,
        h: r.height,
      });
    }
    return rows;
  });
  const results = [];
  for (const m of mock) {
    const want = norm(m.text);
    // the mock geometry keeps the first 40 characters of each run
    const candidates = actual.filter((a) =>
      m.text.length >= 40 ? norm(a.text).startsWith(want) : norm(a.text) === want,
    );
    if (!candidates.length) {
      results.push({ sel: m.sel, text: m.text, found: false });
      continue;
    }
    // the smallest element with this text that is nearest to the mock's box
    const best = candidates
      .map((a) => ({ a, d: Math.hypot(a.x - m.x, a.y - m.y) + (a.w * a.h) / 1e6 }))
      .sort((p, q) => p.d - q.d)[0].a;
    const dx = +(best.x - m.x).toFixed(1);
    const dy = +(best.y - m.y).toFixed(1);
    results.push({
      sel: m.sel,
      text: m.text.slice(0, 24),
      found: true,
      dx,
      dy,
      pass: Math.abs(dx) <= 8 && Math.abs(dy) <= 8,
    });
  }
  const shot = await page.screenshot({ fullPage: true });
  await page.close();
  // mock | implementation, body only, at half size
  const half = Math.round(v.width / 2);
  const bodyH = Math.round(v.body / 2);
  const left = await sharp(v.full)
    .extract({ left: 0, top: 0, width: v.width, height: v.body })
    .resize(half)
    .png()
    .toBuffer();
  const right = await sharp(shot)
    .extract({ left: 0, top: 0, width: v.width, height: v.body })
    .resize(half)
    .png()
    .toBuffer();
  await sharp({
    create: { width: half * 2 + 12, height: bodyH, channels: 3, background: "#ff00ff" },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: half + 12, top: 0 },
    ])
    .webp({ quality: 72 })
    .toFile(`${out}/compare-${v.width}.webp`);
  const found = results.filter((r) => r.found);
  report[name] = {
    runs: results.length,
    found: found.length,
    within8: found.filter((r) => r.pass).length,
    maxAbsDx: Math.max(...found.map((r) => Math.abs(r.dx))),
    maxAbsDy: Math.max(...found.map((r) => Math.abs(r.dy))),
    outside: results.filter((r) => !r.found || !r.pass),
  };
}
await browser.close();
await writeFile(`${out}/fidelity.json`, JSON.stringify(report, null, 1) + "\n");
console.log(JSON.stringify(report, null, 1));
