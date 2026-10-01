/**
 * Build the favicon, app icons and manifest icons from the ADELVA mark.
 *
 * The mark is `public/brand/adelva-logo.png` (black on transparent). It is
 * provisional: when the final logo replaces that file, rerun
 * `node scripts/seo/build-icons.mjs` and every icon follows.
 *
 * Output: src/app/{favicon.ico,icon.png,apple-icon.png} (Next.js metadata file
 * conventions) and public/icons/icon-{192,512}.png (web app manifest).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(root, "public/brand/adelva-logo.png");
const ink = { r: 14, g: 17, b: 24 }; // #0e1118, header and footer ink
const paper = { r: 244, g: 236, b: 223 }; // #f4ecdf

/** The mark's alpha bounding box. */
async function markBox() {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let [left, top, right, bottom] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * info.channels + 3] > 16) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** The mark in paper colour, fitted to `markHeight`, centred on an ink square. */
async function icon(size, markRatio) {
  const box = await markBox();
  const markHeight = Math.round(size * markRatio);
  const alpha = await sharp(source)
    .extract(box)
    .resize({ height: markHeight })
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mark = await sharp({
    create: {
      width: alpha.info.width,
      height: alpha.info.height,
      channels: 3,
      background: paper,
    },
  })
    .joinChannel(alpha.data, {
      raw: { width: alpha.info.width, height: alpha.info.height, channels: 1 },
    })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: ink } })
    .composite([
      {
        input: mark,
        left: Math.round((size - alpha.info.width) / 2),
        top: Math.round((size - alpha.info.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO container holding PNG frames (supported by every current browser). */
function ico(frames) {
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, png }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...frames.map((frame) => frame.png)]);
}

async function write(path, buffer) {
  const target = resolve(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, buffer);
  console.log(`${path} ${buffer.length} B`);
}

// Small sizes carry a larger mark so its strokes survive at 16 px.
const favicon = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, png: await icon(size, 0.8) })),
);
await write("src/app/favicon.ico", ico(favicon));
await write("src/app/icon.png", await icon(512, 0.66));
await write("src/app/apple-icon.png", await icon(180, 0.62));
await write("public/icons/icon-192.png", await icon(192, 0.66));
await write("public/icons/icon-512.png", await icon(512, 0.66));
