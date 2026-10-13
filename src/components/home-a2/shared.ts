/**
 * Pieces both regimes of HOME share: the film, the signature, the breathing
 * mask of the panorama, the lake's zoom schedule, lazy renderer loading and
 * residency. Ported from the adopted prototypes (A2.js / A2m.js).
 */
import { homeGeometry as G } from "@/content/adelva-home-geometry";

import { CAPTURE, clamp, lerp, smooth, type Engine } from "./engine";
import type { Renderer } from "./gl";
import { signatureGaps, signatureSpeed, signatureWidth } from "./signature";

export const q = <T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
) => root.querySelector<T>(selector)!;
export const qa = <T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
) => [...root.querySelectorAll<T>(selector)];

export interface Setter {
  (el: HTMLElement | SVGElement, prop: string, value: string): void;
  /** Remove every inline property this setter wrote (a regime change starts clean). */
  clear(): void;
  /** Forget one cached value (the property was written by other code). */
  forget(el: HTMLElement | SVGElement, prop: string): void;
}

/** Write a style property only when it changes (cheap per-frame writes). */
export function setter(): Setter {
  const cache = new Map<HTMLElement | SVGElement, Map<string, string>>();
  const write = (el: HTMLElement | SVGElement, prop: string, value: string) => {
    let map = cache.get(el);
    if (!map) cache.set(el, (map = new Map()));
    if (map.get(prop) === value) return;
    map.set(prop, value);
    if (prop.startsWith("--")) el.style.setProperty(prop, value);
    else (el.style as unknown as Record<string, string>)[prop] = value;
  };
  return Object.assign(write, {
    clear() {
      cache.forEach((props, el) =>
        props.forEach((_, prop) => {
          if (prop.startsWith("--")) el.style.removeProperty(prop);
          else (el.style as unknown as Record<string, string>)[prop] = "";
        }),
      );
      cache.clear();
    },
    forget(el: HTMLElement | SVGElement, prop: string) {
      cache.get(el)?.delete(prop);
    },
  });
}

export function attr(el: Element, name: string, on: boolean) {
  if (on !== el.hasAttribute(name)) el.toggleAttribute(name, on);
}

// ————————————————————————————————————————————————————————————— the film
export interface Film {
  /**
   * Draw the current video frame into the two halves (only while they part).
   * Draws only when the film shows a new frame; returns whether the film is
   * playing (the caller keeps its loop running for the next frame).
   */
  draw(dprCap: number): boolean;
  /** Play while the film can be seen and the reader has not paused it. */
  visible(on: boolean): void;
  /** Cache the halves' canvas sizes (call on start and resize, outside the frame). */
  measure(): void;
  dispose(): void;
}

export function createFilm(root: HTMLElement): Film {
  const video = q<HTMLVideoElement>(root, "video[data-film-video]");
  const poster = q<HTMLImageElement>(root, "[data-film-whole] img");
  const toggle = q<HTMLButtonElement>(root, "[data-film-toggle]");
  const canvases = qa<HTMLCanvasElement>(root, "[data-half] canvas");
  let paused = false;
  let shown = true;
  let sizes: (readonly [number, number])[] | null = null;
  // the frame the halves last drew: the source and its media time
  let drawn: { src: unknown; time: number; w: number } | null = null;
  const sync = () => {
    if (shown && !paused && !document.hidden) void video.play().catch(() => {});
    else video.pause();
  };
  const onToggle = () => {
    paused = !paused;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute("aria-label", paused ? "背景映像を再生" : "背景映像を一時停止");
    sync();
  };
  toggle.addEventListener("click", onToggle);
  document.addEventListener("visibilitychange", sync);
  sync();
  const measure = () => {
    sizes = canvases.map((cv) => [cv.clientWidth, cv.clientHeight] as const);
    drawn = null;
  };
  return {
    draw(dprCap) {
      // the production poster stands in until the film can play (headless WebKit cannot play H.264)
      const src: HTMLVideoElement | HTMLImageElement =
        video.readyState >= 2 ? video : poster;
      const playing = src === video && !video.paused;
      const time = src === video ? video.currentTime : -1;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      // a new picture: another source, a new frame of the film (24 fps), or a new size
      if (
        drawn &&
        drawn.src === src &&
        drawn.w === dpr &&
        Math.abs(time - drawn.time) < 1 / 30
      )
        return playing;
      const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
      const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
      if (!sw) return playing;
      if (!sizes) measure();
      canvases.forEach((cv, i) => {
        const [cw, ch] = sizes![i]!;
        const w = Math.round(cw * dpr);
        const h = Math.round(ch * dpr);
        if (!w || !h) return;
        if (cv.width !== w || cv.height !== h) {
          cv.width = w;
          cv.height = h;
        }
        const k = Math.max(w / sw, h / sh);
        cv.getContext("2d")!.drawImage(
          src,
          (w - sw * k) / 2,
          (h - sh * k) / 2,
          sw * k,
          sh * k,
        );
      });
      drawn = { src, time, w: dpr };
      return playing;
    },
    visible(on) {
      if (on === shown) return;
      shown = on;
      sync();
    },
    measure,
    dispose() {
      toggle.removeEventListener("click", onToggle);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    },
  };
}

