/**
 * Narrow-viewport choreography of /services/management-operations (< 1024 px).
 *
 * A port of the adopted B-hq-mobile prototype (`m.js`): the adopted photograph
 * is drawn into one fixed canvas and a camera {cx, cy, d} — the viewport centre
 * in plate px and plate px per CSS px — is a pure function of the scroll
 * position, keyed to the DOM. Text stays in the DOM; only the index columns,
 * the knuckle rings and their labels, and the fork threads ride on the
 * photograph (transform only).
 *
 * Images load in stages so the hero paints first; a layer that is not loaded
 * yet is skipped for that frame.
 */
import { moGeometry as G } from "@/content/adelva-management-operations-geometry";

const MEDIA = "/media/adelva/management-operations/";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);

type Source = HTMLImageElement | HTMLCanvasElement;
interface Shot {
  px: number;
  py: number;
  fx: number;
  fy: number;
  d: number;
}
interface Cam {
  cx: number;
  cy: number;
  d: number;
}
interface Win {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Load order: what the first screen needs, then down the page. */
const STAGES: readonly (readonly string[])[] = [
  ["sky", "base-0", "dim-0"],
  [
    "blur-0",
    "lit-0",
    "grove2x-0",
    "lit2x-0",
    "grove2x-1",
    "lit2x-1",
    "base-2048",
    "dim-2048",
    "blur-2048",
    "lit-2048",
  ],
  [
    "warm-knuckle-1",
    "warm-knuckle-2",
    "warm-knuckle-3",
    "warm-knuckle-4",
    "base-4096",
    "warm-old-0",
    "warm-old-2048",
  ],
  ["base-6144", "base-8192", "warm-young"],
];
const SLICES = {
  base: [0, 2048, 4096, 6144, 8192],
  dim: [0, 2048],
  blur: [0, 2048],
  lit: [0, 2048],
} as const;

export interface CameraOptions {
  readonly reduced: boolean;
}

export function startCamera(root: HTMLElement, options: CameraOptions): () => void {
  const reduced = options.reduced;
  const q = <T extends Element = HTMLElement>(
    selector: string,
    el: ParentNode = root,
  ) => el.querySelector<T>(selector)!;
  const qa = <T extends Element = HTMLElement>(
    selector: string,
    el: ParentNode = root,
  ) => [...el.querySelectorAll<T>(selector)];

  const canvas = q<HTMLCanvasElement>("canvas[data-camera]");
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const index = q("[data-index]");
  const boundaries = q("[data-boundaries]");
  const process = q("[data-process]");
  const audience = q("[data-audience]");
  const contact = q("[data-contact]");
  const themes = qa("li[data-theme]");
  const ticks = qa("[data-tick]");
  const forks = qa("[data-fork]");
  const steps = qa("[data-step]");
  const rings = qa("[data-ring]");
  const ringLabels = qa("[data-ring-label]");
  const stemsSvg = q<SVGSVGElement>("svg[data-stems]");
  const stems = qa<SVGPathElement>("[data-stem]");

  let disposed = false;
  let frameId = 0;
  const IMG: Record<string, Source | undefined> = {};

  /* ---------------------------------------------------------------- images */
  function featherBottom(image: HTMLImageElement, fraction: number): Source {
    const c = document.createElement("canvas");
    c.width = image.naturalWidth;
    c.height = image.naturalHeight;
    const x = c.getContext("2d")!;
    x.drawImage(image, 0, 0);
    x.globalCompositeOperation = "destination-in";
    const g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1 - fraction, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  const load = (name: string) =>
    new Promise<void>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        image
          .decode()
          .catch(() => {})
          .then(() => {
            if (disposed) return resolve();
            // The top variants (dim/blur/lit) end at plate row 2560: their last
            // 420 rows fade so no layer ever ends on a straight line.
            IMG[name] = /^(dim|blur|lit)-2048$/.test(name)
              ? featherBottom(image, 420 / 512)
              : image;
            dirty = true;
            resolve();
          });
      };
      image.onerror = () => resolve();
      image.src = `${MEDIA}${name}.webp`;
    });
  async function loadStages(onFirst: () => void) {
    for (const [i, stage] of STAGES.entries()) {
      await Promise.all(stage.map(load));
      if (disposed) return;
      if (i === 0) onFirst();
    }
  }
  const size = (im: Source) =>
    im instanceof HTMLImageElement
      ? [im.naturalWidth, im.naturalHeight]
      : [im.width, im.height];

  /* ---------------------------------------------------------------- viewport */
  let vw = 390;
  let vh = 844;
  let dpr = 1;
  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    stemsSvg.setAttribute("width", String(vw));
    stemsSvg.setAttribute("height", String(vh));
    stemsSvg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
    dirty = true;
  }

  /* ---------------------------------------------------------------- shots */
  const shot = (px: number, py: number, fx: number, fy: number, d: number): Shot => ({
    px,
    py,
    fx,
    fy,
    d,
  });
  const groupSpan = (gi: number) => {
    const g = G.mobileIndex.groups[gi]!;
    const xs = [g.title, ...Object.values(g.services)];
    return [Math.min(...xs) - 18, Math.max(...xs) + 18] as const;
  };
  const SH: Record<string, Shot> = {};
  function defineShots() {
    const zoom = G.mobileIndex.zoom;
    // The tallest gold crown tip low in the frame, sky above.
    SH.hero = shot(880, 280, 0.676, 0.62, 2.2);
    G.mobileIndex.groups.forEach((_, i) => {
      const [a, b] = groupSpan(i);
      SH[`st${i + 1}`] = shot((a + b) / 2, G.mobileIndex.hairlineY, 0.5, 0.4, zoom);
    });
    // The whole daisugi: crowns to platform.
    SH.full = shot(768, 2850, 0.5, 0.78, G.plate.width / vw);
    // Forks: one knuckle at a time, the platform high in the frame, the twisted
    // trunk kept right of the reading column, so no text sits on the bark. The
    // knuckle sits ~96 px above the pinned fork list's heading.
    const stageEl = q("[data-boundaries-stage]");
    const h2 = q("h2", stageEl);
    const h2Top = vh - (stageEl.offsetHeight - h2.offsetTop);
    const fy = clamp((h2Top - 96) / vh, 0.12, 0.2);
    const kx = G.knuckles.map((knuckle) => knuckle.center);
    SH.fork1 = shot(kx[0]![0], kx[0]![1], 0.65, fy, 3.0);
    SH.fork2 = shot(kx[1]![0], kx[1]![1], 0.76, fy, 3.0);
    SH.fork3 = shot(kx[2]![0], kx[2]![1], 0.885, fy, 3.0);
    // Process: the old trunk's left edge at ~2/3 of the width while the camera
    // tilts down it, held between the platform's underside and the boulders.
    SH.procA = shot(1000, 3030, 0.667, 0, 2.0);
    SH.procB = shot(1000, 3150, 0.667, 0, 2.0);
    SH.crowns = shot(820, 560, 0.5, 0.42, 1.75);
    // The whole young daisugi below the routes.
    SH.aud = shot(1060, 6730, 0.62, 0.97, 2.5);
    SH.contA = shot(900, 7300, 0.5, 0.2, 2.6);
    SH.contB = shot(900, 7900, 0.5, 0.45, 2.6);
  }
  function camOf(s: Shot): Cam {
    const d = Math.min(s.d, G.plate.width / vw);
    let cx = s.px - (s.fx - 0.5) * vw * d;
    let cy = s.py - (s.fy - 0.5) * vh * d;
    const hw = (vw * d) / 2;
    const hh = (vh * d) / 2;
    cx = clamp(cx, hw, G.plate.width - hw);
    cy = clamp(cy, -G.plate.sky + hh, G.plate.height - hh);
    return { cx, cy, d };
  }
  const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
    cx: lerp(a.cx, b.cx, t),
    cy: lerp(a.cy, b.cy, t),
    d: Math.exp(lerp(Math.log(a.d), Math.log(b.d), t)),
  });

  /* ---------------------------------------------------------------- timeline */
  let KEYS: [number, string][] = [];
  const M = {
    st: [] as [number, number][],
    pullStart: 0,
    pullEnd: 0,
    descentEnd: 0,
    forks: [] as number[],
    forkEnd: 0,
    procStart: 0,
    procEnd: 0,
    steps: [] as number[],
    audStart: 0,
    aud: 0,
    contStart: 0,
    end: 0,
  };
  const topOf = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  function layout() {
    defineShots();
    // Index budget (scroll px after the stage pins): zoom, 4 stations, pull-back, descent.
    const B = { zoom: 260, hold: 260, move: 380, pull: 620, descent: 820, rest: 260 };
    const pinLength = B.zoom + 4 * B.hold + 3 * B.move + B.pull + B.descent + B.rest;
    index.style.height = `${pinLength + vh}px`;
    const t0 = topOf(index);
    let t = t0 + B.zoom;
    M.st = [];
    for (let i = 0; i < 4; i++) {
      M.st.push([t, t + B.hold]);
      t += B.hold + (i < 3 ? B.move : 0);
    }
    M.pullStart = t;
    M.pullEnd = t + B.pull;
    M.descentEnd = M.pullEnd + B.descent;
    const forkPin = 960;
    boundaries.style.setProperty("--bnd-pin", `${forkPin}px`);
    const b0 = topOf(boundaries);
    M.forks = [b0 + 60, b0 + 60 + forkPin * 0.42, b0 + forkPin - 40];
    M.forkEnd = b0 + forkPin;
    M.procStart = topOf(process) - vh * 0.35;
    M.procEnd = topOf(process) + process.offsetHeight - vh * 0.7;
    M.steps = steps.map((s) => topOf(s) + s.offsetHeight / 2 - vh * 0.55);
    M.audStart = topOf(audience) - vh * 0.75;
    M.aud = topOf(audience) - vh * 0.22;
    M.contStart = topOf(contact) - vh * 0.5;
    M.end = Math.max(M.contStart + 1, document.documentElement.scrollHeight - vh);
    KEYS = (
      [
        [0, "hero"],
        [Math.min(M.st[0]![0] - 200, vh * 0.62), "crowns"],
        [M.st[0]![0], "st1"],
        [M.st[0]![1], "st1"],
        [M.st[1]![0], "st2"],
        [M.st[1]![1], "st2"],
        [M.st[2]![0], "st3"],
        [M.st[2]![1], "st3"],
        [M.st[3]![0], "st4"],
        [M.st[3]![1], "st4"],
        [M.pullEnd, "full"],
        [M.descentEnd + B.rest * 0.5, "full"],
        [M.forks[0]!, "fork1"],
        [M.forks[0]! + 120, "fork1"],
        [M.forks[1]! - 60, "fork2"],
        [M.forks[1]! + 60, "fork2"],
        [M.forks[2]! - 120, "fork3"],
        [M.forkEnd, "fork3"],
        [M.procStart, "procA"],
        [M.procEnd, "procB"],
        [M.aud, "aud"],
        [M.aud + vh * 0.2, "aud"],
        [M.contStart, "contA"],
        [M.end, "contB"],
      ] as [number, string][]
    ).sort((a, b) => a[0] - b[0]);
    placeIndexColumns();
    dirty = true;
  }
  function camAt(y: number): Cam {
    if (y <= KEYS[0]![0]) return camOf(SH[KEYS[0]![1]]!);
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [ya, a] = KEYS[i]!;
      const [yb, b] = KEYS[i + 1]!;
      if (y <= yb) {
        let t = yb > ya ? (y - ya) / (yb - ya) : 1;
        // Reduced motion: cuts between still shots, no camera travel.
        t = reduced ? (t < 0.5 ? 0 : 1) : ease(t);
        return mixCam(camOf(SH[a]!), camOf(SH[b]!), t);
      }
    }
    return camOf(SH[KEYS.at(-1)![1]]!);
  }

  /* ---------------------------------------------------------------- state */
  const S = {
    cam: { cx: 0, cy: 0, d: 1 } as Cam,
    focus: 0,
    band: 0,
    station: 0,
    indexOn: 0,
    comets: 0,
    rings: 0,
    ringsAll: 0,
    pair: 0,
    pairMix: [0, 0, 0],
    pairGrow: 0,
    rail: 0,
    step: 0,
    oldBand: 0,
    oldOn: 0,
    young: 0,
  };
  function stateAt(y: number) {
    S.cam = camAt(y);
    const st = M.st;
    // Rack focus: from the end of the zoom-in to the start of the pull-back.
    S.focus = Math.min(
      ramp(y, st[0]![0] - 220, st[0]![0]),
      1 - ramp(y, M.pullStart, M.pullStart + 300),
    );
    // Light band position: 0..3 between stations.
    let p = 0;
    for (let i = 0; i < 4; i++) {
      if (y >= st[i]![0]) p = i;
      if (i < 3 && y > st[i]![1] && y < st[i + 1]![0])
        p = i + ease((y - st[i]![1]) / (st[i + 1]![0] - st[i]![1]));
    }
    S.band = reduced ? Math.round(p) : p;
    S.station = Math.round(p);
    S.indexOn = Math.min(
      ramp(y, st[0]![0] - 160, st[0]![0] + 20),
      1 - ramp(y, M.pullStart, M.pullStart + 110),
    );
    S.comets = reduced
      ? y > M.pullEnd
        ? 1
        : 0
      : ramp(y, M.pullEnd - 120, M.descentEnd);
    S.rings = 1 - ramp(y, M.forkEnd, M.forkEnd + vh * 0.35);
    S.ringsAll = ramp(y, M.descentEnd - 60, M.descentEnd + 40);
    // Forks: the pin's scroll range is split into three equal parts.
    const span = M.forkEnd - M.forks[0]!;
    S.pair =
      y < M.forks[0]! - vh * 0.3 || y > M.forkEnd + vh * 0.3
        ? 0
        : 1 + clamp(Math.floor(((y - M.forks[0]! + 40) / (span + 80)) * 3), 0, 2);
    const into =
      ramp(y, M.forks[0]! - vh * 0.3, M.forks[0]!) *
      (1 - ramp(y, M.forkEnd, M.forkEnd + vh * 0.3));
    S.pairMix = [1, 2, 3].map((k) => (S.pair === k ? into : 0));
    // The thread grows over the first part of each pair's third.
    const third = (span + 80) / 3;
    const local = y - M.forks[0]! + 40 - (S.pair - 1) * third;
    S.pairGrow = S.pair ? (reduced ? 1 : smooth(ramp(local, 0, third * 0.45))) : 0;
    S.rail = ramp(y, M.steps[0]! - vh * 0.1, M.steps[5]!);
    S.step = 0;
    M.steps.forEach((sy, i) => {
      if (y >= sy - vh * 0.08) S.step = i + 1;
    });
    S.oldBand = ramp(y, M.steps[0]! - vh * 0.2, M.steps[5]! + vh * 0.1);
    S.oldOn =
      ramp(y, M.procStart, M.procStart + vh * 0.3) *
      (1 - ramp(y, M.audStart, M.audStart + vh * 0.4));
    S.young = ramp(y, M.audStart, M.aud) * (1 - 0.35 * ramp(y, M.contStart, M.end));
  }

  /* ---------------------------------------------------------------- drawing */
  let dawn = reduced ? 0 : 1; // 1 = before sunrise (dim plate), animates to 0 on load
  function drawImg(
    im: Source | undefined,
    x: number,
    y: number,
    w: number,
    h: number,
    win: Win,
    alpha = 1,
  ) {
    if (!im || alpha <= 0.002) return;
    const [iw, ih] = size(im);
    // Intersect with the camera window and draw only the visible source rect.
    const x0 = Math.max(x, win.x0);
    const x1 = Math.min(x + w, win.x1);
    const y0 = Math.max(y, win.y0);
    const y1 = Math.min(y + h, win.y1);
    if (x1 <= x0 || y1 <= y0) return;
    const sx = ((x0 - x) / w) * iw!;
    const sy = ((y0 - y) / h) * ih!;
    const sw = ((x1 - x0) / w) * iw!;
    const sh = ((y1 - y0) / h) * ih!;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, sx, sy, sw, sh, x0, y0, x1 - x0, y1 - y0);
  }
  function slices(prefix: keyof typeof SLICES, win: Win, alpha: number) {
    for (const y of SLICES[prefix]) {
      const im = IMG[`${prefix}-${y}`];
      if (!im) continue;
      drawImg(im, 0, y, G.plate.width, size(im)[1]!, win, alpha);
    }
  }
  // Offscreen buffer for masked layers (light band, warm band), viewport-sized.
  const off = document.createElement("canvas");
  const octx = off.getContext("2d")!;
  function maskedLayer(
    drawFn: (c: CanvasRenderingContext2D) => void,
    maskFn: (c: CanvasRenderingContext2D) => void,
    alpha: number,
  ) {
    if (alpha <= 0.002) return;
    if (off.width !== canvas.width || off.height !== canvas.height) {
      off.width = canvas.width;
      off.height = canvas.height;
    }
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalCompositeOperation = "source-over";
    octx.globalAlpha = 1;
    octx.clearRect(0, 0, off.width, off.height);
    octx.setTransform(ctx.getTransform());
    drawFn(octx);
    octx.globalCompositeOperation = "destination-in";
    maskFn(octx);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }
  function bandX(p: number) {
    const L = G.mobileIndex.light;
    const i = Math.floor(clamp(p, 0, 3));
    const t = p - i;
    const a = L[i]!;
    const b = L[Math.min(3, i + 1)]!;
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] as const;
  }
  function draw() {
    const { cx, cy, d } = S.cam;
    const k = 1 / d;
    ctx.setTransform(
      dpr * k,
      0,
      0,
      dpr * k,
      dpr * (vw / 2 - cx * k),
      dpr * (vh / 2 - cy * k),
    );
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const win: Win = {
      x0: cx - (vw * d) / 2 - 2,
      x1: cx + (vw * d) / 2 + 2,
      y0: cy - (vh * d) / 2 - 2,
      y1: cy + (vh * d) / 2 + 2,
    };
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0e1118";
    ctx.fillRect(win.x0, win.y0, win.x1 - win.x0, win.y1 - win.y0);
    // 1. the plate, then the sky above row 0 (its feathered bottom overlaps row 0+)
    slices("base", win, 1);
    const sky = IMG.sky;
    if (sky) drawImg(sky, 0, -G.plate.sky, G.plate.width, size(sky)[1]!, win);
    // 2. the 2× grove band when zoomed in
    const b2 = G.band2x;
    const a2x = ramp(2.3 - d, 0, 0.6);
    drawImg(IMG["grove2x-0"], b2.x, b2.y, b2.w, b2.h / 2, win, a2x);
    drawImg(IMG["grove2x-1"], b2.x, b2.y + b2.h / 2, b2.w, b2.h / 2, win, a2x);
    // 3. before sunrise: the dim plate over everything lit (load only); the
    //    horizon glow at the far left swells as the sun comes up.
    if (dawn > 0) slices("dim", win, dawn);
    if (win.y0 < 900) {
      const glowAlpha = 0.22 * (1 - dawn);
      if (glowAlpha > 0.004) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = glowAlpha;
        ctx.translate(120, 250);
        ctx.scale(2.6, 1);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 260);
        g.addColorStop(0, "rgba(255,150,70,1)");
        g.addColorStop(0.5, "rgba(200,110,60,0.35)");
        g.addColorStop(1, "rgba(120,70,60,0)");
        ctx.fillStyle = g;
        ctx.fillRect(-260, -260, 520, 520);
        ctx.restore();
      }
    }
    // 4. rack focus in the index: a defocused, dimmer grove + the current
    //    group's lit, sharp band
    if (S.focus > 0) {
      slices("blur", win, S.focus * 0.92);
      const [xa, xb] = bandX(S.band);
      const f = 46;
      const zoomed = a2x > 0.5 && IMG["lit2x-0"] && IMG["lit2x-1"];
      maskedLayer(
        (c) => {
          if (zoomed) {
            c.drawImage(IMG["lit2x-0"]!, b2.x, b2.y, b2.w, b2.h / 2);
            c.drawImage(IMG["lit2x-1"]!, b2.x, b2.y + b2.h / 2, b2.w, b2.h / 2);
          } else {
            if (IMG["lit-0"]) c.drawImage(IMG["lit-0"], 0, 0, 1536, 2048);
            if (IMG["lit-2048"]) c.drawImage(IMG["lit-2048"], 0, 2048, 1536, 512);
          }
        },
        (c) => {
          const w = xb - xa + 2 * f;
          const g = c.createLinearGradient(xa - f, 0, xb + f, 0);
          g.addColorStop(0, "rgba(0,0,0,0)");
          g.addColorStop(f / w, "rgba(0,0,0,1)");
          g.addColorStop(1 - f / w, "rgba(0,0,0,1)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g;
          c.fillRect(xa - f, -G.plate.sky, w, G.plate.sky + 2600);
        },
        S.focus,
      );
    }
    // 5. warm knuckles (forks)
    G.warm.knuckles.forEach(({ x, y, width, height }, i) => {
      const a = (S.pair === i + 1 ? S.pairMix[i]! : 0) * 0.95;
      drawImg(IMG[`warm-knuckle-${i + 1}`], x, y, width, height, win, a);
    });
    // 6. a warm band descending the old trunk with the process rail
    if (S.oldOn > 0) {
      const yc = lerp(3150, 4850, S.oldBand);
      const half = 420;
      maskedLayer(
        (c) => {
          G.warm.old.forEach((layer) => {
            const im = IMG[layer.name.replace(".webp", "")];
            if (im) c.drawImage(im, layer.x, layer.y, layer.width, layer.height);
          });
        },
        (c) => {
          const g = c.createLinearGradient(0, yc - half, 0, yc + half);
          g.addColorStop(0, "rgba(0,0,0,0)");
          g.addColorStop(0.5, "rgba(0,0,0,1)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g;
          c.fillRect(0, yc - half, 1536, 2 * half);
        },
        S.oldOn,
      );
      // the morning light itself, running down the bark with the rail
      const OT = [
        [3300, 1160],
        [3800, 1185],
        [4300, 1215],
        [4700, 1230],
      ] as const;
      let tx: number = OT[0][1];
      for (let i = 0; i < OT.length - 1; i++)
        if (yc >= OT[i]![0])
          tx = lerp(
            OT[i]![1],
            OT[i + 1]![1],
            clamp((yc - OT[i]![0]) / (OT[i + 1]![0] - OT[i]![0]), 0, 1),
          );
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.2 * S.oldOn;
      ctx.translate(tx, yc);
      ctx.scale(0.55, 1);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 520);
      gg.addColorStop(0, "rgba(255,176,96,1)");
      gg.addColorStop(0.45, "rgba(255,150,80,0.38)");
      gg.addColorStop(1, "rgba(255,140,70,0)");
      ctx.fillStyle = gg;
      ctx.fillRect(-520, -520, 1040, 1040);
      ctx.restore();
    }
    // 7. the young daisugi warms as the audience routes arrive
    if (S.young > 0) {
      const { x, y, width, height } = G.warm.young;
      drawImg(IMG["warm-young"], x, y, width, height, win, S.young * 0.9);
    }
    // 8. comets
    if (!reduced && S.comets > 0 && S.comets < 1.2) drawComets(S.comets, d);
    ctx.globalAlpha = 1;
  }

  // Comets: light running down each service's trunk into its knuckle.
  // The prototype keyed its paths by service number in an object, so "10" and
  // "11" (integer-like keys) came first; the comet stagger follows that order.
  const ordered = [
    ...G.paths
      .filter((path) => /^[1-9]\d*$/.test(path.id))
      .sort((a, b) => +a.id - +b.id),
    ...G.paths.filter((path) => !/^[1-9]\d*$/.test(path.id)),
  ];
  const PATHS = ordered.map((path) => {
    const pts = path.points;
    const L = [0];
    const gap = [false];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i]![0] - pts[i - 1]![0];
      const dy = pts[i]![1] - pts[i - 1]![1];
      L.push(L[i - 1]! + Math.hypot(dx, dy));
      // A fog bridge (01 leaves its vanishing trunk for the next one): never
      // draw light across fog.
      gap.push(pts[i]![1] < 2420 && Math.abs(dx) > 0.9 * Math.abs(dy));
    }
    // Widen each gap by two samples so the light fades before the bend.
    const wide = gap.map(
      (v, i) => v || gap[i - 1] || gap[i + 1] || gap[i - 2] || gap[i + 2] || false,
    );
    return { pts, L, gap: wide, len: L.at(-1)! };
  });
  type CometPath = (typeof PATHS)[number];
  const inGap = (P: CometPath, s: number) => {
    let i = 1;
    while (i < P.L.length - 1 && P.L[i]! < s) i++;
    return P.gap[i];
  };
  const at = (P: CometPath, s: number) => {
    s = clamp(s, 0, P.len);
    let i = 1;
    while (i < P.L.length - 1 && P.L[i]! < s) i++;
    const t = (s - P.L[i - 1]!) / (P.L[i]! - P.L[i - 1]! || 1);
    return [
      lerp(P.pts[i - 1]![0], P.pts[i]![0], t),
      lerp(P.pts[i - 1]![1], P.pts[i]![1], t),
    ] as const;
  };
  const STAGGER = [0.0, 0.1, 0.04, 0.15, 0.07, 0.12, 0.02, 0.09, 0.17, 0.05, 0.13];
  function drawComets(p: number, d: number) {
    const tail = 240 * d; // 240 CSS px along the path
    PATHS.forEach((P, n) => {
      const delay = STAGGER[n % STAGGER.length]!;
      const progress = ramp(p, delay, delay + 0.8);
      if (progress <= 0 || progress >= 1) return;
      const head = ease(progress) * P.len;
      const fadeIn =
        smooth(ramp(progress, 0, 0.22)) * (1 - smooth(ramp(progress, 0.93, 1)));
      const segments = 24;
      ctx.lineCap = "butt";
      for (let i = 0; i < segments; i++) {
        const s0 = head - (tail * i) / segments;
        const s1 = head - (tail * (i + 1)) / segments;
        if (s0 <= 0) break;
        if (inGap(P, s0)) continue;
        const [x0, y0] = at(P, s0);
        const [x1, y1] = at(P, Math.max(0, s1));
        const f = 1 - i / segments;
        ctx.globalAlpha = 0.85 * f * f * fadeIn;
        ctx.strokeStyle = i < 3 ? "#ffd29a" : "#ff9a3c";
        ctx.lineWidth = 3 * f * d;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      if (inGap(P, head)) return;
      const [hx, hy] = at(P, head);
      // sheen on the wood around the head, elongated along the trunk
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 60 * d);
      g.addColorStop(0, "rgba(255,190,120,0.30)");
      g.addColorStop(1, "rgba(255,190,120,0)");
      ctx.globalAlpha = fadeIn;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(0.34, 1);
      ctx.translate(-hx, -hy);
      ctx.fillStyle = g;
      ctx.fillRect(hx - 60 * d, hy - 60 * d, 120 * d, 120 * d);
      ctx.restore();
      ctx.globalAlpha = 0.95 * fadeIn;
      ctx.fillStyle = "#fff1dc";
      ctx.beginPath();
      ctx.arc(hx, hy, 1.5 * d, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ---------------------------------------------------------------- photo-attached DOM */
  const toScreen = (x: number, y: number) => {
    const { cx, cy, d } = S.cam;
    return [(x - cx) / d + vw / 2, (y - cy) / d + vh / 2] as const;
  };
  interface Column {
    el: HTMLElement;
    x: number;
    y: number;
    w?: number;
    line?: boolean;
    width?: number;
  }
  const COLS: Column[] = [];
  function placeIndexColumns() {
    COLS.length = 0;
    const hy = G.mobileIndex.hairlineY;
    themes.forEach((theme, gi) => {
      const g = G.mobileIndex.groups[gi]!;
      COLS.push({ el: q("h3", theme), x: g.title, y: hy + 14 });
      qa("li[data-service]", theme).forEach((li) =>
        COLS.push({ el: li, x: g.services[li.dataset.service!]!, y: hy + 10 }),
      );
      const [a, b] = groupSpan(gi);
      COLS.push({ el: q("[data-hairline]", theme), x: a, y: hy, w: b - a, line: true });
    });
  }
  const set = (el: Element, key: string, value: string) => {
    if (el.getAttribute(key) !== value) el.setAttribute(key, value);
  };
  function updateDom() {
    const s = S;
    if (s.indexOn > 0.001) {
      for (const c of COLS) {
        const [sx, sy] = toScreen(c.x, c.y);
        if (c.line) {
          c.el.style.width = `${c.w! / s.cam.d}px`;
          c.el.style.transform = `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0)`;
        } else {
          const w = c.width || (c.width = c.el.offsetWidth || 20);
          c.el.style.transform = `translate3d(${(sx - w / 2).toFixed(2)}px,${sy.toFixed(2)}px,0)`;
          // Never show a column cut by the screen edge: fade it over the last 22 px.
          const edge = Math.min(sx - w / 2 - 6, vw - 6 - (sx + w / 2));
          c.el.style.opacity = clamp(edge / 22, 0, 1).toFixed(3);
        }
      }
    }
    root.style.setProperty("--index-on", s.indexOn.toFixed(3));
    const station = s.station + 1;
    themes.forEach((el, i) => set(el, "data-current", i + 1 === station ? "1" : "0"));
    ticks.forEach((el, i) => set(el, "data-current", i + 1 === station ? "1" : "0"));
    // Knuckle rings and their labels.
    G.knuckles.forEach((knuckle, i) => {
      const [sx, sy] = toScreen(knuckle.center[0], knuckle.center[1]);
      const ring = rings[i]!;
      ring.style.transform = `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0)`;
      const arrive = ramp(s.comets, 0.7 + i * 0.04, 0.9 + i * 0.025);
      const lit = Math.max(arrive * s.rings, s.pair === i + 1 ? s.pairMix[i]! : 0);
      ring.style.opacity = (Math.max(arrive, s.ringsAll) * s.rings * 0.95).toFixed(3);
      set(ring, "data-lit", lit > 0.5 ? "1" : "0");
      const lx = clamp(sx, 64, vw - 64);
      const label = ringLabels[i]!;
      label.style.transform = `translate3d(${lx.toFixed(2)}px,${(sy + 18).toFixed(2)}px,0)`;
      label.style.opacity = (s.pair === i + 1 ? s.pairMix[i]! : 0).toFixed(3);
    });
    // Forks: a fine thread grows from the pair being read to its knuckle.
    forks.forEach((f, i) => set(f, "data-active", s.pair === i + 1 ? "1" : "0"));
    stems.forEach((path, i) => {
      const on = s.pair === i + 1 ? s.pairMix[i]! : 0;
      if (on <= 0.01) {
        path.style.opacity = "0";
        return;
      }
      const f = forks[i]!;
      const names = qa("[data-entry-name]", f);
      const r0 = f.getBoundingClientRect();
      const xr = Math.max(...names.map((n) => n.getBoundingClientRect().right));
      const y0 = r0.top + Math.min(26, r0.height * 0.2);
      // Out to the right of the reading column, up along the trunk's edge, then
      // into the bottom of the knuckle's label — never across any text.
      const lab = ringLabels[i]!.getBoundingClientRect();
      const x0 = xr + 8;
      const rail = Math.max(x0 + 14, 270);
      const lx = lab.left + lab.width / 2;
      const ly = lab.bottom + 6;
      path.setAttribute(
        "d",
        `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(rail - 4).toFixed(1)} ${y0.toFixed(1)} ${rail.toFixed(1)} ${(y0 - 6).toFixed(1)} ${rail.toFixed(1)} ${(y0 - 28).toFixed(1)}` +
          ` L${rail.toFixed(1)} ${(ly + 44).toFixed(1)} C${rail.toFixed(1)} ${(ly + 16).toFixed(1)} ${lx.toFixed(1)} ${(ly + 22).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}`,
      );
      path.style.strokeDashoffset = (1 - clamp(s.pairGrow, 0, 1)).toFixed(3);
      path.style.opacity = on.toFixed(3);
    });
    // Process
    root.style.setProperty("--rail", s.rail.toFixed(4));
    steps.forEach((el, i) =>
      set(
        el,
        "data-state",
        i + 1 < s.step ? "reached" : i + 1 === s.step ? "current" : "pending",
      ),
    );
  }

  /* ---------------------------------------------------------------- loop */
  let dirty = true;
  let lastY = -1;
  let ready = false;
  function render(y: number) {
    stateAt(y);
    draw();
    updateDom();
  }
  function frame() {
    frameId = requestAnimationFrame(frame);
    if (!ready) return;
    const y = window.scrollY;
    if (y !== lastY || dirty) {
      lastY = y;
      dirty = false;
      render(y);
    }
  }
  function startDawn() {
    if (reduced) {
      dawn = 0;
      dirty = true;
      return;
    }
    const t0 = performance.now();
    const duration = 1800;
    const step = (now: number) => {
      if (disposed) return;
      const t = clamp((now - t0 - 250) / duration, 0, 1);
      dawn = 1 - smooth(t);
      dirty = true;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  let width = window.innerWidth;
  let height = window.innerHeight;
  const relayout = () => {
    if (!ready) return;
    width = window.innerWidth;
    height = window.innerHeight;
    resize();
    layout();
  };
  // A phone's toolbar changes the height while scrolling: redraw at the new
  // size but keep the scroll marks, so nothing jumps mid-gesture.
  const onResize = () => {
    if (!ready) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w !== width || Math.abs(h - height) > 160) relayout();
    else resize();
  };
  window.addEventListener("resize", onResize);
  const fonts = document.fonts;
  fonts?.addEventListener?.("loadingdone", relayout);

  resize();
  frameId = requestAnimationFrame(frame);
  void loadStages(() => {
    root.dataset.ready = "1"; // the index switches from its no-JS list to the photo layout
    layout();
    ready = true;
    dirty = true;
    root.dataset.motion = "ready";
    startDawn();
  });

  (window as unknown as { __mo?: unknown }).__mo = {
    marks: M,
    state: S,
    render: (y: number, dawnValue?: number) => {
      if (dawnValue !== undefined) dawn = dawnValue;
      render(y);
    },
  };

  return () => {
    disposed = true;
    delete (window as unknown as { __mo?: unknown }).__mo;
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", onResize);
    fonts?.removeEventListener?.("loadingdone", relayout);
    delete root.dataset.ready;
    delete root.dataset.motion;
    root.style.removeProperty("--index-on");
    root.style.removeProperty("--rail");
    index.style.removeProperty("height");
    boundaries.style.removeProperty("--bnd-pin");
    for (const c of COLS) {
      c.el.style.removeProperty("transform");
      c.el.style.removeProperty("opacity");
      c.el.style.removeProperty("width");
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
