import fs from "node:fs/promises";
import sharp from "sharp";
const root = "assets/source/generated/adelva/photo-tiles-2026-09-09";
const destination = "public/media/adelva/photo-tiles";
const generations = JSON.parse(await fs.readFile(`${root}/manifest.json`, "utf8"));
if (generations.length !== 24 || new Set(generations.map((g) => g.id)).size !== 24)
  throw new Error("Expected 24 distinct completed generations");
await fs.mkdir(destination, { recursive: true });
const manifest = [];
const images = [];
for (const generation of generations) {
  const metadata = await sharp(generation.source).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`Invalid dimensions: ${generation.id}`);
  const original = `${root}/${generation.id}.png`;
  await fs.copyFile(generation.source, original);
  const variants = [];
  for (const width of [...new Set([400, 800, Math.min(1200, metadata.width)])]) {
    const path = `${destination}/${generation.id}-${width}.webp`;
    const info = await sharp(original)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(path);
    variants.push({
      path,
      src: path.replace(/^public/, ""),
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
  const base = variants.find((v) => v.width === 800);
  if (!base) throw new Error(`Missing 800px derivative for ${generation.id}`);
  images.push({
    id: generation.id,
    band: generation.band,
    src: base.src,
    srcSet: variants.map((v) => `${v.src} ${v.width}w`).join(", "),
    width: base.width,
    height: base.height,
  });
  manifest.push({
    ...generation,
    original,
    width: metadata.width,
    height: metadata.height,
    variants,
    owner: "ADELVA project; commissioned by user",
    origin: "Subscription-backed built-in imagegen, no reference inputs",
    rights: "Original generated output, no third-party photo used",
    role: "Individual decorative photo in a flowing hospitality sequence",
    altIntent: "Empty alt: decorative, band heading carries meaning",
    loading: "Local responsive WebP, lazy loading, explicit intrinsic dimensions",
    inspection:
      "Accepted: distinct subject, usable anatomy/perspective and no identifiable third-party branding; fictional people and properties",
    perCallModel: "Not exposed",
    quality: "Final production quality requested in prompt; parameter not exposed",
  });
}
await fs.writeFile(`${root}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
await fs.writeFile(
  "src/content/adelva-photo-tiles.json",
  JSON.stringify(images, null, 2) + "\n",
);
console.log({
  images: images.length,
  bytes: manifest.reduce(
    (total, item) => total + item.variants.reduce((t, v) => t + v.bytes, 0),
    0,
  ),
});
