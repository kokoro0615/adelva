/**
 * Derives the delivered WebP files for /services/management-operations from
 * the generated, text-free originals. Deterministic: rerun after changing an
 * original. See docs/specs/adelva-management-operations-spec.md §10.
 *
 *   node scripts/adelva/prepare-management-operations-assets.mjs
 */
import { mkdir, stat } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "assets/source/generated/adelva/management-operations-2026-09-24";
const OUT = "public/media/adelva/management-operations";
await mkdir(OUT, { recursive: true });

const raw = async (input) => {
  const { data, info } = await sharp(input)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

/**
 * Extends a process keyframe plate so the pinned stage can clear the fixed
 * header and fill wider viewports. The shaft repeats every landing module
 * (`period` rows, measured between the slab edges at rows 106 and 237), so the
 * rows above the frame continue that period: the first `feather` rows of the
 * frame cross-fade from the repeated module into the original, and every
 * further seam falls on a slab edge (`anchor`), where the architecture already
 * has a hard horizontal line. The sides mirror the outer wall. Extensions
 * darken away from the original frame. Base and lit plates receive identical
 * geometry, so their registration is unchanged.
 */
function extendPlate(image, { top, side, period, anchor, feather }) {
  const { data, width, height } = image;
  const W = width + side * 2;
  const H = height + top;
  const out = Buffer.alloc(W * H * 3);
  const pixel = (x, y) => {
    let sx = x;
    if (sx < 0) sx = -sx - 1;
    if (sx >= width) sx = 2 * width - sx - 1;
    const k = (y * width + sx) * 3;
    return [data[k], data[k + 1], data[k + 2]];
  };
  const sample = (x, y) => {
    if (y >= feather) return pixel(x, y);
    if (y >= 0) {
      const t = y / feather;
      const a = pixel(x, y + period);
      const b = pixel(x, y);
      return a.map((value, i) => value * (1 - t) + b[i] * t);
    }
    let sy = y + period;
    while (sy < anchor) sy += period;
    return pixel(x, sy);
  };
  for (let Y = 0; Y < H; Y++) {
    const y = Y - top;
    for (let X = 0; X < W; X++) {
      const x = X - side;
      const [r, g, b] = sample(x, y);
      let shade = 1;
      if (y < 0) shade *= 1 - 0.45 * Math.min(1, -y / top);
      if (x < 0) shade *= 1 - 0.65 * Math.min(1, -x / side);
      if (x >= width) shade *= 1 - 0.65 * Math.min(1, (x - width + 1) / side);
      const k = (Y * W + X) * 3;
      out[k] = Math.round(r * shade);
      out[k + 1] = Math.round(g * shade);
      out[k + 2] = Math.round(b * shade);
    }
  }
  return sharp(out, { raw: { width: W, height: H, channels: 3 } });
}

const jobs = [];
const webp = (pipeline, name, quality = 80) =>
  jobs.push(
    pipeline
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(`${OUT}/${name}`)
      .then(async (info) => ({
        name,
        ...info,
        bytes: (await stat(`${OUT}/${name}`)).size,
      })),
  );

// Desktop hero + section map, and the tablet descent.
const building = `${SOURCE}/work/D-building-joined.png`;
webp(sharp(building), "building.webp", 78);
webp(
  sharp(building).resize({ width: 1024, kernel: "lanczos3" }),
  "building-1024.webp",
  78,
);

// サービスの違い photograph.
webp(
  sharp(`${SOURCE}/D-limestone.png`).resize({ width: 840, kernel: "lanczos3" }),
  "limestone.webp",
  80,
);

// Desktop process layers (L0, L1) and the cabin (L2).
const extend = { top: 262, side: 256, period: 131, anchor: 106, feather: 14 };
webp(
  extendPlate(await raw(`${SOURCE}/D-process-base.png`), extend),
  "process-base.webp",
  80,
);
webp(
  extendPlate(await raw(`${SOURCE}/D-process-lit.png`), extend),
  "process-lit.webp",
  80,
);
webp(
  sharp(`${SOURCE}/cabin.png`).resize({ width: 480, kernel: "lanczos3" }),
  "cabin.webp",
  84,
);

// Mobile hero descent and process shaft.
webp(sharp(`${SOURCE}/work/M-hero-joined.png`), "m-hero.webp", 76);
webp(sharp(`${SOURCE}/work/M-process-base-joined.png`), "m-process-base.webp", 78);
// Only the shaft columns of the lit plate are ever shown.
webp(
  sharp(`${SOURCE}/work/M-process-lit-joined.png`).extract({
    left: 40,
    top: 690,
    width: 420,
    height: 2020,
  }),
  "m-process-lit-shaft.webp",
  80,
);

// Mobile chapter photographs.
for (const room of ["meeting", "lobby", "restaurant", "guest", "staff"]) {
  const source = `${SOURCE}/M-room-${room}.png`;
  webp(
    sharp(source).resize({ width: 1280, kernel: "lanczos3" }),
    `room-${room}.webp`,
    78,
  );
  webp(
    sharp(source).resize({ width: 720, kernel: "lanczos3" }),
    `room-${room}-720.webp`,
    78,
  );
}
webp(
  sharp(`${SOURCE}/M-building-thumb.png`).resize({ width: 384, kernel: "lanczos3" }),
  "building-thumb.webp",
  80,
);

for (const result of await Promise.all(jobs))
  console.log(`${result.name}\t${result.width}×${result.height}\t${result.bytes} B`);
