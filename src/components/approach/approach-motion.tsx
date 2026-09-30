"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { desktopGeometry, mobileGeometry } from "@/content/adelva-approach-page";
import { DURATION, EASE_REVEAL, EASE_STATE } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const span = (value: number, from: number, to: number) =>
  clamp01((value - from) / (to - from));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Page-space rectangle of an element, ignoring any transform it carries now. */
function pageBox(element: Element): Box {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    w: rect.width,
    h: rect.height,
  };
}

/**
 * Runs one motion setup. A failure leaves the server-rendered finished state
 * in place instead of unmounting the page: nothing here is needed to read it.
 */
function guarded<Args extends unknown[]>(
  setup: (...args: Args) => void | (() => void),
): (...args: Args) => void | (() => void) {
  return (...args) => {
    try {
      return setup(...args);
    } catch (error) {
      console.error("[approach] motion skipped", error);
    }
  };
}

/**
 * Motion for /approach.
 *
 * The server renders the finished, static descent — every photograph open,
 * every magnification line drawn, every bar at length — which is also the
 * reduced-motion and JavaScript-less page. Under `prefers-reduced-motion:
 * no-preference` this component adds, and on cleanup removes:
 *
 *   1. the hero settle: finder corners draw, the photograph eases 1→1.04,
 *      the rail's orange segment extends to 01;
 *   2. the dive: the hero pins while the page scrolls; the camera zooms into
 *      the finder, stage 01 opens out of it and lands where it rests;
 *   3. focus between stages: each next photograph opens from a finder-shaped
 *      window while its magnification lines track the window's corners;
 *   4. stage copy, the 06 hand-over, the fixed descent rail, the role bars,
 *      the integrated-support parallax and example line, the check marks.
 */
