/**
 * The scroll + clock engine of the adopted HOME prototype (`engine.js`).
 *
 * Every scene is a `<section data-scene>` whose height is its scroll length;
 * its stage is sticky. `update(frame)` runs once per animation frame:
 *   p      0..1 progress while the scene is pinned (section top at the
 *          viewport top → section bottom at the viewport bottom)
 *   enter  0..1 as the section's top travels from the viewport bottom to top
 *   leave  0..1 as the section's bottom travels from the viewport bottom to top
 *   t      seconds since the engine started (a virtual clock when verifying)
 * Document offsets are measured on start and resize, never per frame.
 */
import gsap from "gsap";

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const expo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lin = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 2.2);

/** A masked line rises from below (t 0..1). */
export const rise = (el: HTMLElement, t: number, dist = 110) => {
  el.style.transform = `translateY(${(1 - easeOut(t)) * dist}%)`;
};

export interface SceneFrame {
  readonly p: number;
  readonly enter: number;
  readonly leave: number;
  /** Stage height (the sticky stage is one viewport tall). */
  readonly vh: number;
  readonly vw: number;
  readonly t: number;
  readonly visible: boolean;
}

interface Scene {
  readonly el: HTMLElement;
  readonly update: (frame: SceneFrame) => void;
  top: number;
  h: number;
}

export interface Engine {
  register(el: HTMLElement, update: (frame: SceneFrame) => void): void;
  tick(fn: (t: number, y: number, vh: number) => void): void;
  measure(): void;
  /** Draw one frame now (optionally at a given scroll position and clock). */
  frame(y?: number, t?: number): void;
  start(): void;
  stop(): void;
}

/**
 * `?capture` (verification only): no animation loop — frames are drawn on
 * demand through `frame(y, t)`, so slow software-rendered browsers can take
 * exact stills, as the prototype's capture mode did.
 */
export const CAPTURE =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("capture");

export function createEngine(stageHeight: () => number): Engine {
  const scenes: Scene[] = [];
  const tickers: ((t: number, y: number, vh: number) => void)[] = [];
  const t0 = performance.now();
  let running = false;
  let virtual: number | null = null;
  let vh = stageHeight();
  let vw = document.documentElement.clientWidth;

  const measure = () => {
    vh = stageHeight();
    vw = document.documentElement.clientWidth;
    for (const s of scenes) {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.h = s.el.offsetHeight;
    }
  };

  const frame = (yArg?: number, tArg?: number) => {
    if (tArg !== undefined) virtual = tArg;
    const y = yArg ?? window.scrollY;
    const t = virtual ?? (performance.now() - t0) / 1000;
    for (const s of scenes) {
      const p = clamp((y - s.top) / Math.max(1, s.h - vh));
      const enter = clamp((y + vh - s.top) / vh);
      const leave = clamp((y + vh - (s.top + s.h)) / vh);
      // prepared a quarter screen before it arrives; nothing is drawn once it has gone
      const visible = y + vh > s.top - vh * 0.25 && y < s.top + s.h;
      s.update({ p, enter, leave, vh, vw, t, visible });
    }
    for (const fn of tickers) fn(t, y, vh);
  };

  const loop = () => frame();

  return {
    register(el, update) {
      scenes.push({ el, update, top: 0, h: 1 });
    },
    tick(fn) {
      tickers.push(fn);
    },
    measure,
    frame,
    start() {
      measure();
      if (!running && !CAPTURE) {
        running = true;
        gsap.ticker.add(loop);
      }
      frame();
    },
    stop() {
      running = false;
      gsap.ticker.remove(loop);
    },
  };
}

/** Wrap every character of an element's text in `span.ch` (line breaks kept). */
export function splitChars(root: HTMLElement, className: string): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent ?? "") {
          const s = document.createElement("span");
          s.className = className;
          s.setAttribute("aria-hidden", "true");
          s.textContent = ch;
          frag.append(s);
          out.push(s);
        }
        child.replaceWith(frag);
      } else if (child.nodeName !== "BR") {
        walk(child);
      }
    }
  };
  walk(root);
  return out;
}
