"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useState, type RefObject } from "react";

import { DURATION, EASE_REVEAL, gsapEase } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const reveal = gsapEase(EASE_REVEAL);

/**
 * 02: while the crossbar slides to its point (a CSS transition), a short light
 * trail follows it along the pole. The trail chases the bar's live position, so
 * it never disagrees with the transition's own timing.
 */
function trailFollower(root: HTMLElement) {
  let frame = 0;
  let lag: number | null = null;
  const run = () => {
    const scale = root.querySelector<HTMLElement>("[data-scale]");
    const bar = scale?.querySelector<HTMLElement>("[data-setbar]");
    const trail = bar?.querySelector<HTMLElement>("[data-trail]");
    if (!scale || !bar || !trail) return;
    const box = scale.getBoundingClientRect();
    const r = bar.getBoundingClientRect();
    const current = r.top + r.height / 2 - box.top;
    lag ??= current;
    lag += (current - lag) * 0.16;
    const gap = current - lag;
    // the trail hangs on the side the bar came from
    trail.style.height = `${Math.abs(gap).toFixed(1)}px`;
    trail.style.top = gap > 0 ? `${(-gap).toFixed(1)}px` : "50%";
    trail.style.opacity = String(Math.min(1, Math.abs(gap) / 24));
    if (Math.abs(gap) > 0.4 || bar.getAnimations().length)
      frame = requestAnimationFrame(run);
    else {
      frame = 0;
      lag = current;
      trail.style.opacity = "0";
    }
  };
  return {
    start() {
      if (!frame) frame = requestAnimationFrame(run);
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}

/**
 * Scroll choreography for /challenges/owner (spec §9). Registered only when the
 * visitor has no reduced-motion preference; the server HTML is the finished
 * state, so without this hook nothing is hidden. The load sequence (dawn and
 * headline) is CSS and does not wait for it.
 */
export function useOwnerMotion(root: RefObject<HTMLDivElement | null>) {
  const [on, setOn] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          motion: "(prefers-reduced-motion: no-preference)",
          desktop: "(min-width: 1024px)",
        },
        (context) => {
          const { motion, desktop } = context.conditions as {
            motion: boolean;
            desktop: boolean;
          };
          if (!motion) return;
          const node = root.current;
          if (!node) return;
          setOn(true);
          ScrollTrigger.config({ ignoreMobileResize: true });
          const q = gsap.utils.selector(node);
          const section = (n: number) =>
            node.querySelector<HTMLElement>(`section[data-chapter="${n}"]`);

          // Chapter headings arrive as their scene comes up.
          for (let n = 1; n <= 7; n++) {
            const s = section(n);
            if (!s) continue;
            gsap.from(s.querySelectorAll("[data-reveal]"), {
              y: 14,
              opacity: 0,
              duration: 1,
              ease: reveal,
              stagger: 0.08,
              scrollTrigger: { trigger: s, start: "top 82%", once: true },
            });
          }

          // 02: the crossbar's trail.
          const trail = trailFollower(node);
          const onChange = (event: Event) => {
            if ((event.target as HTMLInputElement).name === "phase") trail.start();
          };
          node.addEventListener("change", onChange);

          // The hearth breathes once each time it comes into view; the kettle steams.
          const breathers = [
            ...node.querySelectorAll<HTMLElement>("[data-breath], [data-steam]"),
          ];
          const seen = new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                const target = entry.target as HTMLElement;
                if (entry.isIntersecting) target.dataset.run = "";
                else delete target.dataset.run;
              }
            },
            { threshold: 0.35 },
          );
          breathers.forEach((b) => seen.observe(b));

          // 04: the sides of the hearth catch the fire one by one; ADELVA's stays lit.
          const hearth = node.querySelector<HTMLElement>("[data-hearth]");
          if (hearth) {
            hearth.dataset.seat = "wait";
            ScrollTrigger.create({
              trigger: hearth,
              start: "top 72%",
              once: true,
              onEnter: () => {
                hearth.dataset.seat = "run";
              },
            });
          }

          // 05: a spark runs from 01 and lights each ember; 06 stays an ivory ring.
          const row = node.querySelector<HTMLElement>("[data-embers]");
          const spark = row?.querySelector<HTMLElement>("[data-spark]");
          const steps = row
            ? [...row.querySelectorAll<HTMLElement>("[data-step]")]
            : [];
          if (row && spark && steps.length) {
            row.dataset.ignite = "wait";
            const centres = () => {
              const box = row.getBoundingClientRect();
              return steps.map((step) => {
                const r = step.querySelector("[data-ring]")!.getBoundingClientRect();
                return [
                  r.left + r.width / 2 - box.left,
                  r.top + r.height / 2 - box.top,
                ];
              });
            };
            const light = (i: number) => {
              steps[i].dataset.lit = "";
            };
            ScrollTrigger.create({
              trigger: row,
              start: desktop ? "top 78%" : "top 72%",
              once: true,
              onEnter: () => {
                const at = centres();
                const tl = gsap.timeline({
                  onComplete: () => {
                    row.dataset.ignite = "done";
                    gsap.set(spark, { clearProps: "all" });
                    steps.forEach((s) => s.style.removeProperty("--fill"));
                  },
                });
                row.dataset.ignite = "run";
                tl.set(spark, { x: at[0][0], y: at[0][1], opacity: 0, scale: 0.6 })
                  .to(spark, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.18,
                    ease: "power2.out",
                  })
                  .call(light, [0]);
                for (let i = 1; i < steps.length; i++) {
                  const last = i === steps.length - 1;
                  const [x0, y0] = at[i - 1];
                  const [x1, y1] = at[i];
                  const to = last
                    ? [x0 + (x1 - x0) * 0.62, y0 + (y1 - y0) * 0.62]
                    : [x1, y1];
                  tl.to(
                    spark,
                    {
                      x: to[0],
                      y: to[1],
                      duration: 0.26,
                      ease: "power1.inOut",
                      opacity: last ? 0 : 1,
                    },
                    ">-0.02",
                  ).fromTo(
                    steps[i],
                    { "--fill": 0 },
                    { "--fill": 1, duration: 0.26, ease: "power1.inOut" },
                    "<",
                  );
                  if (!last) tl.call(light, [i]);
                }
              },
            });
          }

          // 06: the checks are written in.
          gsap.fromTo(
            q("[data-check] path"),
            { attr: { "stroke-dashoffset": 1 } },
            {
              attr: { "stroke-dashoffset": 0 },
              duration: DURATION.state,
              ease: "power2.out",
              stagger: 0.08,
              scrollTrigger: { trigger: section(6), start: "top 58%", once: true },
            },
          );

          return () => {
            setOn(false);
            trail.stop();
            node.removeEventListener("change", onChange);
            seen.disconnect();
            if (hearth) delete hearth.dataset.seat;
            if (row) {
              delete row.dataset.ignite;
              steps.forEach((s) => {
                delete s.dataset.lit;
                s.style.removeProperty("--fill");
              });
            }
            breathers.forEach((b) => delete b.dataset.run);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return on;
}
