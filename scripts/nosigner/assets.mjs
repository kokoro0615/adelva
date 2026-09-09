import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const x = JSON.parse(await readFile("references/nosigner/extract-1440.json", "utf8"));
await mkdir("public/media/nosigner", { recursive: true });
const images = [
  ...new Map(
    [
      ...x.hero.map((v) => v.image),
      ...x.cards.flatMap((v) => v.images),
      ...x.news.map((v) => v.image),
    ].map((v) => [v.src, v]),
  ).values(),
];
const manifest = [];
const map = {};
for (const im of images) {
  const id = createHash("sha256").update(im.src).digest("hex").slice(0, 12);
  const path = `public/media/nosigner/${id}.webp`;
  let buf;
  try {
    buf = await readFile(path);
  } catch {
    const r = await fetch(im.src);
    if (!r.ok) throw Error(im.src + " " + r.status);
    buf = Buffer.from(await r.arrayBuffer());
    await writeFile(path, buf);
    await new Promise((r) => setTimeout(r, 120));
  }
  const m = await sharp(buf).metadata();
  map[im.src] = { src: path.replace("public", ""), width: m.width, height: m.height };
  manifest.push({
    id,
    path,
    source: im.src,
    owner: "NOSIGNER / credited creators",
    permission: "User confirmation 2026-09-09; docs/clone-workflow-ledger.md",
    status: "approved",
    role: x.hero.some((v) => v.image.src === im.src)
      ? "hero"
      : x.news.some((v) => v.image.src === im.src)
        ? "news"
        : "category-strip",
    width: m.width,
    height: m.height,
    bytes: buf.length,
    loading: "First hero eager; other media lazy",
    alt: "Decorative alongside accessible project/category labels",
    transformation: "Original authorized WebP, unchanged",
  });
}
const data = {
  hero: x.hero.map((v) => ({ ...v, image: map[v.image.src] })),
  cards: x.cards.map((v) => ({
    label: v.label,
    promise: v.promise,
    body: v.body,
    href: v.href,
    reverse: v.slider.includes('data-is-reverse="true"'),
    images: [...new Set(v.images.map((i) => i.src))].map((s) => map[s]),
  })),
  news: x.news.map((v) => ({ ...v, image: map[v.image.src] })),
  links: x.links,
};
await mkdir("src/content/nosigner", { recursive: true });
await writeFile("src/content/nosigner/home.json", JSON.stringify(data, null, 2) + "\n");
await writeFile(
  "references/nosigner/asset-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  manifest.length,
  "assets",
  manifest.reduce((a, m) => a + m.bytes, 0),
  "bytes",
);
