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
 * Polish 2026-10-13 (spec `docs/specs/adelva-polish-2026-10-13.md` R1–R10):
 *   - the photograph is drawn with WebGL from streamed tiles (`camera-gl.ts`)
 *     instead of re-compositing ~20 large layers on a 2D canvas every frame;
 *   - the camera follows a damped scroll position (frame-rate independent,
 *     settles in ≈200 ms) so irregular touch scroll sampling never shows as
 *     steps, and the loop sleeps when nothing changes;
 *   - discrete states (the pair being read) cross-fade instead of switching;
 *   - no layout reads in the frame loop: geometry is cached on layout;
 *   - only transform/opacity (and SVG path data of the thin fork thread) are
 *     written per frame, and only when they change;
 *   - while the forks are read the photograph's focus rests on the knuckle
 *     of the pair and the bark behind the text is defocused (rack focus,
 *     the index's own device), so text never sits on sharp bark.
 */
import { moGeometry as G } from "@/content/adelva-management-operations-geometry";

import {
  createRenderer,
  type Cam,
  type LayerName,
  type Overlay,
  type Rect,
} from "./camera-gl";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ramp = (v: number, a: number, b: number) => clamp((v - a) / (b - a), 0, 1);

/** Damping of the camera's scroll position (ms, exponential time constant). */
const TAU_SCROLL = 65;
/** Cross-fade of discrete states (ms, exponential time constant). */
const TAU_STATE = 70;

interface Shot {
  px: number;
  py: number;
  fx: number;
  fy: number;
  d: number;
}

export interface CameraOptions {
  readonly reduced: boolean;
}

interface State {
  cam: Cam;
  focus: number;
  band: number;
  station: number;
  indexOn: number;
  headOn: number;
  comets: number;
  rings: number;
  ringsAll: number;
  pair: number;
  into: number;
  pairGrow: number;
  softFork: number;
  softAud: number;
  softEnd: number;
  rail: number;
  step: number;
  oldBand: number;
  oldOn: number;
  young: number;
}
const emptyState = (): State => ({
  cam: { cx: 0, cy: 0, d: 1 },
  focus: 0,
  band: 0,
  station: 0,
  indexOn: 0,
  headOn: 0,
  comets: 0,
  rings: 0,
  ringsAll: 0,
  pair: 0,
  into: 0,
  pairGrow: 0,
  softFork: 0,
  softAud: 0,
  softEnd: 0,
  rail: 0,
  step: 0,
  oldBand: 0,
  oldOn: 0,
  young: 0,
});

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
  const index = q("[data-index]");
  const indexHead = q("[data-index-head]");
  const themesEl = q("[data-themes]");
  const boundaries = q("[data-boundaries]");
  const boundariesStage = q("[data-boundaries-stage]");
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
  const railFill = q("[data-rail]");

  let disposed = false;
  let frameId = 0;

  const renderer = createRenderer(canvas);
  if (!renderer) {
    // No WebGL: the document reads completely without the photograph (the
    // index stays the plain list it is without JavaScript).
    root.dataset.motion = "ready";
    return () => {
      delete root.dataset.motion;
    };
  }
  const R = renderer;

  /* ---------------------------------------------------------------- viewport */
  // The canvas is 100lvh tall: the camera frames the large viewport and never
  // re-frames when the phone's toolbar shows or hides (R7).
  let vw = 390;
  let vh = 844;
  let dpr = 1;
  function measureViewport() {
    vw = document.documentElement.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    R.resize(vw, vh, dpr);
    stemsSvg.setAttribute("width", String(vw));
    stemsSvg.setAttribute("height", String(vh));
    stemsSvg.setAttribute("viewBox", `0 0 ${vw} ${vh}`);
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
    // On short screens the crown tip moves below the hero's call to action,
    // so the lead never sits on the crowns.
    const cta = q("[data-hero] > a");
    const ctaBottom = cta.offsetTop + cta.offsetHeight;
    const heroFy = vh < 700 ? clamp((ctaBottom + 40) / vh, 0.62, 0.92) : 0.62;
    SH.hero = shot(880, 280, 0.676, heroFy, 2.2);
    G.mobileIndex.groups.forEach((_, i) => {
      const [a, b] = groupSpan(i);
      SH[`st${i + 1}`] = shot((a + b) / 2, G.mobileIndex.hairlineY, 0.5, 0.4, zoom);
    });
    // The whole daisugi: crowns to platform.
    SH.full = shot(768, 2850, 0.5, 0.78, G.plate.width / vw);
    // Forks: one knuckle at a time, the platform high in the frame and the
    // twisted trunk right of the reading column; the knuckle sits ~96 px above
    // the pinned fork list's heading.
    const h2 = q("h2", boundariesStage);
    const fy = clamp((h2.offsetTop - 96) / vh, 0.12, 0.2);
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
  const mixCam = (a: Cam, b: Cam, t: number, out: Cam): Cam => {
    out.cx = lerp(a.cx, b.cx, t);
    out.cy = lerp(a.cy, b.cy, t);
    out.d = Math.exp(lerp(Math.log(a.d), Math.log(b.d), t));
    return out;
  };

  /* ---------------------------------------------------------------- timeline */
  let KEYS: [number, Cam][] = [];
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
    b0: 0,
    forkPin: 0,
  };
  /** Cached geometry of DOM the frame loop positions things against. */
  const GEO = {
    forkRows: [] as { top: number; right: number }[],
    labelH: [] as number[],
    /** The fork heading relative to its sticky stage. */
    h2: { top: 0, bottom: 0, right: 0 },
    /** Bottom of the fixed site header (compact state). */
    header: 64,
  };
  const topOf = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  function layout() {
    measureViewport();
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
    M.forkPin = forkPin;
    boundaries.style.setProperty("--bnd-pin", `${forkPin}px`);
    const b0 = topOf(boundaries);
    M.b0 = b0;
    M.forks = [b0 + 60, b0 + 60 + forkPin * 0.42, b0 + forkPin - 40];
    M.forkEnd = b0 + forkPin;
    M.procStart = topOf(process) - vh * 0.35;
    M.procEnd = topOf(process) + process.offsetHeight - vh * 0.7;
    M.steps = steps.map((s) => topOf(s) + s.offsetHeight / 2 - vh * 0.55);
    M.audStart = topOf(audience) - vh * 0.75;
    M.aud = topOf(audience) - vh * 0.22;
    M.contStart = topOf(contact) - vh * 0.5;
    M.end = Math.max(M.contStart + 1, document.documentElement.scrollHeight - vh);
    const keys: [number, string][] = [
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
    ];
    KEYS = keys
      .sort((a, b) => a[0] - b[0])
      .map(([y, name]) => [y, camOf(SH[name]!)] as [number, Cam]);

    // Fork rows relative to their sticky stage, and the knuckle labels' height.
    const stageRect = boundariesStage.getBoundingClientRect();
    GEO.forkRows = forks.map((fork) => {
      const box = fork.getBoundingClientRect();
      const right = Math.max(
        ...qa("[data-entry-name]", fork).map((n) => n.getBoundingClientRect().right),
      );
      return {
        top: box.top - stageRect.top + Math.min(26, box.height * 0.2),
        right: right - stageRect.left,
      };
    });
    GEO.labelH = ringLabels.map((label) => label.offsetHeight);
    const h2Box = q("h2", boundariesStage).getBoundingClientRect();
    GEO.h2 = {
      top: h2Box.top - stageRect.top,
      bottom: h2Box.bottom - stageRect.top,
      right: h2Box.right - stageRect.left,
    };
    const header = document.querySelector(
      'header[data-fidelity-landmark="header-nav"]',
    );
    GEO.header = header ? Math.min(96, header.getBoundingClientRect().bottom) : 64;
    placeIndexColumns();
    dirty = true;
  }
  function camAt(y: number, out: Cam): Cam {
    if (y <= KEYS[0]![0]) return Object.assign(out, KEYS[0]![1]);
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [ya, a] = KEYS[i]!;
      const [yb, b] = KEYS[i + 1]!;
      if (y <= yb) {
        let t = yb > ya ? (y - ya) / (yb - ya) : 1;
        // Reduced motion: cuts between still shots, no camera travel.
        t = reduced ? (t < 0.5 ? 0 : 1) : ease(t);
        return mixCam(a, b, t, out);
      }
    }
    return Object.assign(out, KEYS.at(-1)![1]);
  }

  /* ---------------------------------------------------------------- state */
  /** The state at scroll position y — pure, so it also serves look-ahead. */
  function stateAt(y: number, out: State): State {
    camAt(y, out.cam);
    const st = M.st;
    // Rack focus: from the end of the zoom-in to the start of the pull-back.
    out.focus = Math.min(
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
    out.band = reduced ? Math.round(p) : p;
    out.station = Math.round(p);
    out.indexOn = Math.min(
      ramp(y, st[0]![0] - 160, st[0]![0] + 20),
      1 - ramp(y, M.pullStart, M.pullStart + 110),
    );
    // The heading "4つの支援テーマ・11のサービス" stays while the eleven lights
    // run into the four knuckles: it captions the pull-back and the descent.
    out.headOn = ramp(y, st[0]![0] - 160, st[0]![0] + 20);
    out.comets = reduced
      ? y > M.pullEnd
        ? 1
        : 0
      : ramp(y, M.pullEnd - 120, M.descentEnd);
    out.rings = 1 - ramp(y, M.forkEnd, M.forkEnd + vh * 0.35);
    out.ringsAll = ramp(y, M.descentEnd - 60, M.descentEnd + 40);
    // Forks: the pin's scroll range is split into three equal parts.
    const span = M.forkEnd - M.forks[0]!;
    out.pair =
      y < M.forks[0]! - vh * 0.3 || y > M.forkEnd + vh * 0.3
        ? 0
        : 1 + clamp(Math.floor(((y - M.forks[0]! + 40) / (span + 80)) * 3), 0, 2);
    out.into =
      ramp(y, M.forks[0]! - vh * 0.3, M.forks[0]!) *
      (1 - ramp(y, M.forkEnd, M.forkEnd + vh * 0.3));
    // The thread grows over the first part of each pair's third.
    const third = (span + 80) / 3;
    const local = y - M.forks[0]! + 40 - (out.pair - 1) * third;
    out.pairGrow = out.pair ? (reduced ? 1 : smooth(ramp(local, 0, third * 0.45))) : 0;
    // Rack focus below the platform: the photograph keeps its focus on what
    // the text is about (the pair's knuckle, then the young daisugi) and the
    // texture behind the text goes soft; at the contact everything softens.
    out.softFork =
      ramp(y, M.forks[0]! - vh * 0.55, M.forks[0]! - vh * 0.1) *
      (1 - ramp(y, M.forkEnd + vh * 0.05, M.forkEnd + vh * 0.45));
    out.softAud = ramp(y, M.audStart + vh * 0.1, M.audStart + vh * 0.5);
    out.softEnd = ramp(y, M.contStart - vh * 0.1, M.contStart + vh * 0.3);
    out.rail = ramp(y, M.steps[0]! - vh * 0.1, M.steps[5]!);
    out.step = 0;
    M.steps.forEach((sy, i) => {
      if (y >= sy - vh * 0.08) out.step = i + 1;
    });
    out.oldBand = ramp(y, M.steps[0]! - vh * 0.2, M.steps[5]! + vh * 0.1);
    out.oldOn =
      ramp(y, M.procStart, M.procStart + vh * 0.3) *
      (1 - ramp(y, M.audStart, M.audStart + vh * 0.4));
    out.young = ramp(y, M.audStart, M.aud) * (1 - 0.35 * ramp(y, M.contStart, M.end));
    return out;
  }

  /* ---------------------------------------------------------------- what to draw */
  let dawn = reduced ? 0 : 1; // 1 = before sunrise (dim plate), animates to 0 on load
  const FEATHER = [2140, 2560] as const; // bottom feather of the top variants
  const windowOf = (cam: Cam, margin = 0): Rect => {
    const mx = (vw * cam.d) / 2 + margin * cam.d;
    const my = (vh * cam.d) / 2 + margin * cam.d;
    return { x0: cam.cx - mx, x1: cam.cx + mx, y0: cam.cy - my, y1: cam.cy + my };
  };
  function bandX(p: number) {
    const L = G.mobileIndex.light;
    const i = Math.floor(clamp(p, 0, 3));
    const t = p - i;
    const a = L[i]!;
    const b = L[Math.min(3, i + 1)]!;
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] as const;
  }
  const a2xOf = (d: number) => ramp(2.3 - d, 0, 0.6);
  /** The young daisugi's crown and trunk, where the routes' focus rests. */
  const YOUNG = [1170, 6150] as const;
  const oldCentre = (s: State) => lerp(3150, 4850, s.oldBand);

  /** Layers (and the plate rectangle they need) at a state. */
  function layersOf(s: State, current: boolean): [LayerName, Rect][] {
    const win = windowOf(s.cam, 24);
    const out: [LayerName, Rect][] = [["base", win]];
    if (win.y0 < 160) out.push(["sky", win]);
    const a2x = a2xOf(s.cam.d);
    if (a2x > 0.002) out.push(["grove2x", win]);
    if (current && dawn > 0) out.push(["dim", win]);
    if (s.focus > 0) {
      out.push(["blur", win]);
      const [xa, xb] = bandX(s.band);
      const band: Rect = {
        ...win,
        x0: Math.max(win.x0, xa - 46),
        x1: Math.min(win.x1, xb + 46),
      };
      out.push([a2x > 0.5 ? "lit2x" : "lit", band]);
    }
    if (s.softFork > 0 || s.softAud > 0) out.push(["soft", win]);
    if (s.pair) out.push([`warm-knuckle-${s.pair}` as LayerName, win]);
    if (s.oldOn > 0) {
      const yc = oldCentre(s);
      out.push([
        "warm-old",
        { ...win, y0: Math.max(win.y0, yc - 420), y1: Math.min(win.y1, yc + 420) },
      ]);
    }
    if (s.young > 0) out.push(["warm-young", win]);
    return out;
  }

  /* ---------------------------------------------------------------- residency */
  const lookState = emptyState();
  let residencyY = -1e9;
  const LOOK = [0, 0.25, -0.25, 0.5, 0.75, 1, -0.5, 1.25, 1.5];
  function residency(y: number) {
    residencyY = y;
    const keys: string[] = ["preview/0-0"];
    const seen = new Set(keys);
    for (const f of LOOK) {
      const yy = clamp(y + f * vh, 0, M.end);
      stateAt(yy, lookState);
      for (const [layer, rect] of layersOf(lookState, f === 0))
        for (const key of R.tilesOf(layer, rect))
          if (!seen.has(key)) {
            seen.add(key);
            keys.push(key);
          }
    }
    R.want(keys);
  }
  function currentKeys(s: State) {
    const keys: string[] = ["preview/0-0"];
    for (const [layer, rect] of layersOf(s, true))
      if (layer === "base" || layer === "sky" || layer === "dim")
        keys.push(...R.tilesOf(layer, rect));
    return keys;
  }

  /* ---------------------------------------------------------------- drawing */
  const S = emptyState();
  /** Cross-faded presence of each pair (0–1) and the focus point between knuckles. */
  const pairVis = [0, 0, 0];
  const comets = new Float32Array(9 * 6 * 11 * 26);

  function draw(s: State) {
    const cam = s.cam;
    const win = windowOf(cam);
    R.begin(cam);
    // 0. the whole photograph, tiny: never black while tiles stream in
    R.layer({ layer: "preview", alpha: 1 });
    // The defocused variant mixed into the plate in the same pass: the rack
    // focus of the index (blur), and below the platform the soft bark behind
    // the text, sharp where the text points (the pair's knuckle, the young
    // daisugi); at the contact everything softens.
    let over: Overlay | undefined;
    if (s.focus > 0)
      over = { layer: "blur", alpha: s.focus * 0.92, fadeBottom: FEATHER };
    else if (s.softFork > 0) {
      const [fx, fy] = focusPoint();
      over = {
        layer: "soft",
        alpha: s.softFork,
        fadeTop: [2048, 2348],
        focus: [fx, fy, 70, 230],
        gain: 0.86,
      };
    } else if (s.softAud > 0) {
      const [fx, fy] = toScreen(cam, YOUNG[0], YOUNG[1]);
      over = {
        layer: "soft",
        alpha: s.softAud * lerp(1, 0.86, s.softEnd),
        focus: [fx, fy, lerp(90, 0, s.softEnd), lerp(280, 1, s.softEnd)],
        fadeTop: [2048, 2348],
        gain: 0.86,
      };
    }
    // 1. the plate, then the sky above row 0 (its feathered bottom overlaps row 0+)
    R.layer({ layer: "base", alpha: 1, over });
    if (win.y0 < 160) R.layer({ layer: "sky", alpha: 1 });
    // 2. the 2× grove band when zoomed in
    const a2x = a2xOf(cam.d);
    R.layer({ layer: "grove2x", alpha: a2x, over: s.focus > 0 ? over : undefined });
    // 3. before sunrise: the dim plate over everything lit (load only); the
    //    horizon glow at the far left swells as the sun comes up.
    if (dawn > 0) R.layer({ layer: "dim", alpha: dawn, fadeBottom: FEATHER });
    if (win.y0 < 900)
      R.glow({
        x: 120,
        y: 250,
        rx: 260 * 2.6,
        ry: 260,
        stops: [
          [255, 150, 70, 1],
          [200, 110, 60, 0.35],
          [120, 70, 60, 0],
        ],
        mid: 0.5,
        alpha: 0.22 * (1 - dawn),
        screen: true,
      });
    // 4. the current group's lit, sharp band in the index
    if (s.focus > 0) {
      const [xa, xb] = bandX(s.band);
      const f = 46;
      const bandXs = [xa - f, xa, xb, xb + f] as const;
      if (a2x > 0.5)
        R.layer({ layer: "lit2x", alpha: s.focus, bandX: bandXs, clipBottom: 2600 });
      else
        R.layer({
          layer: "lit",
          alpha: s.focus,
          bandX: bandXs,
          clipBottom: 2600,
          fadeBottom: FEATHER,
        });
    }
    // 6. warm knuckles (forks)
    pairVis.forEach((v, i) => {
      if (v > 0.002)
        R.layer({ layer: `warm-knuckle-${i + 1}` as LayerName, alpha: v * 0.95 });
    });
    // 7. a warm band descending the old trunk with the process rail
    if (s.oldOn > 0) {
      const yc = oldCentre(s);
      R.layer({ layer: "warm-old", alpha: s.oldOn, bandY: [yc, 420] });
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
      R.glow({
        x: tx,
        y: yc,
        rx: 520 * 0.55,
        ry: 520,
        stops: [
          [255, 176, 96, 1],
          [255, 150, 80, 0.38],
          [255, 140, 70, 0],
        ],
        mid: 0.45,
        alpha: 0.2 * s.oldOn,
        screen: true,
      });
    }
    // 8. the young daisugi warms as the audience routes arrive
    if (s.young > 0) R.layer({ layer: "warm-young", alpha: s.young * 0.9 });
    // 9. comets
    if (!reduced && s.comets > 0 && s.comets < 1.2) {
      const count = buildComets(s.comets, cam.d);
      R.shapes(comets, count);
    }
    // 10. the photograph emerges from the page's ink once its tiles are drawn
    R.veil(1 - reveal);
    R.end();
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
  const indexAt = (P: CometPath, s: number) => {
    let i = 1;
    while (i < P.L.length - 1 && P.L[i]! < s) i++;
    return i;
  };
  const at = (P: CometPath, s: number) => {
    s = clamp(s, 0, P.len);
    const i = indexAt(P, s);
    const t = (s - P.L[i - 1]!) / (P.L[i]! - P.L[i - 1]! || 1);
    return [
      lerp(P.pts[i - 1]![0], P.pts[i]![0], t),
      lerp(P.pts[i - 1]![1], P.pts[i]![1], t),
    ] as const;
  };
  const STAGGER = [0.0, 0.1, 0.04, 0.15, 0.07, 0.12, 0.02, 0.09, 0.17, 0.05, 0.13];
  const HOT = [1, 0xd2 / 255, 0x9a / 255] as const;
  const WARM = [1, 0x9a / 255, 0x3c / 255] as const;
  function buildComets(p: number, d: number): number {
    const tail = 240 * d; // 240 CSS px along the path
    const segments = 24;
    let n = 0;
    const v = comets;
    const push = (
      x: number,
      y: number,
      u: number,
      w: number,
      r: number,
      g: number,
      b: number,
      a: number,
      kind: number,
    ) => {
      const o = n * 9;
      v[o] = x;
      v[o + 1] = y;
      v[o + 2] = u;
      v[o + 3] = w;
      v[o + 4] = r;
      v[o + 5] = g;
      v[o + 6] = b;
      v[o + 7] = a;
      v[o + 8] = kind;
      n++;
    };
    const quad = (
      x: number,
      y: number,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      col: readonly [number, number, number],
      a: number,
      kind: number,
    ) => {
      // centre (x, y), half axes a and b
      const c = [
        [x - ax - bx, y - ay - by, -1, -1],
        [x + ax - bx, y + ay - by, 1, -1],
        [x - ax + bx, y - ay + by, -1, 1],
        [x + ax + bx, y + ay + by, 1, 1],
      ] as const;
      for (const i of [0, 1, 2, 2, 1, 3]) {
        const k = c[i]!;
        push(k[0], k[1], k[2], k[3], col[0], col[1], col[2], a, kind);
      }
    };
    PATHS.forEach((P, idx) => {
      const delay = STAGGER[idx % STAGGER.length]!;
      const progress = ramp(p, delay, delay + 0.8);
      if (progress <= 0 || progress >= 1) return;
      const head = ease(progress) * P.len;
      const fadeIn =
        smooth(ramp(progress, 0, 0.22)) * (1 - smooth(ramp(progress, 0.93, 1)));
      for (let i = 0; i < segments; i++) {
        const s0 = head - (tail * i) / segments;
        const s1 = head - (tail * (i + 1)) / segments;
        if (s0 <= 0) break;
        if (P.gap[indexAt(P, s0)]) continue;
        const [x0, y0] = at(P, s0);
        const [x1, y1] = at(P, Math.max(0, s1));
        const f = 1 - i / segments;
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const half = (3 * f * d) / 2;
        const tx = (x1 - x0) / 2;
        const ty = (y1 - y0) / 2;
        const nx = (-(y1 - y0) / len) * half;
        const ny = ((x1 - x0) / len) * half;
        // u runs across the line (soft edges), v along it
        quad(
          (x0 + x1) / 2,
          (y0 + y1) / 2,
          nx,
          ny,
          tx,
          ty,
          i < 3 ? HOT : WARM,
          0.85 * f * f * fadeIn,
          0,
        );
      }
      if (P.gap[indexAt(P, head)]) return;
      const [hx, hy] = at(P, head);
      // sheen on the wood around the head, elongated along the trunk
      quad(
        hx,
        hy,
        60 * d * 0.34,
        0,
        0,
        60 * d,
        [1, 190 / 255, 120 / 255],
        0.3 * fadeIn,
        2,
      );
      quad(
        hx,
        hy,
        1.5 * d * 1.6,
        0,
        0,
        1.5 * d * 1.6,
        [1, 0xf1 / 255, 0xdc / 255],
        0.95 * fadeIn,
        1,
      );
    });
    return n;
  }

  /* ---------------------------------------------------------------- photo-attached DOM */
  const toScreen = (cam: Cam, x: number, y: number) =>
    [(x - cam.cx) / cam.d + vw / 2, (y - cam.cy) / cam.d + vh / 2] as const;
  function focusPoint(): [number, number] {
    let w = 0;
    let x = 0;
    let y = 0;
    pairVis.forEach((v, i) => {
      const [sx, sy] = toScreen(
        S.cam,
        G.knuckles[i]!.center[0],
        G.knuckles[i]!.center[1],
      );
      w += v;
      x += v * sx;
      y += v * sy;
    });
    if (w < 0.01) {
      const k = G.knuckles[Math.max(0, S.pair - 1)]!.center;
      return [...toScreen(S.cam, k[0], k[1])] as [number, number];
    }
    return [x / w, y / w];
  }
  interface Column {
    el: HTMLElement;
    x: number;
    y: number;
    w?: number;
    line?: boolean;
    width: number;
  }
  const COLS: Column[] = [];
  function placeIndexColumns() {
    COLS.length = 0;
    const hy = G.mobileIndex.hairlineY;
    themes.forEach((theme, gi) => {
      const g = G.mobileIndex.groups[gi]!;
      const title = q("h3", theme);
      COLS.push({ el: title, x: g.title, y: hy + 14, width: title.offsetWidth || 20 });
      qa("li[data-service]", theme).forEach((li) =>
        COLS.push({
          el: li,
          x: g.services[li.dataset.service!]!,
          y: hy + 10,
          width: li.offsetWidth || 20,
        }),
      );
      const [a, b] = groupSpan(gi);
      const line = q("[data-hairline]", theme);
      // One fixed width; the camera's zoom becomes a scale (no layout per frame).
      line.style.width = `${b - a}px`;
      COLS.push({ el: line, x: a, y: hy, w: b - a, line: true, width: b - a });
    });
  }
  const written = new WeakMap<Element, Record<string, string>>();
  /** Write a style property only when its value changed. */
  const style = (el: HTMLElement | SVGElement, key: string, value: string) => {
    let cache = written.get(el);
    if (!cache) written.set(el, (cache = {}));
    if (cache[key] === value) return;
    cache[key] = value;
    el.style.setProperty(key, value);
  };
  const attr = (el: Element, key: string, value: string) => {
    if (el.getAttribute(key) !== value) el.setAttribute(key, value);
  };
  const px = (v: number) => v.toFixed(1);

  /** `at`: the damped position the state was built for; `y`: the scroll position read this frame. */
  const labelShown = [1, 1, 1, 1];
  function labelFits(i: number, lx: number, sy: number, stageTop: number) {
    const top = sy + 18;
    const bottom = top + (GEO.labelH[i] ?? 30);
    if (top < GEO.header + 4) return false;
    const h2Top = stageTop + GEO.h2.top;
    const h2Bottom = stageTop + GEO.h2.bottom;
    const overlapsY = bottom + 8 > h2Top && top - 8 < h2Bottom;
    const overlapsX = lx - 55 < GEO.h2.right + 8;
    return !(overlapsY && overlapsX);
  }
  function updateDom(s: State, at: number, y: number) {
    const cam = s.cam;
    if (s.indexOn > 0.001) {
      for (const c of COLS) {
        const [sx, sy] = toScreen(cam, c.x, c.y);
        if (c.line) {
          style(
            c.el,
            "transform",
            `translate3d(${px(sx)}px,${px(sy)}px,0) scaleX(${(1 / cam.d).toFixed(4)})`,
          );
        } else {
          style(
            c.el,
            "transform",
            `translate3d(${px(sx - c.width / 2)}px,${px(sy)}px,0)`,
          );
          // Never show a column cut by the screen edge: fade it over the last 22 px.
          const edge = Math.min(sx - c.width / 2 - 6, vw - 6 - (sx + c.width / 2));
          style(c.el, "opacity", clamp(edge / 22, 0, 1).toFixed(3));
        }
      }
    }
    style(themesEl, "opacity", s.indexOn.toFixed(3));
    style(indexHead, "opacity", s.headOn.toFixed(3));
    const station = s.station + 1;
    themes.forEach((el, i) => attr(el, "data-current", i + 1 === station ? "1" : "0"));
    // Ticks: the station being read; after the pull-back, each knuckle that
    // has received its light.
    const descending = at >= M.pullStart;
    ticks.forEach((el, i) => {
      const on = descending
        ? ramp(s.comets, 0.7 + i * 0.04, 0.9 + i * 0.025) > 0.5 || s.ringsAll > 0.5
        : i + 1 === station;
      attr(el, "data-current", on ? "1" : "0");
    });
    // The sticky fork stage's top on screen (native scroll, like the list).
    const stageTop =
      y < M.b0 ? M.b0 - y : y <= M.b0 + M.forkPin ? 0 : M.b0 + M.forkPin - y;
    // Knuckle rings and their labels.
    G.knuckles.forEach((knuckle, i) => {
      const [sx, sy] = toScreen(cam, knuckle.center[0], knuckle.center[1]);
      const ring = rings[i]!;
      style(ring, "transform", `translate3d(${px(sx)}px,${px(sy)}px,0)`);
      const arrive = ramp(s.comets, 0.7 + i * 0.04, 0.9 + i * 0.025);
      const vis = pairVis[i] ?? 0;
      const lit = Math.max(arrive * s.rings, vis);
      style(
        ring,
        "opacity",
        (Math.max(arrive, s.ringsAll) * s.rings * 0.95).toFixed(3),
      );
      attr(ring, "data-lit", lit > 0.5 ? "1" : "0");
      const lx = clamp(sx, 64, vw - 64);
      const label = ringLabels[i]!;
      style(label, "transform", `translate3d(${px(lx)}px,${px(sy + 18)}px,0)`);
      // On short screens the label would sit on the fork heading or under the
      // header: then the ring and the thread carry the mapping alone.
      labelShown[i] = labelFits(i, lx, sy, stageTop) ? 1 : 0;
      style(label, "opacity", (vis * labelShown[i]!).toFixed(3));
    });
    // Forks: a fine thread grows from the pair being read to its knuckle.
    forks.forEach((f, i) => attr(f, "data-active", s.pair === i + 1 ? "1" : "0"));
    stems.forEach((path, i) => {
      const on = pairVis[i] ?? 0;
      if (on <= 0.01) {
        style(path, "opacity", "0");
        return;
      }
      const row = GEO.forkRows[i]!;
      const y0 = stageTop + row.top;
      // Out to the right of the reading column, up along the trunk's edge, then
      // into the bottom of the knuckle's label — never across any text.
      const [sx, sy] = toScreen(
        cam,
        G.knuckles[i]!.center[0],
        G.knuckles[i]!.center[1],
      );
      const lx = labelShown[i] ? clamp(sx, 64, vw - 64) : sx;
      const ly = labelShown[i] ? sy + 18 + (GEO.labelH[i] ?? 30) + 6 : sy + 13;
      const x0 = row.right + 8;
      const rail = Math.max(x0 + 14, 270);
      const d =
        `M${px(x0)} ${px(y0)} C${px(rail - 4)} ${px(y0)} ${px(rail)} ${px(y0 - 6)} ${px(rail)} ${px(y0 - 28)}` +
        ` L${px(rail)} ${px(ly + 44)} C${px(rail)} ${px(ly + 16)} ${px(lx)} ${px(ly + 22)} ${px(lx)} ${px(ly)}`;
      if (path.getAttribute("d") !== d) path.setAttribute("d", d);
      const grow = s.pair === i + 1 ? s.pairGrow : 1;
      style(path, "stroke-dashoffset", (1 - clamp(grow, 0, 1)).toFixed(3));
      style(path, "opacity", on.toFixed(3));
    });
    // Process
    style(railFill, "transform", `scaleY(${s.rail.toFixed(4)})`);
    steps.forEach((el, i) =>
      attr(
        el,
        "data-state",
        i + 1 < s.step ? "reached" : i + 1 === s.step ? "current" : "pending",
      ),
    );
  }

  /* ---------------------------------------------------------------- loop */
  let dirty = true;
  let ready = false;
  let lastY = -1;
  let shownY = -1;
  let lastTime = 0;
  let animating = false;
  function render(y: number) {
    stateAt(y, S);
    draw(S);
    updateDom(S, y, window.scrollY);
  }
  function followPairs(dt: number) {
    const k = reduced ? 1 : 1 - Math.exp(-dt / TAU_STATE);
    let moving = false;
    for (let i = 0; i < 3; i++) {
      const target = S.pair === i + 1 ? S.into : 0;
      const v = pairVis[i]!;
      const next = Math.abs(target - v) < 0.003 ? target : v + (target - v) * k;
      if (next !== v) moving = true;
      pairVis[i] = next;
    }
    return moving;
  }
  function frame(now: number) {
    frameId = 0;
    if (disposed) return;
    const dt = lastTime ? Math.min(64, now - lastTime) : 16;
    lastTime = now;
    const y = window.scrollY;
    // Damped camera position: follows the scroll, frame-rate independent.
    if (reduced || shownY < 0 || Math.abs(y - shownY) > vh * 1.5) shownY = y;
    else {
      shownY += (y - shownY) * (1 - Math.exp(-dt / TAU_SCROLL));
      if (Math.abs(y - shownY) < 0.5) shownY = y;
    }
    const uploaded = R.pump();
    let changed = dirty || uploaded || shownY !== lastY || animating;
    if (ready) {
      // Re-plan the tiles every 40 px of camera travel, and once more where
      // the camera comes to rest (its window there leads the list).
      if (Math.abs(shownY - residencyY) > 40 || (shownY === y && residencyY !== y))
        residency(shownY);
      stateAt(shownY, S);
      const pairsMoving = followPairs(dt);
      changed ||= pairsMoving;
      // Skip frames whose picture would not differ (the damped camera's
      // sub-pixel tail, or a scroll inside a held shot).
      const sig = signature(S, y);
      if (changed && (dirty || uploaded || sig !== lastSig || R.fading())) {
        lastSig = sig;
        draw(S);
        updateDom(S, shownY, y);
      }
      lastY = shownY;
      dirty = false;
      animating = pairsMoving || R.fading() || dawnRunning;
    }
    if (changed || animating || shownY !== y || R.stats().queued > 0) schedule();
  }
  let lastSig = "";
  /** What the frame shows, quantised below what the eye can see. */
  function signature(s: State, y: number) {
    const q = (v: number, k: number) => Math.round(v * k);
    const c = s.cam;
    return [
      q(c.cx / c.d, 4),
      q(c.cy / c.d, 4),
      q(Math.log(c.d), 4000),
      q(s.focus, 500),
      q(s.band, 500),
      q(s.indexOn, 500),
      q(s.headOn, 500),
      q(s.comets, 2000),
      q(s.rings, 500),
      q(s.ringsAll, 500),
      s.pair,
      q(s.pairGrow, 500),
      ...pairVis.map((v) => q(v, 500)),
      q(s.softFork, 500),
      q(s.softAud, 500),
      q(s.softEnd, 500),
      q(s.rail, 1000),
      s.step,
      q(s.oldBand, 1000),
      q(s.oldOn, 500),
      q(s.young, 500),
      q(dawn, 500),
      q(reveal, 500),
      s.station,
      // the fork thread starts at the sticky list, which moves with the
      // native scroll around the pin
      s.pair ? q(y, 2) : 0,
    ].join(",");
  }
  function schedule() {
    if (!frameId && !disposed) frameId = requestAnimationFrame(frame);
  }
  let dawnRunning = false;
  /** 0 → 1 as the first frame emerges from the ink (700 ms, EASE_REVEAL-like). */
  let reveal = reduced ? 1 : 0;
  function startDawn() {
    if (reduced) {
      dawn = 0;
      dirty = true;
      schedule();
      return;
    }
    // The dawn plays at the hero only; mid-page the photograph just emerges.
    const withDawn = window.scrollY <= vh * 0.5;
    if (!withDawn) dawn = 0;
    dawnRunning = true;
    const t0 = performance.now();
    const duration = withDawn ? 1800 : 450;
    const step = (now: number) => {
      if (disposed) return;
      const t = clamp((now - t0 - 250) / duration, 0, 1);
      if (withDawn) dawn = 1 - smooth(t);
      reveal = 1 - Math.pow(1 - clamp((now - t0) / 700, 0, 1), 3);
      dirty = true;
      schedule();
      if (t < 1) requestAnimationFrame(step);
      else dawnRunning = false;
    };
    requestAnimationFrame(step);
  }

  let width = 0;
  let height = 0;
  const relayout = () => {
    width = document.documentElement.clientWidth;
    height = window.innerHeight;
    layout();
    residency(window.scrollY);
    schedule();
  };
  // A phone's toolbar changes the height while scrolling: nothing depends on
  // it (the canvas and the camera use the large viewport), so ignore it.
  const onResize = () => {
    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    if (w !== width || Math.abs(h - height) > 160) relayout();
  };
  const onScroll = () => schedule();
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  const fonts = document.fonts;
  fonts?.addEventListener?.("loadingdone", relayout);
  R.onChange(schedule);

  // The index switches from its no-JS list to the photo layout before the
  // first measurement.
  root.dataset.ready = "1";
  relayout();
  stateAt(window.scrollY, S);
  const firstKeys = currentKeys(S);
  const t0 = performance.now();
  const waitFirst = () => {
    if (disposed) return;
    R.pump();
    if (R.has(firstKeys) || performance.now() - t0 > 4000) {
      R.settle();
      ready = true;
      dirty = true;
      root.dataset.motion = "ready";
      startDawn();
      schedule();
      return;
    }
    requestAnimationFrame(waitFirst);
  };
  requestAnimationFrame(waitFirst);

  (window as unknown as { __mo?: unknown }).__mo = {
    marks: M,
    state: S,
    render: (y: number, dawnValue?: number) => {
      if (dawnValue !== undefined) dawn = dawnValue;
      shownY = y;
      render(y);
    },
    /** True when the camera has settled and every tile it shows is drawn. */
    idle: () =>
      ready &&
      !frameId &&
      Math.abs(window.scrollY - shownY) < 0.5 &&
      R.has(currentKeys(S)) &&
      R.stats().loading === 0,
    stats: () => ({
      ...R.stats(),
      running: Boolean(frameId),
      missing: currentKeys(S).filter((key) => !R.has([key])),
      lag: window.scrollY - shownY,
    }),
  };

  return () => {
    disposed = true;
    delete (window as unknown as { __mo?: unknown }).__mo;
    if (frameId) cancelAnimationFrame(frameId);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    fonts?.removeEventListener?.("loadingdone", relayout);
    delete root.dataset.ready;
    delete root.dataset.motion;
    index.style.removeProperty("height");
    boundaries.style.removeProperty("--bnd-pin");
    for (const el of [themesEl, indexHead, railFill]) {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    }
    for (const c of COLS) {
      c.el.style.removeProperty("transform");
      c.el.style.removeProperty("opacity");
      c.el.style.removeProperty("width");
    }
    R.dispose();
  };
}
