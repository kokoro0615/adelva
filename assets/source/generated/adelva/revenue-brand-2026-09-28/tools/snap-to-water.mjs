// Snap a rough, mostly-downward polyline onto the centre of the river water in
// a clean plate (Opus 5.5). Row by row, water pixels (bright, blue-white) are
// searched within ±half px of the guide polyline and their weighted centroid is
// taken; lateral motion per row is limited and the result smoothed.
// usage: node snap-to-water.mjs <plate.png> '<json [{id, guide:[[x,y]...], half?, lum?, every?, smooth?}]>'
// Prints JSON { id: [[x,y], ...] } in plate px.
import sharp from "sharp";
const [img, json] = process.argv.slice(2);
const segs = JSON.parse(json);
const { data, info } = await sharp(img)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const at = (x, y) => {
  const i = (Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};
function guideX(guide, y) {
  if (y <= guide[0][1]) return guide[0][0];
  for (let i = 0; i < guide.length - 1; i++) {
    const [a, b] = [guide[i], guide[i + 1]];
    if (y >= a[1] && y <= b[1])
      return a[0] + ((y - a[1]) / Math.max(1e-6, b[1] - a[1])) * (b[0] - a[0]);
  }
  return guide.at(-1)[0];
}
const out = {};
for (const s of segs) {
  const half = s.half ?? 22;
  const thr = s.lum ?? 125;
  const y0 = Math.round(s.guide[0][1]);
  const y1 = Math.round(s.guide.at(-1)[1]);
  const raw = [];
  let prev = null;
  for (let y = y0; y <= y1; y++) {
    const gx = guideX(s.guide, y);
    const centre = prev == null ? gx : prev * 0.6 + gx * 0.4;
    let sw = 0;
    let sx = 0;
    for (let x = Math.round(centre - half); x <= Math.round(centre + half); x++) {
      const [r, g, b] = at(x, y);
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (l >= thr && b >= r - 4) {
        const w = (l - thr + 1) * (1 - Math.abs(x - gx) / (half * 2.2));
        sw += w;
        sx += w * x;
      }
    }
    let x = sw > 0 ? sx / sw : centre;
    if (prev != null) x = prev + Math.max(-3, Math.min(3, x - prev));
    raw.push([x, y]);
    prev = x;
  }
  const k = s.smooth ?? 14;
  const sm = raw.map((p, i) => {
    let a = 0;
    let n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(raw.length - 1, i + k); j++) {
      a += raw[j][0];
      n++;
    }
    return [a / n, p[1]];
  });
  const every = s.every ?? 16;
  const pts = [];
  for (let i = 0; i < sm.length; i += every) pts.push([Math.round(sm[i][0]), sm[i][1]]);
  if (pts.at(-1)[1] !== sm.at(-1)[1])
    pts.push([Math.round(sm.at(-1)[0]), sm.at(-1)[1]]);
  out[s.id] = pts;
}
console.log(JSON.stringify(out));
