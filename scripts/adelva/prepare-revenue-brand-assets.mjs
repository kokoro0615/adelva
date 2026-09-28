/** Deterministic delivery derivatives; spec §10. No generative image changes. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const base = "assets/source/generated/adelva/revenue-brand-2026-09-28";
const out = "public/media/adelva/revenue-brand";
await mkdir(out, { recursive: true });
const derivatives = [];
async function encode(input, name, width, format, crop, role) {
  let p = sharp(`${base}/${input}`);
  if (crop) p = p.extract(crop);
  p = p.resize({ width, kernel: "lanczos3" });
  p =
    format === "avif"
      ? p.avif({ quality: 58, effort: 5 })
      : p.webp({ quality: 80, effort: 6, smartSubsample: true });
  const path = `${out}/${name}-${width}.${format}`;
  const info = await p.toFile(path);
  const bytes = await readFile(path);
  derivatives.push({
    path,
    source: `${base}/${input}`,
    role,
    width: info.width,
    height: info.height,
    format,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    crop: crop ?? null,
    alt: "",
    owner: "ADELVA project",
    license: "User-authorized generated imagery; fictional locations",
    loading:
      role === "background"
        ? name.endsWith("-0")
          ? "media-specific preload"
          : name.endsWith("-1")
            ? "eager"
            : "lazy"
        : "lazy",
  });
}
// Sequential tile families bound encoder memory while the main worktree builds.
for (const [key, width, height, count, small] of [
  ["d", 1536, 8704, 8, 1024],
  ["m", 853, 12960, 10, 600],
]) {
  for (let n = 0; n < count; n++)
    for (const w of [width, small])
      for (const f of ["avif", "webp"])
        await encode(
          `plates/${key === "d" ? "desktop" : "mobile"}-plate.png`,
          `${key}-plate-${n}`,
          w,
          f,
          {
            left: 0,
            top: (n * height) / count,
            width,
            height: height / count + (n === count - 1 ? 0 : 4),
          },
          "background",
        );
  console.log(`${key}: ${count * 4} tiles`);
}
for (const c of ["C1", "C2"])
  for (const w of [1200, 800])
    for (const f of ["avif", "webp"])
      await encode(`raw/${c}.png`, c.toLowerCase(), w, f, null, "related-card");
for (const c of ["F1", "F2"])
  for (const w of [1536, 768])
    await encode(`raw/${c}.png`, c.toLowerCase(), w, "webp", null, "fog");
await writeFile(
  `${base}/manifest.json`,
  JSON.stringify(
    {
      generatedBy: "scripts/adelva/prepare-revenue-brand-assets.mjs",
      sourceOwner: "ADELVA project",
      sourceMethod:
        "Built-in image_gen; prompts and stitching by Opus; Astra image workers",
      derivatives,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
