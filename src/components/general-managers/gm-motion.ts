"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useState, type RefObject } from "react";

import { geometry } from "@/content/adelva-general-managers";
import { EASE_REVEAL, gsapEase } from "@/lib/motion";

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
 * Scroll choreography for /challenges/general-managers (spec §9, revised §13):
 * one line of first light that follows the reader down the slope. Registered
 * only when the visitor has no reduced-motion preference; the server HTML is
 * the finished state, so without this hook nothing is hidden. The hero's dawn
 * runs in CSS from the first paint.
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
          /** Attributes this layer writes, removed again on revert. */
          const marked = new Map<Element, Set<string>>();
          const mark = (el: Element, name: string, value = "") => {
            el.setAttribute(name, value);
            marked.set(el, (marked.get(el) ?? new Set()).add(name));
          };

          // Chapters: the number slides in, each heading line lifts from its baseline.
          for (let n = 1; n <= 7; n++) {
            const s = section(n);
            if (!s) continue;
            const heading = s.querySelector("h2");
            if (heading) mark(heading, "data-rising");
            const tl = gsap.timeline({
              scrollTrigger: { trigger: s, start: "top 80%", once: true },
              onComplete: () => heading?.removeAttribute("data-rising"),
            });
            tl.from(s.querySelectorAll("p[data-reveal]"), {
              x: -16,
              opacity: 0,
              duration: 0.9,
              ease: reveal,
            })
              .fromTo(
                s.querySelectorAll("h2 [data-line]"),
                { yPercent: 110 },
                {
                  yPercent: 0,
                  duration: 1.1,
                  ease: reveal,
                  stagger: 0.09,
                  clearProps: "transform",
                },
                0.08,
              )
              .from(
                s.querySelectorAll("[data-reveal-soft]"),
                { y: 12, opacity: 0, duration: 1, ease: reveal, stagger: 0.08 },
                0.35,
              );
          }

          // 01: the first light enters the terrace at the reading line and leaves
          // it again as the reader moves on; a chosen terrace keeps it (CSS).
          const labels = q<HTMLLabelElement>("label[data-issue]");
          const ids = labels.map((l) => l.dataset.issue ?? "");
          const stage = node.querySelector<HTMLElement>("[data-stage]");
          const drop = node.querySelector<HTMLElement>("[data-drop]");
          let lit: string | null = null;
          let flight: gsap.core.Tween | null = null;
          /** Where the drop is while it runs, so a new pass continues from there. */
          let dropAt: readonly [number, number] | null = null;
          const setDawn = (id: string | null, onOff: boolean) => {
            if (!id) return;
            for (const el of node.querySelectorAll(
              `[data-issue="${id}"]:is(label, [data-lit])`,
            ))
              if (onOff) mark(el, "data-dawn");
              else el.removeAttribute("data-dawn");
          };
          /** Ring centres in stage coordinates, measured on refresh only so the
           *  scroll handler never forces a layout. */
          let rings: (readonly [number, number] | null)[] = [];
          let stageTop = 0;
          const measureRings = () => {
            const box = stage?.getBoundingClientRect();
            if (!box) return;
            stageTop = box.top + scrollY;
            rings = labels.map((label) => {
              const ring = label.querySelector("[data-ring]")?.getBoundingClientRect();
              return ring
                ? [
                    ring.left + ring.width / 2 - box.left,
                    ring.top + ring.height / 2 - box.top,
                  ]
                : null;
            });
          };
          const ringAt = (id: string) => rings[ids.indexOf(id)] ?? null;
          /** Going down the slope, the light leaves one terrace and runs down the
           *  spill to the next, which lights when it arrives. */
          const pass = (from: string | null, to: string | null) => {
            const running = flight ? dropAt : null;
            flight?.kill();
            flight = null;
            setDawn(from, false);
            const a = running ?? (from && ringAt(from));
            const b = to && ringAt(to);
            if (!drop || !a || !b || !to || ids.indexOf(to) < ids.indexOf(from!)) {
              gsap.set(drop, { opacity: 0 });
              setDawn(to, true);
              return;
            }
            // over the levee: out along the upper terrace, then down to the ring
            const c = [(a[0] + b[0]) / 2, a[1] + (b[1] - a[1]) * 0.15] as const;
            const at = { t: 0 };
            let arrived = false;
            flight = gsap.to(at, {
              t: 1,
              duration: 0.6,
              ease: "power1.inOut",
              onUpdate: () => {
                const t = at.t;
                const u = 1 - t;
                const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0];
                const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
                dropAt = [x, y];
                gsap.set(drop, {
                  x,
                  y,
                  opacity: Math.min(1, t * 6, (1 - t) * 4 + 0.35),
                  scale: 0.7 + 0.5 * Math.sin(Math.PI * t),
                });
                // the terrace starts to light as the drop reaches its ring
                if (!arrived && t > 0.7) {
                  arrived = true;
                  if (lit === to) setDawn(to, true);
                }
              },
              onComplete: () => {
                gsap.to(drop, {
                  opacity: 0,
                  scale: 1.6,
                  duration: 0.5,
                  ease: "power2.out",
                });
                flight = null;
              },
            });
          };
          const follow = () => {
            if (!rings.length) measureRings();
            const line = scrollY + innerHeight * (desktop ? 0.5 : 0.55) - stageTop;
            let best: string | null = null;
            let distance = Infinity;
            rings.forEach((ring, i) => {
              if (!ring) return;
              const d = Math.abs(ring[1] - line);
              if (d < distance) {
                distance = d;
                best = ids[i];
              }
            });
            const next = distance <= innerHeight * 0.28 ? best : null;
            if (next === lit) return;
            const from = lit;
            lit = next;
            pass(from, next);
          };
          ScrollTrigger.create({
            trigger: section(1),
            start: "top bottom",
            end: "bottom top",
            onUpdate: follow,
            onToggle: follow,
            onRefresh: () => {
              measureRings();
              follow();
            },
          });

          // 02: nothing is drawn until the reader reaches the judgement.
          const decision = section(2);
          if (decision)
            ScrollTrigger.create({
              trigger: decision,
              start: "top 55%",
              once: true,
              onEnter: () => {
                mark(decision, "data-drawn");
                for (const glow of q("[data-cause-glow]")) mark(glow, "data-drawn");
              },
            });

          // 03: each row's figure is drawn and the light crosses it once.
          for (const row of q<HTMLElement>('[role="row"][id]'))
            ScrollTrigger.create({
              trigger: row,
              start: "top 85%",
              once: true,
              onEnter: () => {
                mark(row, "data-seen");
                row.dataset.light = "run";
                gsap.delayedCall(1.4, () => delete row.dataset.light);
              },
            });

          // 04: the roles step down the terraces one level at a time.
          for (const role of q<HTMLElement>("[data-role]"))
            gsap.fromTo(
              role,
              { "--rule": 0, opacity: 0, y: 14 },
              {
                "--rule": 1,
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: reveal,
                scrollTrigger: { trigger: role, start: "top 82%", once: true },
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
                    attr: { r: r * 3.2 },
                    opacity: 0,
                    duration: 1.1,
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
              glow?.setAttribute("opacity", String(alive));
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

          // 06: the light runs along the rule (desktop) and checks what it reaches.
          const checks = q<HTMLElement>("[data-check]");
          const rule = checks[0]?.parentElement;
          if (desktop && rule) {
            const ticked = checks.map(() => false);
            const tick = (p: number) => {
              rule.style.setProperty("--run", p.toFixed(4));
              checks.forEach((c, i) => {
                const on = p >= i / checks.length + 0.04;
                if (on === ticked[i]) return;
                ticked[i] = on;
                if (on) mark(c, "data-ticked");
                else c.removeAttribute("data-ticked");
              });
            };
            tick(0);
            ScrollTrigger.create({
              trigger: rule,
              start: "top 82%",
              end: "top 40%",
              scrub: 0.5,
              onUpdate: (self) => tick(self.progress),
            });
          } else
            for (const c of checks)
              ScrollTrigger.create({
                trigger: c,
                start: "top 86%",
                once: true,
                onEnter: () => mark(c, "data-ticked"),
              });

          // 07: the steps after sending light in turn; the inn's windows warm.
          const contact = section(7);
          const flow = q<HTMLElement>("[data-flow]");
          const steps = contact
            ? [...contact.querySelectorAll("[data-flow] > li")]
            : [];
          gsap.set(flow, { "--flow": 0 });
          if (contact)
            ScrollTrigger.create({
              trigger: contact,
              start: "top 62%",
              once: true,
              onEnter: () => {
                gsap.to(flow, { "--flow": 1, duration: 1.2, ease: reveal });
                steps.forEach((step, i) =>
                  gsap.delayedCall(0.15 + i * 0.22, () => mark(step, "data-reached")),
                );
                for (const inn of node.querySelectorAll("[data-inn]"))
                  mark(inn, "data-lit");
              },
            });

          return () => {
            setOn(false);
            for (const [el, names] of marked)
              for (const name of names) el.removeAttribute(name);
            rule?.style.removeProperty("--run");
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return on;
}
