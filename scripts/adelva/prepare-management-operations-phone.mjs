/**
 * Phone/tablet texture tiles of /services/management-operations (< 1024 px).
 *
 *   node scripts/adelva/prepare-management-operations-phone.mjs [--src <dir>]
 *
 * The narrow-viewport camera draws the photograph with WebGL. Instead of the
 * desktop's large WebP layers (≈188 MB decoded), it streams small tiles that
 * the renderer uploads once and keeps only while the camera is near them
 * (polish 2026-10-13, rule R5: ≤ 64 MB of decoded image data alive).
 *
 * Every tile is derived from the desktop masters in
 * `public/media/adelva/management-operations/` (or `--src`), so a re-rendered
 * plate family with the same file names and pixel sizes drops in by running
 * this script again. Nothing here depends on the colours of the photograph:
 * the only derived look is `soft`, a Gaussian defocus of the base plate.
 *
 * Output: `public/media/adelva/management-operations/phone/<layer>/<row>-<col>.webp`
 * and the manifest `src/content/adelva-management-operations-phone-tiles.ts`.
 * A tile holds TILE texels plus GUTTER texels copied from its neighbours on
 * every side, so bilinear and mipmapped sampling never shows a seam.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = process.cwd();
const srcArg = process.argv.indexOf("--src");
const SRC =
  srcArg > 0
    ? path.resolve(process.argv[srcArg + 1])
    : path.join(ROOT, "public/media/adelva/management-operations");
const OUT = path.join(ROOT, "public/media/adelva/management-operations/phone");
const MANIFEST = path.join(
  ROOT,
  "src/content/adelva-management-operations-phone-tiles.ts",
);
const URL_BASE = "/media/adelva/management-operations/phone/";

const DEFAULT_TILE = 512;
/** Small, soft layers stay one texture: they are sampled as overlays. */
const SINGLE = 2048;
const GUTTER = 4;
const PLATE = { width: 1536, height: 8379, sky: 1280 };

/**
 * Layers in plate px. `parts` stack master files vertically from the layer's
 * top; `scale` is texels per plate px, `master` the masters' px per plate px
 * (default 1). Opaque layers drop their alpha.
 */
const LAYERS = [
  {
    name: "sky",
    x: 0,
    y: -PLATE.sky,
    w: 1536,
    h: 1440,
    scale: 0.75,
    alpha: true,
    parts: ["sky.webp"],
  },
  {
    name: "base",
    x: 0,
    y: 0,
    w: 1536,
    h: 8379,
    scale: 1,
    alpha: false,
    parts: [
      "base-0.webp",
      "base-2048.webp",
      "base-4096.webp",
      "base-6144.webp",
      "base-8192.webp",
    ],
  },
  {
    name: "dim",
    x: 0,
    y: 0,
    w: 1536,
    h: 2560,
    scale: 1,
    alpha: false,
    parts: ["dim-0.webp", "dim-2048.webp"],
  },
  {
    name: "lit",
    x: 0,
    y: 0,
    w: 1536,
    h: 2560,
    scale: 1,
    alpha: false,
    parts: ["lit-0.webp", "lit-2048.webp"],
  },
  {
    name: "blur",
    x: 0,
    y: 0,
    w: 1536,
    h: 2560,
    scale: 0.25,
    tile: SINGLE,
    alpha: false,
    parts: ["blur-0.webp", "blur-2048.webp"],
  },
  {
    name: "grove2x",
    x: 320,
    y: 640,
    w: 1216,
    h: 1536,
    scale: 2,
    master: 2,
    alpha: true,
    parts: ["grove2x-0.webp", "grove2x-1.webp"],
  },
  {
    name: "lit2x",
    x: 320,
    y: 640,
    w: 1216,
    h: 1536,
    scale: 2,
    master: 2,
    alpha: true,
    parts: ["lit2x-0.webp", "lit2x-1.webp"],
  },
  ...[
    [513, 2381, 454, 654],
    [704, 2390, 453, 654],
    [920, 2386, 453, 653],
    [1154, 2401, 382, 653],
  ].map(([x, y, w, h], i) => ({
    name: `warm-knuckle-${i + 1}`,
    x,
    y,
    w,
    h,
    scale: 1,
    alpha: true,
    parts: [`warm-knuckle-${i + 1}.webp`],
  })),
  {
    name: "warm-old",
    x: 666,
    y: 2906,
    w: 870,
    h: 2198,
    scale: 1,
    alpha: true,
    parts: ["warm-old-0.webp", "warm-old-2048.webp"],
  },
  {
    name: "warm-young",
    x: 826,
    y: 5521,
    w: 688,
    h: 1303,
    scale: 1,
    alpha: true,
    parts: ["warm-young.webp"],
  },
];

