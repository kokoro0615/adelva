// Print runs of orange pixels on given rows (mock measurement helper).
// usage: node orange-runs.mjs <image> <rows a,b,c | from:to:step> [x0] [x1]
import sharp from "sharp";
const [img, rowsArg, x0a, x1a] = process.argv.slice(2);
const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const isO = (x, y) => { const i = (y * W + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2]; return r > 170 && r - b > 100 && g > 60 && g < 200 && r - g > 45; };
const x0 = +(x0a ?? 0), x1 = +(x1a ?? W);
let rows;
if (rowsArg.includes(":")) { const [a, b, s] = rowsArg.split(":").map(Number); rows = []; for (let y = a; y <= b; y += s) rows.push(y); }
else rows = rowsArg.split(",").map(Number);
for (const y of rows) {
  const g = [];
  for (let x = x0; x < x1; x++) if (isO(x, y)) { if (g.length && x - g.at(-1).at(-1) <= 3) g.at(-1).push(x); else g.push([x]); }
  console.log(y, g.map((a) => a[0] + "-" + a.at(-1)).join(" "));
}
