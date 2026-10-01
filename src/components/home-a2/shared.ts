/**
 * Pieces both regimes of HOME share: the film, the signature, the breathing
 * mask of the panorama, the lake's zoom schedule, lazy renderer loading and
 * the header's surface. Ported from the adopted prototypes (A2.js / A2m.js).
 */
import { homeGeometry as G } from "@/content/adelva-home-geometry";
import { setHeaderOverride, type HeaderSurface } from "@/lib/header-state";

import { clamp, lerp, smooth } from "./engine";
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
  });
}

export function attr(el: Element, name: string, on: boolean) {
  if (on !== el.hasAttribute(name)) el.toggleAttribute(name, on);
}

// ————————————————————————————————————————————————————————————— the film
export interface Film {
  /** Draw the current video frame into the two halves (only while they part). */
  draw(dprCap: number): void;
  /** Play while the film can be seen and the reader has not paused it. */
  visible(on: boolean): void;
  dispose(): void;
}

export function createFilm(root: HTMLElement): Film {
  const video = q<HTMLVideoElement>(root, "video[data-film-video]");
  const poster = q<HTMLImageElement>(root, "[data-film-whole] img");
  const toggle = q<HTMLButtonElement>(root, "[data-film-toggle]");
  const canvases = qa<HTMLCanvasElement>(root, "[data-half] canvas");
  let paused = false;
  let shown = true;
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
  return {
    draw(dprCap) {
      // the production poster stands in until the film can play (headless WebKit cannot play H.264)
      const src: HTMLVideoElement | HTMLImageElement =
        video.readyState >= 2 ? video : poster;
      const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth;
      const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight;
      if (!sw) return;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      for (const cv of canvases) {
        const w = Math.round(cv.clientWidth * dpr);
        const h = Math.round(cv.clientHeight * dpr);
        if (!w || !h) continue;
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
      }
    },
    visible(on) {
      if (on === shown) return;
      shown = on;
      sync();
    },
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
  return {
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
        const pt = paths[at.i]!.getPointAtLength(at.len);
        const [ox, oy] = offsets[at.i]!;
        const box = svg.getBoundingClientRect();
        const host = svg.parentElement!.getBoundingClientRect();
        const k = box.width / signatureWidth;
        nib.style.transform = `translate(${box.left - host.left + (pt.x + ox!) * k}px, ${box.top - host.top + (pt.y + oy!) * k}px)`;
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
/** Run `fn` once, when the browser is idle after load or when `when()` turns true. */
export function whenNeeded(fn: () => void, when: () => boolean, idleDelay: number) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    fn();
  };
  const timer = window.setTimeout(() => {
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

// ———————————————————————————————————————————————————————————— the header
export interface SurfaceRule {
  readonly el: HTMLElement;
  readonly kind: (p: number) => HeaderSurface;
}

/** The scene under the header's middle decides its surface (the footer: glass). */
export function headerSurface(
  rules: readonly SurfaceRule[],
  probe: number,
  stageHeight: number,
) {
  for (const s of rules) {
    const r = s.el.getBoundingClientRect();
    if (r.top <= probe && r.bottom > probe) {
      const p = clamp(-r.top / Math.max(1, s.el.offsetHeight - stageHeight));
      setHeaderOverride({ surface: s.kind(p) });
      return;
    }
  }
  setHeaderOverride({ surface: "glass" });
}
