// Trace the centre line of bright river water in a clean plate (Opus 5.5).
// Row by row, the luminance-weighted centroid of water pixels inside a window
// around the previous centre is taken, then the result is smoothed.
// usage: node trace-water.mjs <plate.png> '<json [{id, x, y0, y1, half?, every?, lum?}]>'
// Prints JSON { id: [[x,y], ...] } in plate px.
import sharp from "sharp";
const [img, json] = process.argv.slice(2);
const segs = JSON.parse(json);
const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const lumAt = (x, y) => {
  const i = (y * W + x) * 3;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
};
const out = {};
for (const s of segs) {
  const half = s.half ?? 18;
  const thr = s.lum ?? 120;
  let x = s.x;
  const raw = [];
  const dir = s.y1 >= s.y0 ? 1 : -1;
  for (let y = s.y0; dir > 0 ? y <= s.y1 : y >= s.y1; y += dir) {
    let sw = 0, sx = 0;
    for (let xx = Math.max(0, Math.round(x - half)); xx <= Math.min(W - 1, Math.round(x + half)); xx++) {
      const l = lumAt(xx, y);
      if (l >= thr) { const w = l - thr + 1; sw += w; sx += w * xx; }
    }
    if (sw > 0) {
      const c = sx / sw;
      x = x + Math.max(-3, Math.min(3, c - x)); // limit lateral speed
    }
    raw.push([x, y]);
  }
  // moving-average smoothing over +-k rows
  const k = s.smooth ?? 12;
  const sm = raw.map((p, i) => {
    let a = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(raw.length - 1, i + k); j++) { a += raw[j][0]; n++; }
    return [a / n, p[1]];
  });
  const every = s.every ?? 24;
  const pts = [];
  for (let i = 0; i < sm.length; i += every) pts.push([Math.round(sm[i][0]), sm[i][1]]);
  const last = sm.at(-1);
  if (pts.at(-1)[1] !== last[1]) pts.push([Math.round(last[0]), last[1]]);
  out[s.id] = pts;
}
console.log(JSON.stringify(out));
