/**
 * Delivery derivatives for /about (A2 "INK TO LIFE"); spec
 * docs/specs/adelva-about-a2-spec.md §9. Deterministic pixel arithmetic only:
 * crops, resizes, feathered blends of registered plates. No generative edits.
 *
 * Usage (project root): node scripts/adelva/prepare-about-assets.mjs
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const base = "assets/source/generated/adelva/about-2026-09-29";
const out = "public/media/adelva/about-a2";
await mkdir(out, { recursive: true });
const derivatives = [];

async function record(path, source, role, extra = {}) {
  const bytes = await readFile(path);
  const meta = await sharp(bytes).metadata();
  derivatives.push({
    path,
    source,
    role,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    alt: "",
    owner: "ADELVA project",
    license: "User-authorized generated imagery; fictional ryokan and garden",
    ...extra,
  });
}

async function encode(pipeline, name, format, source, role, extra) {
  const path = `${out}/${name}.${format}`;
  const p =
    format === "avif"
      ? pipeline.avif({ quality: 56, effort: 6 })
      : pipeline.webp({ quality: 82, effort: 6, smartSubsample: true });
  await p.toFile(path);
  await record(path, source, role, extra);
}

/* ------------------------------------------------------------------ plates */
// Tile rows are plate pixels. Each tile but the last carries 4 extra rows so
// neighbouring tiles overlap under fractional CSS scaling (no hairline seams).
const plates = {
  d: {
    file: "desktop-plate.png",
    width: 1536,
    height: 6912,
    count: 8,
    widths: [1536, 1024],
  },
  m: {
    file: "mobile-plate.png",
    width: 853,
    height: 10534,
    count: 10,
    widths: [853, 600],
  },
};
for (const [key, p] of Object.entries(process.env.SKIP_PLATES ? {} : plates)) {
  const step = Math.ceil(p.height / p.count);
  for (let n = 0; n < p.count; n++) {
    const top = n * step;
    const height = Math.min(step + (n === p.count - 1 ? 0 : 4), p.height - top);
    for (const width of p.widths)
      for (const format of ["avif", "webp"])
        await encode(
          sharp(`${base}/${p.file}`)
            .extract({ left: 0, top, width: p.width, height })
            .resize({ width, kernel: "lanczos3" }),
          `${key}-plate-${n}-${width}`,
          format,
          `${base}/${p.file}`,
          "background",
          { plateRows: [top, top + height] },
        );
  }
  console.log(`${key}: ${p.count} tiles × ${p.widths.length} widths × 2 formats`);
}

/* ------------------------------------------------------- implementation front */
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Deterministic value-noise fBm in [-1, 1]; `period` is the base feature size in px.
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function fbm(x, y, period, seed) {
  let sum = 0,
    amp = 0.55,
    norm = 0;
  for (let o = 0; o < 3; o++) {
    const p = period / 2 ** o,
      gx = x / p,
      gy = y / p,
      x0 = Math.floor(gx),
      y0 = Math.floor(gy);
    const tx = gx - x0,
      ty = gy - y0,
      sx = tx * tx * (3 - 2 * tx),
      sy = ty * ty * (3 - 2 * ty);
    const a = hash(x0, y0, seed + o),
      b = hash(x0 + 1, y0, seed + o),
      c = hash(x0, y0 + 1, seed + o),
      d = hash(x0 + 1, y0 + 1, seed + o);
    sum += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy);
    norm += amp;
    amp *= 0.5;
  }
  return (sum / norm) * 2 - 1;
}
async function rgb(file, top, rows, width) {
  const { data } = await sharp(`${base}/${file}`)
    .extract({ left: 0, top, width, height: rows })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}
/**
 * Build one front texture: the plate slice with a registered variant blended in
 * by `weight(x, vy)` (0 = plate, 1 = variant; vy = variant row). Opaque RGB: the
 * shader derives its morning-light band from where "before" and "after" differ.
 */
async function frontTexture({ plate, width, top, rows, variant, vTop, weight, name }) {
  const base0 = await rgb(plate, top, rows, width);
  const vRows = (await sharp(`${base}/${variant}`).metadata()).height;
  const v = await rgb(variant, 0, vRows, width);
  const px = Buffer.alloc(width * rows * 3);
  for (let y = 0; y < rows; y++) {
    const vy = top + y - vTop;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const k = vy >= 0 && vy < vRows ? weight(x, vy) : 0;
      const j = (vy * width + x) * 3;
      for (let c = 0; c < 3; c++)
        px[i + c] = Math.round(base0[i + c] * (1 - k) + (k ? v[j + c] * k : 0));
    }
  }
  const path = `${out}/${name}.webp`;
  await sharp(px, { raw: { width, height: rows, channels: 3 } })
    .webp({ quality: 84, effort: 6, smartSubsample: true })
    .toFile(path);
  await record(path, `${base}/${plate} + ${base}/${variant}`, "front-texture", {
    plateRows: [top, top + rows],
    variantPlateRow: vTop,
  });
}

