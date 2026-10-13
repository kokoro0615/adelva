"use client";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { EASE_REVEAL, EASE_STATE, DURATION, cubicBezier } from "@/lib/motion";
import { viewfinderTargets, type PhotoId } from "@/content/adelva-revenue-brand";
import styles from "./revenue-brand.module.css";
gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);
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
/** Polyline of the table between two lengths, at most `budget` points.
 *  Whole plate units are finer than a CSS pixel on every layout. */
function subPath(lut: Sample[], from: number, to: number, budget: number) {
  const a = Math.max(0, from),
    b = Math.max(a, to);
  const stride = Math.max(1, Math.ceil((b - a) / STEP / budget));
  const start = pointAt(lut, a),
    end = pointAt(lut, b);
  let d = "M" + Math.round(start.x) + " " + Math.round(start.y);
  for (let i = Math.ceil(a / STEP); i * STEP < b && i < lut.length; i += stride)
    d += "L" + Math.round(lut[i].x) + " " + Math.round(lut[i].y);
  return d + "L" + Math.round(end.x) + " " + Math.round(end.y);
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
/** Share of a point hidden beneath text blocks (plate px rectangles), with a
 *  soft edge of `fade` units: the light dims as it slips under copy. */
function coverAt(
  rects: readonly (readonly number[])[],
  x: number,
  y: number,
  fade: number,
) {
  let cover = 0;
  for (const [rx, ry, rw, rh] of rects) {
    const dx = x < rx ? rx - x : x > rx + rw ? x - (rx + rw) : 0;
    const dy = y < ry ? ry - y : y > ry + rh ? y - (ry + rh) : 0;
    cover = Math.max(cover, 1 - Math.min(1, Math.max(dx, dy) / fade));
  }
  return cover;
}
/* WAAPI easings matching the GSAP ones used before (expo.out, power3.out). */
const EXPO_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const POWER3_OUT = "cubic-bezier(0.215, 0.61, 0.355, 1)";
/** Time constant (s) of the light following the reading line: an exponential,
 *  frame-rate independent follow that settles in about 0.2 s (R3). */
const FOLLOW_TAU = 0.065;
/** Lag behind the reading line (CSS px) that counts as full scroll energy;
 *  with FOLLOW_TAU this is reached at about 2200 px/s. */
const FULL_LAG = 150;
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
      const branchLuts = new Map<string, Sample[]>();
      for (const svg of all<SVGSVGElement>("[data-river]")) {
        const mode = svg.dataset.river!;
        const layer = svg.closest<HTMLElement>("[data-river-layer]")!;
        for (const node of svg.querySelectorAll<SVGGElement>("[data-branch-node]")) {
          const branch = layer.querySelector<SVGPathElement>(
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
          const selected = node.querySelector<SVGPathElement>(
            "path[data-selected-branch]",
          )!;
          selected.setAttribute("d", d);
          branchLuts.set(`${mode}:${node.dataset.branchNode}`, sample(selected).lut);
        }
      }
      // Set by the active layout while motion runs: sends a light from a chip.
      let sendBranchLight: ((id: string) => void) | null = null;
      const select = safe((event: Event) => {
        const { kind, id } = (event as CustomEvent<{ kind: string; id: string | null }>)
          .detail;
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
        } else if (motion && id) sendBranchLight?.(id);
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
          // Read once before anything is written: which one-shot chapter
          // moments a restored or deep-linked reading position has passed.
          const viewAtStart = innerHeight;
          const pastAtStart = (node: Element | null, at: number) =>
            !!node && node.getBoundingClientRect().top < viewAtStart * at;
          const ch1 = el.querySelector("#rb-ch1-title")!;
          const ch3 = el.querySelector("#rb-ch3-title")!;
          const photoGroup = el.querySelector('[data-chip-group="photo"]')!;
          const diffTitle = el.querySelector("#rb-diff-title")!;
          const past = {
            ch1: pastAtStart(ch1, 0.7),
            ch3: pastAtStart(ch3, 0.7),
            photo: pastAtStart(photoGroup, 0.7),
            differences: pastAtStart(diffTitle, 0.7),
            items: all<HTMLElement>("[data-difference-item]").map((item) =>
              pastAtStart(item.querySelector("dt span"), 0.7),
            ),
            cards: all<HTMLElement>("[data-card]").map((card) =>
              pastAtStart(card, 0.9),
            ),
          };
          el.dataset.motion = "on";
          const layer = svg.closest<HTMLElement>("[data-river-layer]")!;
          const path = layer.querySelector<SVGPathElement>('[data-main-line="core"]')!;
          const textRects = JSON.parse(layer.dataset.masks ?? "[]") as number[][];
          const [lakeTop, lakeBottom] = JSON.parse(
            layer.dataset.lake ?? "[0,0]",
          ) as number[];
          /* Moving layers: only their transforms and opacity change per frame. */
          const revealWindow = layer.querySelector<HTMLElement>("[data-reveal]")!;
          const revealContent = layer.querySelector<HTMLElement>(
            "[data-reveal-content]",
          )!;
          const head = layer.querySelector<HTMLElement>("[data-head]")!;
          const headGlow = head.querySelector<HTMLElement>("[data-head-glow]")!;
          const tails = Array.from(layer.querySelectorAll<HTMLElement>("[data-tail]"))
            .sort((a, b) => Number(a.dataset.tail) - Number(b.dataset.tail))
            .map((window) => ({
              window,
              clip: window.querySelector<HTMLElement>("[data-tail-clip]")!,
              content: window.querySelector<HTMLElement>("[data-tail-content]")!,
            }));
          const flow = layer.querySelector<SVGPathElement>("[data-flow]")!;
          const lantern = el.querySelector<HTMLElement>("[data-lantern]")!;
          const bands = all<HTMLElement>("[data-ripple-band]");
          const reflection = el.querySelector<HTMLElement>("[data-reflection]")!;
          const moving = [
            revealWindow,
            revealContent,
            head,
            headGlow,
            lantern,
            ...bands,
            ...tails.flatMap((t) => [t.window, t.clip, t.content]),
          ];
          const k = svg.viewBox.baseVal.width / (desktop ? 1440 : 390);
          const fx = { flare: 0 };
          let flowOffset = 0;
          type Waypoint = {
            len: number;
            x: number;
            y: number;
            kind: string;
            step?: number;
          };
          let waypoints: Waypoint[] = [];
          let passed = 0;
          let geometry = sample(path),
            ratio = 1,
            stageTop = 0,
            stageHeight = 1,
            viewHeight = innerHeight,
            endY = 1;
          let steps: number[] = [];
          let boundaries: number[] = [];
          let relatedTop = Infinity;
          let railThreshold = 700;
          let railAllowed = true;
          let cover = new Float32Array(1);
          let rippleFrom = 0,
            rippleTo = 0,
            rippleAmp = 0;
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
          const railLinks = all<HTMLAnchorElement>('[data-rail="desktop"] a');
          let railIndex = -1;
          /* Effects: HTML placed at stage points, animated with WAAPI. */
          const fxLayer = layer.querySelector<HTMLElement>("[data-fx]")!;
          const place = (node: HTMLElement, x: number, y: number) => {
            node.style.transform = `translate3d(${(x / ratio).toFixed(2)}px, ${(y / ratio).toFixed(2)}px, 0)`;
          };
          const burstSlots = Array.from(
            fxLayer.querySelectorAll<HTMLElement>("[data-burst]"),
          );
          const ringSlots = Array.from(
            fxLayer.querySelectorAll<HTMLElement>("[data-ring-slot]"),
          );
          let burstTurn = 0,
            ringTurn = 0;
          // Running effect animations per slot, cancelled on reuse. Kept here
          // because `getAnimations()` would force a style recalculation.
          const running = new Map<HTMLElement, Animation[]>();
          const restart = (slot: HTMLElement) => {
            for (const a of running.get(slot) ?? []) a.cancel();
            const list: Animation[] = [];
            running.set(slot, list);
            return list;
          };
          /* Ignition: two shock rings and a spray of sparks where the light
             arrives. Two burst groups are reused round-robin, so fast
             scrolling never piles up DOM or animations. */
          const burst = (x: number, y: number, strong = false) => {
            const group = burstSlots[burstTurn++ % burstSlots.length];
            const list = restart(group);
            place(group, x, y);
            const reach = strong ? 4 : 2.8;
            group.style.setProperty("--shock", String(11 * reach));
            group.querySelectorAll<HTMLElement>("[data-shock]").forEach((shock, i) =>
              list.push(
                shock.animate(
                  [
                    { transform: `scale(${(0.35 / reach).toFixed(3)})`, opacity: 1 },
                    { transform: "scale(1)", opacity: 0 },
                  ],
                  {
                    duration: strong ? 1250 : 950,
                    delay: i * 120,
                    easing: EXPO_OUT,
                    fill: "backwards",
                  },
                ),
              ),
            );
            const unit = k / ratio;
            const sparks = group.querySelectorAll<HTMLElement>("[data-spark]");
            sparks.forEach((spark, i) => {
              const angle =
                (i / sparks.length) * Math.PI * 2 + gsap.utils.random(-0.25, 0.25);
              const distance = (strong ? 40 : 26) * unit * gsap.utils.random(0.7, 1.3);
              list.push(
                spark.animate(
                  [
                    { transform: "translate(0, 0) scale(1)", opacity: 1 },
                    {
                      transform: `translate(${(Math.cos(angle) * distance).toFixed(1)}px, ${(Math.sin(angle) * distance).toFixed(1)}px) scale(0.2)`,
                      opacity: 0,
                    },
                  ],
                  { duration: gsap.utils.random(700, 1050), easing: POWER3_OUT },
                ),
              );
            });
          };
          /* A ring that widens once around an SVG node (its anchor circle). */
          const ring = (node: Element | null, duration = 0.6) => {
            if (!(node instanceof SVGCircleElement)) return null;
            const x = node.cx.baseVal.value,
              y = node.cy.baseVal.value;
            const slot = ringSlots[ringTurn++ % ringSlots.length];
            const disc = slot.firstElementChild as HTMLElement;
            const list = restart(slot);
            place(slot, x, y);
            slot.style.setProperty("--ring", String((node.r.baseVal.value * 2.2) / k));
            list.push(
              disc.animate(
                [
                  { transform: `scale(${(0.6 / 2.2).toFixed(3)})`, opacity: 0.9 },
                  { transform: "scale(1)", opacity: 0 },
                ],
                { duration: duration * 1600, easing: EXPO_OUT },
              ),
            );
            return { x, y };
          };
          const pulse = (node: Element | null, duration = 0.6) => {
            const at = ring(node, duration);
            if (at) burst(at.x, at.y, duration >= 0.6);
          };
          /* A small light travelling along a sampled path (transform only). */
          const particle = (
            kind: "branch" | "cycle",
            lut: Sample[],
            to: number,
            duration: number,
            ease: string,
            onStep?: (len: number) => void,
          ) => {
            const slot = fxLayer.querySelector<HTMLElement>(
              `[data-particle="${kind}"]`,
            )!;
            const dot = slot.firstElementChild as HTMLElement;
            const travel = { len: 0 };
            return gsap.to(travel, {
              len: to,
              duration,
              ease,
              onStart: () => {
                dot.style.opacity = "1";
              },
              onUpdate: () => {
                const p = pointAt(lut, travel.len);
                place(slot, p.x, p.y);
                onStep?.(travel.len);
              },
              onComplete: () => {
                dot.style.opacity = "0";
              },
            });
          };
          let branchRun: gsap.core.Tween | null = null;
          sendBranchLight = (id) => {
            const lut = branchLuts.get(`${mode}:${id}`);
            if (!lut) return;
            branchRun?.kill();
            const run = (branchRun = particle(
              "branch",
              lut,
              lut.at(-1)!.len,
              1.1,
              "power2.inOut",
            ));
            run.eventCallback("onComplete", () => {
              (
                fxLayer.querySelector('[data-particle="branch"] i') as HTMLElement
              ).style.opacity = "0";
              pulse(svg.querySelector("[data-confluence-pulse]"));
            });
          };
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
            counter.animate(
              [{ transform: "translateY(100%)" }, { transform: "none" }],
              {
                duration: 300,
                easing: cubicBezier(EASE_STATE),
              },
            );
          };
          const ignite = (w: Waypoint) => {
            const strong = w.kind === "process" || w.kind === "end";
            burst(w.x, w.y, strong);
            gsap.fromTo(
              fx,
              { flare: 1 },
              { flare: 0, duration: 1.2, ease: "power2.out", onUpdate: wake },
            );
            if (w.kind === "end") ring(layer.querySelector("[data-end-pulse]"));
            if (w.step) {
              // The node answers with a ring of its own (no SVG repaint).
              ring(
                layer.querySelector(
                  `[data-process-node="${w.step}"] .${styles.stepNode}`,
                ),
                0.5,
              );
              // The label arrives from the river side (a CSS animation, restarted).
              const item = el.querySelector<HTMLElement>(`li[data-step="${w.step}"]`);
              if (item) {
                item.removeAttribute("data-arrive");
                requestAnimationFrame(() =>
                  item.setAttribute("data-arrive", item.dataset.side ?? "right"),
                );
              }
            }
          };
          /* Writes are cached so a frame only touches what actually changed. */
          const written = new WeakMap<Element, Map<string, string>>();
          const write = (node: Element, key: string, value: string) => {
            let last = written.get(node);
            if (!last) written.set(node, (last = new Map()));
            if (last.get(key) === value) return;
            last.set(key, value);
            if (key.startsWith("@")) node.setAttribute(key.slice(1), value);
            else (node as HTMLElement).style.setProperty(key, value);
          };
          const round = (v: number, d = 2) => String(Math.round(v * 10 ** d) / 10 ** d);
          const px = (v: number) => v.toFixed(2);
          const shift = (node: HTMLElement, y: number) =>
            write(node, "transform", `translate3d(0, ${px(y)}px, 0)`);
          /* The scroll position is cached from the scroll event: nothing in
             the frame loop reads layout (R2). */
          let scrollTop = window.scrollY;
          let phaseScroll = scrollTop;
          let len = 0,
            energy = 0,
            ripplePhase = 0;
          const goal = () =>
            scrollTop <= 0
              ? 0
              : lengthAtY(
                  geometry.lut,
                  (scrollTop + viewHeight * 0.58 - stageTop) * ratio,
                );
          const render = () => {
            const at = Math.max(0, Math.min(geometry.total, len));
            const point = pointAt(geometry.lut, at);
            // The lower edge of every window is the head (CSS px in the stage).
            const edge = Math.round((point.y / ratio) * 100) / 100;
            const down = Math.round((edge - stageHeight) * 100) / 100;
            shift(revealWindow, down);
            shift(revealContent, -down);
            write(
              head,
              "transform",
              `translate3d(${px(point.x / ratio)}px, ${px(edge)}px, 0)`,
            );
            const visible = at > 1 && at < geometry.total - 1 && scrollTop > 0;
            const e = energy;
            // The light slips beneath copy instead of glowing through it.
            const clear =
              1 - (cover[Math.min(cover.length - 1, Math.round(at / STEP))] ?? 0);
            write(head, "opacity", visible ? round((0.8 + e * 0.2) * clear) : "0");
            write(
              headGlow,
              "transform",
              `scale(${round(1 + e * 0.7 + fx.flare * 0.5)})`,
            );
            tails.forEach(({ window: tail, clip, content }, i) => {
              const length =
                Math.round(
                  Math.min(edge, ([70, 170, 340][i] * k * (0.35 + e * 1.45)) / ratio) *
                    100,
                ) / 100;
              const up = Math.round((stageHeight - length) * 100) / 100;
              shift(tail, down);
              shift(clip, up);
              shift(content, -(down + up));
              write(
                tail,
                "opacity",
                visible ? round([0.95, 0.6, 0.28][i] * (0.55 + e * 0.45)) : "0",
              );
            });
            // The current repaints per frame, so it only runs on desktop.
            const flowing = desktop && visible && e > 0.02;
            if (flowing) {
              // Only the stretch between the top of the viewport and the head.
              const from = lengthAtY(geometry.lut, (scrollTop - stageTop) * ratio);
              write(flow, "@d", subPath(geometry.lut, from, at, 48));
              write(flow, "stroke-dashoffset", round(from + flowOffset, 1));
            }
            write(flow, "opacity", flowing ? round(Math.min(1, e * 1.6) * 0.85) : "0");
            write(
              lantern,
              "transform",
              `translate3d(${round(point.x / ratio, 1)}px, ${round(point.y / ratio, 1)}px, 0) translate(-50%, -50%) scale(${round(0.8 + e * 0.35 + fx.flare * 0.25)})`,
            );
            write(
              lantern,
              "opacity",
              visible
                ? round(Math.min(1, 0.38 + e * 0.5 + fx.flare * 0.35) * clear)
                : "0",
            );
            let reached = 0;
            while (reached < waypoints.length && at >= waypoints[reached].len - 0.5)
              reached++;
            if (reached > passed)
              waypoints.slice(Math.max(passed, reached - 2), reached).forEach(ignite);
            passed = reached;
            setStates(steps.filter((step) => at >= step).length);
            const p = Math.max(
              0,
              Math.min(1, (at - steps[3]) / (geometry.total - steps[3])),
            );
            write(dawn, "opacity", round(p * 0.55));
            write(windows, "opacity", round(p * 0.35));
            // The reflection ripples with the scroll's energy while in view.
            if (scrollTop > rippleFrom && scrollTop < rippleTo) {
              const amplitude = e * rippleAmp;
              bands.forEach((band, i) =>
                write(
                  band,
                  "transform",
                  `translate3d(${px(amplitude * Math.sin(ripplePhase + i * 2.094))}px, 0, 0)`,
                ),
              );
            }
            // Page position: the rail's dot, its chapter, and its visibility.
            if (railAllowed || scrollTop < railThreshold) {
              const progress = Math.max(
                0,
                Math.min(1, (scrollTop - stageTop) / (endY - viewHeight * 0.58)),
              );
              const dot = pointAt(railLut.lut, railLut.total * progress);
              write(railDot, "@cx", round(dot.x, 1));
              write(railDot, "@cy", round(dot.y, 1));
            }
            const index = Math.max(
              0,
              boundaries.filter((y) => scrollTop + viewHeight * 0.58 >= y).length - 1,
            );
            if (index !== railIndex) {
              railIndex = index;
              railLinks.forEach((a, i) => {
                if (i === index) a.setAttribute("aria-current", "location");
                else a.removeAttribute("aria-current");
              });
            }
            // Attributes on the page root restyle the whole subtree: write
            // only when a value actually changes.
            write(
              el,
              "@data-rail-fixed",
              String(railAllowed && scrollTop > railThreshold),
            );
            write(
              el,
              "@data-rail-hidden",
              String(scrollTop + viewHeight * 0.6 >= relatedTop),
            );
          };
          /* One frame loop, awake only while something is still moving. */
          let raf = 0,
            last = 0;
          const frame = (time: number) => {
            raf = 0;
            const dt = last ? Math.min(0.1, (time - last) / 1000) : 1 / 60;
            last = time;
            const target = goal();
            len += (target - len) * (1 - Math.exp(-dt / FOLLOW_TAU));
            // Energy is the light's lag behind the reader: it rises with
            // speed and fades as the light catches up (no velocity spikes
            // from irregular scroll sampling).
            const wanted = Math.min(1, Math.abs(target - len) / ratio / FULL_LAG);
            energy +=
              (wanted - energy) * (1 - Math.exp(-dt / (wanted > energy ? 0.06 : 0.28)));
            const moved = Math.abs(scrollTop - phaseScroll);
            phaseScroll = scrollTop;
            ripplePhase += moved * 0.045;
            flowOffset -= moved * ratio * 1.5;
            const settled =
              Math.abs(target - len) < 0.3 && energy < 0.004 && fx.flare <= 0;
            if (settled) {
              len = target;
              energy = 0;
              last = 0;
            }
            render();
            if (!settled) raf = requestAnimationFrame(frame);
          };
          function wake() {
            if (!raf) raf = requestAnimationFrame(frame);
          }
          const onScroll = () => {
            scrollTop = window.scrollY;
            wake();
          };
          const refresh = () => {
            geometry = sample(path);
            const r = stage.getBoundingClientRect();
            scrollTop = window.scrollY;
            phaseScroll = scrollTop;
            ratio = svg.viewBox.baseVal.height / r.height;
            stageHeight = r.height;
            railThreshold = 700 * (r.width / 390);
            railAllowed = desktop || innerWidth >= 600;
            stageTop = r.top + scrollTop;
            viewHeight = innerHeight;
            // Over the lake the river is a row of fine dots on still water:
            // the light glides there at 40% instead of burning like an orb.
            const lake = [[0, lakeTop, Infinity, lakeBottom - lakeTop]];
            cover = Float32Array.from(geometry.lut, (p) =>
              Math.max(
                coverAt(textRects, p.x, p.y, 60 * k),
                0.6 * coverAt(lake, p.x, p.y, 60 * k),
              ),
            );
            const reflected = reflection.getBoundingClientRect();
            rippleFrom = reflected.top + scrollTop - viewHeight;
            rippleTo = reflected.bottom + scrollTop;
            rippleAmp = Math.min(
              6,
              parseFloat(getComputedStyle(reflection).fontSize) * 0.11,
            );
            steps = Array.from(
              layer.querySelectorAll<SVGGElement>("[data-process-node]"),
            ).map((node) => {
              const dot = node.querySelector("circle")!;
              return nearest(
                geometry.lut,
                Number(dot.getAttribute("cx")),
                Number(dot.getAttribute("cy")),
              );
            });
            endY = geometry.lut.at(-1)!.y / ratio;
            const onRiver = (x: number, y: number) => {
              const at = nearest(geometry.lut, x, y);
              const p = pointAt(geometry.lut, at);
              return Math.hypot(p.x - x, p.y - y) < 24 * k ? at : null;
            };
            const candidates: Omit<Waypoint, "len">[] = [];
            layer
              .querySelectorAll<SVGGElement>("[data-process-node]")
              .forEach((node) => {
                const c = node.querySelector("circle")!;
                candidates.push({
                  x: Number(c.getAttribute("cx")),
                  y: Number(c.getAttribute("cy")),
                  kind: "process",
                  step: Number(node.dataset.processNode),
                });
              });
            layer.querySelectorAll<SVGElement>("[data-waypoint]").forEach((node) => {
              const x =
                node instanceof SVGCircleElement
                  ? node.cx.baseVal.value
                  : Number(node.dataset.waypointX);
              const y =
                node instanceof SVGCircleElement
                  ? node.cy.baseVal.value
                  : Number(node.dataset.waypointY);
              candidates.push({ x, y, kind: node.dataset.waypoint ?? "mark" });
            });
            // Loop stages that sit on the river itself light up as it passes.
            svg
              .querySelectorAll<SVGCircleElement>(
                `[data-loop-node] .${styles.loopNode}`,
              )
              .forEach((c) =>
                candidates.push({
                  x: c.cx.baseVal.value,
                  y: c.cy.baseVal.value,
                  kind: "loop",
                }),
              );
            const endRect = layer.querySelector<SVGRectElement>("[data-end] rect")!;
            candidates.push({
              x: endRect.x.baseVal.value + endRect.width.baseVal.value / 2,
              y: endRect.y.baseVal.value + endRect.height.baseVal.value / 2,
              kind: "end",
            });
            waypoints = candidates
              .map((c) => ({
                ...c,
                len: c.kind === "end" ? geometry.total - 2 : onRiver(c.x, c.y),
              }))
              .filter((w): w is Waypoint => w.len !== null)
              .sort((a, b) => a.len - b.len);
            boundaries = all<HTMLElement>(
              "#rb-hero,#rb-ch1,#rb-ch2,#rb-ch3,#rb-process",
            ).map((n) => n.getBoundingClientRect().top + scrollTop);
            relatedTop =
              el.querySelector<HTMLElement>("[data-related]")!.getBoundingClientRect()
                .top + scrollTop;
            // A reload, resize or history return lands on the reading line at
            // once and must not replay every ignition.
            len = goal();
            energy = 0;
            passed = waypoints.filter((w) => len >= w.len - 0.5).length;
            render();
          };
          refresh();
          window.addEventListener("scroll", onScroll, { passive: true });
          ScrollTrigger.addEventListener("refresh", refresh);
          /* One-shot chapter moments: played once when their trigger enters,
             or shown finished when the page opens past them. */
          const once = (
            timeline: gsap.core.Timeline,
            trigger: Element,
            wasPast: boolean,
            finish?: () => void,
          ) => {
            if (wasPast) {
              timeline.progress(1, true);
              finish?.();
              return;
            }
            ScrollTrigger.create({
              trigger,
              start: "top 70%",
              once: true,
              onEnter: () => void timeline.play(),
            });
          };
          if (scrollY <= 100) {
            const heroTl = gsap.timeline();
            const sourcePaths = Array.from(
              layer.querySelectorAll<SVGPathElement>("[data-source-line]"),
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
                // Grow the radius, not a transform: the node's CSS
                // `transform-box: fill-box` breaks GSAP's SVG origin math.
                { attr: { r: 0 }, opacity: 0 },
                {
                  attr: { r: Number(dot?.getAttribute("r")) },
                  opacity: 1,
                  duration: 0.3,
                  ease: "back.out(1.6)",
                },
                0.7 + i * 0.08,
              );
              heroTl.fromTo(
                chip,
                { opacity: 0, y: 6 },
                { opacity: 1, y: 0, duration: 0.3, ease: panel },
                0.85 + i * 0.08,
              );
            });
          }
          const ch1Tl = gsap.timeline({ paused: true });
          ch1Tl
            .fromTo(
              layer.querySelectorAll("[data-tributary]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: reveal },
              0,
            )
            .fromTo(
              layer.querySelectorAll("[data-tributary-glow]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: reveal },
              0,
            )
            // Grow the radius, not a transform: these nodes carry CSS
            // `transform-box: fill-box` for the hover scale, which GSAP's SVG
            // origin math does not expect (they flew in from far off-river).
            .from(
              layer.querySelectorAll("[data-ch1-node]"),
              { attr: { r: 0 }, duration: 0.24, stagger: 0.06, ease: reveal },
              0.15,
            )
            .fromTo(
              layer.querySelectorAll("[data-leader]"),
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.3, stagger: 0.06, ease: panel },
              0.15,
            )
            .add(() => pulse(layer.querySelector("[data-confluence-pulse]")), 1.5)
            .fromTo(
              el.querySelector("[data-revenue-chip]"),
              { opacity: 0, y: 6 },
              { opacity: 1, y: 0, duration: 0.3, ease: panel },
              1.6,
            );
          once(ch1Tl, ch1, past.ch1);
          const frame0 = layer.querySelector<SVGGElement>("[data-viewfinder]")!;
          const initialTarget = viewfinderTargets[mode].room;
          const center = [
            (initialTarget[0] + initialTarget[2]) / 2,
            (initialTarget[1] + initialTarget[3]) / 2,
          ];
          const finderTl = gsap.timeline({ paused: true });
          frame0.querySelectorAll<SVGPathElement>("[data-corner]").forEach((corner) => {
            const end = corner.getAttribute("transform")!;
            const [x, y] = end.match(/[-\d.]+/g)!.map(Number);
            finderTl.fromTo(
              corner,
              {
                attr: {
                  transform: `translate(${center[0] + (x - center[0]) * 1.15} ${center[1] + (y - center[1]) * 1.15})`,
                },
              },
              { attr: { transform: end }, duration: 0.4, ease: panel },
              0,
            );
          });
          finderTl.fromTo(
            frame0,
            { opacity: 0 },
            { opacity: 1, duration: 0.4, ease: panel },
            0,
          );
          once(finderTl, photoGroup, past.photo);
          const cycle = layer.querySelector<SVGPathElement>("[data-cycle]")!,
            cycleGeo = sample(cycle),
            posting = layer.querySelector<SVGCircleElement>(
              '[data-loop-node="posting"] circle',
            )!;
          const postLength = nearest(
            cycleGeo.lut,
            posting.cx.baseVal.value,
            posting.cy.baseVal.value,
          );
          const cycleNodes = Array.from(
            layer.querySelectorAll<SVGGElement>("[data-loop-node]"),
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
          if (!past.ch3) setCurrent(false);
          const loopTl = gsap.timeline({ paused: true });
          loopTl
            .fromTo(
              [
                layer.querySelector("[data-loop-other]"),
                layer.querySelector("[data-loop-other-glow]"),
              ],
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 0.9, ease: reveal },
            )
            .add(
              particle("cycle", cycleGeo.lut, postLength, 1.6, "power1.inOut", (at) =>
                cycleNodes.forEach((node, i) => {
                  if (pulsed.has(i) || at < cycleStops[i]) return;
                  pulsed.add(i);
                  if (node.dataset.loopNode !== "posting")
                    pulse(node.querySelector("[data-loop-pulse]"), 0.5);
                }),
              ),
            )
            .add(() => {
              setCurrent(true);
              pulse(layer.querySelector("[data-post-pulse]"));
            })
            .fromTo(
              layer.querySelector("[data-loop-arrow]"),
              { opacity: 0 },
              { opacity: 1, duration: 0.3 },
            );
          once(loopTl, ch3, past.ch3, () => setCurrent(true));
          all<HTMLElement>("[data-difference-item]").forEach((item, i) => {
            if (past.items[i]) return;
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
            });
          });
          if (!past.differences)
            for (const line of layer.querySelectorAll("[data-difference-line]"))
              gsap.from(line, {
                scaleX: 0,
                transformOrigin: desktop ? "center" : "left",
                duration: 0.4,
                ease: panel,
                scrollTrigger: { trigger: diffTitle, start: "top 70%", once: true },
              });
          all<HTMLElement>("[data-card]").forEach((card, i) => {
            if (past.cards[i]) return;
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
          // Mist parallax only where blending and layer moves are cheap (R4):
          // on phones and tablets the mist stays still.
          if (desktop)
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
          const pageshow = () => ScrollTrigger.refresh();
          window.addEventListener("pageshow", pageshow);
          void document.fonts.ready.then(() => {
            if (alive) ScrollTrigger.refresh();
          });
          return () => {
            window.removeEventListener("pageshow", pageshow);
            window.removeEventListener("scroll", onScroll);
            ScrollTrigger.removeEventListener("refresh", refresh);
            cancelAnimationFrame(raf);
            raf = 0;
            sendBranchLight = null;
            for (const list of running.values()) for (const a of list) a.cancel();
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
            for (const node of [...moving, flow])
              ["opacity", "transform", "stroke-dashoffset"].forEach((p) =>
                node.style.removeProperty(p),
              );
            dawn.style.removeProperty("opacity");
            windows.style.removeProperty("opacity");
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