/** Derived: the base plate defocused, behind the forks, the routes and the contact. */
const SOFT = {
  name: "soft",
  x: 0,
  y: 2048,
  w: 1536,
  h: PLATE.height - 2048,
  scale: 0.25,
  sigma: 20,
};
/** Derived: the whole photograph, tiny, drawn while tiles stream in. */
const PREVIEW = {
  name: "preview",
  x: 0,
  y: -PLATE.sky,
  w: 1536,
  h: PLATE.height + PLATE.sky,
  scale: 1 / 8,
};

async function stack(parts, w, h, alpha) {
  const layers = [];
  let top = 0;
  for (const part of parts) {
    const file = path.join(SRC, part);
    const meta = await sharp(file).metadata();
    if (meta.width !== w)
      throw new Error(`${part}: width ${meta.width}, expected ${w}`);
    layers.push({ input: file, left: 0, top });
    top += meta.height;
  }
  if (top !== h) throw new Error(`${parts.join("+")}: height ${top}, expected ${h}`);
  const canvas = sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite(layers);
  const raw = await canvas.raw().toBuffer();
  return { raw, w, h, channels: 4, alpha };
}

async function scaled(source, scale) {
  const W = Math.round(source.w * scale);
  const H = Math.round(source.h * scale);
  const img = sharp(source.raw, {
    raw: { width: source.w, height: source.h, channels: 4 },
  });
  const raw =
    W === source.w && H === source.h
      ? source.raw
      : await img.resize(W, H, { kernel: "lanczos3", fit: "fill" }).raw().toBuffer();
  return { raw, W, H };
}

async function writeTiles(name, raster, alpha, TILE = DEFAULT_TILE) {
  const dir = path.join(OUT, name);
  await mkdir(dir, { recursive: true });
  const cols = Math.ceil(raster.W / TILE);
  const rows = Math.ceil(raster.H / TILE);
  const padded = await sharp(raster.raw, {
    raw: { width: raster.W, height: raster.H, channels: 4 },
  })
    .extend({
      top: GUTTER,
      bottom: GUTTER,
      left: GUTTER,
      right: GUTTER,
      extendWith: "copy",
    })
    .raw()
    .toBuffer();
  const PW = raster.W + 2 * GUTTER;
  const PH = raster.H + 2 * GUTTER;
  const tiles = [];
  let bytes = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const w = Math.min(TILE, raster.W - c * TILE) + 2 * GUTTER;
      const h = Math.min(TILE, raster.H - r * TILE) + 2 * GUTTER;
      let img = sharp(padded, { raw: { width: PW, height: PH, channels: 4 } }).extract({
        left: c * TILE,
        top: r * TILE,
        width: w,
        height: h,
      });
      if (!alpha) img = img.removeAlpha();
      const buf = await img
        .webp(
          alpha
            ? {
                quality: 84,
                alphaQuality: 100,
                exact: true,
                effort: 6,
                smartSubsample: true,
              }
            : { quality: 84, effort: 6, smartSubsample: true },
        )
        .toBuffer();
      await writeFile(path.join(dir, `${r}-${c}.webp`), buf);
      bytes += buf.length;
      tiles.push([w, h]);
    }
  return { cols, rows, bytes, tiles };
}

await rm(OUT, { recursive: true, force: true });
const manifest = [];
let total = 0;

for (const layer of LAYERS) {
  const m = layer.master ?? 1;
  const source = await stack(layer.parts, layer.w * m, layer.h * m, layer.alpha);
  const raster = await scaled(source, layer.scale / m);
  const tile = layer.tile ?? DEFAULT_TILE;
  const out = await writeTiles(layer.name, raster, layer.alpha, tile);
  total += out.bytes;
  manifest.push({
    name: layer.name,
    x: layer.x,
    y: layer.y,
    w: layer.w,
    h: layer.h,
    sx: raster.W / layer.w,
    sy: raster.H / layer.h,
    cols: out.cols,
    rows: out.rows,
    tile,
    texW: raster.W,
    texH: raster.H,
  });
  console.log(
    `${layer.name.padEnd(15)} ${raster.W}×${raster.H} ${out.cols}×${out.rows} tiles ${(out.bytes / 1024).toFixed(0)} KB`,
  );
}

