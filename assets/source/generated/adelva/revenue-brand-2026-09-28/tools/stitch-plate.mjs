// Join the clean-plate slices into one continuous photograph (Opus 5.5).
// Slice k+1 was edited from input rows that overlap slice k by `overlap` rows.
// For each join the residual offset (dx, dy) of slice k+1 against slice k is
// measured inside the overlap, slice k is kept down to `blendStart` rows into
// the overlap, and the two are cross-faded over `blend` rows (smoothstep).
// Nothing is generated here; only pixel arithmetic.
// Usage: node stitch-plate.mjs <config.json>
//   { slices: [...png], overlap, blendStart, blend, out, record }
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const load = async (p) => {
  const { data, info } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { path: p, data, W: info.width, H: info.height };
};
const slices = [];
for (const p of cfg.slices) slices.push(await load(p));
const W = slices[0].W;
for (const s of slices) if (s.W !== W) throw new Error(`width mismatch: ${s.path}`);
const px = (s, x, y, c) =>
  s.data[(Math.min(s.H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 3 + c];

function measure(prev, next) {
  const { overlap } = cfg;
  let best = null;
  for (let dy = -8; dy <= 8; dy++)
    for (let dx = -8; dx <= 8; dx++) {
      let s = 0;
      let n = 0;
      for (let y = 24; y < overlap - 24; y += 2)
        for (let x = 24; x < W - 24; x += 3) {
          const py = prev.H - overlap + y;
          for (let c = 0; c < 3; c++) s += Math.abs(px(prev, x, py, c) - px(next, x + dx, y + dy, c));
          n += 3;
        }
      const v = s / n;
      if (!best || v < best.v) best = { dx, dy, v };
    }
  return best;
}

const rows = [];
const joins = [];
let cumDx = 0;
slices.forEach((s, k) => {
  if (k === 0) {
    for (let y = 0; y < s.H; y++) rows.push({ s, y, dx: 0 });
    return;
  }
  const prev = slices[k - 1];
  const m = measure(prev, s);
  const prevDx = cumDx;
  cumDx += m.dx;
  const { overlap, blendStart, blend } = cfg;
  const keepPrev = prev.H - overlap + blendStart;
  rows.splice(rows.length - (prev.H - keepPrev));
  const pageRow = rows.length;
  for (let y = blendStart; y < s.H; y++) {
    const t = Math.min(1, Math.max(0, (y - blendStart) / blend));
    const a = t * t * (3 - 2 * t);
    const prevY = prev.H - overlap + y;
    rows.push(
      a < 1 && prevY < prev.H
        ? { mix: true, prev, prevY, prevDx, s, y: y + m.dy, dx: cumDx, a }
        : { s, y: y + m.dy, dx: cumDx },
    );
  }
  joins.push({
    join: `${prev.path} -> ${s.path}`,
    offset: { dx: m.dx, dy: m.dy },
    cumulativeDx: cumDx,
    meanAbsDiff: +m.v.toFixed(2),
    blendRows: [pageRow, pageRow + blend],
  });
});

const H = rows.length;
const out = Buffer.alloc(W * H * 3);
rows.forEach((r, yy) => {
  for (let x = 0; x < W; x++)
    for (let c = 0; c < 3; c++) {
      const v = px(r.s, x + r.dx, r.y, c);
      out[(yy * W + x) * 3 + c] = r.mix
        ? Math.round(px(r.prev, x + (r.prevDx || 0), r.prevY, c) * (1 - r.a) + v * r.a)
        : v;
    }
});
await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 9 }).toFile(cfg.out);
writeFileSync(
  cfg.record,
  `${JSON.stringify(
    {
      tool: "tools/stitch-plate.mjs",
      config: cfg,
      inputs: cfg.slices.map((p) => ({ path: p, sha256: sha(p) })),
      joins,
      output: { path: cfg.out, width: W, height: H, sha256: sha(cfg.out) },
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ W, H, joins: joins.map((j) => [j.offset, j.meanAbsDiff]) }));
