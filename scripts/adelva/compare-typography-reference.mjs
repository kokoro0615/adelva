import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const out = "artifacts/challenges-type-correction";
const reference = JSON.parse(
  await readFile("references/nosigner/brand-study-2026-09-09/measurements.json"),
);
const actual = JSON.parse(await readFile(`${out}/results.json`));
const metrics = [];
for (const width of [1440, 768, 390]) {
  const r = reference.find((x) => x.width === width),
    a = actual.find((x) => x.width === width);
  const geometry = [
    ["introKeyvisual", 0],
    ["introKeyvisualCanvas", 1],
    ["introKeyvisualLogo", 2],
  ].map(([part, index]) => {
    const source = r.measure.find((x) => x.class === part),
      local = a.geometry.brand[index];
    return {
      part,
      source,
      local,
      delta: Object.fromEntries(
        ["x", "y", "width", "height"].map((key) => [key, local[key] - source[key]]),
      ),
    };
  });
  const R = await sharp(`references/nosigner/brand-study-2026-09-09/${width}.png`)
    .removeAlpha()
    .raw()
    .toBuffer();
  const A = await sharp(`${out}/${width}-brand.png`).removeAlpha().raw().toBuffer();
  const overlay = Buffer.alloc(A.length),
    difference = Buffer.alloc(A.length);
  let error = 0;
  for (let i = 0; i < A.length; i++) {
    overlay[i] = (R[i] + A[i]) / 2;
    difference[i] = Math.min(255, Math.abs(R[i] - A[i]) * 4);
    error += Math.abs(R[i] - A[i]);
  }
  const raw = { width, height: r.height, channels: 3 };
  const panels = await Promise.all(
    [R, A, overlay, difference].map((x) => sharp(x, { raw }).png().toBuffer()),
  );
  await sharp({
    create: { width: width * 4, height: r.height, channels: 3, background: "#fff" },
  })
    .composite(panels.map((input, i) => ({ input, left: i * width, top: 0 })))
    .png()
    .toFile(`${out}/${width}-reference-comparison.png`);
  metrics.push({
    width,
    geometry,
    rawPixelMAE: error / A.length / 255,
    scope:
      "Geometry acceptance; pixel differences intentionally include user-selected HOME fonts, ADELVA wording, existing ambient background/header/consent and HOME chapter labels. Not a full-page pixel-fidelity pass.",
  });
}
await writeFile(`${out}/reference-metrics.json`, JSON.stringify(metrics, null, 2));
console.log(
  "Updated three independent external-reference comparison panels and metrics.",
);
