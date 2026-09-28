// Follow a thin orange UI line in the adopted mock from a seed point, so the
// production SVG river line can reuse the mock's geometry (Opus 5.5).
// usage: node trace-line.mjs <image> '<json segments>'
//   segment: { id, seed:[x,y], dir:[dx,dy], stop?:[x,y], stopY?, every? }
// Prints JSON { id: [[x,y], ...] } in the image's own pixels.
import sharp from "sharp";
const [img, segJson] = process.argv.slice(2);
const segs = JSON.parse(segJson);
const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const isOrange = (x, y) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const i = (y * W + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
  return r > 170 && r - b > 100 && g > 60 && g < 200 && r - g > 45;
};
const out = {};
for (const s of segs) {
  let [x, y] = s.seed;
  let dir = Math.atan2(s.dir[1], s.dir[0]);
  const pts = [[x, y]];
  for (let step = 0; step < 5000; step++) {
    let found = null;
    for (const r of [6, 9, 13, 18, 24, 32, 42]) {
      let sx = 0, sy = 0, n = 0;
      for (let a = -60; a <= 60; a += 3) {
        const t = dir + (a * Math.PI) / 180;
        for (let rr = r - 2; rr <= r + 2; rr++) {
          const px = x + Math.cos(t) * rr, py = y + Math.sin(t) * rr;
          if (isOrange(px, py)) { sx += px; sy += py; n++; }
        }
      }
      if (n >= 2) { found = [sx / n, sy / n]; break; }
    }
    if (!found) break;
    const nd = Math.atan2(found[1] - y, found[0] - x);
    dir = Math.atan2(Math.sin(dir) * 0.35 + Math.sin(nd) * 0.65, Math.cos(dir) * 0.35 + Math.cos(nd) * 0.65);
    [x, y] = found;
    pts.push([x, y]);
    if (s.stopY && y >= s.stopY) break;
    if (s.stop && Math.hypot(x - s.stop[0], y - s.stop[1]) < 8) break;
  }
  const every = s.every ?? 20;
  const res = [pts[0].map(Math.round)];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc >= every) { res.push(pts[i].map(Math.round)); acc = 0; }
  }
  res.push(pts.at(-1).map(Math.round));
  out[s.id] = res;
}
console.log(JSON.stringify(out));
