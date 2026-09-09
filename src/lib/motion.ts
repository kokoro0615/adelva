/**
 * Motion constants shared between the CSS token layer and the scripted layer.
 *
 * Every value below is either a measurement taken from the authorised target on
 * 2026-08-30 or a deliberate, documented improvement on it. The measurements
 * live in `.Codex/docs/research/white-desert-motion-study.md`; keep the two in
 * step when either changes.
 */

/** Measured on the target's navigation tab transition. State feedback. */
export const EASE_STATE = [0.5, 1, 0.89, 1] as const;
/** Measured on the target's menu clip wipe. Curtains and sweeps. */
export const EASE_WIPE = [0.76, 0, 0.24, 1] as const;
/** Measured on the target's long-form title reveal. Entrances. */
export const EASE_REVEAL = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  /** Measured 300ms state feedback. */
  state: 0.3,
  /** Measured 400ms backdrop fade. */
  panel: 0.4,
  /** Measured ~460ms menu wipe. */
  wipe: 0.46,
  /** Improvement: dismissals resolve faster than they arrive. */
  wipeOut: 0.26,
  /** Measured 1400ms long-form reveal. */
  hero: 1.4,
  /** Measured 1200ms sectional reveal. */
  reveal: 1.2,
} as const;

/**
 * Scroll-linked ratios measured on the target.
 *
 * `bannerParallax` reproduces the region banner's -0.2x lift, and `veil` the
 * scrim that reaches 0.8 opacity as the banner leaves.
 */
export const SCRUB = {
  bannerParallax: 0.2,
  veilPeak: 0.8,
  /** Measured -80px direction-aware masthead travel. */
  mastheadTravel: 80,
  /** Below this scroll offset the masthead is always shown. */
  mastheadFloor: 120,
} as const;

export const cubicBezier = (
  points: readonly [number, number, number, number],
): string => `cubic-bezier(${points.join(", ")})`;

export const gsapEase = (points: readonly [number, number, number, number]): string =>
  `cubic-bezier(${points.join(",")})`;

/**
 * Single source of truth for "should this browsing session animate".
 *
 * Scripted motion is opt-in: it requires an explicit no-preference match, so a
 * browser that cannot answer the query is treated as reduced.
 */
export function prefersMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}

/**
 * Cooperative scroll lock.
 *
 * The menu locks the document while it is open. Smooth scrolling registers a
 * pause handler here so a single lock stops both the native scroller and the
 * optional desktop smoothing, and so neither owner can leave the other running.
 */
type PauseHandler = (paused: boolean) => void;

interface ScrollPosition {
  readonly x: number;
  readonly y: number;
}

const pauseHandlers = new Set<PauseHandler>();
let lockCount = 0;
/** The exact reading position the currently held lock has to preserve. */
let lockedPosition: ScrollPosition | null = null;

/** Sub-pixel tolerance: a browser may land a fraction off what it was asked for. */
const SCROLL_EPSILON = 0.5;

export function onScrollPause(handler: PauseHandler): () => void {
  pauseHandlers.add(handler);
  if (lockCount > 0) {
    handler(true);
  }
  return () => {
    pauseHandlers.delete(handler);
  };
}

function hasMovedFrom(position: ScrollPosition): boolean {
  return (
    Math.abs(window.scrollX - position.x) >= SCROLL_EPSILON ||
    Math.abs(window.scrollY - position.y) >= SCROLL_EPSILON
  );
}

function restorePosition(position: ScrollPosition): void {
  // `behavior: "instant"` rather than the default, which would inherit the
  // `scroll-behavior: smooth` this document sets under a no-preference
  // preference and animate the correction into view.
  window.scrollTo({ left: position.x, top: position.y, behavior: "instant" });
}

/**
 * Re-pins the document whenever anything moves it while a lock is held.
 *
 * `overflow: hidden` only stops *user* scrolling. An overflow-clipped viewport
 * stays programmatically scrollable, so `window.scrollTo`, `scrollIntoView`, a
 * hash jump, a restored scroll position or any third-party script can still
 * slide the page behind an open modal. Re-pinning restores the recorded
 * position in the same frame the document reports leaving it, which keeps the
 * lock complete without detaching the document from its own layout the way a
 * `position: fixed` body would.
 */
function repinScroll(): void {
  if (lockedPosition && hasMovedFrom(lockedPosition)) {
    restorePosition(lockedPosition);
  }
}

/** Locks the document scroller and returns the matching release function. */
export function lockScroll(): () => void {
  const root = document.documentElement;
  let released = false;

  if (lockCount === 0) {
    lockedPosition = { x: window.scrollX, y: window.scrollY };
    const gutter = window.innerWidth - root.clientWidth;
    root.dataset.scrollLocked = "true";
    if (gutter > 0) {
      root.style.setProperty("--scrollbar-gutter", `${gutter}px`);
    }
    window.addEventListener("scroll", repinScroll, { passive: true });
    for (const handler of pauseHandlers) {
      handler(true);
    }
  }
  lockCount += 1;

  return () => {
    if (released) {
      return;
    }
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount > 0) {
      return;
    }

    const held = lockedPosition;
    lockedPosition = null;
    window.removeEventListener("scroll", repinScroll);
    delete root.dataset.scrollLocked;
    root.style.removeProperty("--scrollbar-gutter");
    // Always issue the held instant coordinate before resuming. Even when this
    // frame still reports the held position, a native smooth-scroll or Lenis
    // target (for example from End) can remain queued and continue as soon as
    // overflow is restored unless the instant scroll explicitly cancels it.
    if (held) {
      restorePosition(held);
    }
    // Resumed last, so smoothing adopts the restored position and not a stale
    // one it may have been stopped at.
    for (const handler of pauseHandlers) {
      handler(false);
    }
  };
}