// Desktop: segment B spans CSS 2160–3390 = plate rows 2304–3616 (×0.9375).
// The variants are plate rows 2304–3327. Plate px = CSS / 0.9375.
const dCss = (v) => v / 0.9375;
// Organic edges: every feather is displaced by low-frequency noise so no edge
// of a blend reads as a straight line or a rectangle.
const edge = (a, b, t, n) => smooth(a + n, b + n, t);
await frontTexture({
  name: "d-front-before",
  plate: "desktop-plate.png",
  width: 1536,
  top: 2304,
  rows: 1312,
  variant: "desktop-v-ink.png",
  vTop: 2304,
  // V-ink redraws the deck in its first rows where the plate shows the photographed
  // reflection: fade in below it, and hand back to the plate above the variant's edge.
  weight: (x, vy) =>
    edge(0, 150, vy, 40 + 40 * fbm(x, vy, 260, 3)) * (1 - smooth(963, 1023, vy)),
});
await frontTexture({
  name: "d-front-after",
  plate: "desktop-plate.png",
  width: 1536,
  top: 2304,
  rows: 1312,
  variant: "desktop-v-photo.png",
  vTop: 2304,
  // Legibility: the text column (CSS x ≤ 800, y ≤ 2905) keeps the plate's paper;
  // the photograph begins along a noisy, rounded distance from that column.
  weight: (x, vy) => {
    const dx = Math.max(0, x - dCss(800)),
      dy = Math.max(0, vy + 2304 - dCss(2905));
    const d = Math.hypot(dx, dy);
    const outside = edge(0, dCss(190), d, dCss(70) * fbm(x, vy, 300, 11));
    return (
      outside *
      edge(0, 150, vy, 50 + 45 * fbm(x, vy, 240, 5)) *
      (1 - smooth(963, 1023, vy))
    );
  },
});

// Mobile: segment B spans CSS 2060–3400 = plate rows 4505–7437 (×853/390).
// Variants are band rows 0–1843 at plate row 5514; only rows 13–84 % hold the
// same composition as the plate (their edges were redrawn), so blend there.
const mWeight = (x, vy) =>
  edge(240, 406, vy, 40 * fbm(x, vy, 200, 7)) *
  (1 - edge(1401, 1549, vy, 40 * fbm(x, vy, 200, 9)));
await frontTexture({
  name: "m-front-before",
  plate: "mobile-plate.png",
  width: 853,
  top: 4505,
  rows: 2932,
  variant: "mobile-v-ink.png",
  vTop: 5514,
  weight: mWeight,
});
await frontTexture({
  name: "m-front-after",
  plate: "mobile-plate.png",
  width: 853,
  top: 4505,
  rows: 2932,
  variant: "mobile-v-photo.png",
  vTop: 5514,
  weight: mWeight,
});
console.log("front textures: 4");

/* ------------------------------------------------------------ audience panels */
// Plate crops (no upscaling): owners = the sketched gable and upper storey (the
// plan); managers = the photographed stepping stones and lantern (the site).
const crops = {
  "d-owners": ["desktop-plate.png", [560, 1170, 976, 346]],
  "d-managers": ["desktop-plate.png", [640, 3190, 896, 318]],
  "m-owners": ["mobile-plate.png", [80, 2880, 773, 356]],
  "m-managers": ["mobile-plate.png", [60, 6120, 793, 365]],
};
for (const [name, [file, [left, top, width, height]]] of Object.entries(crops))
  for (const format of ["avif", "webp"])
    await encode(
      sharp(`${base}/${file}`).extract({ left, top, width, height }),
      name,
      format,
      `${base}/${file}`,
      "audience-panel",
      { crop: { left, top, width, height } },
    );
console.log("audience panels: 4 × 2 formats");

await writeFile(
  `${out}/manifest.json`,
  JSON.stringify(
    {
      generatedBy: "scripts/adelva/prepare-about-assets.mjs",
      sourceOwner: "ADELVA project",
      sourceMethod:
        "Built-in image_gen clean plates and variants (Codex gpt-6-astra, Opus-authored prompts); references/adelva/mockups/about-2026-09-29/A2 and A2-mobile",
      derivatives,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
