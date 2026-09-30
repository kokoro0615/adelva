/** Dump the C2 mock's own HTML geometry (the mock was typeset in HTML); feeds docs/specs/adelva-contact-spec.md. */
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";
const which = process.argv[2];
const base = "references/adelva/mockups/contact-r2-2026-09-29/C2";
const file =
  which === "mobile" ? `${base}/mobile/build/index.html` : `${base}/build/index.html`;
const width = which === "mobile" ? 390 : 1440;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width, height: 900 } });
await p.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: "networkidle" });
await p.waitForSelector('body[data-ready="1"]', { timeout: 30000 });
const sels =
  which === "mobile"
    ? [
        ".bar",
        ".cta-current",
        ".eyebrow",
        "h1",
        "h1 span",
        ".q01 .num",
        ".q01 .ask-s",
        ".q01 .card",
        ".map-label",
        ".tag",
        "#steps-bar",
        ".sb",
        ".q02 .num",
        ".q02 .ask",
        ".q02 .card",
        ".q03 .num",
        ".q03 .ask",
        ".help",
        ".area",
        ".q04 .num",
        ".q04 .ask",
        ".field",
        ".fl",
        ".err",
        ".summary",
        ".sum-label",
        ".chip",
        ".sum-arrow",
        ".consent",
        ".send",
        ".after .bar-accent",
        ".after-h",
        "#steps li",
        ".after-link",
        ".note",
        ".note h3",
        ".note p",
        ".note .link",
      ]
    : [
        ".bar",
        ".brand",
        ".cta-current",
        ".eyebrow",
        "h1 .line",
        ".q01 .num",
        ".q01 .ask",
        ".q01 .card",
        ".map",
        ".map-label",
        ".tag",
        ".scroll span",
        ".scroll i",
        ".rail",
        ".node",
        ".q02 .num",
        ".q02 .ask",
        ".q02 .card",
        ".q03 .num",
        ".q03 .ask",
        ".help",
        ".area",
        ".q04 .num",
        ".q04 .ask",
        ".field",
        ".fl",
        ".err",
        ".summary",
        ".sum-label",
        ".chip",
        ".arrow",
        ".consent",
        ".send",
        ".after .bar-accent",
        ".after-h",
        "#steps li",
        ".after-link",
        ".note",
        ".note h3",
        ".note p",
        ".note .link",
        ".clear",
      ];
const out = await p.evaluate(
  (sels) =>
    sels.map((s) => [
      s,
      [...document.querySelectorAll(s)].map((n) => {
        const r = n.getBoundingClientRect();
        return [
          Math.round(r.x * 10) / 10,
          Math.round((r.y + scrollY) * 10) / 10,
          Math.round(r.width * 10) / 10,
          Math.round(r.height * 10) / 10,
          n.children.length ? "" : n.textContent.trim().slice(0, 14),
        ];
      }),
    ]),
  sels,
);
for (const [s, rs] of out)
  console.log(
    s.padEnd(20),
    rs.map((r) => r.slice(0, 4).join(",") + (r[4] ? " " + r[4] : "")).join(" | "),
  );
const fonts = await p.evaluate(() =>
  [...document.fonts]
    .filter((f) => f.status === "loaded")
    .map((f) => f.family + " " + f.weight)
    .join(", "),
);
if (process.argv.includes("--fonts")) console.log("fonts:", fonts);
await b.close();
