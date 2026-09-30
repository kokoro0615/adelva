/** Delivery derivatives for /challenges/general-managers
 * (docs/specs/adelva-general-managers-spec.md §10).
 *
 * Deterministic, no generative model:
 * - the "before selection" plate is the adopted A2 plate with the water of its two
 *   lit terraces swapped for the matching unlit variant;
 * - each of the five selectable terraces gets a "lit" overlay (RGBA, cropped to the
 *   terrace). 品質 and システム定着 are the adopted plate's own lit water; 人材・生産性・
 *   販売 carry the light field of a lit terrace over onto their own reflections.
 *
 *   node scripts/adelva/prepare-general-managers-assets.mjs [--preview <dir>]
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const mock = "references/adelva/mockups/general-managers-2026-09-29";
const out = "public/media/adelva/general-managers";
const record = "assets/source/generated/adelva/general-managers-2026-09-30";
const previewAt = process.argv.indexOf("--preview");
const preview = previewAt > 0 ? process.argv[previewAt + 1] : null;
await mkdir(out, { recursive: true });
await mkdir(record, { recursive: true });
if (preview) await mkdir(preview, { recursive: true });

const ISSUES = ["quality", "people", "productivity", "sales", "system"];
/** Real lit water exists in the adopted plate for these two only. */
const LIT = new Set(["quality", "system"]);

const regimes = {
  d: {
    plate: `${mock}/A2/plates/plate.png`,
    unlit: `${mock}/A2/raw/V-unlit.png`,
    // plate rows covered by the unlit variant
    top: 768,
    width: 1536,
    height: 8064,
    tiles: 8,
    small: 1024,
    toPage: 1440 / 1536,
    // seeds in window px: a point on each terrace's water (from the mock's ring anchors)
    seeds: {
      quality: [780, 126],
      people: [915, 295],
      productivity: [724, 492],
      sales: [1150, 740],
      system: [868, 882],
    },
    // which real lit terrace lends its light to each synthesized one
    source: { people: "quality", productivity: "system", sales: "quality" },
  },
  m: {
    plate: `${mock}/A2-mobile/plates/plate.png`,
    unlit: `${mock}/A2-mobile/plates/unlit-900-1800.png`,
    top: 1968,
    width: 853,
    height: 16136,
    tiles: 8,
    small: 600,
    toPage: 390 / 853,
    seeds: {
      quality: [426, 300],
      people: [426, 680],
      productivity: [500, 1050],
      sales: [560, 1400],
      system: [426, 1650],
    },
    source: { people: "quality", productivity: "system", sales: "system" },
  },
};

const T_WATER = 18; // (B − G) above this is water
const ERODE = 6;

function planes(buf, n, channels) {
  const p = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  for (let i = 0; i < n; i++)
    for (let c = 0; c < 3; c++) p[c][i] = buf[i * channels + c];
  return p;
}

function boxBlur(src, W, H, r) {
  const a = Float32Array.from(src);
  const tmp = new Float32Array(W * H);
  const d = 2 * r + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[row + Math.min(W - 1, Math.max(0, x))];
      for (let x = 0; x < W; x++) {
        tmp[row + x] = s / d;
        s += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = s / d;
        s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x];
      }
    }
  }
  return a;
}

function morph(m, W, H, r, erode) {
  const tmp = new Uint8Array(W * H);
  const res = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = erode ? 1 : 0;
      for (let k = -r; k <= r; k++) {
        const xx = x + k;
        const s = xx < 0 || xx >= W ? 0 : m[y * W + xx];
        v = erode ? v & s : v | s;
      }
      tmp[y * W + x] = v;
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = erode ? 1 : 0;
      for (let k = -r; k <= r; k++) {
        const yy = y + k;
        const s = yy < 0 || yy >= H ? 0 : tmp[yy * W + x];
        v = erode ? v & s : v | s;
      }
      res[y * W + x] = v;
    }
  return res;
}

