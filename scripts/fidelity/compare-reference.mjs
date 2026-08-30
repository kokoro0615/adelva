import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

function parseArguments(argv) {
  return Object.fromEntries(
    argv.map((argument) => {
      const [key, ...value] = argument.replace(/^--/, "").split("=");
      return [key, value.join("=") || true];
    }),
  );
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}=<path>.`);
  }
  return value;
}

const args = parseArguments(process.argv.slice(2));
const referencePath = path.resolve(requireString(args.reference, "reference"));
const actualPath = path.resolve(requireString(args.actual, "actual"));
const label = typeof args.label === "string" ? args.label : "comparison";
const outputRoot = path.resolve(
  typeof args.out === "string" ? args.out : "artifacts/fidelity",
);

const reference = await sharp(referencePath).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});
const actual = await sharp(actualPath).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});

if (
  reference.info.width !== actual.info.width ||
  reference.info.height !== actual.info.height
) {
  throw new Error(
    `Reference and implementation capture dimensions differ: ${reference.info.width}x${reference.info.height} vs ${actual.info.width}x${actual.info.height}.`,
  );
}

const pixelCount = reference.info.width * reference.info.height;
const channelCount = 3;
const difference = Buffer.alloc(reference.data.length);
let absoluteTotal = 0;
let squaredTotal = 0;
let changedPixels = 0;

for (let pixel = 0; pixel < pixelCount; pixel += 1) {
  let pixelChanged = false;
  for (let channel = 0; channel < channelCount; channel += 1) {
    const offset = pixel * 4 + channel;
    const delta = Math.abs(reference.data[offset] - actual.data[offset]);
    absoluteTotal += delta;
    squaredTotal += delta * delta;
    pixelChanged ||= delta > 8;
    difference[offset] = Math.min(255, delta * 4);
  }
  difference[pixel * 4 + 3] = 255;
  if (pixelChanged) changedPixels += 1;
}

const metrics = {
  label,
  referencePath,
  actualPath,
  width: reference.info.width,
  height: reference.info.height,
  normalizedRgbMae: absoluteTotal / (pixelCount * channelCount * 255),
  normalizedRgbRmse: Math.sqrt(squaredTotal / (pixelCount * channelCount)) / 255,
  changedPixelRatio: changedPixels / pixelCount,
  status: "diagnostic",
  note: "Acceptance is decided by the predeclared measured-spec landmarks and discrepancy ledger; global photo-heavy pixel metrics are diagnostic.",
};

await mkdir(outputRoot, { recursive: true });
const referencePng = await sharp(referencePath).png().toBuffer();
const actualPng = await sharp(actualPath).png().toBuffer();
await sharp(referencePng)
  .composite([{ input: actualPng, blend: "over", opacity: 0.5 }])
  .png()
  .toFile(path.join(outputRoot, `${label}-overlay.png`));
await sharp(difference, {
  raw: {
    width: reference.info.width,
    height: reference.info.height,
    channels: 4,
  },
})
  .png()
  .toFile(path.join(outputRoot, `${label}-difference.png`));
await sharp({
  create: {
    width: reference.info.width * 2,
    height: reference.info.height,
    channels: 4,
    background: "#ffffff",
  },
})
  .composite([
    { input: referencePng, left: 0, top: 0 },
    { input: actualPng, left: reference.info.width, top: 0 },
  ])
  .png()
  .toFile(path.join(outputRoot, `${label}-side-by-side.png`));
await writeFile(
  path.join(outputRoot, `${label}-metrics.json`),
  `${JSON.stringify(metrics, null, 2)}\n`,
);

process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
