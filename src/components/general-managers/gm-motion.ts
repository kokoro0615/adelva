"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useState, type RefObject } from "react";

import { geometry } from "@/content/adelva-general-managers";
import { DURATION, EASE_REVEAL, gsapEase } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const reveal = gsapEase(EASE_REVEAL);
type Point = readonly [number, number];

/** Arc-length table of the gate path (the same cubics as `gatePath`). */
function sampleGates(points: readonly Point[]) {
  const xs: number[] = [points[0][0]];
  const ys: number[] = [points[0][1]];
  const len: number[] = [0];
  const marks: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const mid = (ay + by) / 2;
    const c = [ax, ay, ax, mid, bx, mid - 10, bx, by];
    for (let s = 1; s <= 48; s++) {
      const t = s / 48;
      const u = 1 - t;
      const x =
        u * u * u * c[0] +
        3 * u * u * t * c[2] +
        3 * u * t * t * c[4] +
        t * t * t * c[6];
      const y =
        u * u * u * c[1] +
        3 * u * u * t * c[3] +
        3 * u * t * t * c[5] +
        t * t * t * c[7];
      len.push(
        len[len.length - 1] + Math.hypot(x - xs[xs.length - 1], y - ys[ys.length - 1]),
      );
      xs.push(x);
      ys.push(y);
    }
    marks.push(len[len.length - 1]);
  }
  const total = len[len.length - 1];
  const at = (p: number) => {
    const target = p * total;
    let lo = 0;
    let hi = len.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (len[mid] < target) lo = mid;
      else hi = mid;
    }
    const f = len[hi] === len[lo] ? 0 : (target - len[lo]) / (len[hi] - len[lo]);
    return [xs[lo] + (xs[hi] - xs[lo]) * f, ys[lo] + (ys[hi] - ys[lo]) * f] as const;
  };
  return { at, reached: marks.map((m) => m / total) };
}

/**
 * Scroll choreography for /challenges/general-managers (spec §9). Registered only
 * when the visitor has no reduced-motion preference; the server HTML is the
 * finished state, so without this hook nothing is hidden.
 */
