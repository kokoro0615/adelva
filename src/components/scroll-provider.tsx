"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

import { onScrollPause, prefersMotion } from "@/lib/motion";

/**
 * Optional desktop scroll smoothing.
 *
 * Native scrolling is always complete on its own: this module only adds
 * inertia, and only when every condition below holds.
 *
 *   - `prefers-reduced-motion: no-preference`
 *   - a fine pointer, so touch scrolling is never intercepted
 *   - a viewport at or above the 64rem desktop breakpoint
 *
 * The instance is driven from the single GSAP ticker rather than a second
 * `requestAnimationFrame` loop, and it is destroyed whenever any condition
 * stops holding. The audited target keeps its smoothing running under
 * `reduce`; this does not.
 */
const SMOOTH_QUERY =
  "(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 64rem)";

export function ScrollProvider() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const query = window.matchMedia(SMOOTH_QUERY);
    let teardown: (() => void) | null = null;

    const start = async () => {
      if (teardown) {
        return;
      }
      const { default: Lenis } = await import("lenis");
      if (!query.matches) {
        return;
      }

      const lenis = new Lenis({
        duration: 1.05,
        // Long-form editorial reading: enough weight to feel deliberate,
        // short enough that a flick still lands where the reader expects.
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1,
        anchors: false,
      });

      const update = () => ScrollTrigger.update();
      const tick = (time: number) => lenis.raf(time * 1000);

      lenis.on("scroll", update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      document.documentElement.dataset.smoothScroll = "true";

      // The menu owns the scroll lock; smoothing follows it rather than
      // competing with it.
      const releasePause = onScrollPause((paused) => {
        if (paused) {
          lenis.stop();
          return;
        }
        lenis.start();
        // The lock owns the position for as long as it is held, so smoothing
        // resumes from wherever the document actually is rather than from the
        // target it was carrying when it was stopped.
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      });

      // In-page anchors keep native focus semantics: the browser moves focus,
      // and the smoothed scroller is told where the document actually went.
      const onAnchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey) {
          return;
        }
        const anchor = (event.target as Element | null)?.closest?.("a[href^='#']");
        if (!(anchor instanceof HTMLAnchorElement)) {
          return;
        }
        const id = decodeURIComponent(anchor.hash.slice(1));
        const destination = id ? document.getElementById(id) : null;
        if (!destination) {
          return;
        }
        event.preventDefault();
        lenis.scrollTo(destination, {
          offset: -Number.parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop || "0",
          ),
        });
        // Focus moves exactly as a native jump would leave it, so assistive
        // technology and keyboard users arrive with the destination active.
        if (!destination.hasAttribute("tabindex")) {
          destination.setAttribute("tabindex", "-1");
          destination.dataset.focusShim = "true";
        }
        destination.focus({ preventScroll: true });
      };

      // The browser still owns scrolling a newly focused control into view.
      // Smoothing only adopts the position the browser landed on, so keyboard
      // traversal is never swallowed by inertia and never fights it either.
      const onFocusIn = () => {
        requestAnimationFrame(() => {
          lenis.scrollTo(window.scrollY, { immediate: true, force: true });
        });
      };

      document.addEventListener("click", onAnchorClick);
      document.addEventListener("focusin", onFocusIn);

      teardown = () => {
        document.removeEventListener("click", onAnchorClick);
        document.removeEventListener("focusin", onFocusIn);
        releasePause();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.off("scroll", update);
        lenis.destroy();
        delete document.documentElement.dataset.smoothScroll;
        teardown = null;
      };
    };

    const stop = () => {
      teardown?.();
    };

    const sync = () => {
      if (query.matches && prefersMotion()) {
        void start();
      } else {
        stop();
      }
    };

    sync();
    query.addEventListener("change", sync);

    return () => {
      query.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}
