import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
const dir = "artifacts/adelva-audience-v3/comparison";
await mkdir(dir, { recursive: true });
for (const [label, ref, actual] of [
  ["owner-desktop", "owners-desktop", "owner-1440"],
  ["owner-mobile", "owners-mobile", "owner-390"],
  ["gm-desktop", "gm-desktop", "general-managers-1440"],
  ["gm-mobile", "gm-mobile", "general-managers-390"],
]) {
  const reference = `references/adelva/audience-v3/${ref}.png`,
    implementation = `artifacts/adelva-audience-v3/${actual}.png`;
  const a = await sharp(reference)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const b = await sharp(implementation)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (a.info.width !== b.info.width || a.info.height !== b.info.height)
    throw Error(`${label}: unequal bounds; comparison must not rescale`);
  const diff = Buffer.alloc(a.data.length);
  let sum = 0,
    changed = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    let pixel = 0;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(a.data[i + c] - b.data[i + c]);
      diff[i + c] = delta;
      sum += delta;
      pixel += delta;
    }
    if (pixel / 3 > 25.5) changed++;
  }
  const dimensions = { width: a.info.width, height: a.info.height, channels: 3 };
  await sharp(diff, { raw: dimensions }).png().toFile(`${dir}/${label}-difference.png`);
  const overlay = Buffer.from(a.data);
  for (let i = 0; i < overlay.length; i++) overlay[i] = (a.data[i] + b.data[i]) / 2;
  await sharp(overlay, { raw: dimensions }).png().toFile(`${dir}/${label}-overlay.png`);
  const metrics = {
    label,
    reference,
    implementation,
    mapping: { ...dimensions, scaleX: 1, scaleY: 1 },
    metrics: {
      mae: sum / a.data.length / 255,
      diffRatio: changed / (a.info.width * a.info.height),
    },
    status: "MEASURED, NOT A PIXEL-PERFECT PASS",
    method:
      "Exact 1:1 full-page RGB; changed pixel = mean absolute channel delta > 25.5. Geometry gate is separate; no post-hoc pixel threshold for acceptance.",
  };
  await writeFile(
    `${dir}/${label}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
  console.log(JSON.stringify(metrics));
}