export function ApproachMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const reveal = CustomEase.create("ap-reveal", EASE_REVEAL.join(","));
      const state = CustomEase.create("ap-state", EASE_STATE.join(","));
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 1024px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        guarded((context: gsap.Context) => {
          const { desktop, motion } = context.conditions!;
          if (!motion) return;
          element.dataset.motion = "on";
          const cleanups: Array<() => void> = [];
          const geometry = desktop ? desktopGeometry : mobileGeometry;

          const q = <T extends Element = HTMLElement>(selector: string) =>
            element.querySelector<T>(selector);
          const qa = <T extends Element = HTMLElement>(selector: string) =>
            Array.from(element.querySelectorAll<T>(selector));

          const canvas = q("[data-canvas]")!;
          const hero = q("[data-hero]")!;
          const heroZoom = q("[data-hero-zoom]")!;
          const heroPush = q("[data-hero-push]")!;
          const heroNight = q("[data-hero-night]")!;
          const heroBody = q("[data-hero-body]")!;
          const heroRail = q("[data-rail]")!;
          const heroFinderLink = q("[data-hero-finder-link]")!;
          const heroFinder = q(`[data-hero-push] [data-finder="0"]`)!;
          const stagesEls = qa("[data-stage]");
          const frames = stagesEls.map((stage) =>
            stage.querySelector<HTMLElement>("[data-frame]")!,
          );
          const finders = qa("[data-finder]").filter((node) => node !== heroFinder);
          const diveFrame = q("[data-dive-frame]")!;
          const svg = q<SVGSVGElement>(
            `[data-lines="${desktop ? "desktop" : "mobile"}"]`,
          )!;
          const pairs = Array.from(
            svg.querySelectorAll<SVGGElement>("[data-line-pair]"),
          );
          const lineOf = (pair: number, side: "left" | "right") =>
            pairs[pair]!.querySelector<SVGLineElement>(`[data-side="${side}"]`)!;

          /* ---------------------------------------------------- geometry */

          /** Design unit in CSS px, and the canvas origin in page space. */
          let unit = 1;
          let origin = { x: 0, y: 0 };
          const toDesign = (x: number, y: number) =>
            [(x - origin.x) / unit, (y - origin.y) / unit] as const;

          interface PairBase {
            from: [readonly [number, number], readonly [number, number]];
            to: [readonly [number, number], readonly [number, number]];
          }
          let bases: PairBase[] = [];
          let framesPage: Box[] = [];
          let findersPage: Box[] = [];
          let heroFinderPage: Box = { x: 0, y: 0, w: 0, h: 0 };
          /** The hero's natural page top: where the dive pins it. */
          let pinStart = 0;

          /** Every pair of lines leaves a finder's lower corners for a frame's upper corners. */
          const measure = () => {
            const box = canvas.getBoundingClientRect();
            unit = box.width / geometry.width;
            origin = { x: box.left + window.scrollX, y: box.top + window.scrollY };
            framesPage = frames.map(pageBox);
            // The hero may be pinned (fixed) while this runs, so its finder is
            // measured against the hero and placed at the hero's natural top.
            const heroRect = hero.getBoundingClientRect();
            const linkRect = heroFinderLink.getBoundingClientRect();
            heroFinderPage = {
              x: linkRect.left + window.scrollX,
              y: linkRect.top - heroRect.top + pinStart,
              w: linkRect.width,
              h: linkRect.height,
            };
            // Finder i (1-based in the stages) frames photograph i; finder 0 is the hero's.
            findersPage = [heroFinderPage, ...finders.map(pageBox)];
            bases = framesPage.map((frame, index) => {
              const finder = findersPage[index]!;
              return {
                from: [
                  toDesign(finder.x, finder.y + finder.h),
                  toDesign(finder.x + finder.w, finder.y + finder.h),
                ],
                to: [toDesign(frame.x, frame.y), toDesign(frame.x + frame.w, frame.y)],
              };
            });
          };

          /** Per-pair live state, combined into one write per frame. */
          const pairState = geometry.photos.map(() => ({
            opacity: 1,
            finderScale: 1,
            window: null as null | {
              top: number;
              right: number;
              bottom: number;
              left: number;
            },
          }));

          const drawPair = (index: number) => {
            const base = bases[index];
            if (!base || !(unit > 0)) return;
            const live = pairState[index]!;
            const [fl, fr] = base.from;
            const cx = (fl[0] + fr[0]) / 2;
            const finder = findersPage[index]!;
            const fh = finder.h / unit;
            const cy = fl[1] - fh / 2;
            const s = live.finderScale;
            const scaled = (point: readonly [number, number]) =>
              [cx + (point[0] - cx) * s, cy + (point[1] - cy) * s] as const;
            const from = [scaled(fl), scaled(fr)] as const;
            const [tl, tr] = base.to;
            const inset = live.window ?? { top: 0, right: 0, bottom: 0, left: 0 };
            const to = [
              [tl[0] + inset.left / unit, tl[1] + inset.top / unit],
              [tr[0] - inset.right / unit, tr[1] + inset.top / unit],
            ] as const;
            (["left", "right"] as const).forEach((side, sideIndex) => {
              const line = lineOf(index, side);
              line.setAttribute("x1", from[sideIndex]![0].toFixed(2));
              line.setAttribute("y1", from[sideIndex]![1].toFixed(2));
              line.setAttribute("x2", to[sideIndex]![0].toFixed(2));
              line.setAttribute("y2", to[sideIndex]![1].toFixed(2));
            });
            pairs[index]!.style.opacity = String(live.opacity);
          };
          const drawAll = () => pairState.forEach((_, index) => drawPair(index));

          const magnification = (index: number) => {
            const [fx, fy, fw, fh] = geometry.finders[index]!;
            const [px, py, pw] = geometry.photos[index]!;
            return {
              left: [
                [fx, fy + fh],
                [px, py],
              ],
              right: [
                [fx + fw, fy + fh],
                [px + pw, py],
              ],
            } as const;
          };
          cleanups.push(() => {
            pairs.forEach((pair, index) => {
              pair.style.removeProperty("opacity");
              const line = magnification(index);
              (["left", "right"] as const).forEach((side, sideIndex) => {
                const node = lineOf(index, side);
                const points = sideIndex === 0 ? line.left : line.right;
                node.setAttribute("x1", String(points[0][0]));
                node.setAttribute("y1", String(points[0][1]));
                node.setAttribute("x2", String(points[1][0]));
                node.setAttribute("y2", String(points[1][1]));
              });
            });
          });
          /* ------------------------------------------------ 1. hero settle */

          const finderRect =
            heroFinder.querySelector<SVGRectElement>("[data-finder-rect]");
          const corners = Array.from(
            heroFinder.querySelectorAll<HTMLElement>("[data-corner]"),
          );
          const settle = gsap.timeline({ defaults: { ease: reveal } });
          if (finderRect) {
            settle.fromTo(
              finderRect,
              { strokeDasharray: 1, strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: DURATION.reveal },
              0.15,
            );
          }
          settle
            .fromTo(
              corners,
              { opacity: 0, scale: 0.4 },
              { opacity: 1, scale: 1, duration: DURATION.state, stagger: 0.05 },
              0.75,
            )
            .fromTo(
              heroPush,
              { scale: 1 },
              {
                scale: 1.04,
                duration: 2,
                ease: "power1.out",
                transformOrigin: () => {
                  const box = heroFinderLink.getBoundingClientRect();
                  const zoom = heroPush.getBoundingClientRect();
                  return `${box.left + box.width / 2 - zoom.left}px ${box.top + box.height / 2 - zoom.top}px`;
                },
              },
              0,
            )
            .fromTo(
              q("[data-rail-progress]"),
              { scaleY: 0 },
              { scaleY: 1, duration: DURATION.panel * 2, ease: state },
              0.35,
            )
            .fromTo(
              pairs[0]!.querySelectorAll("line"),
              { opacity: 0 },
              { opacity: 1, duration: DURATION.panel },
              1.05,
            );
          cleanups.push(() => {
            settle.kill();
            gsap.set([heroPush, ...corners, ...pairs[0]!.querySelectorAll("line")], {
              clearProps: "all",
            });
            finderRect?.style.removeProperty("stroke-dasharray");
            finderRect?.style.removeProperty("stroke-dashoffset");
          });

          /* ---------------------------------------------------- 2. the dive */

          const stage1 = stagesEls[0]!;
          const arrival = () =>
            desktop
              ? Math.max(84, (window.innerHeight - framesPage[0]!.h) / 2)
              : Math.min(96, Math.max(64, (window.innerHeight - framesPage[0]!.h) / 2));
          const diveDistance = () =>
            Math.max(
              1,
              framesPage[0]!.y -
                hero.getBoundingClientRect().top -
                window.scrollY -
                arrival(),
            );

          const lifted = [heroBody, heroRail, heroFinderLink];
          const dive = { p: 0 };
          /** Assigned once the dive tween exists; its trigger may render first. */
          let diveTrigger: ScrollTrigger | null = null;
          const applyDive = () => {
            if (!framesPage[0] || !(unit > 0) || !heroFinderPage.w) return;
            const p = dive.p;
            /* The veil follows the raw scroll position, so the hero is fully
               dark the moment the pin releases even while the zoom settles. */
            const raw = diveTrigger?.progress ?? p;
            const scroll = window.scrollY;
            const F0 = {
              x: heroFinderPage.x - window.scrollX,
              y: heroFinderPage.y - pinStart,
              w: heroFinderPage.w,
              h: heroFinderPage.h,
            };
            const frame = framesPage[0]!;
            const N = {
              x: frame.x - window.scrollX,
              y: frame.y - scroll,
              w: frame.w,
              h: frame.h,
            };
            const e = smooth(p);
            const w = F0.w * Math.pow(N.w / F0.w, e);
            const h = F0.h * Math.pow(N.h / F0.h, e);
            const g = (w - F0.w) / (N.w - F0.w || 1);
            const cx = F0.x + F0.w / 2 + (N.x + N.w / 2 - (F0.x + F0.w / 2)) * g;
            const cy = F0.y + F0.h / 2 + (N.y + N.h / 2 - (F0.y + F0.h / 2)) * g;
            const W = { x: cx - w / 2, y: cy - h / 2, w, h };

            // Stage 01 fills the window, uniformly scaled and clipped to it.
            if (p >= 0.999) {
              stage1.style.removeProperty("transform");
              stage1.style.removeProperty("clip-path");
              stage1.style.removeProperty("opacity");
            } else {
              const k = Math.max(W.w / N.w, W.h / N.h);
              const tx = W.x + W.w / 2 - (N.x + N.w / 2);
              const ty = W.y + W.h / 2 - (N.y + N.h / 2);
              const insetX = Math.max(0, (N.w - W.w / k) / 2);
              const insetY = Math.max(0, (N.h - W.h / k) / 2);
              stage1.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${k.toFixed(4)})`;
              stage1.style.clipPath = `inset(${insetY.toFixed(2)}px ${insetX.toFixed(2)}px)`;
              stage1.style.opacity = String(span(p, 0, 0.08));
            }

            // The camera: the hero photograph zooms so its finder becomes the window.
            const z = W.w / F0.w;
            const heroBox = hero.getBoundingClientRect();
            const c0x = F0.x + F0.w / 2 - heroBox.left;
            const c0y = F0.y + F0.h / 2 - heroBox.top;
            const tx = cx - heroBox.left - z * c0x;
            const ty = cy - heroBox.top - z * c0y;
            heroZoom.style.transform =
              p <= 0.0005
                ? ""
                : `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
            heroNight.style.opacity = String(smooth(span(Math.max(p, raw), 0.28, 1)));
            heroFinder.style.opacity = String(1 - span(p, 0, 0.06));

            const lift = span(p, 0, 0.36);
            for (const node of lifted) {
              node.style.opacity = String(1 - lift);
              node.style.transform = lift
                ? `translate3d(0, ${(-48 * lift).toFixed(2)}px, 0)`
                : "";
              node.style.pointerEvents = lift >= 1 ? "none" : "";
            }
            /* Once the pin releases, ScrollTrigger leaves the hero offset behind
               the stages; it is fully dark by then, so it steps out entirely. */
            hero.style.opacity = raw >= 0.999 ? "0" : "";

            pairState[0]!.opacity = 1 - span(p, 0, 0.1);
            pairState[1]!.opacity = span(p, 0.92, 1);
            drawPair(0);
            drawPair(1);

            const frameVisible = p > 0.004 && p < 0.995;
            diveFrame.style.visibility = frameVisible ? "visible" : "hidden";
            diveFrame.style.opacity = String(
              span(p, 0.004, 0.05) * (1 - span(p, 0.82, 0.99)),
            );
            diveFrame.style.transform = `translate3d(${W.x.toFixed(2)}px, ${W.y.toFixed(2)}px, 0)`;
            diveFrame.style.width = `${W.w.toFixed(2)}px`;
            diveFrame.style.height = `${W.h.toFixed(2)}px`;
          };

          /* ------------------------------------ 3. focus between stages */

          interface Focus {
            q: number;
          }
          const focus: Focus[] = frames.map(() => ({ q: 1 }));
          const photosOf = frames.map((frame) =>
            frame.querySelector<HTMLElement>("picture")!,
          );
          const applyFocus = (index: number) => {
            const frame = framesPage[index];
            if (!frame || !findersPage[index]?.h) return;
            const value = focus[index]!.q;
            const e = smooth(value);
            const finder = findersPage[index]!;
            const aspect = finder.w / finder.h;
            let w0 = frame.w * 0.32;
            let h0 = w0 / aspect;
            if (h0 > frame.h * 0.9) {
              h0 = frame.h * 0.9;
              w0 = h0 * aspect;
            }
            const w = w0 + (frame.w - w0) * e;
            const h = h0 + (frame.h - h0) * e;
            const inset = {
              top: (frame.h - h) / 2,
              bottom: (frame.h - h) / 2,
              left: (frame.w - w) / 2,
              right: (frame.w - w) / 2,
            };
            const node = frames[index]!;
            if (value >= 0.999) {
              node.style.removeProperty("clip-path");
              photosOf[index]!.style.removeProperty("transform");
              pairState[index]!.window = null;
            } else {
              node.style.clipPath = `inset(${inset.top.toFixed(2)}px ${inset.right.toFixed(2)}px ${inset.bottom.toFixed(2)}px ${inset.left.toFixed(2)}px)`;
              photosOf[index]!.style.transform =
                `scale(${(1 + 0.25 * (1 - e)).toFixed(4)})`;
              pairState[index]!.window = inset;
            }
            // The finder that framed this photograph settles as it opens.
            const previousFinder = finders[index - 1];
            const s = 1 + 0.08 * (1 - e);
            pairState[index]!.finderScale = s;
            if (previousFinder)
              previousFinder.style.transform =
                s > 1.0005 ? `scale(${s.toFixed(4)})` : "";
            drawPair(index);
          };

          /* ------------------------------------------------ refresh wiring */

          const resetTransforms = () => {
            stage1.style.removeProperty("transform");
            stage1.style.removeProperty("clip-path");
            frames.forEach((frame) => frame.style.removeProperty("clip-path"));
            finders.forEach((finder) => finder.style.removeProperty("transform"));
            lifted.forEach((node) => node.style.removeProperty("transform"));
          };
          const onRefreshInit = () => resetTransforms();
          ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
          cleanups.push(() =>
            ScrollTrigger.removeEventListener("refreshInit", onRefreshInit),
          );

          // Address-bar resizes on touch devices must not re-measure the pinned dive.
          ScrollTrigger.config({ ignoreMobileResize: true });
          cleanups.push(() => ScrollTrigger.config({ ignoreMobileResize: false }));

          measure();

          const diveTween = gsap.to(dive, {
            p: 1,
            ease: "none",
            onUpdate: applyDive,
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${diveDistance()}`,
              pin: hero,
              pinSpacing: false,
              scrub: desktop ? 0.4 : 0.5,
              invalidateOnRefresh: true,
            },
          });
          diveTrigger = diveTween.scrollTrigger ?? null;
          cleanups.push(() => diveTween.kill());
          /* The hero's links stay in the tab order while it is lifted away; a
             keyboard user returning to them brings the page back to the top,
             where they are visible again. */
          const onHeroFocus = () => {
            if (window.scrollY > 1) window.scrollTo({ top: 0, behavior: "instant" });
          };
          hero.addEventListener("focusin", onHeroFocus);
          cleanups.push(() => hero.removeEventListener("focusin", onHeroFocus));

          frames.forEach((frame, index) => {
            if (index === 0) return;
            const tween = gsap.fromTo(
              focus[index]!,
              { q: 0 },
              {
                q: 1,
                ease: "none",
                onUpdate: () => applyFocus(index),
                scrollTrigger: {
                  trigger: frame,
                  start: "top bottom",
                  end: "top 42%",
                  scrub: 0.4,
                },
              },
            );
            cleanups.push(() => tween.kill());
          });

          const onRefresh = () => {
            resetTransforms();
            pinStart = diveTrigger?.start ?? 0;
            measure();
            drawAll();
            applyDive();
            frames.forEach((_, index) => index > 0 && applyFocus(index));
          };
          ScrollTrigger.addEventListener("refresh", onRefresh);
          cleanups.push(() => ScrollTrigger.removeEventListener("refresh", onRefresh));

          cleanups.push(() => {
            resetTransforms();
            heroZoom.style.removeProperty("transform");
            heroNight.style.removeProperty("opacity");
            heroFinder.style.removeProperty("opacity");
            for (const node of lifted) {
              node.style.removeProperty("opacity");
              node.style.removeProperty("transform");
              node.style.removeProperty("pointer-events");
            }
            hero.style.removeProperty("opacity");
            stage1.style.removeProperty("opacity");
            photosOf.forEach((photo) => photo.style.removeProperty("transform"));
            finders.forEach((finder) => finder.style.removeProperty("transform"));
            diveFrame.removeAttribute("style");
          });

          /* ------------------------------------------------ 4. stage copy */

          stagesEls.forEach((stage, index) => {
            const text = stage.querySelectorAll<HTMLElement>(
              "[data-stage-text] [data-reveal]",
            );
            gsap.set(text, { opacity: 0, y: 8 });
            const play = () =>
              gsap.to(text, {
                opacity: 1,
                y: 0,
                duration: DURATION.state,
                ease: state,
                stagger: 0.06,
                overwrite: true,
              });
            if (index === 0) {
              // Stage 01 arrives through the dive; its copy follows the landing.
              ScrollTrigger.create({
                trigger: stage,
                start: () =>
                  `top ${Math.round(arrival() + stage.offsetHeight * 0.35)}px`,
                once: true,
                onEnter: play,
              });
            } else {
              ScrollTrigger.create({
                trigger:
                  index === stagesEls.length - 1
                    ? stage.querySelector("[data-stage-text]")!
                    : stage,
                start: index === stagesEls.length - 1 ? "top 88%" : "top 46%",
                once: true,
                onEnter: play,
              });
            }
          });
          cleanups.push(() => {
            gsap.set(element.querySelectorAll("[data-stage-text] [data-reveal]"), {
              clearProps: "opacity,transform",
            });
          });

          /* ------------------------------------------ 5. the 06 hand-over */

          const final = stagesEls[stagesEls.length - 1]!;
          const clientFinder = final.querySelector<HTMLElement>("[data-finder]");
          const clientRect =
            clientFinder?.querySelector<SVGRectElement>("[data-finder-rect]");
          const clientCorners = clientFinder
            ? Array.from(clientFinder.querySelectorAll("[data-corner]"))
            : [];
          const rules = [
            final.querySelector("[data-rule-adelva]"),
            final.querySelector("[data-rule-client]"),
          ].filter((node): node is Element => node !== null);
          const [ruleAdelva, ruleClient] = rules;
          gsap.set(rules, { scaleX: 0 });
          if (clientRect)
            gsap.set(clientRect, { strokeDasharray: 1, strokeDashoffset: 1 });
          gsap.set(clientCorners, { opacity: 0 });
          const handover = gsap.timeline({
            paused: true,
            defaults: { ease: reveal },
          });
          if (clientRect)
            handover.to(
              clientRect,
              { strokeDashoffset: 0, duration: DURATION.reveal },
              0,
            );
          handover.to(
            clientCorners,
            { opacity: 1, duration: DURATION.state, stagger: 0.05 },
            0.7,
          );
          if (ruleAdelva)
            handover.to(
              ruleAdelva,
              { scaleX: 1, duration: 0.6, ease: "power2.inOut" },
              0.2,
            );
          if (ruleClient)
            handover.to(
              ruleClient,
              { scaleX: 1, duration: 0.6, ease: "power2.out" },
              0.8,
            );
          ScrollTrigger.create({
            trigger: final,
            start: "top 55%",
            once: true,
            onEnter: () => handover.play(),
          });
          cleanups.push(() => {
            handover.kill();
            gsap.set([...rules, ...clientCorners], { clearProps: "all" });
            if (clientRect) gsap.set(clientRect, { clearProps: "all" });
          });

          /* ---------------------------------------- 6. fixed descent rail */

          const railFixed = q("[data-descent-rail]")!;
          const railFill = q("[data-descent-rail-fill]")!;
          const railDots = qa("[data-rail-dot]");
          const heroStops = qa("[data-rail] a");
          let railShown = false;
          const showRail = (show: boolean) => {
            if (show === railShown) return;
            railShown = show;
            gsap.to(railFixed, {
              autoAlpha: show ? 1 : 0,
              duration: DURATION.state,
              ease: state,
              overwrite: true,
            });
          };
          const railTrigger = ScrollTrigger.create({
            trigger: stagesEls[0]!,
            // Appears as the dive lands, not while the camera is still descending.
            start: () => `top ${Math.round(arrival() + 60)}px`,
            endTrigger: final,
            end: "bottom 35%",
            onToggle: (self) => showRail(self.isActive),
            onUpdate: () => {
              const middle = window.innerHeight * 0.5;
              let current = 0;
              stagesEls.forEach((stage, index) => {
                if (stage.getBoundingClientRect().top < middle) current = index;
              });
              railDots.forEach((dot, index) => {
                dot.dataset.state =
                  index < current
                    ? "passed"
                    : index === current
                      ? "current"
                      : "upcoming";
              });
              heroStops.forEach((stop, index) => {
                if (index === current) stop.setAttribute("data-current", "");
                else stop.removeAttribute("data-current");
              });
              gsap.to(railFill, {
                scaleY: current / (railDots.length - 1),
                duration: DURATION.panel,
                ease: state,
                overwrite: true,
              });
              if (current === railDots.length - 1) railFixed.dataset.client = "";
              else delete railFixed.dataset.client;
            },
          });
          cleanups.push(() => {
            railTrigger.kill();
            gsap.set(railFixed, { clearProps: "all" });
            gsap.set(railFill, { clearProps: "all" });
            railDots.forEach((dot) => delete dot.dataset.state);
            delete railFixed.dataset.client;
            heroStops.forEach((stop, index) =>
              index === 0
                ? stop.setAttribute("data-current", "")
                : stop.removeAttribute("data-current"),
            );
          });

          /* ----------------------------------------------- 7. role bars */

          const bars = ["manager", "owner", "partners", "adelva"].flatMap((id) =>
            qa(`[data-role="${id}"] [data-bar]`),
          );
          const adelvaBar = q(`[data-role="adelva"] [data-bar]`);
          gsap.set(bars, { scaleX: 0 });
          const barsTimeline = gsap.timeline({ paused: true });
          bars.forEach((bar, index) => {
            barsTimeline.to(
              bar,
              {
                scaleX: 1,
                duration: bar === adelvaBar ? 0.6 : DURATION.panel,
                ease: bar === adelvaBar ? "power2.inOut" : reveal,
              },
              index * 0.08 + (bar === adelvaBar ? 0.16 : 0),
            );
          });
          ScrollTrigger.create({
            trigger: q('[data-section="responsibilities"]')!,
            start: "top 62%",
            once: true,
            onEnter: () => barsTimeline.play(),
          });
          cleanups.push(() => {
            barsTimeline.kill();
            gsap.set(bars, { clearProps: "transform" });
          });

          /* ---------------------------------- 8. integrated support */

          const integratedMedia = q("[data-integrated-media]");
          const integratedPicture = integratedMedia?.querySelector("picture");
          if (integratedMedia && integratedPicture) {
            gsap.fromTo(
              integratedPicture,
              { yPercent: -5, scale: 1.1 },
              {
                yPercent: 5,
                scale: 1.1,
                ease: "none",
                scrollTrigger: {
                  trigger: integratedMedia,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
            cleanups.push(() =>
              gsap.set(integratedPicture, { clearProps: "transform" }),
            );
          }
          const exampleLine = q("[data-example-line]");
          const exampleItems = qa("[data-example-item]");
          const exampleBrackets = exampleItems
            .map((item) => item.querySelector("i"))
            .filter((node): node is HTMLElement => node !== null);
          if (exampleLine) {
            gsap.set(exampleLine, { scaleX: 0 });
            gsap.set(exampleBrackets, { scale: 0.6, opacity: 0 });
            const lineBox = () => exampleLine.getBoundingClientRect();
            const example = gsap.timeline({ paused: true });
            example.to(
              exampleLine,
              { scaleX: 1, duration: 0.9, ease: "power1.inOut" },
              0,
            );
            exampleItems.forEach((item, index) => {
              const at = () => {
                const line = lineBox();
                const box = item.getBoundingClientRect();
                return (
                  (0.9 * (box.left + box.width / 2 - line.left)) / (line.width || 1)
                );
              };
              const bracket = exampleBrackets[index];
              if (!bracket) return;
              example.to(
                bracket,
                { scale: 1, opacity: 1, duration: 0.16, ease: state },
                at(),
              );
            });
            ScrollTrigger.create({
              trigger: q("[data-example]")!,
              start: "top 82%",
              once: true,
              onEnter: () => example.play(),
            });
            cleanups.push(() => {
              example.kill();
              gsap.set([exampleLine, ...exampleBrackets], { clearProps: "all" });
            });
          }

          /* -------------------------------------------- 9. check marks */

          const marks = qa("[data-check-mark]");
          gsap.set(marks, { opacity: 0, scale: 0.72 });
          const marksTimeline = gsap.to(marks, {
            paused: true,
            opacity: 1,
            scale: 1,
            duration: DURATION.state,
            ease: reveal,
            stagger: 0.08,
          });
          ScrollTrigger.create({
            trigger: q('[data-section="verification"]')!,
            start: "top 70%",
            once: true,
            onEnter: () => marksTimeline.play(),
          });
          cleanups.push(() => {
            marksTimeline.kill();
            gsap.set(marks, { clearProps: "all" });
          });

          /* ------------------------------------------- initial frame */

          onRefresh();
          const fontsReady = document.fonts?.ready;
          let active = true;
          void fontsReady?.then(() => active && ScrollTrigger.refresh());
          cleanups.push(() => {
            active = false;
          });

          return () => {
            delete element.dataset.motion;
            cleanups.reverse().forEach((cleanup) => cleanup());
          };
        }),
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} data-approach-motion>
      {children}
    </div>
  );
}