function flood(allowed, W, H, start) {
  const lab = new Uint8Array(W * H);
  if (!allowed[start])
    throw new Error(`seed ${start % W},${(start / W) | 0} is not on water`);
  const q = [start];
  lab[start] = 1;
  while (q.length) {
    const i = q.pop();
    const x = i % W;
    const y = (i / W) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx;
      if (!lab[j] && allowed[j]) {
        lab[j] = 1;
        q.push(j);
      }
    }
  }
  return lab;
}

function fillHoles(m, W, H) {
  const outside = new Uint8Array(W * H);
  const q = [];
  const push = (i) => {
    if (!m[i] && !outside[i]) {
      outside[i] = 1;
      q.push(i);
    }
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (q.length) {
    const i = q.pop();
    const x = i % W;
    const y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  return Uint8Array.from(outside, (v) => (v ? 0 : 1));
}

/** Soft water mask (0–1) of the terrace containing `seed`, computed on the unlit window.
 * `grow` widens it so the thin rim of water under the levee is included. */
function waterMask(U, W, H, seed, grow = 0) {
  const blurred = [0, 1, 2].map((c) => boxBlur(U[c], W, H, 1));
  const water = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++)
    water[i] = blurred[2][i] - blurred[1][i] > T_WATER ? 1 : 0;
  const core = morph(water, W, H, ERODE, true);
  const region = flood(core, W, H, seed[1] * W + seed[0]);
  const hard = fillHoles(morph(region, W, H, ERODE + grow, false), W, H);
  return boxBlur(Float32Array.from(hard), W, H, 1);
}

function extents(m, W, H) {
  const top = new Float32Array(W).fill(-1);
  const bot = new Float32Array(W).fill(-1);
  let x0 = W;
  let x1 = -1;
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++)
      if (m[y * W + x] > 0.5) {
        if (top[x] < 0) top[x] = y;
        bot[x] = y;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
      }
  // smooth the column extents so neighbouring columns map to neighbouring rows
  const smooth = (a) => {
    const o = new Float32Array(W).fill(-1);
    for (let x = 0; x < W; x++) {
      let s = 0;
      let n = 0;
      for (let k = -30; k <= 30; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < W && a[xx] >= 0) {
          s += a[xx];
          n++;
        }
      }
      if (a[x] >= 0 && n) o[x] = s / n;
    }
    return o;
  };
  return { top: smooth(top), bot: smooth(bot), x0, x1 };
}

function bilinear(ch, W, H, x, y) {
  const x0 = Math.max(0, Math.min(W - 2, Math.floor(x)));
  const y0 = Math.max(0, Math.min(H - 2, Math.floor(y)));
  const dx = Math.min(1, Math.max(0, x - x0));
  const dy = Math.min(1, Math.max(0, y - y0));
  const i = y0 * W + x0;
  return (
    ch[i] * (1 - dx) * (1 - dy) +
    ch[i + 1] * dx * (1 - dy) +
    ch[i + W] * (1 - dx) * dy +
    ch[i + W + 1] * dx * dy
  );
}

const lum = (p, i) => 0.3 * p[0][i] + 0.59 * p[1][i] + 0.11 * p[2][i];

function maskedLowFrequency(ch, m, W, H, r) {
  const num = boxBlur(
    ch.map((v, i) => v * m[i]),
    W,
    H,
    r,
  );
  const den = boxBlur(m, W, H, r);
  return num.map((v, i) => (den[i] > 1e-3 ? v / den[i] : 0));
}

/**
 * Carry the light of a lit terrace (source) onto a terrace that is still blue (target).
 * Target pixels are the plate's own; their reflections survive through the local
 * luminance ratio, while the low-frequency glow and the sky streaks come from the source.
 */
