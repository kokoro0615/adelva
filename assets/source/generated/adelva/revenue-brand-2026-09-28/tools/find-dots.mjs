// Find round orange (or white) dots in the adopted mock (measurement helper).
// usage: node find-dots.mjs <image> <x0> <y0> <x1> <y1> [orange|white] [minArea] [maxArea]
import sharp from "sharp";
const [img, ...rest] = process.argv.slice(2);
const [x0, y0, x1, y1] = rest.slice(0, 4).map(Number);
const mode = rest[4] ?? "orange";
const minA = +(rest[5] ?? 30), maxA = +(rest[6] ?? 400);
const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const f = mode === "orange"
  ? (r, g, b) => r > 200 && r - b > 110 && g > 70 && g < 190
  : (r, g, b) => r > 225 && g > 225 && b > 220;
const seen = new Uint8Array((x1 - x0 + 1) * (y1 - y0 + 1));
const idx = (x, y) => (y - y0) * (x1 - x0 + 1) + (x - x0);
const on = (x, y) => { const i = (y * W + x) * 3; return f(data[i], data[i + 1], data[i + 2]); };
const res = [];
for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
  if (seen[idx(x, y)] || !on(x, y)) continue;
  const st = [[x, y]]; seen[idx(x, y)] = 1; let n = 0, sx = 0, sy = 0, bx0 = x, bx1 = x, by0 = y, by1 = y;
  while (st.length) {
    const [cx, cy] = st.pop(); n++; sx += cx; sy += cy;
    bx0 = Math.min(bx0, cx); bx1 = Math.max(bx1, cx); by0 = Math.min(by0, cy); by1 = Math.max(by1, cy);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < x0 || ny < y0 || nx > x1 || ny > y1 || seen[idx(nx, ny)] || !on(nx, ny)) continue;
      seen[idx(nx, ny)] = 1; st.push([nx, ny]);
    }
  }
  const w = bx1 - bx0 + 1, h = by1 - by0 + 1;
  if (n >= minA && n <= maxA && w / h > 0.6 && w / h < 1.6 && n / (w * h) > 0.45)
    res.push({ c: [+(sx / n).toFixed(1), +(sy / n).toFixed(1)], area: n, size: [w, h] });
}
console.log(JSON.stringify(res));
