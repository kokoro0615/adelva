// Measure how far a clean-plate edit drifted from its edit input.
// Both images are blurred and compared at 1/4 scale; the best global offset and
// the best offset of each cell of a 3x3 grid are reported in full-size px.
// A clean plate must still line up with its input when overlaid, because the
// page's SVG lines and text are placed on the input's geometry.
// Usage: node measure-drift.mjs <input.png> <output.png> [--allow-aspect]
// Prints JSON: { input, output, sizeMatch, global:{dx,dy,meanAbsDiff}, cells:[...], verdict }
import sharp from "sharp";

const args = process.argv.slice(2);
const allowAspect = args.includes("--allow-aspect");
const [inputPath, outputPath] = args.filter((a) => !a.startsWith("--"));
if (!inputPath || !outputPath) {
  console.error("usage: node measure-drift.mjs <input.png> <output.png>");
  process.exit(2);
}
const SCALE = 4;
const inMeta = await sharp(inputPath).metadata();
const outMeta = await sharp(outputPath).metadata();
const w = Math.round(inMeta.width / SCALE);
const h = Math.round(inMeta.height / SCALE);
const load = (p) =>
  sharp(p)
    .removeAlpha()
    .resize({ width: w, height: h, fit: "fill", kernel: "lanczos3" })
    .blur(1.2)
    .greyscale()
    .raw()
    .toBuffer();
const a = await load(inputPath);
const b = await load(outputPath);
const at = (buf, x, y) => buf[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];

function best(x0, y0, x1, y1, range) {
  let top = null;
  for (let dy = -range; dy <= range; dy++)
    for (let dx = -range; dx <= range; dx++) {
      let s = 0;
      let n = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          s += Math.abs(at(a, x, y) - at(b, x + dx, y + dy));
          n++;
        }
      const v = s / n;
      if (!top || v < top.v) top = { dx, dy, v };
    }
  return { dx: top.dx * SCALE, dy: top.dy * SCALE, meanAbsDiff: +top.v.toFixed(2) };
}

const margin = 10;
const global = best(margin, margin, w - margin, h - margin, 8);
const cells = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) {
    const x0 = Math.round((c * w) / 3) + 4;
    const x1 = Math.round(((c + 1) * w) / 3) - 4;
    const y0 = Math.round((r * h) / 3) + 4;
    const y1 = Math.round(((r + 1) * h) / 3) - 4;
    cells.push({ cell: `r${r}c${c}`, ...best(x0, y0, x1, y1, 8) });
  }
const aspectIn = inMeta.width / inMeta.height;
const aspectOut = outMeta.width / outMeta.height;
const sizeMatch =
  Math.abs(outMeta.width - inMeta.width) <= 2 && Math.abs(outMeta.height - inMeta.height) <= 2;
const aspectMatch = Math.abs(aspectOut / aspectIn - 1) <= 0.01;
const worstCell = Math.max(...cells.map((c) => Math.hypot(c.dx, c.dy)));
const serious = [];
if (!aspectMatch && !allowAspect) serious.push(`aspect ${aspectOut.toFixed(4)} vs input ${aspectIn.toFixed(4)}`);
if (Math.hypot(global.dx, global.dy) > 12) serious.push(`global drift ${global.dx},${global.dy}`);
// Local offsets are informational: where a large overlay was removed (text over
// mist) the cell has no reliable match. Opus checks local geometry at join time.
const info = worstCell > 24 ? [`local offset up to ${worstCell.toFixed(0)} px (informational)`] : [];
console.log(
  JSON.stringify(
    {
      input: { path: inputPath, width: inMeta.width, height: inMeta.height },
      output: { path: outputPath, width: outMeta.width, height: outMeta.height },
      sizeMatch,
      aspectMatch,
      global,
      cells,
      verdict: serious.length ? "FAIL" : "PASS",
      serious,
      info,
    },
    null,
    2,
  ),
);
