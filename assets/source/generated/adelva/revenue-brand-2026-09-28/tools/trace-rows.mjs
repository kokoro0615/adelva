// Row-wise and ring-wise tracing of the mock's thin orange line (Opus 5.5).
// usage: node trace-rows.mjs <image> '<json segments>'
//  row segment:  { id, x:<seed x>, y0, y1, every?, maxJump? }   (mostly vertical lines)
//  ring segment: { id, ring:{cx, cy, rMin, rMax}, a0, a1, step? } (angles in degrees, clockwise from +x)
// Prints JSON { id: [[x,y], ...] }.
import sharp from "sharp";
const [img, segJson] = process.argv.slice(2);
const segs = JSON.parse(segJson);
const { data, info } = await sharp(img).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const isO = (x, y) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  const i = (y * W + x) * 3, r = data[i], g = data[i + 1], b = data[i + 2];
  return r > 170 && r - b > 100 && g > 60 && g < 200 && r - g > 45;
};
const out = {};
for (const s of segs) {
  const pts = [];
  if (s.ring) {
    const { cx, cy, rMin, rMax } = s.ring;
    const step = s.step ?? 6;
    const dirSign = s.a1 >= s.a0 ? 1 : -1;
    let prevR = null;
    for (let a = s.a0; dirSign > 0 ? a <= s.a1 : a >= s.a1; a += step * dirSign) {
      const t = (a * Math.PI) / 180;
      const hits = [];
      for (let r = rMin; r <= rMax; r++) if (isO(cx + Math.cos(t) * r, cy + Math.sin(t) * r)) hits.push(r);
      if (!hits.length) continue;
      // cluster hits, choose cluster nearest the previous radius
      const cl = [];
      for (const r of hits) { if (cl.length && r - cl.at(-1).at(-1) <= 3) cl.at(-1).push(r); else cl.push([r]); }
      const centers = cl.map((c) => c.reduce((p, v) => p + v, 0) / c.length);
      const r = prevR == null ? centers[0] : centers.reduce((b, c) => (Math.abs(c - prevR) < Math.abs(b - prevR) ? c : b));
      prevR = r;
      pts.push([Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r)]);
    }
  } else {
    let x = s.x;
    const maxJump = s.maxJump ?? 6;
    let gap = 0;
    const raw = [];
    for (let y = s.y0; y <= s.y1; y++) {
      const g = [];
      for (let xx = Math.max(0, Math.round(x - maxJump - gap * 2)); xx <= Math.min(W - 1, Math.round(x + maxJump + gap * 2)); xx++)
        if (isO(xx, y)) { if (g.length && xx - g.at(-1).at(-1) <= 2) g.at(-1).push(xx); else g.push([xx]); }
      const runs = g.filter((r) => r.length <= 8).map((r) => (r[0] + r.at(-1)) / 2);
      if (runs.length) { x = runs.reduce((b, c) => (Math.abs(c - x) < Math.abs(b - x) ? c : b)); gap = 0; raw.push([x, y]); }
      else gap++;
    }
    const every = s.every ?? 16;
    let last = -1e9;
    for (const [px, py] of raw) if (py - last >= every) { pts.push([Math.round(px), py]); last = py; }
    if (raw.length && pts.at(-1)[1] !== raw.at(-1)[1]) pts.push([Math.round(raw.at(-1)[0]), raw.at(-1)[1]]);
  }
  out[s.id] = pts;
}
console.log(JSON.stringify(out));
