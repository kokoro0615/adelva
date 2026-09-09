"use client";

import { useEffect, useRef } from "react";
import {
  createAmbientRenderer,
  darkField,
  lightField,
  type Field,
} from "./ambient-renderer";

const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/** A continuous field: shape, palette and scroll position have separate clocks. */
export function Ambient({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [paused]);
  useEffect(() => {
    const canvas = ref.current;
    const page = canvas?.closest<HTMLElement>(".ns-page");
    if (!canvas || !page) return;
    const how = page.querySelector<HTMLElement>(".ns-how-group");
    const quotes = [...page.querySelectorAll<HTMLElement>(".ns-quote")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer = createAmbientRenderer(canvas);
    let frame = 0,
      last = 0,
      elapsed = 0;
    let field = { ...darkField };
    let transition = { light: false, from: field, start: 0 };
    let mix = 1,
      lock = { target: 1, from: 1, start: 0 };
    let initialized = false;
    const render = (now: number) => {
      frame = 0;
      const stopped = pausedRef.current || reduced.matches;
      if (document.hidden) {
        last = 0;
        return;
      }
      if (!stopped && last) elapsed += Math.min(now - last, 100) / 1000;
      last = now;
      const height = window.innerHeight;
      const y = window.scrollY;
      const bounds = how?.getBoundingClientRect();
      const light = !!bounds && bounds.top < height && bounds.bottom > -100;
      const target = light ? lightField : darkField;
      if (!initialized || light !== transition.light) {
        transition = { light, from: field, start: now };
        page.dataset.ambientTheme = light ? "light" : "dark";
      }
      const fixed = quotes.some((quote) => {
        const box = quote.getBoundingClientRect();
        return (
          Math.max(0, Math.min(height, box.bottom) - Math.max(0, box.top)) >=
          box.height * 0.1
        );
      });
      if (Number(!fixed) !== lock.target)
        lock = { target: Number(!fixed), from: mix, start: now };
      mix =
        stopped || !initialized
          ? lock.target
          : lock.from + (lock.target - lock.from) * ease((now - lock.start) / 1000);
      const durations: Record<string, number> = {
        color1: light ? 8 : 200,
        color2: light ? 8 : 200,
        color3: light ? 500 : 100,
        color4: light ? 740 : 80,
        surface: light ? 860 : 540,
        alpha: 400,
        blur: 4,
        radius: 4,
        lightness: light ? 100 : 600,
        organicSpeed: 50,
      };
      field = Object.fromEntries(
        Object.entries(target).map(([key, value]) => {
          const t =
            stopped || !initialized
              ? 1
              : ease((now - transition.start) / durations[key]);
          const from = transition.from[key as keyof Field];
          return [
            key,
            Array.isArray(value)
              ? value.map(
                  (v, i) => (from as number[])[i] + (v - (from as number[])[i]) * t,
                )
              : (from as number) + (value - (from as number)) * t,
          ];
        }),
      ) as Field;
      initialized = true;
      page.dataset.scrolled = String(y > height * 0.6);
      // Contrast is tied to the settled chapter, not a lagging sampled canvas pixel.
      page.style.setProperty("--ns-ink", light ? "#000" : "#fff");
      page.style.setProperty("--ns-surface", light ? "#fff" : "#000");
      canvas.dataset.renderer = renderer ? "webgl" : "fallback";
      canvas.dataset.motion = stopped ? "paused" : "running";
      renderer?.draw(field, elapsed, y, mix);
      if (!stopped && renderer) frame = requestAnimationFrame(tick);
    };
    const tick = (now: number) => {
      if (now - last < 1000 / 30) {
        frame = requestAnimationFrame(tick);
        return;
      }
      render(now);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      renderer?.dispose();
      renderer = null;
      wake();
    };
    const contextRestored = () => {
      renderer = createAmbientRenderer(canvas);
      wake();
    };
    const resetClock = () => {
      last = 0;
      wake();
    };
    wakeRef.current = resetClock;
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    reduced.addEventListener("change", resetClock);
    document.addEventListener("visibilitychange", resetClock);
    canvas.addEventListener("webglcontextlost", contextLost);
    canvas.addEventListener("webglcontextrestored", contextRestored);
    wake();
    return () => {
      wakeRef.current = null;
      cancelAnimationFrame(frame);
      renderer?.dispose();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      reduced.removeEventListener("change", resetClock);
      document.removeEventListener("visibilitychange", resetClock);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
    };
  }, []);
  return <canvas className="ns-ambient" ref={ref} aria-hidden="true" />;
}
