import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
const page = await browser.newPage();
const responses = [],
  files = new Map();
let css = "";
page.on("response", (response) => {
  if (response.url().startsWith("https://fonts.googleapis.com/"))
    responses.push(
      response.text().then((text) => {
        css = text;
      }),
    );
  if (
    response.url().startsWith("https://fonts.gstatic.com/s/zenkakugothicnew/") &&
    response.url().endsWith(".woff2")
  )
    responses.push(
      response.body().then((body) => {
        files.set(response.url(), body);
      }),
    );
});
await page.goto("https://morght.com/", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await Promise.all(responses);
await browser.close();
if (!css || !files.size) throw new Error("Observed Japanese fonts unavailable");
const licenseUrl =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/zenkakugothicnew/OFL.txt";
const license = await fetch(licenseUrl);
if (!license.ok) throw new Error("Font license unavailable");
const licenseText = await license.text();
await writeFile("public/media/morght/ZenKakuGothicNew-OFL.txt", licenseText);
const manifest = JSON.parse(
  await readFile("references/morght/asset-manifest.json", "utf8"),
).filter((a) => !a.id.startsWith("zen-kaku-") && a.id !== "ZenKakuGothicNew-OFL.txt");
manifest.push({
  id: "ZenKakuGothicNew-OFL.txt",
  path: "/media/morght/ZenKakuGothicNew-OFL.txt",
  source: licenseUrl,
  owner: "The Zen Kaku Gothic Project Authors",
  permission: "SIL Open Font License 1.1",
  status: "approved",
  role: "Required font copyright and license notice",
  bytes: Buffer.byteLength(licenseText),
  loading: "not loaded by UI; bundled with font files",
  altIntent: "not applicable: license notice",
  transformation: "none",
  restrictions: "Preserve copyright and license",
  expiry: "none",
});
const rules = [];
let i = 0;
for (const [url, body] of files) {
  const name = `zen-kaku-${++i}.woff2`;
  await writeFile(`public/media/morght/${name}`, body);
  for (const match of css.matchAll(/@font-face\s*\{[^}]*\}/g))
    if (match[0].includes(url))
      rules.push(match[0].replace(url, `/media/morght/${name}`));
  manifest.push({
    id: name,
    path: `/media/morght/${name}`,
    source: url,
    owner: "The Zen Kaku Gothic Project Authors",
    permission: "SIL Open Font License 1.1",
    license: licenseUrl,
    attribution: "public/media/morght/ZenKakuGothicNew-OFL.txt",
    status: "approved",
    role: "Observed HOME Japanese medium font subset",
    bytes: body.length,
    loading: "local CSS unicode-range, font-display swap",
    altIntent: "not applicable: font",
    transformation: "none; original Google Fonts subset",
    restrictions: "OFL retained; not sold standalone",
    expiry: "none",
  });
}
await writeFile("src/components/morght/japanese-font.css", rules.join("\n"));
await writeFile(
  "references/morght/asset-manifest.json",
  JSON.stringify(manifest, null, 2),
);
console.log({
  files: files.size,
  bytes: [...files.values()].reduce((n, b) => n + b.length, 0),
  rules: rules.length,
});
