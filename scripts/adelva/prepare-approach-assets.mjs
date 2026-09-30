/**
 * Derives the delivered WebP plates for /approach from the generated,
 * text-free originals. Deterministic: rerun after changing an original.
 * See docs/specs/adelva-approach-spec.md §9.
 *
 *   node scripts/adelva/prepare-approach-assets.mjs
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "assets/source/generated/adelva/approach-page-2026-09-26";
const OUT = "public/media/adelva/approach";
await mkdir(OUT, { recursive: true });

/**
 * [source id, delivered name, widths (the largest is the native width),
 *  quality]. Night and dark plates tolerate a lower quality without banding
 * because the page darkens them further.
 */
const plates = [
  ["D-hero", "d-hero", [1024, null], 80],
  ["D-01", "d-01", [1280, null], 78],
  ["D-02", "d-02", [1280, null], 78],
  ["D-03", "d-03", [1280, null], 78],
  ["D-04", "d-04", [1280, null], 78],
  ["D-05", "d-05", [1280, null], 78],
  ["D-06", "d-06", [1280, null], 80],
  ["D-integrated", "d-integrated", [null], 76],
  ["D-ridge", "ridge", [null], 70],
  ["M-hero", "m-hero", [null], 80],
  ["M-01", "m-01", [720, null], 78],
  ["M-02", "m-02", [720, null], 78],
  ["M-03", "m-03", [720, null], 78],
  ["M-04", "m-04", [720, null], 78],
  ["M-05", "m-05", [720, null], 78],
  ["M-06", "m-06", [720, null], 80],
  ["M-integrated", "m-integrated", [null], 76],
];

const manifest = [];
for (const [id, name, widths, quality] of plates) {
  const input = `${SOURCE}/${id}.png`;
  const { width, height } = await sharp(input).metadata();
  for (const target of widths) {
    const w = target ?? width;
    const file = target ? `${OUT}/${name}-${target}.webp` : `${OUT}/${name}.webp`;
    await sharp(input)
      .removeAlpha()
      .resize({ width: w, kernel: "lanczos3" })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(file);
    const bytes = (await stat(file)).size;
    manifest.push({
      id,
      file,
      width: w,
      height: Math.round((height * w) / width),
      bytes,
    });
  }
}
await writeFile(`${SOURCE}/delivered.json`, `${JSON.stringify(manifest, null, 2)}\n`);
for (const entry of manifest)
  console.log(
    `${entry.file} ${entry.width}x${entry.height} ${(entry.bytes / 1024).toFixed(0)} KiB`,
  );
