/** Reference fidelity for /challenges/general-managers (spec §3, §11): the page in the
 * mock's state against the mocks' own HTML geometry (measure-general-managers-mock.mjs)
 * at 1440 and 390, plus a whole-page pixel difference against the adopted rasters.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4481 node scripts/adelva/compare-general-managers.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4481";
const dir = "docs/reports/adelva-general-managers-2026-09-30";
const mocks = {
  1440: "references/adelva/mockups/general-managers-2026-09-29/A2/A2-full.png",
  390: "references/adelva/mockups/general-managers-2026-09-29/A2-mobile/A2-mobile-full-390.png",
};
const TOLERANCE = 8;

/** [label, mock selector + index, page selector + index] */
const anchors = {
  1440: [
    ["breadcrumb", ".crumb", 0, "nav[aria-label='パンくず'] ol", 0],
    ["h1 line 1", "h1 .l1", 0, "h1 [data-hero-line]", 0],
    ["h1 line 2", "h1 .l2", 0, "h1 [data-hero-line]", 1],
    ["hero button", ".hero .btn", 0, "#gm-hero a[class*=action]", 0],
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => [
      `chapter 0${i + 1}`,
      "section .ch",
      i,
      "section[data-chapter] p[class*=chapter]",
      i,
    ]),
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => [
      `h2 0${i + 1}`,
      "section h2",
      i,
      "main h2",
      i,
    ]),
    ...[0, 1, 2, 3, 4].map((i) => [
      `issue ring ${i + 1}`,
      ".tl .ring",
      i,
      "label[data-issue] > span[class*=ring]",
      i,
    ]),
    ...[0, 1, 2].map((i) => [
      `point ${i + 1}`,
      ".point",
      i,
      "[role=radiogroup] label",
      i,
    ]),
    ["cause tag", ".cause-tag", 0, "p[data-modes='cause priority']", 0],
    ["symptom tag", ".symptom-tag", 0, "p[data-modes='cause']", 0],
    ...[0, 1, 2].map((i) => [`support row ${i + 1}`, ".row", i, "[role=row][id]", i]),
    ...[0, 1, 2, 3].map((i) => [`role ${i + 1}`, ".role", i, "[data-role]", i]),
    ...[0, 1, 2, 3, 4, 5].map((i) => [`gate ${i + 1}`, ".gate", i, "[data-gate]", i]),
    ["approach link", ".btn-outline", 0, "main a[href='/approach']", 0],
    ...[0, 1, 2, 3].map((i) => [
      `check ${i + 1}`,
      ".checks dt",
      i,
      "[data-check] dt",
      i,
    ]),
    ["07 button", ".s07 .btn", 0, "#gm-07 a[href='/contact']", 0],
    ["07 flow first step", ".flow li", 0, "#gm-07 [data-flow] li", 0],
  ],
  390: [
    ["breadcrumb", ".crumb", 0, "nav[aria-label='パンくず'] ol", 0],
    ["h1 line 1", "h1 .l1", 0, "h1 [data-hero-line]", 0],
    ["h1 line 2", "h1 .l2", 0, "h1 [data-hero-line]", 1],
    ["hero button", ".hero .btn", 0, "#gm-hero a[class*=action]", 0],
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => [
      `chapter 0${i + 1}`,
      "section .ch",
      i,
      "section[data-chapter] p[class*=chapter]",
      i,
    ]),
    ...[0, 1, 2, 3, 4, 5, 6].map((i) => [
      `h2 0${i + 1}`,
      "section h2",
      i,
      "main h2",
      i,
    ]),
    ...[0, 1, 2, 3, 4].map((i) => [
      `issue row ${i + 1}`,
      ".tl",
      i,
      "label[data-issue]",
      i,
    ]),
    ...[0, 1, 2].map((i) => [
      `point ${i + 1}`,
      ".point",
      i,
      "[role=radiogroup] label",
      i,
    ]),
    ["cause tag", ".cause-tag", 0, "p[data-modes='cause priority']", 0],
    ["symptom tag", ".symptom-tag", 0, "p[data-modes='cause']", 0],
    ...[0, 1, 2].map((i) => [`support card ${i + 1}`, ".card", i, "[role=row][id]", i]),
    ...[0, 1, 2, 3].map((i) => [`role ${i + 1}`, ".role", i, "[data-role]", i]),
    ...[0, 1, 2, 3, 4, 5].map((i) => [`gate ${i + 1}`, ".gate", i, "[data-gate]", i]),
    ["approach link", ".btn-outline", 0, "main a[href='/approach']", 0],
    ...[0, 1, 2, 3].map((i) => [
      `check ${i + 1}`,
      ".checks dt",
      i,
      "[data-check] dt",
      i,
    ]),
    ["07 button", ".s07 .btn", 0, "#gm-07 a[href='/contact']", 0],
  ],
};

