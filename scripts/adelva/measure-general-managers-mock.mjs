/** Dump the GM A2 mocks' own HTML geometry (the mocks were typeset in HTML);
 * feeds docs/specs/adelva-general-managers-spec.md §6.
 *   node scripts/adelva/measure-general-managers-mock.mjs desktop|mobile [out.json] */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const which = process.argv[2] === "mobile" ? "mobile" : "desktop";
const base = "references/adelva/mockups/general-managers-2026-09-29";
const file =
  which === "mobile"
    ? `${base}/A2-mobile/build/index.html`
    : `${base}/A2/build/index.html`;
const width = which === "mobile" ? 390 : 1440;
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
const rows = await page.evaluate(() => {
  const pick = [
    ".site-header",
    ".brand",
    ".crumb",
    ".eyebrow",
    "h1 .l1",
    "h1 .l2",
    ".lead",
    ".hero .btn",
    "section .ch",
    "section h2",
    "section .body",
    ".helper",
    ".tl",
    ".tl .ring",
    ".tl .t",
    ".tl .d",
    ".tray",
    ".point",
    ".point b",
    ".point span",
    ".cause-tag",
    ".symptom-tag",
    ".s03-lead",
    ".thead",
    ".row",
    ".card",
    ".judge",
    ".chip",
    ".note",
    ".role",
    ".role dt",
    ".role dd",
    ".agree",
    ".cross-note",
    ".cross",
    ".gate",
    ".btn-outline",
    ".checks",
    ".checks > div",
    ".checks dt",
    ".checks dd",
    ".carry",
    ".s07 .btn",
    ".flow",
    ".flow li",
    ".gauge",
    ".gauge a",
  ];
  const out = [];
  for (const sel of pick)
    document.querySelectorAll(sel).forEach((n, i) => {
      const r = n.getBoundingClientRect();
      const s = getComputedStyle(n);
      out.push({
        sel,
        i,
        text: n.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
        x: +r.x.toFixed(1),
        y: +(r.y + scrollY).toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily.split(",")[0]}`,
        ls: s.letterSpacing,
        color: s.color,
      });
    });
  return out;
});
const out =
  process.argv[3] ??
  `docs/reports/adelva-general-managers-2026-09-30/mock-geometry-${which}.json`;
await writeFile(out, JSON.stringify(rows, null, 1) + "\n");
console.log(out, rows.length);
await browser.close();
