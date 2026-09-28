"use client";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/CustomEase";
import { EASE_REVEAL, EASE_STATE, DURATION } from "@/lib/motion";
import { viewfinderTargets, type PhotoId } from "@/content/adelva-revenue-brand";
import styles from "./revenue-brand.module.css";
gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin, CustomEase);
type Sample = { len: number; x: number; y: number; maxY: number };
/*
 * Length lookup tables for the river paths.
 *
 * `getPointAtLength` walks the whole path on every call, so sampling the main
 * river (200–400 cubic segments) every 4 units took 0.5–1.4 s of main-thread
 * time on a desktop CPU. Every path here is authored with absolute M/L/C/S/Q
 * commands, so the table is built in one linear pass by flattening each
 * segment, then scaled to the browser's own total length (one call) so that
 * dash offsets still line up exactly. Tables are cached per element and `d`.
 */
const STEP = 4;
const lutCache = new WeakMap<
  SVGPathElement,
  { d: string; total: number; lut: Sample[] }
>();
type Pt = { x: number; y: number };
function flatten(d: string): Pt[] | null {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
  if (!tokens) return null;
  const points: Pt[] = [];
  let i = 0,
    cmd = "",
    cur: Pt = { x: 0, y: 0 },
    lastCtrl: Pt | null = null;
  const num = () => Number(tokens[i++]);
  const cubic = (p1: Pt, p2: Pt, p3: Pt) => {
    const chord =
      Math.hypot(p1.x - cur.x, p1.y - cur.y) +
      Math.hypot(p2.x - p1.x, p2.y - p1.y) +
      Math.hypot(p3.x - p2.x, p3.y - p2.y);
    const n = Math.max(2, Math.ceil(chord / 1.5));
    for (let k = 1; k <= n; k++) {
      const t = k / n,
        u = 1 - t;
      points.push({
        x:
          u * u * u * cur.x +
          3 * u * u * t * p1.x +
          3 * u * t * t * p2.x +
          t * t * t * p3.x,
        y:
          u * u * u * cur.y +
          3 * u * u * t * p1.y +
          3 * u * t * t * p2.y +
          t * t * t * p3.y,
      });
    }
    lastCtrl = p2;
    cur = p3;
  };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "M") {
      cur = { x: num(), y: num() };
      points.push(cur);
      lastCtrl = null;
      cmd = "L";
    } else if (cmd === "L") {
      cur = { x: num(), y: num() };
      points.push(cur);
      lastCtrl = null;
    } else if (cmd === "C") {
      const p1 = { x: num(), y: num() },
        p2 = { x: num(), y: num() };
      cubic(p1, p2, { x: num(), y: num() });
    } else if (cmd === "S") {
      // `cubic` updates lastCtrl inside a closure, which TS cannot follow.
      const ctrl = lastCtrl as Pt | null;
      const p1: Pt = ctrl ? { x: 2 * cur.x - ctrl.x, y: 2 * cur.y - ctrl.y } : cur;
      const p2 = { x: num(), y: num() };
      cubic(p1, p2, { x: num(), y: num() });
    } else if (cmd === "Q") {
      const q = { x: num(), y: num() },
        end = { x: num(), y: num() };
      cubic(
        { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) },
        { x: end.x + (2 / 3) * (q.x - end.x), y: end.y + (2 / 3) * (q.y - end.y) },
        end,
      );
      lastCtrl = null;
    } else return null;
  }
  return points;
}
function sample(path: SVGPathElement) {
  const d = path.getAttribute("d") ?? "";
  const cached = lutCache.get(path);
  if (cached && cached.d === d) return cached;
  const total = path.getTotalLength();
  const lut: Sample[] = [];
  let maxY = -Infinity;
  const points = flatten(d);
  if (points && points.length > 1) {
    let acc = 0;
    const lengths = [0];
    for (let k = 1; k < points.length; k++) {
      acc += Math.hypot(points[k].x - points[k - 1].x, points[k].y - points[k - 1].y);
      lengths.push(acc);
    }
    const scale = acc > 0 ? total / acc : 1;
    let k = 1;
    for (let len = 0; len < total + STEP; len += STEP) {
      const target = Math.min(len, total) / scale;
      while (k < lengths.length - 1 && lengths[k] < target) k++;
      const a = lengths[k - 1],
        f = Math.max(0, Math.min(1, (target - a) / (lengths[k] - a || 1)));
      const x = points[k - 1].x + (points[k].x - points[k - 1].x) * f,
        y = points[k - 1].y + (points[k].y - points[k - 1].y) * f;
      maxY = Math.max(maxY, y);
      lut.push({ len: Math.min(len, total), x, y, maxY });
    }
  } else {
    for (let len = 0; len < total + STEP; len += STEP) {
      const length = Math.min(len, total),
        p = path.getPointAtLength(length);
      maxY = Math.max(maxY, p.y);
      lut.push({ len: length, x: p.x, y: p.y, maxY });
    }
  }
  const result = { d, total, lut };
  lutCache.set(path, result);
  return result;
}
function nearest(lut: Sample[], x: number, y: number) {
  let best = lut[0],
    distance = Infinity;
  for (const p of lut) {
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < distance) {
      distance = d;
      best = p;
    }
  }
  return best.len;
}
function pointAt(lut: Sample[], len: number) {
  const i = Math.min(lut.length - 2, Math.floor(len / STEP));
  const a = lut[Math.max(0, i)],
    b = lut[Math.max(0, i) + 1];
  const f = Math.max(0, Math.min(1, (len - a.len) / (b.len - a.len || 1)));
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
function lengthAtY(lut: Sample[], y: number) {
  let lo = 0,
    hi = lut.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lut[mid].maxY < y) lo = mid + 1;
    else hi = mid;
  }
  const p = lut[lo],
    a = lut[Math.max(0, lo - 1)];
  const f = Math.max(0, Math.min(1, (y - a.maxY) / (p.maxY - a.maxY || 1)));
  return a.len + (p.len - a.len) * f;
}
export function RevenueBrandMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    (context, contextSafe) => {
      const el = root.current;
      if (!el) return;
      const safe = contextSafe!;
      const stage = el.querySelector<HTMLElement>("[data-stage]")!;
      const all = <T extends Element>(s: string) =>
        Array.from(el.querySelectorAll<T>(s));
      const reveal = CustomEase.create("rb-reveal", EASE_REVEAL.join(","));
      const panel = CustomEase.create("rb-panel", EASE_STATE.join(","));
      const media = gsap.matchMedia();
      let alive = true;
      // Compact runtime geometry is sampled once; SVG paths are server-rendered.
      const branchPaths = new Map<string, string>();
      for (const svg of all<SVGSVGElement>("[data-river]")) {
        const mode = svg.dataset.river!;
        for (const node of svg.querySelectorAll<SVGGElement>("[data-branch-node]")) {
          const branch = svg.querySelector<SVGPathElement>(
            `[data-tributary="${node.dataset.branchSide}"]`,
          )!;
          const dot = node.querySelector<SVGCircleElement>("circle")!;
          const x = dot.cx.baseVal.value,
            y = dot.cy.baseVal.value;
          const { lut } = sample(branch);
          const at = nearest(lut, x, y);
          const start = pointAt(lut, at);
          const d =
            `M${x} ${y}Q${(x + start.x) / 2} ${Math.max(y, start.y) + 20} ${start.x} ${start.y} ` +
            lut
              .filter((p) => p.len > at)
              .map((p) => `L${p.x} ${p.y}`)
              .join(" ");
          branchPaths.set(`${mode}:${node.dataset.branchNode}`, d);
          node.querySelector("path[data-selected-branch]")!.setAttribute("d", d);
        }
      }
      const pulse = (node: SVGElement | null, duration = 0.6) => {
        if (!node) return;
        gsap.fromTo(
          node,
          { scale: 0.6, opacity: 0.9, transformOrigin: "50% 50%" },
          { scale: 1.8, opacity: 0, duration, ease: reveal, overwrite: true },
        );
      };
      const select = safe((event: Event) => {
        const { kind, id } = (event as CustomEvent<{ kind: string; id: string | null }>)
          .detail;
        const mobile = matchMedia("(max-width:1023px)").matches;
        const svg = el.querySelector<SVGSVGElement>(
          `[data-river="${mobile ? "mobile" : "desktop"}"]`,
        )!;
        const motion = matchMedia("(prefers-reduced-motion:no-preference)").matches;
        if (kind === "photo") {
          // Update both coordinate planes, so resizing preserves the selected building.
          for (const s of all<SVGSVGElement>("[data-river]")) {
            const frame = s.querySelector<SVGGElement>("[data-viewfinder]")!;
            gsap.killTweensOf(frame);
            if (!id) {
              gsap.set(frame, { opacity: 0 });
              continue;
            }
            const t =
              viewfinderTargets[s.dataset.river as "desktop" | "mobile"][id as PhotoId];
            const coords = [
              [t[0] - 12, t[1] - 12],
              [t[2] + 12, t[1] - 12],
              [t[2] + 12, t[3] + 12],
              [t[0] - 12, t[3] + 12],
            ];
            gsap.set(frame, { opacity: 1 });
            frame
              .querySelectorAll<SVGPathElement>("[data-corner]")
              .forEach((corner, i) => {
                const [x, y] = coords[i];
                if (motion)
                  gsap.to(corner, {
                    attr: { transform: `translate(${x} ${y})` },
                    duration: 0.4,
                    ease: panel,
                    overwrite: true,
                  });
                else corner.setAttribute("transform", `translate(${x} ${y})`);
              });
          }
        } else if (motion && id) {
          const particle = svg.querySelector<SVGCircleElement>(
            "[data-branch-particle]",
          )!;
          gsap.killTweensOf(particle);
          gsap.set(particle, { opacity: 1 });
          gsap.to(particle, {
            motionPath: { path: branchPaths.get(`${svg.dataset.river}:${id}`)! },
            duration: 1.1,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.set(particle, { opacity: 0 });
              pulse(svg.querySelector("[data-confluence-pulse]"));
            },
          });
        }
      });
      el.addEventListener("rb:select", select);
      media.add(
        {
          desktop: "(min-width:1024px)",
          mobile: "(max-width:1023px)",
          motion: "(prefers-reduced-motion:no-preference)",
        },
        (ctx) => {
          const { desktop, motion } = ctx.conditions!;
          const mode = desktop ? "desktop" : "mobile";
          const svg = el.querySelector<SVGSVGElement>(`[data-river="${mode}"]`)!;
          if (!motion) return;
          el.dataset.motion = "on";
          const path = svg.querySelector<SVGPathElement>('[data-main-line="core"]')!;
          const lines = Array.from(
            svg.querySelectorAll<SVGPathElement>("[data-main-line]"),
          );
          const clip = svg.querySelector<SVGRectElement>("[data-dotted-clip]")!;
          const head = svg.querySelector<SVGGElement>("[data-head]")!;
          let geometry = sample(path),
            ratio = 1,
            stageTop = 0,
            viewHeight = innerHeight,
            endY = 1;
          let steps: number[] = [];
          let boundaries: number[] = [];
          let relatedTop = Infinity;
          let railThreshold = 700;
          const proxy = { len: 0 };
          let previousCount = -1;
          const stepElements = all<HTMLElement>("li[data-step]");
          const counter = el.querySelector<HTMLElement>("[data-counter]")!;
          const bars = all<HTMLElement>("[data-progress-segment]");
          const dawn = el.querySelector<HTMLElement>("[data-dawn]")!,
            windows = el.querySelector<HTMLElement>("[data-windows]")!;
          const rail = el.querySelector<HTMLElement>(`[data-rail="${mode}"]`)!;
          const railDot = rail.querySelector<SVGCircleElement>("[data-rail-dot]")!;
          const railPath = rail.querySelector<SVGPathElement>("path")!;
          const railLut = sample(railPath);
          const setStates = (count: number) => {
            if (count === previousCount) return;
            previousCount = count;
            stepElements.forEach((item, i) => {
              const state =
                i === count - 1 ? "current" : i < count ? "reached" : "upcoming";
              item.dataset.state = state;
              if (state === "current") item.setAttribute("aria-current", "step");
              else item.removeAttribute("aria-current");
              svg
                .querySelector(`[data-process-node="${i + 1}"]`)
                ?.setAttribute("data-state", state);
              bars[i].dataset.reached = String(i < count);
            });
            counter.textContent = String(count).padStart(2, "0");
            gsap.fromTo(
              counter,
              { yPercent: 100 },
              { yPercent: 0, duration: 0.3, ease: panel, overwrite: true },
            );
          };
          const render = () => {
            const len = Math.max(0, Math.min(geometry.total, proxy.len));
            for (const line of lines)
              line.style.strokeDashoffset = String(geometry.total - len);
            const point = pointAt(geometry.lut, len);
            clip.setAttribute("height", String(Math.max(0, point.y)));
            head.setAttribute("transform", `translate(${point.x} ${point.y})`);
            head.style.opacity =
              len > 1 && len < geometry.total - 1 && window.scrollY > 0 ? "1" : "0";
            const count = steps.filter((step) => len >= step).length;
            setStates(count);
            const p = Math.max(
              0,
              Math.min(1, (len - steps[3]) / (geometry.total - steps[3])),
            );
            dawn.style.opacity = String(p * 0.55);
            windows.style.opacity = String(p * 0.35);
          };
          const follow = gsap.quickTo(proxy, "len", {
            duration: 0.6,
            ease: "power3.out",
            onUpdate: render,
          });
          const refresh = () => {
            geometry = sample(path);
            const r = stage.getBoundingClientRect();
            ratio = svg.viewBox.baseVal.height / r.height;
            railThreshold = 700 * (r.width / 390);
            stageTop = r.top + scrollY;
            viewHeight = innerHeight;
            steps = Array.from(
              svg.querySelectorAll<SVGGElement>("[data-process-node]"),
            ).map((node) => {
              const dot = node.querySelector("circle")!;
              return nearest(
                geometry.lut,
                Number(dot.getAttribute("cx")),
                Number(dot.getAttribute("cy")),
              );
            });
            endY = geometry.lut.at(-1)!.y / ratio;
            boundaries = all<HTMLElement>(
              "#rb-hero,#rb-ch1,#rb-ch2,#rb-ch3,#rb-process",
            ).map((n) => n.getBoundingClientRect().top + scrollY);
            relatedTop =
              el.querySelector<HTMLElement>("[data-related]")!.getBoundingClientRect()
                .top + scrollY;
            for (const line of lines)
              line.style.strokeDasharray = String(geometry.total);
            proxy.len =
              scrollY === 0
                ? 0
                : lengthAtY(
                    geometry.lut,
                    (scrollY + viewHeight * 0.58 - stageTop) * ratio,
                  );
            render();
          };
          const update = (scroll: number) => {
            follow(
              scroll === 0
                ? 0
                : lengthAtY(
                    geometry.lut,
                    (scroll + viewHeight * 0.58 - stageTop) * ratio,
                  ),
            );
            const progress = Math.max(
              0,
              Math.min(1, (scroll - stageTop) / (endY - viewHeight * 0.58)),
            );
            const point = pointAt(railLut.lut, railLut.total * progress);
            railDot.setAttribute("cx", String(point.x));
            railDot.setAttribute("cy", String(point.y));
            const index = Math.max(
              0,
              boundaries.filter((y) => scroll + viewHeight * 0.58 >= y).length - 1,
            );
            all<HTMLAnchorElement>('[data-rail="desktop"] a').forEach((a, i) => {
              if (i === index) a.setAttribute("aria-current", "location");
              else a.removeAttribute("aria-current");
            });
            el.dataset.railFixed = String(scroll > railThreshold);
            el.dataset.railHidden = String(scroll + viewHeight * 0.6 >= relatedTop);
          };
          refresh();
          ScrollTrigger.create({
            trigger: stage,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => update(self.scroll()),
            onRefresh: () => {
              refresh();
              update(scrollY);
            },
          });
          const heroTl = gsap.timeline();
          const restored = scrollY > 100;
          if (!restored) {
            heroTl.fromTo(
              el.querySelector("[data-hero-veil]"),
              { opacity: 0.55 },
              { opacity: 0, duration: 0.9, ease: reveal },
              0,
            );
            const sourcePaths = Array.from(
              svg.querySelectorAll<SVGPathElement>("[data-source-line]"),
            );
            sourcePaths.forEach((line, i) => {
              const id = line.closest<SVGGElement>("[data-source]")!.dataset.source;
              const group = line.parentElement!;
              const dot = group.querySelector("[data-source-node]");
              const chip = el.querySelector(`[data-source-chip="${id}"]`);
              heroTl.fromTo(
                [line, group.querySelector("[data-source-glow]")],
                { strokeDashoffset: 1 },
                { strokeDashoffset: 0, duration: 1.2, ease: reveal },
                0.25 + i * 0.08,
              );
              heroTl.fromTo(
                group.querySelector("[data-source-leader]"),
                { strokeDashoffset: 1 },
                { strokeDashoffset: 0, duration: 0.3, ease: panel },
                0.78 + i * 0.08,
              );
              heroTl.fromTo(
                dot,
                // SVG transforms need an explicit bbox origin, or the node
                // grows from the canvas corner and drifts in from off-river.
                { scale: 0, opacity: 0, transformOrigin: "50% 50%" },
                { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.6)" },
                0.7 + i * 0.08,
              );
              heroTl.fromTo(
                chip,
                { opacity: 0, y: 6 },
                { opacity: 1, y: 0, duration: 0.3, ease: panel },
                0.85 + i * 0.08,
              );
            });
            heroTl.fromTo(
              el.querySelector("[data-scroll-cue]"),
              { scaleY: 0 },
              { scaleY: 1, duration: 1.2, ease: reveal },
              0.6,
            );
          }
          const ch1 = el.querySelector("#rb-ch1-title")!;
          const ch1Tl = gsap.timeline({
            scrollTrigger: { trigger: ch1, start: "top 70%", once: true },
          });
          ch1Tl
            .fromTo(
              svg.querySelectorAll("[data-tributary]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: reveal },
              0,
            )
            .fromTo(
              svg.querySelectorAll("[data-tributary-glow]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: reveal },
              0,
            )
            .fromTo(
              svg.querySelectorAll("[data-ch1-node]"),
              { scale: 0, transformOrigin: "50% 50%" },
              { scale: 1, duration: 0.24, stagger: 0.06, ease: reveal },
              0.15,
            )
            .fromTo(
              svg.querySelectorAll("[data-leader]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.3, stagger: 0.06, ease: panel },
              0.15,
            )
            .add(() => pulse(svg.querySelector("[data-confluence-pulse]")), 1.5)
            .fromTo(
              el.querySelector("[data-revenue-chip]"),
              { opacity: 0, y: 6 },
              { opacity: 1, y: 0, duration: 0.3, ease: panel },
              1.6,
            );
          // Ripple is local to the reflected title and only enabled while visible.
          const reflection = el.querySelector<HTMLElement>("[data-reflection]")!;
          const displacement =
            el.querySelector<SVGFEDisplacementMapElement>("[data-ripple]")!;
          const ripple = { value: 0 };
          let inView = false;
          const rippleTo = gsap.quickTo(ripple, "value", {
            duration: 0.7,
            ease: "power3.out",
            onUpdate: () => displacement.setAttribute("scale", String(ripple.value)),
          });
          const calm = gsap.delayedCall(0.12, () => rippleTo(0)).pause();
          const observer = new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting && !matchMedia("(update:slow)").matches;
            reflection.style.filter = inView ? "url(#rb-ripple)" : "none";
            if (!inView) rippleTo(0);
          });
          observer.observe(reflection);
          ScrollTrigger.create({
            trigger: reflection,
            start: "top bottom",
            end: "bottom top",
            onUpdate: (self) => {
              if (inView) {
                rippleTo(Math.min(6, Math.abs(self.getVelocity()) / 700));
                calm.restart(true);
              }
            },
          });
          const frame = svg.querySelector<SVGGElement>("[data-viewfinder]")!;
          const initialTarget = viewfinderTargets[mode].room;
          const center = [
            (initialTarget[0] + initialTarget[2]) / 2,
            (initialTarget[1] + initialTarget[3]) / 2,
          ];
          frame.querySelectorAll<SVGPathElement>("[data-corner]").forEach((corner) => {
            const end = corner.getAttribute("transform")!;
            const [x, y] = end.match(/[-\d.]+/g)!.map(Number);
            gsap.fromTo(
              corner,
              {
                attr: {
                  transform: `translate(${center[0] + (x - center[0]) * 1.15} ${center[1] + (y - center[1]) * 1.15})`,
                },
              },
              {
                attr: { transform: end },
                duration: 0.4,
                ease: panel,
                scrollTrigger: {
                  trigger: el.querySelector('[data-chip-group="photo"]'),
                  start: "top 70%",
                  once: true,
                },
              },
            );
          });
          gsap.fromTo(
            frame,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.4,
              ease: panel,
              scrollTrigger: {
                trigger: el.querySelector('[data-chip-group="photo"]'),
                start: "top 70%",
                once: true,
              },
            },
          );
          const cycle = svg.querySelector<SVGPathElement>("[data-cycle]")!,
            cycleGeo = sample(cycle),
            posting = svg.querySelector<SVGCircleElement>(
              '[data-loop-node="posting"] circle',
            )!;
          const postLength = nearest(
            cycleGeo.lut,
            posting.cx.baseVal.value,
            posting.cy.baseVal.value,
          );
          const cycleProxy = { value: 0 };
          const cycleNodes = Array.from(
            svg.querySelectorAll<SVGGElement>("[data-loop-node]"),
          ).filter((n) => n.dataset.loopNode !== "web-booking");
          // The ring starts at ブランド方針, so its own stop is 0 (not the ring's end).
          const cycleStops = cycleNodes.map((node) =>
            node.dataset.loopNode === "brand-policy"
              ? 0
              : nearest(
                  cycleGeo.lut,
                  Number(node.querySelector("circle")!.getAttribute("cx")),
                  Number(node.querySelector("circle")!.getAttribute("cy")),
                ),
          );
          const pulsed = new Set<number>();
          // 投稿 is the lit stage in the finished (reduced / no-JS) state; with
          // motion it lights only when the particle arrives.
          const currentMarks = all<Element>("[data-loop-current]");
          const setCurrent = (on: boolean) =>
            currentMarks.forEach((node) =>
              node.setAttribute("data-loop-current", String(on)),
            );
          setCurrent(false);
          const cycleParticle = svg.querySelector("[data-cycle-particle]");
          const loopTl = gsap.timeline({
            scrollTrigger: {
              trigger: el.querySelector("#rb-ch3-title"),
              start: "top 70%",
              once: true,
            },
          });
          loopTl
            .fromTo(
              [
                svg.querySelector("[data-loop-other]"),
                svg.querySelector("[data-loop-other-glow]"),
              ],
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.9, ease: reveal },
            )
            .set(cycleParticle, { opacity: 1 })
            .to(cycleParticle, {
              motionPath: {
                path: cycle.getAttribute("d")!,
                start: 0,
                end: postLength / cycleGeo.total,
              },
              duration: 1.6,
              ease: "power1.inOut",
            })
            .to(
              cycleProxy,
              {
                value: postLength,
                duration: 1.6,
                ease: "power1.inOut",
                onUpdate: () =>
                  cycleNodes.forEach((node, i) => {
                    if (pulsed.has(i) || cycleProxy.value < cycleStops[i]) return;
                    pulsed.add(i);
                    if (node.dataset.loopNode !== "posting")
                      pulse(node.querySelector("[data-loop-pulse]"), 0.5);
                  }),
              },
              "<",
            )
            .add(() => {
              setCurrent(true);
              pulse(svg.querySelector("[data-post-pulse]"));
            })
            .to(cycleParticle, { opacity: 0, duration: 0.3 })
            .fromTo(
              svg.querySelector("[data-loop-arrow]"),
              { opacity: 0 },
              { opacity: 1, duration: 0.3 },
              "<",
            );
          all<HTMLElement>("[data-difference-item]").forEach((item, i) =>
            gsap.from(item.children, {
              opacity: 0,
              x: i % 2 === 0 ? -12 : 12,
              duration: 0.4,
              delay: (i % 2) * 0.08,
              ease: panel,
              scrollTrigger: {
                trigger: item.querySelector("dt span"),
                start: "top 70%",
                once: true,
              },
            }),
          );
          for (const line of svg.querySelectorAll("[data-difference-line]"))
            gsap.from(line, {
              scaleX: 0,
              transformOrigin: desktop ? "center" : "left",
              duration: 0.4,
              ease: panel,
              scrollTrigger: {
                trigger: el.querySelector("#rb-diff-title"),
                start: "top 70%",
                once: true,
              },
            });
          ScrollTrigger.create({
            trigger: stage,
            start: () => stageTop + endY - innerHeight * 0.58,
            once: true,
            onEnter: () => pulse(svg.querySelector("[data-end-pulse]")),
          });
          all<HTMLElement>("[data-card]").forEach((card, i) => {
            gsap.from(card, {
              y: 12,
              opacity: 0,
              duration: DURATION.reveal,
              delay: i * 0.12,
              ease: reveal,
              scrollTrigger: { trigger: card, start: "top 90%", once: true },
            });
            if (!desktop)
              gsap.fromTo(
                card.querySelector("[data-card-line]"),
                { strokeDashoffset: 1 },
                {
                  strokeDashoffset: 0,
                  duration: 0.9,
                  ease: reveal,
                  scrollTrigger: { trigger: card, start: "top 80%", once: true },
                },
              );
          });
          all<HTMLImageElement>("[data-fog]").forEach((fog) =>
            gsap.fromTo(
              fog,
              { yPercent: fog.dataset.fog === "0" ? -15 : 15 },
              {
                yPercent: fog.dataset.fog === "0" ? 15 : -15,
                ease: "none",
                scrollTrigger: {
                  trigger: fog,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  onToggle: (self) => {
                    fog.style.willChange = self.isActive ? "transform" : "auto";
                  },
                },
              },
            ),
          );
          const pageshow = () => {
            ScrollTrigger.refresh();
            refresh();
            update(scrollY);
          };
          window.addEventListener("pageshow", pageshow);
          void document.fonts.ready.then(() => {
            if (alive) ScrollTrigger.refresh();
          });
          return () => {
            observer.disconnect();
            window.removeEventListener("pageshow", pageshow);
            calm.kill();
            follow.tween.kill();
            rippleTo.tween.kill();
            delete el.dataset.motion;
            delete el.dataset.railFixed;
            delete el.dataset.railHidden;
            setCurrent(true);
            stepElements.forEach((item) => {
              item.dataset.state = "reached";
              item.removeAttribute("aria-current");
            });
            all<SVGElement>("[data-process-node]").forEach(
              (n) => (n.dataset.state = "reached"),
            );
            bars.forEach((b) => (b.dataset.reached = "true"));
            counter.textContent = "06";
            lines.forEach((line) => {
              line.style.removeProperty("stroke-dasharray");
              line.style.removeProperty("stroke-dashoffset");
            });
            clip.setAttribute("height", String(svg.viewBox.baseVal.height));
            head.style.opacity = "0";
            dawn.style.removeProperty("opacity");
            windows.style.removeProperty("opacity");
            reflection.style.removeProperty("filter");
          };
        },
      );
      return () => {
        alive = false;
        media.revert();
        el.removeEventListener("rb:select", select);
      };
    },
    { scope: root },
  );
  return (
    <div
      ref={root}
      className={styles.page}
      lang="ja"
      data-revenue-brand
      data-acquisition="ota"
      data-photo="room"
    >
      {children}
    </div>
  );
}
