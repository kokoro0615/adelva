/** Dump the owner B2 mocks' own HTML geometry (the mocks were typeset in HTML);
 * feeds docs/specs/adelva-owner-spec.md §6.
 *   node scripts/adelva/measure-owner-mock.mjs desktop|mobile [out.json] */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const which = process.argv[2] === "mobile" ? "mobile" : "desktop";
const base = "references/adelva/mockups/owner-2026-09-29";
const file =
  which === "mobile"
    ? `${base}/B2-mobile/build/index.html`
    : `${base}/B2/build/index.html`;
const width = which === "mobile" ? 390 : 1440;
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "load" });
await page.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
const rows = await page.evaluate(() => {
  const pick = [
    ".crumb",
    ".audience",
    "h1 .ln",
    ".hero .lead",
    ".hero .btn",
    ".scroll",
    ".sec",
    ".chapter",
    ".chapter .no",
    "h2",
    ".lead2",
    ".bays li",
    ".bays .no",
    ".bays .nm",
    ".bays .ds",
    ".bays .go",
    ".scale li",
    ".scale .nm",
    ".grad",
    ".setbar",
    ".combo",
    ".combo th",
    ".combo td",
    ".cards li",
    ".cards h3",
    ".cards dt",
    ".cards dd",
    ".note",
    ".hearth",
    ".hearth .r",
    ".ember",
    ".tail",
    ".agree",
    ".link",
    ".embers",
    ".embers li",
    ".embers i",
    ".embers .no",
    ".embers .nm",
    ".checks",
    ".checks li",
    ".h-contact",
    ".contact .btn",
    ".index",
    ".index a",
    ".crossbar",
    ".pool-dark",
    ".beam .shaft",
    ".beam .pool",
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
  process.argv[3] ?? `docs/reports/adelva-owner-2026-09-30/mock-geometry-${which}.json`;
await writeFile(out, JSON.stringify(rows, null, 1) + "\n");
console.log(out, rows.length);
await browser.close();
