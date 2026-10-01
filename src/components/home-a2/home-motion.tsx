"use client";

import { useEffect } from "react";

import {
  resetHeaderOverride,
  setHeaderOverride,
  type HeaderSurface,
} from "@/lib/header-state";

import { startDesktop, type Controller } from "./desktop";
import { startMobile } from "./mobile";

/** The moving page runs only where the module CSS lays the scenes out for it. */
const MOTION = "(scripting: enabled) and (prefers-reduced-motion: no-preference)";
const DESKTOP = "(min-width: 1024px)";

declare global {
  interface Window {
    /** Verification hook: draw HOME at a scroll position and clock (see tests/e2e/home.spec.ts). */
    __home?: {
      frame(y: number, t?: number): void;
      ready: Promise<void>;
      regime: "desktop" | "mobile";
      renderers?: () => { pano: unknown; lake: unknown };
    };
  }
}

/**
 * Client root of HOME. The page reads completely without it; this picks the
 * choreography for the viewport and the motion preference and restarts it
 * when either changes:
 *
 *   ≥ 1024 px   the desktop prototype (A2.js)
 *   < 1024 px   the phone prototype (A2m.js), extended to tablets
 *   reduced     the still document; only the header follows the page
 */
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-home-root]");
    if (!root) return;
    const motion = window.matchMedia(MOTION);
    const desktop = window.matchMedia(DESKTOP);
    let controller: Controller | null = null;
    let stopStill: (() => void) | null = null;

    const run = () => {
      controller?.stop();
      controller = null;
      stopStill?.();
      stopStill = null;
      delete window.__home;
      if (!motion.matches) {
        root.dataset.motion = "still";
        stopStill = followStill(root);
        return;
      }
      const regime = desktop.matches ? "desktop" : "mobile";
      root.dataset.motion = regime;
      controller = regime === "desktop" ? startDesktop(root) : startMobile(root);
      const c = controller;
      window.__home = {
        frame: (y, t) => c.engine.frame(y, t),
        ready: c.ready,
        regime,
        renderers: c.renderers,
      };
    };

    run();
    motion.addEventListener("change", run);
    desktop.addEventListener("change", run);
    return () => {
      motion.removeEventListener("change", run);
      desktop.removeEventListener("change", run);
      controller?.stop();
      stopStill?.();
      delete window.__home;
      delete root.dataset.motion;
      resetHeaderOverride();
    };
  }, []);
  return null;
}

/** The still document: the header shows the brand and takes the surface of what lies under it. */
function followStill(root: HTMLElement): () => void {
  setHeaderOverride({ brand: "shown", intro: false });
  const zones: [Element | null, HeaderSurface][] = [
    [root.querySelector("[data-film]"), "film"],
    [root.querySelector('[data-scene="challenges"]'), "glass"],
    [document.querySelector("[data-site-footer]"), "glass"],
  ];
  let frame = 0;
  const update = () => {
    frame = 0;
    const probe = 36;
    for (const [el, surface] of zones) {
      const r = el?.getBoundingClientRect();
      if (r && r.top <= probe && r.bottom > probe) {
        setHeaderOverride({ surface });
        return;
      }
    }
    setHeaderOverride({ surface: "paper" });
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}
