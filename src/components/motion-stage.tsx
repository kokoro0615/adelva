"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

import { DURATION, EASE_REVEAL, SCRUB, gsapEase } from "@/lib/motion";

/**
 * Scoped scroll choreography for one route.
 *
 * The governing idea is a single one: **the sheet lifts**. Everything arrives by
 * being uncovered — a plane settles, a field rises, an edge sweeps — and nothing
 * bounces, spins or pops. Ordinary state feedback stays in CSS; this file owns
 * only the four scroll-linked behaviours that were measured on the target:
 *
 *  - the hero departing as the reader leaves it (measured `-0.2x` lift with a
 *    scrim reaching `0.8`);
 *  - grouped section reveals, staggered by relationship rather than by a flat
 *    per-element delay;
 *  - media settling out of a small overscale inside its own frame;
 *  - the full-bleed banner's parallax.
 *
 * Everything is built inside `gsap.matchMedia("(prefers-reduced-motion:
 * no-preference)")`, so a reduce preference produces no tween, no scroll
 * listener and no ScrollTrigger whatsoever. The audited target keeps its
 * reveals and transforms running under `reduce`; this does not.
 *
 * Nothing here is required for reading. Every element ships in its final state,
 * reveals are skipped for anything already inside the first viewport, and no
 * animation gates text, links or focus.
 */

const REVEAL_EASE = gsapEase(EASE_REVEAL);

export function MotionStage({ children }: { readonly children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) {
        return;
      }

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const foldLine = window.innerHeight * 0.92;

        // 1. Hero departure. The monument recedes as the reader scrolls past it
        //    rather than sliding rigidly off the top, which is what makes the
        //    first section feel like it arrives from underneath.
        const hero = root.querySelector<HTMLElement>("[data-hero]");
        if (hero) {
          const body = hero.querySelector<HTMLElement>("[data-hero-body]");
          const layer = hero.querySelector<HTMLElement>("[data-hero-media]");
          const scrim = hero.querySelector<HTMLElement>("[data-hero-scrim]");
          const departure = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${hero.getBoundingClientRect().height}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });

          if (body) {
            departure.to(body, { yPercent: -14, opacity: 0, ease: "none" }, 0);
          }
          if (layer) {
            departure.to(
              layer,
              { yPercent: SCRUB.bannerParallax * 100 * 0.6, ease: "none" },
              0,
            );
          }
          if (scrim) {
            departure.to(scrim, { opacity: SCRUB.veilPeak, ease: "none" }, 0);
          }
        }

        // 2. Grouped reveals. A section's own head leads, its children follow on
        //    a relationship-sized stagger, so a card rail reads as one gesture
        //    instead of eight unrelated ones.
        for (const group of root.querySelectorAll<HTMLElement>("[data-reveal-group]")) {
          const items = Array.from(
            group.querySelectorAll<HTMLElement>("[data-reveal]"),
          );
          if (items.length === 0 || group.getBoundingClientRect().top < foldLine) {
            continue;
          }

          const stagger = Number.parseFloat(group.dataset.revealStagger ?? "0.07");
          gsap.from(items, {
            opacity: 0,
            y: 26,
            duration: DURATION.reveal * 0.85,
            ease: REVEAL_EASE,
            stagger,
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
            onComplete: () => {
              gsap.set(items, { clearProps: "opacity,transform" });
            },
          });
        }

        // 3. Media settles out of a small overscale inside its own frame. The
        //    frame never moves, so no layout is touched and nothing reflows.
        for (const frame of root.querySelectorAll<HTMLElement>("[data-reveal-media]")) {
          const picture = frame.querySelector<HTMLElement>("img");
          if (!picture || frame.getBoundingClientRect().top < foldLine) {
            continue;
          }

          gsap.from(picture, {
            scale: 1.07,
            duration: DURATION.hero,
            ease: REVEAL_EASE,
            scrollTrigger: { trigger: frame, start: "top 92%", once: true },
            onComplete: () => {
              gsap.set(picture, { clearProps: "transform" });
            },
          });
        }

        // 4. Full-bleed banner parallax at the measured lift ratio.
        for (const layer of root.querySelectorAll<HTMLElement>("[data-parallax]")) {
          gsap.fromTo(
            layer,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: "none",
              scrollTrigger: {
                trigger: layer.parentElement ?? layer,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.5,
              },
            },
          );
        }

        // Late webfont and image readiness changes every trigger position.
        void document.fonts?.ready.then(() => ScrollTrigger.refresh());
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div className="stage" data-fidelity-landmark="primary-content" ref={scope}>
      {children}
    </div>
  );
}