// ————————————————————————————————————————————————————————————— the signature
export function createSignature(root: HTMLElement) {
  const svg = q<SVGSVGElement>(root, "[data-signature]");
  const nib = q(root, "[data-nib]");
  const paths = qa<SVGPathElement>(svg, "path");
  const lengths = paths.map((p) => p.getTotalLength());
  // the pen's path sampled once (every 2 units): SVG geometry calls inside the frame force a layout
  const samples = paths.map((p, i) => {
    const n = Math.max(2, Math.ceil(lengths[i]! / 2));
    return Array.from({ length: n + 1 }, (_, k) => {
      const pt = p.getPointAtLength((lengths[i]! * k) / n);
      return [pt.x, pt.y] as const;
    });
  });
  const pointAt = (i: number, len: number) => {
    const pts = samples[i]!;
    const f = clamp(len / lengths[i]!) * (pts.length - 1);
    const k = Math.min(pts.length - 2, Math.floor(f));
    const u = f - k;
    const [x0, y0] = pts[k]!;
    const [x1, y1] = pts[k + 1]!;
    return { x: lerp(x0, x1, u), y: lerp(y0, y1, u) };
  };
  const offsets = paths.map((p) => {
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(
      p.getAttribute("transform") ?? "",
    );
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
  });
  const total =
    lengths.reduce((a, b) => a + b, 0) / signatureSpeed +
    signatureGaps.reduce((a, b) => a + b, 0);
  paths.forEach((p, i) => {
    p.style.strokeDasharray = `${lengths[i]} ${lengths[i]}`;
    p.style.strokeDashoffset = String(lengths[i]);
  });
  let last = -1;
  // the signature's box in its host's coordinates (both sit in the sticky stage)
  let box: { x: number; y: number; k: number } | null = null;
  const measure = () => {
    const b = svg.getBoundingClientRect();
    const host = svg.parentElement!.getBoundingClientRect();
    box = { x: b.left - host.left, y: b.top - host.top, k: b.width / signatureWidth };
    last = -1;
  };
  return {
    /** Cache the signature's box (call on start and resize, outside the frame). */
    measure,
    /** Write the signature up to fraction f; `hideNibAtEnd` (phone) lifts the pen once written. */
    draw(f: number, hideNibAtEnd: boolean) {
      if (f === last) return;
      last = f;
      let budget = f * total;
      let pen: { i: number; len: number } | null = null;
      paths.forEach((p, i) => {
        budget -= signatureGaps[i]!;
        const need = lengths[i]! / signatureSpeed;
        const k = clamp(budget / need);
        p.style.strokeDashoffset = String(lengths[i]! * (1 - k));
        if (k > 0 && k < 1) pen = { i, len: lengths[i]! * k };
        budget -= need;
      });
      const at = pen as { i: number; len: number } | null;
      if (at && !(hideNibAtEnd && f >= 0.995)) {
        const pt = pointAt(at.i, at.len);
        const [ox, oy] = offsets[at.i]!;
        if (!box) measure();
        const { x, y, k } = box!;
        nib.style.transform = `translate(${x + (pt.x + ox!) * k}px, ${y + (pt.y + oy!) * k}px)`;
        nib.style.opacity = "1";
      } else nib.style.opacity = "0";
    },
    reset() {
      paths.forEach((p) => {
        p.style.strokeDasharray = "";
        p.style.strokeDashoffset = "";
      });
      nib.style.opacity = "";
      nib.style.transform = "";
    },
  };
}