function relight({ T, L, U, W, H, mt, ms }) {
  const R = 10;
  const lf = L.map((c) => maskedLowFrequency(c, ms, W, H, R));
  const ulf = U.map((c) => maskedLowFrequency(c, ms, W, H, R));
  const tlf = T.map((c) => maskedLowFrequency(c, mt, W, H, R));
  const es = extents(ms, W, H);
  const et = extents(mt, W, H);
  const res = T.map((c) => Float32Array.from(c));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (mt[i] < 0.01 || et.top[x] < 0) continue;
      const u = (x - et.x0) / Math.max(1, et.x1 - et.x0);
      const v = Math.min(
        1,
        Math.max(0, (y - et.top[x]) / Math.max(1, et.bot[x] - et.top[x])),
      );
      const xs = es.x0 + u * (es.x1 - es.x0);
      const xi = Math.round(xs);
      if (es.top[xi] < 0) continue;
      const ys = es.top[xi] + v * (es.bot[xi] - es.top[xi]);
      const j = Math.round(ys) * W + xi;
      const r = Math.min(1.5, Math.max(0, lum(T, i) / Math.max(1, lum(tlf, i))));
      const rs = Math.min(1.5, Math.max(0, lum(U, j) / Math.max(1, lum(ulf, j))));
      const sky = Math.min(1, Math.max(0, (r - 0.68) / 0.27)) ** 1.3;
      const skyS = Math.min(1, Math.max(0, (rs - 0.8) / 0.15));
      for (let c = 0; c < 3; c++) {
        const base = bilinear(lf[c], W, H, xs, ys);
        const glow =
          base * r + (bilinear(L[c], W, H, xs, ys) - base) * 0.7 * skyS * sky;
        const dark = T[c][i] * [0.95, 0.88, 0.9][c];
        res[c][i] = glow * sky + dark * (1 - sky);
      }
    }
  return res;
}

const derivatives = [];
const geometry = {};

async function record_(path, source, role, extra) {
  const bytes = await readFile(path);
  const meta = await sharp(bytes).metadata();
  derivatives.push({
    path,
    source,
    role,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    alt: "",
    owner: "ADELVA project",
    license:
      "User-authorized generated imagery (fictional terraces and inn) and deterministic edits",
    ...extra,
  });
}