// soft: the base plate rows SOFT.y.., defocused (8-bit input, see traps).
{
  const base = LAYERS.find((layer) => layer.name === "base");
  const source = await stack(base.parts, base.w, base.h, false);
  const crop = await sharp(source.raw, {
    raw: { width: source.w, height: source.h, channels: 4 },
  })
    .extract({ left: 0, top: SOFT.y, width: SOFT.w, height: SOFT.h })
    .raw()
    .toBuffer();
  const W = Math.round(SOFT.w * SOFT.scale);
  const H = Math.round(SOFT.h * SOFT.scale);
  const raw = await sharp(crop, { raw: { width: SOFT.w, height: SOFT.h, channels: 4 } })
    .resize(W, H, { kernel: "lanczos3", fit: "fill" })
    .blur(SOFT.sigma * SOFT.scale)
    .raw()
    .toBuffer();
  const out = await writeTiles(SOFT.name, { raw, W, H }, false, SINGLE);
  total += out.bytes;
  manifest.push({
    name: SOFT.name,
    x: SOFT.x,
    y: SOFT.y,
    w: SOFT.w,
    h: SOFT.h,
    sx: W / SOFT.w,
    sy: H / SOFT.h,
    cols: out.cols,
    rows: out.rows,
    tile: SINGLE,
    texW: W,
    texH: H,
  });
  console.log(
    `${SOFT.name.padEnd(15)} ${W}×${H} ${out.cols}×${out.rows} tiles ${(out.bytes / 1024).toFixed(0)} KB`,
  );

  // preview: sky over ink, then the plate, at 1/8.
  const sky = LAYERS.find((layer) => layer.name === "sky");
  const W8 = Math.round(PREVIEW.w * PREVIEW.scale);
  const H8 = Math.round(PREVIEW.h * PREVIEW.scale);
  const full = await sharp({
    create: { width: PREVIEW.w, height: PREVIEW.h, channels: 3, background: "#0e1118" },
  })
    .composite([
      { input: path.join(SRC, base.parts[0]), left: 0, top: PLATE.sky },
      ...base.parts.slice(1).map((part, i) => ({
        input: path.join(SRC, part),
        left: 0,
        top: PLATE.sky + 2048 * (i + 1),
      })),
      { input: path.join(SRC, sky.parts[0]), left: 0, top: 0 },
    ])
    .removeAlpha()
    .raw()
    .toBuffer();
  const small = await sharp(full, {
    raw: { width: PREVIEW.w, height: PREVIEW.h, channels: 3 },
  })
    .resize(W8, H8, { kernel: "lanczos3", fit: "fill" })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "preview.webp"), small);
  total += small.length;
  manifest.push({
    name: PREVIEW.name,
    x: PREVIEW.x,
    y: PREVIEW.y,
    w: PREVIEW.w,
    h: PREVIEW.h,
    sx: W8 / PREVIEW.w,
    sy: H8 / PREVIEW.h,
    cols: 1,
    rows: 1,
    tile: SINGLE,
    texW: W8,
    texH: H8,
  });
  console.log(`preview         ${W8}×${H8} ${(small.length / 1024).toFixed(0)} KB`);
}

const body = `/**
 * Texture tiles of the narrow-viewport camera of /services/management-operations.
 *
 * Generated by scripts/adelva/prepare-management-operations-phone.mjs from the
 * plate masters; do not edit by hand. Layer rectangles are plate px; \`sx\`/\`sy\`
 * are texels per plate px. Tile \`<row>-<col>.webp\` holds tile×tile texels of
 * the scaled layer (fewer at the right and bottom edges) plus \`gutter\` texels
 * copied from the neighbours on every side. \`preview\` is one file.
 */

export interface PhoneLayer {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly sx: number;
  readonly sy: number;
  readonly cols: number;
  readonly rows: number;
  /** Texels per tile side (without gutters). */
  readonly tile: number;
  readonly texW: number;
  readonly texH: number;
}

export const phoneTiles = {
  base: ${JSON.stringify(URL_BASE)},
  gutter: ${GUTTER},
  layers: ${JSON.stringify(Object.fromEntries(manifest.map((m) => [m.name, m])), null, 2)},
} as const satisfies {
  base: string;
  gutter: number;
  layers: Record<string, PhoneLayer>;
};
`;
await writeFile(MANIFEST, body);
execFileSync(
  process.execPath,
  [path.join(ROOT, "node_modules/prettier/bin/prettier.cjs"), "--write", MANIFEST],
  { stdio: "ignore" },
);
console.log(
  `total ${(total / 1024 / 1024).toFixed(2)} MB → ${path.relative(ROOT, OUT)}`,
);