export function useGmMotion(root: RefObject<HTMLDivElement | null>) {
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
          const regime = desktop ? "d" : "m";
          const section = (n: number) =>
            node.querySelector<HTMLElement>(`section[data-chapter="${n}"]`);

          // Load: the first light crosses the mirror, then the headline rises line by line.
          const sweep = q("[data-sweep]");
          // A steady pass (an entrance ease would cross the mirror in the first 300 ms).
          gsap
            .timeline({ delay: 0.2 })
            .set(sweep, { xPercent: -70, opacity: 0 })
            .to(
              sweep,
              { xPercent: 70, duration: DURATION.hero + 0.2, ease: "power1.inOut" },
              0,
            )
            .to(sweep, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0)
            .to(
              sweep,
              { opacity: 0, duration: 0.6, ease: "power1.in" },
              DURATION.hero - 0.4,
            );
          gsap.from(q("[data-hero-line]"), {
            y: desktop ? 10 : 8,
            opacity: 0,
            duration: DURATION.reveal,
            ease: reveal,
            stagger: 0.12,
            delay: 0.1,
          });
          gsap.from(q("[data-hero-after]"), {
            y: 8,
            opacity: 0,
            duration: DURATION.reveal,
            ease: reveal,
            stagger: 0.08,
            delay: 0.46,
          });

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

          // 02: the dotted line climbs from the symptom to the clogged inlet.
          const decision = section(2);
          gsap.fromTo(
            q('[data-draw="cause"]'),
            { attr: { "stroke-dashoffset": 1 } },
            {
              attr: { "stroke-dashoffset": 0 },
              duration: 0.9,
              ease: "power2.inOut",
              scrollTrigger: { trigger: decision, start: "top 45%", once: true },
            },
          );
          gsap.from(q("[data-cause-glow]"), {
            opacity: 0,
            duration: DURATION.reveal,
            ease: reveal,
            delay: 0.6,
            scrollTrigger: { trigger: decision, start: "top 45%", once: true },
          });

          // 04: the roles step down the terraces one level at a time.
          const roles = q("[data-role]");
          gsap.fromTo(
            roles,
            { "--rule": 0, opacity: 0, y: 12 },
            {
              "--rule": 1,
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: reveal,
              stagger: 0.14,
              scrollTrigger: { trigger: roles[0], start: "top 80%", once: true },
            },
          );

          // 05: the orange line runs down the spills with the scroll.
          const svg = node.querySelector<SVGSVGElement>(
            `[data-marks="gates"][data-regime="${regime}"]`,
          );
          if (svg) {
            const points = (
              desktop ? geometry.desktop.gates : geometry.mobile.gates
            ) as readonly Point[];
            const path = sampleGates(points.slice(0, 5));
            const draw = svg.querySelector<SVGPathElement>("[data-gate-draw]");
            const head = svg.querySelector<SVGCircleElement>("[data-gate-head]");
            const glow = svg.querySelector<SVGCircleElement>("[data-gate-glow]");
            const marks = [...svg.querySelectorAll<SVGGElement>("[data-gate-mark]")];
            const labels = q("[data-gate]");
            const reached = [...path.reached, 1.0001];
            // undefined until the first render, so the first pass styles every gate
            const state: (boolean | undefined)[] = marks.map(() => undefined);
            let last = -1;
            const light = (i: number, done: boolean, forward: boolean) => {
              if (state[i] === done) return;
              state[i] = done;
              const mark = marks[i];
              const ring = mark.querySelector<SVGCircleElement>(
                "circle:nth-of-type(2)",
              );
              const dot = mark.querySelector<SVGCircleElement>("[data-gate-dot]");
              const burst = mark.querySelector<SVGCircleElement>("[data-gate-burst]");
              const end = i === marks.length - 1;
              if (ring) {
                if (end) ring.style.stroke = done ? "" : "rgb(241 239 234 / 60%)";
                else ring.dataset.done = String(done);
              }
              if (dot) dot.style.opacity = done ? "1" : "0";
              labels[i]?.setAttribute("data-state", done ? "done" : "todo");
              if (done && forward && burst) {
                const r = Number(burst.getAttribute("r"));
                gsap.fromTo(
                  burst,
                  { attr: { r }, opacity: 0.9 },
                  {
                    attr: { r: r * 2.8 },
                    opacity: 0,
                    duration: 1,
                    ease: "power2.out",
                    overwrite: true,
                  },
                );
              }
            };
            const render = (p: number, forward: boolean) => {
              draw?.setAttribute("stroke-dashoffset", String(1 - p));
              const [x, y] = path.at(Math.min(1, Math.max(0, p)));
              const alive = p > 0.002 && p < 0.998 ? 1 : 0;
              head?.setAttribute("cx", x.toFixed(1));
              head?.setAttribute("cy", y.toFixed(1));
              head?.setAttribute("opacity", String(alive));
              glow?.setAttribute("cx", x.toFixed(1));
              glow?.setAttribute("cy", y.toFixed(1));
              glow?.setAttribute("opacity", String(alive * 0.9));
              for (let i = 0; i < marks.length; i++)
                light(
                  i,
                  i === marks.length - 1 ? p >= 0.999 : p >= reached[i] - 0.004,
                  forward,
                );
              last = p;
            };
            render(0, false);
            ScrollTrigger.create({
              trigger: svg,
              start: "top 75%",
              end: "bottom 55%",
              scrub: 0.6,
              onUpdate: (self) => render(self.progress, self.progress >= last),
            });
          }

          // 06: the check rings draw in.
          const ticks = q("[data-check] svg > *");
          gsap.fromTo(
            ticks,
            { attr: { "stroke-dasharray": "1 1", "stroke-dashoffset": 1 } },
            {
              attr: { "stroke-dashoffset": 0 },
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.06,
              scrollTrigger: { trigger: section(6), start: "top 60%", once: true },
            },
          );

          // 07: the line of the steps after sending.
          gsap.fromTo(
            q("[data-flow]"),
            { "--flow": 0 },
            {
              "--flow": 1,
              duration: DURATION.reveal,
              ease: reveal,
              scrollTrigger: { trigger: section(7), start: "top 60%", once: true },
            },
          );

          return () => setOn(false);
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return on;
}
