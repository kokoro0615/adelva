/**
 * Derives the delivered WebP files for /services/dx-it-procurement from the
 * text-free plates prepared by Opus 5.5 (image_gen edits by Codex gpt-6-astra,
 * joined, cleaned and unlit-derived deterministically). Rerun after changing a
 * plate. See assets/source/generated/adelva/dx-it-procurement-2026-09-28/.
 *
 *   node scripts/adelva/prepare-dx-it-procurement-assets.mjs
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SRC = "assets/source/generated/adelva/dx-it-procurement-2026-09-28";
const OUT = "public/media/adelva/dx-it-procurement";
await mkdir(OUT, { recursive: true });

const made = [];
async function webp(input, name, { width, height, extract, quality = 80 } = {}) {
  let s = sharp(input).removeAlpha();
  if (extract) s = s.extract(extract);
  if (width || height)
    s = s.resize(width ?? null, height ?? null, { kernel: "lanczos3" });
  const path = `${OUT}/${name}`;
  const info = await s.webp({ quality, effort: 6, smartSubsample: true }).toFile(path);
  made.push({
    path,
    width: info.width,
    height: info.height,
    bytes: (await stat(path)).size,
  });
}

// Desktop: hero + foundation map (1536×2304 plate; LCP on ≥1024 px).
await webp(`${SRC}/plates/D-map.png`, "d-map.webp", { quality: 78 });
await webp(`${SRC}/plates/D-map.png`, "d-map-1024.webp", { width: 1024, quality: 78 });
// Power-off layer of the conduits, staff floor and rooms (plate x 780–1536, y 0–1960).
await webp(`${SRC}/plates/D-map-off_x780_y0.png`, "d-map-off.webp", { quality: 76 });
// Service-boundary photograph (1024×1536).
await webp(`${SRC}/originals/D-diff.png`, "d-diff.webp", { width: 768, quality: 80 });
// Process: channel through granite to the dawn arch (1536×1664) and its unlit channel (x 740–1080, y 0–1330).
await webp(`${SRC}/plates/D-process.png`, "d-process.webp", { quality: 78 });
await webp(`${SRC}/plates/D-process-off_x740_y0.png`, "d-process-off.webp", {
  quality: 78,
});
// Related-domain cards (1254² originals).
for (const id of ["01", "02"]) {
  await webp(`${SRC}/originals/D-card-${id}.png`, `card-${id}.webp`, {
    width: 960,
    quality: 80,
  });
  await webp(`${SRC}/originals/D-card-${id}.png`, `card-${id}-560.webp`, {
    width: 560,
    quality: 80,
  });
}

// Mobile / tablet: the continuous section (780×11000 = 390×5500 CSS px at 2×),
// cut into eight 1375-row tiles that stack without a seam; the first is the LCP.
const TILE = 1375;
for (let i = 0; i < 8; i++)
  await webp(`${SRC}/plates/M-body@2x.png`, `m-body-${i}.webp`, {
    extract: { left: 0, top: i * TILE, width: 780, height: TILE },
    quality: 76,
  });
// Power-off layer of the core and channel (plate x 560–780, y 440–10070), in tiles.
const OFF_TOP = 440,
  OFF_H = 9630,
  OFF_TILE = 1926;
for (let i = 0; i < 5; i++)
  await webp(`${SRC}/plates/M-core-off@2x_x560_y440.png`, `m-core-off-${i}.webp`, {
    extract: {
      left: 0,
      top: i * OFF_TILE,
      width: 220,
      height: Math.min(OFF_TILE, OFF_H - i * OFF_TILE),
    },
    quality: 78,
  });

await writeFile(
  `${OUT}/manifest.json`,
  JSON.stringify(
    {
      source: SRC,
      files: made,
      mobileTile: TILE,
      coreOff: { top: OFF_TOP, tile: OFF_TILE },
    },
    null,
    2,
  ) + "\n",
);
console.table(made.map((m) => ({ ...m, kb: Math.round(m.bytes / 1024) })));
