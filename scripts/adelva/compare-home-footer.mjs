import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { compareImagePair } from "../fidelity/compare-reference.mjs";
const out = "artifacts/adelva-home-footer";
const mappings = [];
for (const [width, name] of [
  [1440, "desktop"],
  [390, "mobile"],
]) {
  const original = `references/adelva/mockups/home-footer-2026-09-09/home-footer-${name}.png`;
  const actualPath = `${out}/${width}-footer.png`;
  const refMeta = await sharp(original).metadata();
  const actualMeta = await sharp(actualPath).metadata();
  const uniform = await sharp(original).resize({ width }).png().toBuffer();
  const uniformMeta = await sharp(uniform).metadata();
  let normalized = sharp(uniform);
  const bottomDelta = actualMeta.height - uniformMeta.height;
  if (bottomDelta > 0)
    normalized = normalized.extend({ bottom: bottomDelta, background: "#050908" });
  if (bottomDelta < 0)
    normalized = normalized.extract({
      left: 0,
      top: 0,
      width,
      height: actualMeta.height,
    });
  const referencePath = `${out}/${width}-reference.png`;
  await normalized.toFile(referencePath);
  const result = await compareImagePair({
    referencePath,
    actualPath,
    label: `footer-${name}`,
    outputRoot: `${out}/diff`,
  });
  // The shared comparator's unsupported composite.opacity option is ignored by
  // sharp. Use real alpha for the required 50/50 overlay, retaining its metrics.
  const halfActual = await sharp(actualPath)
    .removeAlpha()
    .ensureAlpha(0.5)
    .png()
    .toBuffer();
  await sharp(referencePath)
    .composite([{ input: halfActual, blend: "over" }])
    .png()
    .toFile(`${out}/diff/footer-${name}-overlay.png`);
  mappings.push({
    original,
    referencePath,
    actualPath,
    referenceRaster: { width: refMeta.width, height: refMeta.height },
    cssWidth: width,
    scaleX: refMeta.width / width,
    scaleY: refMeta.width / width,
    bottomDelta,
    note: "Uniform width scaling; only empty bottom margin is padded/cropped for equal comparator canvas. No anisotropic stretching.",
    result,
  });
}
await writeFile(`${out}/mapping.json`, JSON.stringify(mappings, null, 2) + "\n");
console.log(
  mappings.map((m) => ({
    width: m.cssWidth,
    bottomDelta: m.bottomDelta,
    result: m.result,
  })),
);
