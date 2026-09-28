// Crop a plate region with a labelled coordinate grid (measurement helper).
// usage: node grid-crop.mjs <image> <x0> <y0> <w> <h> <step> <outWidth> <out.png> [pointsJSON]
import sharp from "sharp";
const [img, x0s, y0s, ws, hs, steps, ows, out, ptsJson] = process.argv.slice(2);
const [x0, y0, w, h, step, ow] = [x0s, y0s, ws, hs, steps, ows].map(Number);
let g = "";
for (let x = Math.ceil(x0 / step) * step; x < x0 + w; x += step) {
  const major = x % (step * 2) === 0;
  g += `<line x1="${x - x0}" y1="0" x2="${x - x0}" y2="${h}" stroke="${major ? "#f0f" : "#ff0"}" stroke-opacity="0.4" stroke-width="1"/>`;
  if (major) g += `<text x="${x - x0 + 3}" y="${Math.round(16 * w / ow)}" fill="#ff0" font-size="${Math.round(14 * w / ow)}">${x}</text>`;
}
for (let y = Math.ceil(y0 / step) * step; y < y0 + h; y += step) {
  const major = y % (step * 2) === 0;
  g += `<line x1="0" y1="${y - y0}" x2="${w}" y2="${y - y0}" stroke="${major ? "#f0f" : "#ff0"}" stroke-opacity="0.4" stroke-width="1"/>`;
  if (major) g += `<text x="3" y="${y - y0 + Math.round(16 * w / ow)}" fill="#ff0" font-size="${Math.round(14 * w / ow)}">${y}</text>`;
}
if (ptsJson) {
  const sets = JSON.parse(ptsJson);
  for (const pts of Object.values(sets))
    g += `<polyline fill="none" stroke="#ff7e15" stroke-width="${Math.max(2, w / ow * 1.5)}" points="${pts.map(([x, y]) => `${x - x0},${y - y0}`).join(" ")}"/>`;
}
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${g}</svg>`);
const crop = await sharp(img).extract({ left: x0, top: y0, width: w, height: h }).composite([{ input: svg }]).png().toBuffer();
await sharp(crop).resize(ow).toFile(out);
