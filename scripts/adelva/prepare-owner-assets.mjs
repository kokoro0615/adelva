/** Delivery assets for /challenges/owner (B2「囲炉裏」) — docs/specs/adelva-owner-spec.md §10.
 *
 * Deterministic: tiles the adopted clean plates, converts the pre-dawn variants,
 * and derives the ember "breath" layer from the plate's own hearth pixels. No
 * image generation happens here.
 *   node scripts/adelva/prepare-owner-assets.mjs [--ember]   (--ember: only rebuild the ember layers)
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const mock = "references/adelva/mockups/owner-2026-09-29";
const out = "public/media/adelva/owner";
const record = "assets/source/generated/adelva/owner-2026-09-30";

/** Page geometry: desktop page 1440 wide, mobile page 390 wide (spec §6). */
const REGIMES = {
  d: {
    plate: `${mock}/B2/plates/plate.png`,
    dawn: `${mock}/B2/raw/V-dawn.png`,
    page: 1440,
    tiles: 10,
    widths: [1536, 1024],
    // the charcoal bed in page px (x0, y0, x1, y1)
    ember: [440, 5280, 1000, 5680],
  },
  m: {
    plate: `${mock}/B2-mobile/plates/plate.png`,
    dawn: `${mock}/B2-mobile/bands/V-dawn.png`,
    page: 390,
    tiles: 9,
    widths: [853, 600],
    ember: [176, 4350, 390, 4650],
  },
};
const OVERLAP = 4;

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const derivatives = [];
const sources = {};

async function save(pipeline, path, role, extra = {}) {
  const bytes = await pipeline.toBuffer();
  await writeFile(path, bytes);
  const meta = await sharp(bytes).metadata();
  derivatives.push({
    path,
    role,
    width: meta.width,
    height: meta.height,
    bytes: bytes.length,
    sha256: sha(bytes),
    ...extra,
  });
}

const encoders = {
  avif: (p) => p.avif({ quality: 58, effort: 5 }),
  webp: (p) => p.webp({ quality: 80, effort: 6, smartSubsample: true }),
};
const alphaEncoders = {
  avif: (p) => p.avif({ quality: 62, effort: 5 }),
  webp: (p) => p.webp({ quality: 82, alphaQuality: 90, effort: 6 }),
};

/** Rows of tile n (the last one takes the remainder); every tile but the last overlaps the next by 4 rows. */
function tileRows(height, tiles, n) {
  const step = Math.floor(height / tiles);
  const top = n * step;
  const end = n === tiles - 1 ? height : top + step + OVERLAP;
  return [top, end - top];
}

/** Ember-ness of a pixel: saturated orange-red with a bright red channel. */
function ember(r, g, b) {
  const heat = (r - 0.55 * g - 0.65 * b - 58) / 70;
  const bright = (r - 120) / 60;
  return Math.max(0, Math.min(1, heat)) * Math.max(0, Math.min(1, bright));
}

async function emberLayer(key, g, plateMeta) {
  const k = plateMeta.width / g.page;
  const [x0, y0, x1, y1] = g.ember;
  const box = {
    left: Math.round(x0 * k),
    top: Math.round(y0 * k),
    width: Math.round((x1 - x0) * k),
    height: Math.round((y1 - y0) * k),
  };
  const { data, info } = await sharp(g.plate)
    .extract(box)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const core = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++)
    core[i] = Math.round(255 * ember(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]));
  const blur = async (sigma) =>
    sharp(core, { raw: { width: w, height: h, channels: 1 } })
      .blur(sigma)
      .extractChannel(0)
      .raw()
      .toBuffer();
  // a tight core for the coals and a wide bloom for the light they throw on the ash
  const tight = await blur(1.2 * (k / 1.0667));
  const bloom = await blur(16 * (k / 1.0667));
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const t = tight[i] / 255;
    const b = Math.min(1, (bloom[i] / 255) * 2.6);
    const a = Math.min(0.85, t * 0.8 + b * 0.35);
    if (a <= 0) continue;
    // hotter toward the core: from deep orange (bloom) to amber-yellow (coals)
    const mix = t / a || 0;
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = Math.round(112 + 70 * mix);
    rgba[i * 4 + 2] = Math.round(28 + 40 * mix);
    rgba[i * 4 + 3] = Math.round(255 * a);
  }
  for (const [format, encode] of Object.entries(alphaEncoders)) {
    const path = `${out}/${key}-ember.${format}`;
    await save(
      encode(sharp(rgba, { raw: { width: w, height: h, channels: 4 } })),
      path,
      "ember breath layer (screen)",
      { box, page: g.ember },
    );
  }
}

const emberOnly = process.argv.includes("--ember");
await mkdir(out, { recursive: true });
await mkdir(record, { recursive: true });
if (emberOnly) {
  const previous = JSON.parse(await readFile(`${record}/manifest.json`, "utf8"));
  Object.assign(sources, previous.sources);
  derivatives.push(...previous.derivatives.filter((d) => !d.path.includes("-ember.")));
}

for (const [key, g] of Object.entries(REGIMES)) {
  if (emberOnly) {
    await emberLayer(key, g, await sharp(g.plate).metadata());
    continue;
  }
  const plateBytes = await readFile(g.plate);
  const dawnBytes = await readFile(g.dawn);
  sources[g.plate] = sha(plateBytes);
  sources[g.dawn] = sha(dawnBytes);
  const plateMeta = await sharp(plateBytes).metadata();

  for (let n = 0; n < g.tiles; n++) {
    const [top, height] = tileRows(plateMeta.height, g.tiles, n);
    const tile = await sharp(plateBytes)
      .extract({ left: 0, top, width: plateMeta.width, height })
      .removeAlpha()
      .png()
      .toBuffer();
    for (const width of g.widths) {
      for (const [format, encode] of Object.entries(encoders)) {
        const scaled =
          width === plateMeta.width
            ? sharp(tile)
            : sharp(tile).resize({ width, kernel: "lanczos3" });
        await save(
          encode(scaled),
          `${out}/${key}-plate-${n}-${width}.${format}`,
          "plate tile",
          {
            rows: [top, top + height],
          },
        );
      }
    }
  }

  for (const width of g.widths) {
    for (const [format, encode] of Object.entries(encoders)) {
      const base = sharp(dawnBytes).removeAlpha();
      const scaled =
        width === plateMeta.width ? base : base.resize({ width, kernel: "lanczos3" });
      await save(
        encode(scaled),
        `${out}/${key}-dawn-${width}.${format}`,
        "pre-dawn variant",
      );
    }
  }

  await emberLayer(key, g, plateMeta);
  console.log(key, plateMeta.width, plateMeta.height);
}

await writeFile(
  `${record}/manifest.json`,
  JSON.stringify(
    {
      script: "scripts/adelva/prepare-owner-assets.mjs",
      spec: "docs/specs/adelva-owner-spec.md §10",
      generatedBy:
        "Codex gpt-6-astra image_gen clean plates and V-dawn variants (records under the mock folders); deterministic tiling and ember derivation here",
      sources,
      derivatives,
    },
    null,
    1,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