// ———————————————————————————————————————————————— the panorama's breathing regions
/** R steam, G water, B noren — painted from the geometry at quarter size. */
export function panoMask(): HTMLCanvasElement {
  const [W, H] = G.pano.size;
  const cv = document.createElement("canvas");
  cv.width = W / 4;
  cv.height = H / 4;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#000";
  c.fillRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = "lighter";
  c.filter = "blur(6px)";
  for (const m of G.pano.mask) {
    const col = m.ch === "r" ? "255,0,0" : m.ch === "g" ? "0,255,0" : "0,0,255";
    if ("grad" in m && m.grad) {
      const g = c.createLinearGradient(0, m.grad[0] / 4, 0, m.grad[1] / 4);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(1, `rgba(${col},1)`);
      c.fillStyle = g;
    } else c.fillStyle = `rgb(${col})`;
    c.beginPath();
    if ("ellipse" in m) {
      const [x, y, rx, ry] = m.ellipse;
      c.ellipse(x / 4, y / 4, rx / 4, ry / 4, 0, 0, Math.PI * 2);
    } else {
      m.poly.forEach(([x, y], i) =>
        i ? c.lineTo(x / 4, y / 4) : c.moveTo(x / 4, y / 4),
      );
      c.closePath();
    }
    c.fill();
  }
  return cv;
}

// ———————————————————————————————————————————————————————————— the lake
export const STEP_TIMING = {
  A_PAPER: [0.035, 0.09] as const,
  A_GLUE: [0.085, 0.11] as const,
  A_FALL: 0.11,
  FALL_LEN: 0.075,
  FALL_STAG: 0.012,
  A_ROUTE: [0.17, 0.235] as const,
  TRAVEL0: 0.235,
  PER: 0.105,
  END: 0.235 + 6 * 0.105,
};

/** Front zoom per step (log-linear): 4.6× in all, with mist-bank plate changes between 2|3 and 4|5. */
export function zoomAt(q: number): number {
  const keys = [
    [0, 1],
    [1, 1.25],
    [2, 1.7],
    [2.5, 2.15],
    [3, 2.75],
    [4, 3.4],
    [4.5, 4.0],
    [5, 4.35],
    [5.5, 4.5],
    [6, 4.6],
  ] as const;
  for (let i = 1; i < keys.length; i++) {
    if (q <= keys[i]![0]) {
      const u = (q - keys[i - 1]![0]) / (keys[i]![0] - keys[i - 1]![0]);
      return Math.exp(lerp(Math.log(keys[i - 1]![1]), Math.log(keys[i]![1]), u));
    }
  }
  return keys[keys.length - 1]![1];
}

/** Which front plate shows at zoom z, the mix towards the next, and the mist bank hiding the change. */
export function plateMix(z: number): [number, number, number] {
  const banks = [
    [2.4, 2.75],
    [4.2, 4.45],
  ] as const;
  for (let k = 0; k < banks.length; k++) {
    const [a, b] = banks[k]!;
    if (z < a) return [k, 0, 0];
    if (z < b) {
      const u = (z - a) / (b - a);
      return [k, smooth(0.3, 0.7, u), Math.sin(Math.PI * u)];
    }
  }
  return [2, 0, 0];
}

// ———————————————————————————————————————————————————————————— lazy work
/**
 * Run `fn` once, when `when()` turns true or (with an `idleDelay`) when the
 * browser is idle after load. `idleDelay: null` waits for `when()` only.
 */
export function whenNeeded(
  fn: () => void,
  when: () => boolean,
  idleDelay: number | null,
) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    fn();
  };
  const timer =
    idleDelay === null
      ? 0
      : window.setTimeout(() => {
          if ("requestIdleCallback" in window)
            window.requestIdleCallback(go, { timeout: 2000 });
          else go();
        }, idleDelay);
  return {
    check() {
      if (!done && when()) go();
    },
    cancel() {
      done = true;
      window.clearTimeout(timer);
    },
  };
}

/**
 * Residency of a photograph renderer (R5): its textures stay on the GPU only
 * while the reader is within `[from, to]` (document px, with a hysteresis of
 * one screen); elsewhere they are released and restored on the way back.
 * Verification (`?capture`) keeps everything resident.
 */
export function residency(
  engine: Engine,
  renderer: () => Renderer<unknown> | null,
  range: () => readonly [number, number],
) {
  return (vh: number) => {
    const r = renderer();
    if (!r || CAPTURE) return;
    const [from, to] = range();
    const y = engine.y;
    if (r.live && (y < from - vh || y > to + vh)) r.release();
    else if (!r.live && y >= from && y <= to)
      void r.restore().then(() => engine.invalidate());
  };
}

/** Ambient drawing at a film's cadence once the scroll has settled. */
export function ambient(fps = 24) {
  let last = -Infinity;
  return (t: number, moved: boolean) => {
    if (!moved && t - last < 1 / fps - 0.002) return false;
    last = t;
    return true;
  };
}
