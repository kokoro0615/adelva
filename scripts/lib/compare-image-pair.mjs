/**
 * Pixel comparison of one reference image and one implementation capture.
 *
 * Moved from the retired White Desert fidelity harness (scripts/fidelity,
 * removed 2026-10-02) because ADELVA comparison scripts still use it. Writes an
 * overlay, a difference map, a side-by-side image and a metrics JSON; the
 * metrics are diagnostic, acceptance is decided by each page's measured spec.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const DIAGNOSTIC_METRICS_NOTE =
  "Acceptance is decided by the predeclared measured-spec landmarks and discrepancy ledger; global photo-heavy pixel metrics are diagnostic.";
const safeLabelPattern = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}=<value>.`);
  }
  return value;
}

function resolvePath(value, name, cwd = process.cwd()) {
  return path.resolve(cwd, requireString(value, name));
}

function assertSafeLabel(label) {
  if (typeof label !== "string" || !safeLabelPattern.test(label)) {
    throw new Error(
      "Invalid --label: use a filename-safe label containing letters, numbers, dots, hyphens, or underscores.",
    );
  }
  return label;
}

function resolveWithin(root, filename) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, filename);
  const relative = path.relative(resolvedRoot, candidate);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Refusing a path outside the configured root: ${filename}.`);
  }
  return candidate;
}

export async function compareImagePair({
  referencePath,
  actualPath,
  label = "comparison",
  outputRoot,
  cwd = process.cwd(),
}) {
  const safeLabel = assertSafeLabel(label);
  const resolvedReferencePath = resolvePath(referencePath, "reference", cwd);
  const resolvedActualPath = resolvePath(actualPath, "actual", cwd);
  const resolvedOutputRoot = resolvePath(outputRoot, "out", cwd);

  const reference = await sharp(resolvedReferencePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const actual = await sharp(resolvedActualPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

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
  const difference = Buffer.alloc(pixelCount * 4);
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
    label: safeLabel,
    referencePath: resolvedReferencePath,
    actualPath: resolvedActualPath,
    width: reference.info.width,
    height: reference.info.height,
    normalizedRgbMae: absoluteTotal / (pixelCount * channelCount * 255),
    normalizedRgbRmse: Math.sqrt(squaredTotal / (pixelCount * channelCount)) / 255,
    changedPixelRatio: changedPixels / pixelCount,
    status: "diagnostic",
    note: DIAGNOSTIC_METRICS_NOTE,
  };

  const outputPaths = {
    overlay: resolveWithin(resolvedOutputRoot, `${safeLabel}-overlay.png`),
    difference: resolveWithin(resolvedOutputRoot, `${safeLabel}-difference.png`),
    sideBySide: resolveWithin(resolvedOutputRoot, `${safeLabel}-side-by-side.png`),
    metrics: resolveWithin(resolvedOutputRoot, `${safeLabel}-metrics.json`),
  };

  await mkdir(resolvedOutputRoot, { recursive: true });
  const referencePng = await sharp(resolvedReferencePath).png().toBuffer();
  const actualPng = await sharp(resolvedActualPath).png().toBuffer();
  // Sharp composite does not implement an `opacity` option. Give the source
  // a real half-alpha channel; otherwise the reference is completely hidden.
  const translucentActual = await sharp(actualPng)
    .removeAlpha()
    .ensureAlpha(128 / 255)
    .png()
    .toBuffer();
  await sharp(referencePng)
    .composite([{ input: translucentActual, blend: "over" }])
    .png()
    .toFile(outputPaths.overlay);
  await sharp(difference, {
    raw: {
      width: reference.info.width,
      height: reference.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPaths.difference);
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
    .toFile(outputPaths.sideBySide);
  await writeFile(outputPaths.metrics, `${JSON.stringify(metrics, null, 2)}\n`);

  return metrics;
}
