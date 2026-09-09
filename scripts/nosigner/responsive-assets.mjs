import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const raw = JSON.parse(await readFile("references/nosigner/extract-1440.json", "utf8"));
const data = JSON.parse(await readFile("src/content/nosigner/home.json", "utf8"));
const manifest = JSON.parse(
  await readFile("references/nosigner/asset-manifest.json", "utf8"),
);
const cache = new Map();
async function variants(image, role) {
  if (!image.srcset) return null;
  const result = [];
  for (const part of image.srcset.split(",")) {
    const [rel, size] = part.trim().split(/\s+/);
    const url = new URL(rel, "https://nosigner.com").href;
    if (cache.has(url)) {
      result.push(cache.get(url) + " " + size);
      continue;
    }
    const id = createHash("sha256").update(url).digest("hex").slice(0, 12);
    const path = `public/media/nosigner/${id}.webp`;
    let buf;
    try {
      buf = await readFile(path);
    } catch {
      const r = await fetch(url);
      if (!r.ok) throw Error(url);
      buf = Buffer.from(await r.arrayBuffer());
      await writeFile(path, buf);
      await new Promise((r) => setTimeout(r, 70));
    }
    const m = await sharp(buf).metadata();
    if (!manifest.some((e) => e.path === path))
      manifest.push({
        id,
        path,
        source: url,
        owner: "NOSIGNER / credited creators",
        permission: "User-confirmed 2026-09-09; docs/clone-workflow-ledger.md",
        status: "approved",
        role,
        width: m.width,
        height: m.height,
        bytes: buf.length,
        loading: "Responsive lazy variant",
        alt: "Decorative; adjacent HTML label",
        transformation: "Original source responsive WebP",
      });
    cache.set(url, path.replace("public", ""));
    result.push(cache.get(url) + " " + size);
  }
  return result.join(", ");
}
for (let i = 0; i < data.cards.length; i++) {
  const unique = [...new Map(raw.cards[i].images.map((v) => [v.src, v])).values()];
  for (let j = 0; j < data.cards[i].images.length; j++) {
    data.cards[i].images[j].srcSet = await variants(
      unique[j],
      "category-strip-responsive",
    );
  }
}
for (let i = 0; i < data.news.length; i++)
  data.news[i].image.srcSet = await variants(raw.news[i].image, "news-responsive");
for (let i = 0; i < data.hero.length; i++)
  data.hero[i].image.srcSet = await variants(raw.hero[i].image, "hero-responsive");
await writeFile("src/content/nosigner/home.json", JSON.stringify(data, null, 2) + "\n");
await writeFile(
  "references/nosigner/asset-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(manifest.length, "local variants");
