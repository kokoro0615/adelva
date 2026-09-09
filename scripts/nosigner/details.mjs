import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const req = [];
p.on("response", (r) => {
  if (/font|woff|\.glb|\.gltf|\.png|\.js/.test(r.url())) req.push(r.url());
});
await p.goto("https://nosigner.com/ja/", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(8000);
const d = await p.evaluate(() => ({
  fonts: [...document.fonts].map((f) => ({
    family: f.family,
    status: f.status,
    weight: f.weight,
  })),
  quote: [...document.querySelectorAll("citation-layer")].map((e) => ({
    text: e.querySelector(".desktop-only .visuallyHidden")?.textContent,
    book: e.querySelector(".citationBook")?.textContent.trim(),
    href: e.querySelector("a")?.href,
    html: e.innerHTML.slice(-1700),
  })),
  logo: document.querySelector("#logo").outerHTML,
  menu: [
    ...document.querySelectorAll(".menuNavMainList,.menuNavSubList,.menuLogoUnit"),
  ].map((e) => e.textContent.trim()),
  fontsStyles: [...document.styleSheets]
    .filter((s) => !s.href)
    .map((s) => [...s.cssRules].map((x) => x.cssText).join("\n")),
}));
await writeFile(
  "references/nosigner/details.json",
  JSON.stringify({ ...d, requests: req }, null, 2),
);
console.log(d.fonts, d.quote);
await b.close();
