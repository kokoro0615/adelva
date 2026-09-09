import { readFile, writeFile, mkdir } from "node:fs/promises";
import { JSDOM } from "jsdom";
import sharp from "sharp";
const reference = JSON.parse(await readFile("references/morght/1440.json", "utf8"));
const dest = "public/media/morght";
await mkdir(dest, { recursive: true });
const manifest = [];
const assets = [...new Map(reference.assets.map((a) => [a.currentSrc, a])).values()];
for (const p of [
  "images/texture-daytime-1.webp",
  "images/texture-daytime-2.webp",
  "images/shadow-daytime.png",
  "images/logo-symbol-daytime.svg",
  "fonts/TTCommonsProRegular/font.woff2",
  "fonts/TTCommonsProMedium/font.woff2",
])
  assets.push({ currentSrc: "https://morght.com/assets/" + p, alt: "" });
const map = {};
let news = 0;
for (const a of assets) {
  const url = a.currentSrc;
  const name = url.includes("/cms/")
    ? `news-${++news}.webp`
    : url.includes("/fonts/")
      ? url.split("/").at(-2) + ".woff2"
      : url.split("/").at(-1);
  const res = await fetch(url);
  if (!res.ok) throw Error(`${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(`${dest}/${name}`, buffer);
  const dimensions = await sharp(buffer)
    .metadata()
    .catch(() => ({}));
  map[url] = name;
  manifest.push({
    id: name,
    path: `/media/morght/${name}`,
    source: url,
    owner: "Morght / authorized licensors",
    permission: "Current user attestation, 2026-09-09: 許可取得済です",
    status: "approved",
    role: a.alt
      ? "authored headline artwork"
      : "observed HOME media / decoration / font",
    width: dimensions.width,
    height: dimensions.height,
    bytes: buffer.length,
    loading: name.startsWith("img-") ? "eager, async decode" : "lazy, async decode",
    altIntent: a.alt || "decorative",
    transformation: "none",
    restrictions: "Local authorized review; no publication authorized",
    attribution: "Original ownership retained",
    expiry: "not supplied",
  });
}
const doc = new JSDOM(reference.header + reference.sections.map((s) => s.html).join(""))
  .window.document;
const svgDefs = {
  wordmark: ".c-home-intro__logoType-type svg",
  symbol: ".c-home-intro__logoSymbol-symbol svg",
  header: ".c-site-header__logo svg",
  "logo-outline": ".c-home-intro__logoType-outline svg",
  "intro-round": ".c-home-intro__round svg",
  "intro-arrow": ".c-home-intro__arrow svg",
  "intro-symbol-lines": ".c-home-intro__logoSymbol-line svg",
  "intro-headline-lines": ".c-home-intro__headline-line svg",
  "mission-circle": "main-missing",
};
delete svgDefs["mission-circle"];
const sections = reference.sections.map((s) => new JSDOM(s.html).window.document);
const extra = {
  "mission-circle": sections[1].querySelector("svg"),
  "career-ring": sections[3].querySelector("svg"),
  "career-scribble": sections[3].querySelectorAll("svg")[1],
  "career-arrow": sections[3].querySelectorAll("svg")[2],
  "company-arrow": sections[5].querySelectorAll("svg")[1],
};
const vectors = {};
for (const [name, el] of [
  ...Object.entries(svgDefs).map(([n, s]) => [n, doc.querySelector(s)]),
  ...Object.entries(extra),
]) {
  if (!el) throw Error(name);
  el.querySelectorAll("[style]").forEach((e) => {
    if (e.style.fill) e.setAttribute("fill", e.style.fill);
    e.removeAttribute("style");
  });
  el.removeAttribute("style");
  const svg = el.outerHTML.replaceAll('class="opacity-0"', "");
  await writeFile(`${dest}/${name}.svg`, svg);
  vectors[name] = svg;
  manifest.push({
    id: name,
    path: `/media/morght/${name}.svg`,
    source: `https://morght.com/#${name}`,
    owner: "Morght",
    permission: "Current user attestation, 2026-09-09",
    status: "approved",
    role: "original vector artwork",
    loading: "inline or eager",
    altIntent: "decorative; semantic copy in HTML",
    transformation: "animation state removed; vector paths retained",
  });
}
const items = [...sections[4].querySelectorAll("li")].map((e) => ({
  title: e.querySelector(".c-news-card__title").textContent,
  href: new URL(e.querySelector("a").getAttribute("href"), "https://morght.com").href,
  date: e.querySelector("time").textContent,
  image: map[new URL(e.querySelector("img").src, "https://morght.com").href],
}));
await writeFile(
  "references/morght/asset-manifest.json",
  JSON.stringify(manifest, null, 2),
);
await mkdir("src/content/morght", { recursive: true });
await writeFile("src/content/morght/news.json", JSON.stringify(items, null, 2));
await writeFile("src/content/morght/vectors.json", JSON.stringify(vectors, null, 2));
console.log(
  `${manifest.length} registered assets; ${manifest.reduce((n, a) => n + (a.bytes || 0), 0)} bytes`,
);
