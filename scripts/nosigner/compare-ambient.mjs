import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const directory = "references/nosigner/ambient-2026-09-09";
const reference = JSON.parse(
  await readFile(`${directory}/reference-observations.json`),
);
const actual = JSON.parse(await readFile(`${directory}/actual-observations.json`));
const results = [];
for (const ref of reference.observations) {
  const act = actual.observations.find(
    (a) => a.width === ref.width && a.name === ref.name,
  );
  if (!act) throw new Error(`Missing actual ${ref.width}/${ref.name}`);
  const load = async (path) =>
    sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const [r, a] = await Promise.all([load(ref.path), load(act.path)]);
  if (r.info.width !== a.info.width || r.info.height !== a.info.height)
    throw new Error("Canvas dimensions differ");
  const { width, height } = r.info;
  let sum = 0;
  const diff = Buffer.alloc(r.data.length),
    overlay = Buffer.alloc(r.data.length);
  for (let i = 0; i < r.data.length; i++) {
    const d = Math.abs(r.data[i] - a.data[i]);
    sum += d;
    diff[i] = Math.min(255, d * 4);
    overlay[i] = Math.round((r.data[i] + a.data[i]) / 2);
  }
  const centroid = (data) => {
    let total = 0,
      x = 0,
      y = 0;
    for (let i = 0; i < data.length; i += 3) {
      const weight =
        Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      const index = i / 3;
      total += weight;
      x += (index % width) * weight;
      y += Math.floor(index / width) * weight;
    }
    return [x / total, y / total];
  };
  const rc = centroid(r.data),
    ac = centroid(a.data);
  const centroidDelta =
    Math.hypot(rc[0] - ac[0], rc[1] - ac[1]) / Math.min(width, height);
  const mae = sum / r.data.length / 255;
  const prefix = `${directory}/diff-${ref.name}-${ref.width}`;
  await sharp(diff, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(`${prefix}.png`);
  await sharp(overlay, { raw: { width, height, channels: 3 } })
    .png()
    .toFile(`${prefix}-overlay.png`);
  const pass =
    mae <= 0.08 &&
    centroidDelta <= 0.08 &&
    ref.theme === act.theme &&
    ref.y === act.y &&
    act.errors.length === 0;
  results.push({
    viewport: ref.width,
    state: ref.name,
    mae,
    centroidDelta,
    pass,
    reference: ref.path,
    actual: act.path,
    difference: `${prefix}.png`,
    overlay: `${prefix}-overlay.png`,
  });
}
await writeFile(
  `${directory}/comparison.json`,
  JSON.stringify({ thresholds: { mae: 0.08, centroidDelta: 0.08 }, results }, null, 2),
);
console.table(
  results.map(({ viewport, state, mae, centroidDelta, pass }) => ({
    viewport,
    state,
    mae: mae.toFixed(5),
    centroidDelta: centroidDelta.toFixed(5),
    pass,
  })),
);
if (results.length !== 15 || results.some((r) => !r.pass)) process.exitCode = 1;
