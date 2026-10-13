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
 *   moved  whether the (damped) scroll position or the viewport changed since
 *          the previous frame; a scene with nothing to redraw returns early
 * Document offsets are measured on start and resize, never per frame.
 *
 * Production additions (2026-10-13 polish, spec R2/R3):
 * - The scenes follow a damped scroll position: a frame-rate independent
 *   exponential follow of `window.scrollY` (time constant `damp`), so the
 *   irregular scroll sampling of phones never shows as steps. Desktop keeps
 *   `damp = 0` (Lenis already eases the wheel there).
 * - The loop sleeps once the position has settled and no scene asked for
 *   another frame (a scene's `update` returns `true` while something it draws
 *   still moves on its own clock); scrolling, resizing or `invalidate()`
 *   wakes it.
 * - The header's surface is derived from the cached scene offsets, so no
 *   layout is read inside the loop.
 */
import gsap from "gsap";

import { setHeaderOverride, type HeaderSurface } from "@/lib/header-state";

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

/** A masked line rises from below (t 0..1); written only when it changes. */
const risen = new WeakMap<HTMLElement, number>();
export const rise = (el: HTMLElement, t: number, dist = 110) => {
  const v = Math.round((1 - easeOut(t)) * dist * 100) / 100;
  if (risen.get(el) === v) return;
  risen.set(el, v);
  el.style.transform = `translateY(${v}%)`;
};
/** Forget the cached rise of these lines (their inline transform was cleared). */
export const forgetRise = (els: readonly HTMLElement[]) =>
  els.forEach((el) => risen.delete(el));

export interface SceneFrame {
  readonly p: number;
  readonly enter: number;
  readonly leave: number;
  /** Stage height (the sticky stage is one viewport tall). */
  readonly vh: number;
  readonly vw: number;
  readonly t: number;
  readonly visible: boolean;
  /** The damped scroll position or the viewport changed since the last frame. */
  readonly moved: boolean;
}

/** Return `true` to be called again next frame even if nothing scrolls. */
type SceneUpdate = (frame: SceneFrame) => boolean | void;

interface Scene {
  readonly el: HTMLElement;
  readonly update: SceneUpdate;
  readonly surface?: (p: number) => HeaderSurface;
  top: number;
  h: number;
}

export interface Engine {
  register(
    el: HTMLElement,
    update: SceneUpdate,
    surface?: (p: number) => HeaderSurface,
  ): void;
  tick(fn: (t: number, y: number, vh: number, moved: boolean) => void): void;
  measure(): void;
  /** Document offset (top, height) of a registered scene, as last measured. */
  offset(el: HTMLElement): { readonly top: number; readonly h: number };
  /** The scroll position the scenes are drawn at (damped). */
  readonly y: number;
  /** Draw one frame now (optionally at a given scroll position and clock). */
  frame(y?: number, t?: number): void;
  /** Something outside the scroll changed (a renderer became ready): redraw. */
  invalidate(): void;
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

export function createEngine(
  stageHeight: () => number,
  {
    damp = 0,
    surfaceProbe = 30,
  }: {
    /** Time constant (s) of the scroll follow; 0 follows the scroll exactly. */
    damp?: number;
    /** Header surface: the scene under this many px from the top decides it. */
    surfaceProbe?: number;
  } = {},
): Engine {
  const scenes: Scene[] = [];
  const tickers: ((t: number, y: number, vh: number, moved: boolean) => void)[] = [];
  const t0 = performance.now();
  let running = false;
  let awake = false;
  let virtual: number | null = null;
  let vh = stageHeight();
  let vw = document.documentElement.clientWidth;
  let y = window.scrollY;
  let last = { y: Number.NaN, vw: 0, vh: 0 };
  let lastTime = performance.now();
  let forced = true;

  const measure = () => {
    vh = stageHeight();
    vw = document.documentElement.clientWidth;
    const sy = window.scrollY;
    for (const s of scenes) {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + sy;
      s.h = s.el.offsetHeight;
    }
    forced = true;
  };

  const surfaceAt = (yy: number): HeaderSurface => {
    const probe = yy + surfaceProbe;
    for (const s of scenes) {
      if (!s.surface) continue;
      if (s.top <= probe && s.top + s.h > probe) {
        return s.surface(clamp((yy - s.top) / Math.max(1, s.h - vh)));
      }
    }
    // the footer (and anything between scenes) takes the smoked glass
    return "glass";
  };

  /** One frame. Returns whether the loop should keep running. */
  const frame = (yArg?: number, tArg?: number): boolean => {
    if (tArg !== undefined) virtual = tArg;
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    // the one layout-dependent read of the frame, before any write
    const target = yArg ?? window.scrollY;
    if (yArg !== undefined || damp <= 0 || Math.abs(target - y) > vh * 1.5) y = target;
    else {
      y += (target - y) * (1 - Math.exp(-dt / damp));
      if (Math.abs(target - y) < 0.3) y = target;
    }
    const t = virtual ?? (now - t0) / 1000;
    const moved = forced || y !== last.y || vw !== last.vw || vh !== last.vh;
    forced = false;
    last = { y, vw, vh };
    let again = y !== target;
    for (const s of scenes) {
      const p = clamp((y - s.top) / Math.max(1, s.h - vh));
      const enter = clamp((y + vh - s.top) / vh);
      const leave = clamp((y + vh - (s.top + s.h)) / vh);
      // prepared a quarter screen before it arrives; nothing is drawn once it has gone
      const visible = y + vh > s.top - vh * 0.25 && y < s.top + s.h;
      if (s.update({ p, enter, leave, vh, vw, t, visible, moved }) === true)
        again = true;
    }
    for (const fn of tickers) fn(t, y, vh, moved);
    if (moved) setHeaderOverride({ surface: surfaceAt(y) });
    return again;
  };

  const loop = () => {
    if (!frame()) sleep();
  };
  const sleep = () => {
    if (!awake) return;
    awake = false;
    gsap.ticker.remove(loop);
  };
  const wake = () => {
    if (!running || awake || CAPTURE) return;
    awake = true;
    lastTime = performance.now();
    gsap.ticker.add(loop);
  };
  const onScroll = () => wake();

  return {
    register(el, update, surface) {
      scenes.push({ el, update, surface, top: 0, h: 1 });
    },
    tick(fn) {
      tickers.push(fn);
    },
    measure,
    offset(el) {
      const s = scenes.find((x) => x.el === el);
      return { top: s?.top ?? 0, h: s?.h ?? 1 };
    },
    get y() {
      return y;
    },
    frame(yArg, tArg) {
      frame(yArg, tArg);
    },
    invalidate() {
      forced = true;
      wake();
    },
    start() {
      measure();
      y = window.scrollY;
      if (!running) {
        running = true;
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      frame();
      wake();
    },
    stop() {
      running = false;
      window.removeEventListener("scroll", onScroll);
      sleep();
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
