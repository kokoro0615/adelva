import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const role = process.argv[2] ?? "final";
const root = `artifacts/hero-seam/${role}`;
const results = [];
for (const [name, height] of [
  ["desktop", 900],
  ["tablet", 1024],
  ["mobile", 844],
]) {
  const frames = JSON.parse(await readFile(`${root}/${name}.json`, "utf8"));
  for (const frame of frames.filter((frame) => frame.f > 1)) {
    const { data, info } = await sharp(`${root}/${name}-${frame.f}.png`)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const boundary = Math.round(height * 2 - frame.scrollY);
    const deltas = [0.2, 0.3, 0.4, 0.6, 0.7, 0.8].flatMap((fraction) => {
      const x = Math.floor(info.width * fraction);
      return [0, 1, 2].map((channel) => {
        let above = 0,
          below = 0;
        for (let dy = 1; dy <= 3; dy++) {
          above += data[((boundary - dy) * info.width + x) * 3 + channel];
          below += data[((boundary + dy) * info.width + x) * 3 + channel];
        }
        return Math.abs(above - below) / 3;
      });
    });
    const maximum = Math.max(...deltas);
    const mean = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
    results.push({
      name,
      f: frame.f,
      boundary,
      mean,
      maximum,
      accepted: mean <= 3 && maximum <= 5,
    });
  }
}
const report = {
  role,
  accepted: results.every((result) => result.accepted),
  thresholds: { mean: 3, maximum: 5 },
  results,
};
await writeFile(`${root}/seam-metrics.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.accepted) process.exitCode = 1;