for (const [key, g] of Object.entries(regimes)) {
  const plateRaw = await sharp(g.plate).removeAlpha().raw().toBuffer();
  const unlitImg = sharp(g.unlit).removeAlpha();
  const { width: W, height: H } = await unlitImg.metadata();
  const unlitRaw = await unlitImg.raw().toBuffer();
  const n = W * H;
  const windowRaw = plateRaw.subarray(g.top * g.width * 3, (g.top + H) * g.width * 3);
  const L = planes(windowRaw, n, 3); // lit plate window (adopted)
  const U = planes(unlitRaw, n, 3); // unlit variant window

  const masks = {};
  // Lit water in the adopted plate reaches the levee wall; swap and overlay it with a
  // mask grown by 4 px so no warm rim survives in the before-selection plate.
  for (const id of ISSUES)
    masks[id] = waterMask(U, W, H, g.seeds[id], LIT.has(id) ? 4 : 0);

  // Before-selection plate: swap the lit water for the unlit variant.
  const base = Buffer.from(plateRaw);
  for (const id of LIT) {
    const m = masks[id];
    for (let i = 0; i < n; i++) {
      const a = m[i];
      if (!a) continue;
      const k = (g.top * g.width + i) * 3;
      for (let c = 0; c < 3; c++)
        base[k + c] = Math.round(plateRaw[k + c] * (1 - a) + unlitRaw[i * 3 + c] * a);
    }
  }
  const baseWindow = planes(
    base.subarray(g.top * g.width * 3, (g.top + H) * g.width * 3),
    n,
    3,
  );

  // Lit overlays.
  geometry[key] = { width: g.width, height: g.height, toPage: g.toPage, lit: {} };
  for (const id of ISSUES) {
    const m = masks[id];
    const lit = LIT.has(id)
      ? L
      : relight({ T: baseWindow, L, U, W, H, mt: m, ms: masks[g.source[id]] });
    let x0 = W;
    let y0 = H;
    let x1 = 0;
    let y1 = 0;
    for (let i = 0; i < n; i++)
      if (m[i] > 0.004) {
        const x = i % W;
        const y = (i / W) | 0;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    // even sizes keep 4:2:0 chroma aligned
    x0 -= x0 % 2;
    y0 -= y0 % 2;
    const w = Math.min(W - x0, x1 - x0 + 2 - ((x1 - x0) % 2));
    const h = Math.min(H - y0, y1 - y0 + 2 - ((y1 - y0) % 2));
    const rgba = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y0 + y) * W + x0 + x;
        const o = (y * w + x) * 4;
        for (let c = 0; c < 3; c++)
          rgba[o + c] = Math.max(0, Math.min(255, Math.round(lit[c][i])));
        rgba[o + 3] = Math.round(Math.min(1, m[i]) * 255);
      }
    const img = sharp(rgba, { raw: { width: w, height: h, channels: 4 } });
    const name = `${key}-lit-${id}`;
    for (const [ext, fn] of [
      ["avif", (p) => p.avif({ quality: 62, effort: 5 })],
      ["webp", (p) => p.webp({ quality: 82, alphaQuality: 90, effort: 6 })],
    ]) {
      const path = `${out}/${name}.${ext}`;
      await fn(img.clone()).toFile(path);
      await record_(
        path,
        LIT.has(id) ? g.plate : `${g.plate} + ${g.unlit}`,
        "lit terrace overlay",
        {
          crop: { left: x0, top: g.top + y0, width: w, height: h },
          method: LIT.has(id)
            ? "adopted plate lit water"
            : `light field carried from ${g.source[id]}`,
          loading: "lazy",
        },
      );
    }
    geometry[key].lit[id] = { left: x0, top: g.top + y0, width: w, height: h };
    if (preview) await img.clone().png().toFile(`${preview}/${name}.png`);
  }

  // Tiles of the before-selection plate.
  const step = g.height / g.tiles;
  for (let t = 0; t < g.tiles; t++) {
    const crop = {
      left: 0,
      top: t * step,
      width: g.width,
      height: step + (t === g.tiles - 1 ? 0 : 4),
    };
    for (const w of [g.width, g.small])
      for (const f of ["avif", "webp"]) {
        let p = sharp(base, { raw: { width: g.width, height: g.height, channels: 3 } })
          .extract(crop)
          .resize({ width: w, kernel: "lanczos3" });
        p =
          f === "avif"
            ? p.avif({ quality: 58, effort: 5 })
            : p.webp({ quality: 80, effort: 6, smartSubsample: true });
        const path = `${out}/${key}-plate-${t}-${w}.${f}`;
        await p.toFile(path);
        await record_(path, `${g.plate} + ${g.unlit}`, "background", {
          crop,
          loading: t === 0 ? "media-specific preload" : t === 1 ? "eager" : "lazy",
        });
      }
  }
  if (preview) {
    await sharp(base, { raw: { width: g.width, height: g.height, channels: 3 } })
      .extract({ left: 0, top: g.top, width: g.width, height: H })
      .png()
      .toFile(`${preview}/${key}-base-window.png`);
    // every terrace lit, for review
    const all = Buffer.from(
      base.subarray(g.top * g.width * 3, (g.top + H) * g.width * 3),
    );
    for (const id of ISSUES) {
      const { left, top, width, height } = geometry[key].lit[id];
      const { data } = await sharp(`${preview}/${key}-lit-${id}.png`)
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const o = (y * width + x) * 4;
          const a = data[o + 3] / 255;
          const i = ((top - g.top + y) * W + left + x) * 3;
          for (let c = 0; c < 3; c++)
            all[i + c] = Math.round(all[i + c] * (1 - a) + data[o + c] * a);
        }
    }
    await sharp(all, { raw: { width: W, height: H, channels: 3 } })
      .png()
      .toFile(`${preview}/${key}-all-lit.png`);
  }
  console.log(key, JSON.stringify(geometry[key].lit));
}

const sources = {};
for (const g of Object.values(regimes))
  for (const f of [g.plate, g.unlit])
    sources[f] = createHash("sha256")
      .update(await readFile(f))
      .digest("hex");

await writeFile(
  `${record}/manifest.json`,
  JSON.stringify(
    {
      generatedBy: "scripts/adelva/prepare-general-managers-assets.mjs",
      sourceOwner: "ADELVA project",
      sourceMethod:
        "Built-in image_gen clean plates and unlit variants (Codex gpt-6-astra workers, Opus prompts and stitching; see the A2 and A2-mobile READMEs), then the deterministic swap and light-field transfer in this script",
      water: { threshold: T_WATER, erode: ERODE },
      sources,
      geometry,
      derivatives,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