const browser = await chromium.launch();
const report = { base, tolerance: TOLERANCE, viewports: {} };
for (const width of [1440, 390]) {
  const mock = JSON.parse(
    await readFile(
      `${dir}/mock-geometry-${width === 1440 ? "desktop" : "mobile"}.json`,
      "utf8",
    ),
  );
  const page = await browser.newPage({
    viewport: { width, height: width === 1440 ? 900 : 844 },
    reducedMotion: "reduce",
  });
  await page.goto(`${base}/challenges/general-managers`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) i.loading = "eager";
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  });
  for (const id of ["quality", "system"])
    await page.locator(`input[name="issue"][value="${id}"]`).check({ force: true });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.addStyleTag({ content: "[data-tray]{display:none!important}" });
  const rows = [];
  for (const [label, mockSel, mockIndex, sel, index] of anchors[width]) {
    const m = mock.find((r) => r.sel === mockSel && r.i === mockIndex);
    const a = await page.evaluate(
      ([s, i]) => {
        const n = document.querySelectorAll(s)[i];
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
      },
      [sel, index],
    );
    if (!m || !a) {
      rows.push({ label, missing: !m ? "mock" : "page" });
      continue;
    }
    const dx = +(a.x - m.x).toFixed(1);
    const dy = +(a.y - m.y).toFixed(1);
    rows.push({
      label,
      mock: [m.x, m.y],
      page: [+a.x.toFixed(1), +a.y.toFixed(1)],
      dx,
      dy,
      pass: Math.abs(dx) <= TOLERANCE && Math.abs(dy) <= TOLERANCE,
    });
  }
  const shot = await page.screenshot({ fullPage: true });
  await sharp(shot).toFile(`${dir}/actual-reference-${width}.png`);
  const ref = sharp(mocks[width]);
  const { width: rw, height: rh } = await ref.metadata();
  const act = await sharp(shot).metadata();
  const h = Math.min(rh, act.height);
  const [A, B] = await Promise.all([
    sharp(mocks[width])
      .extract({ left: 0, top: 0, width: rw, height: h })
      .removeAlpha()
      .raw()
      .toBuffer(),
    sharp(shot)
      .extract({ left: 0, top: 0, width: act.width, height: h })
      .removeAlpha()
      .raw()
      .toBuffer(),
  ]);
  let sum = 0;
  for (let i = 0; i < A.length; i++) sum += Math.abs(A[i] - B[i]);
  report.viewports[width] = {
    pageHeight: act.height,
    mockHeight: rh,
    meanAbsRgbDiff: +(sum / A.length).toFixed(2),
    anchors: rows.length,
    anchorFailures: rows.filter((r) => r.pass === false || r.missing).length,
    maxOffset: Math.max(
      ...rows
        .filter((r) => r.dx !== undefined)
        .map((r) => Math.max(Math.abs(r.dx), Math.abs(r.dy))),
    ),
    rows,
  };
  await page.close();
}
await browser.close();
await writeFile(
  `${dir}/reference-comparison.json`,
  JSON.stringify(report, null, 2) + "\n",
);
for (const [w, v] of Object.entries(report.viewports)) {
  console.log(w, {
    pageHeight: v.pageHeight,
    mockHeight: v.mockHeight,
    meanAbsRgbDiff: v.meanAbsRgbDiff,
    anchors: v.anchors,
    anchorFailures: v.anchorFailures,
    maxOffset: v.maxOffset,
  });
  for (const r of v.rows)
    if (r.pass === false || r.missing) console.log("  ", JSON.stringify(r));
}
