"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  chapters,
  geometry,
  media,
  stepStates,
} from "@/content/adelva-dx-it-procurement";
import { DURATION, EASE_REVEAL, EASE_WIPE } from "@/lib/motion";

gsap.registerPlugin(useGSAP, CustomEase, ScrollTrigger, SplitText);
const numbers = ["17", "19", "18", "20"] as const;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
type Box = { top: number; bottom: number; left: number; width: number };

/** Errors in optional decoration restore the same completed page as SSR. */
function guarded(action: () => void, restore: () => void) {
  return () => {
    try {
      action();
    } catch (error) {
      restore();
      console.error("[dx-it-procurement] motion skipped", error);
    }
  };
}
export function DxItProcurementMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = <T extends Element = HTMLElement>(s: string) => el.querySelector<T>(s)!;
      const all = <T extends Element = HTMLElement>(s: string) => [
        ...el.querySelectorAll<T>(s),
      ];
      const mm = gsap.matchMedia();
      let alive = true;

      /* Geometry only: runs for reduced motion too, once per font/resize/refresh,
       never in a frame's scroll update. SVG coordinates use the same plates. */
      const measureLeaders = () => {
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        const plane = q(
          desktop ? "[data-scene]" : "[data-body]",
        ).getBoundingClientRect();
        const scale = plane.width / (desktop ? 1536 : 780);
        if (!scale) return;
        numbers.forEach((number) => {
          const label = q(`[data-row-name="${number}"]`).getBoundingClientRect();
          const target = desktop
            ? geometry.desktop.map.leaderTargets[number]
            : [681, geometry.mobile.coreDots[number]];
          const start = (label.right - plane.left) / scale + (desktop ? 19.2 : 18);
          q<SVGPathElement>(
            `[data-variant="${desktop ? "desktop" : "mobile"}"][data-leader="${number}"] [data-line]`,
          ).setAttribute(
            "d",
            `M${Math.min(start, target[0] - 12)} ${target[1]}H${target[0]}`,
          );
        });
        if (!desktop) {
          const process = q("[data-process]").getBoundingClientRect();
          all("li[data-step]").forEach((step, i) => {
            const head = step.querySelector<HTMLElement>("h3")!.getBoundingClientRect();
            const end = Math.max(
              head.right,
              step.querySelector("svg")!.getBoundingClientRect().right,
            );
            const x = Math.min((end - process.left) / scale + 16, 604);
            const y = geometry.mobile.boxes[i].centerY - 7340;
            q<SVGPathElement>(
              `[data-landings="mobile"] [data-step-line="${i + 1}"]`,
            ).setAttribute("d", `M${x} ${y}H626`);
          });
        }
      };
      const observer = new ResizeObserver(measureLeaders);
      observer.observe(q("[data-column]"));
      void document.fonts.ready.then(() => alive && measureLeaders());

      mm.add(
        {
          desktop: "(min-width: 1024px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (!context.conditions?.motion) return;
          const desktop = Boolean(context.conditions.desktop);
          const variant = desktop ? "desktop" : "mobile";
          const reveal = CustomEase.create("dx-reveal", EASE_REVEAL.join(","));
          const wipe = CustomEase.create("dx-wipe", EASE_WIPE.join(","));
          const process = q("[data-process]");
          const steps = all("li[data-step]");
          const landings = all<SVGElement>(
            `[data-landings="${variant}"] [data-landing]`,
          );
          const clips = all("[data-off-clip]");
          const clip = q(`[data-off-clip="${variant}"]`);
          const windowEl = q(`[data-off-window="${variant}"]`);
          const strip = q(`[data-off-strip="${variant}"]`);
          const particle = q(`[data-tip="${variant}"]`);
          const dawn = q(`[data-dawn="${variant}"]`);
          const warm = q("[data-dawn-warm]");
          const veils = all<SVGElement>(
            desktop ? "[data-room-veil]" : "[data-mobile-room]",
          );
          const leaders = numbers.map((n) =>
            q<SVGGElement>(`[data-variant="${variant}"][data-leader="${n}"]`),
          );
          const paths = leaders.map((g) =>
            g.querySelector<SVGPathElement>("[data-line]")!,
          );
          const powerOff = q<SVGImageElement>("[data-power-off]");
          const centers = (
            desktop ? geometry.desktop.process : geometry.mobile
          ).boxes.map((b) => b.centerY);
          const end = desktop ? 1262 : 10004;
          const start = desktop ? 0 : 440;
          const ride = { y: start };
          let maxTip = start,
            current = -2,
            chapter = -2,
            stopped = false,
            focusCompleted = false;
          let scale = 1,
            vh = innerHeight,
            plane: Box = { top: 0, bottom: 0, left: 0, width: 0 };
          let sectionBoxes: Box[] = [],
            panelTop = 0,
            titleTop = 0;
          let tracker: ScrollTrigger | undefined;
          let split: SplitText | undefined;
          const timelines: gsap.core.Timeline[] = [];
          const cleanups: Array<() => void> = [];
          const touched = new Map<Element, string | null>();
          const remember = (node: Element) => {
            if (!touched.has(node)) touched.set(node, node.getAttribute("style"));
          };
          const preserve = (s: string) => {
            all(s).forEach(remember);
          };
          preserve(
            "[data-off-clip], [data-off-window], [data-off-strip], [data-tip], [data-dawn], [data-dawn-warm], [data-power-off], [data-power-room], [data-power-path], [data-power-particle], [data-room-veil], [data-mobile-room], [data-mobile-staff], [data-line], [data-dot], [data-dot-halo], [data-handoff], [data-handoff-node], [data-mobile-handoff], [data-room-edge], [data-hover-particle], [data-boundaries-body], [data-pair-item], [data-pair-rule], [data-pairs-rule], [data-heading-rule], [data-heading-node]",
          );
          const finish = () => {
            stopped = true;
            tracker?.kill();
            timelines.forEach((t) => t.kill());
            gsap.killTweensOf(ride);
            touched.forEach((originalStyle, node) => {
              gsap.killTweensOf(node);
              if (originalStyle === null) node.removeAttribute("style");
              else node.setAttribute("style", originalStyle);
            });
            clips.forEach((node) => node.style.removeProperty("display"));
            powerOff.removeAttribute("href");
            powerOff.style.display = "none";
            split?.revert();
            split = undefined;
            steps.forEach((node) => {
              node.dataset.state = "passed";
              node.removeAttribute("aria-current");
              delete node.dataset.reached;
            });
            all("[data-landing]").forEach((n) => (n.dataset.state = "passed"));
            all("[data-dim], [data-hover]").forEach((n) => {
              delete n.dataset.dim;
              delete n.dataset.hover;
            });
            all("[data-tick]").forEach((n, i) => {
              if (i === 0) n.dataset.current = "true";
              else delete n.dataset.current;
            });
            process.dataset.progress = "complete";
            delete process.dataset.tip;
            delete el.dataset.motion;
          };
          const protect = (fn: () => void) => guarded(fn, finish);
          const box = (node: Element): Box => {
            const r = node.getBoundingClientRect();
            return {
              top: r.top + scrollY,
              bottom: r.bottom + scrollY,
              left: r.left,
              width: r.width,
            };
          };
          const measure = () => {
            vh = innerHeight;
            plane = box(q(desktop ? "[data-process]" : "[data-body]"));
            scale = plane.width / (desktop ? 1536 : 780);
            sectionBoxes = all("[data-chapter]").map(box);
            panelTop = box(q("[data-boundaries-body]")).top;
            titleTop = box(q("[data-process-title]")).top;
            measureLeaders();
            apply();
          };
          const visited = new Set<number>();
          const apply = () => {
            if (stopped) return;
            const tip = clamp(ride.y, start, end);
            const shift = (tip - start) * scale;
            windowEl.style.transform = `translateY(${shift}px)`;
            strip.style.transform = `translateY(${-shift}px)`;
            particle.style.transform = `translateY(${tip * scale}px)`;
            particle.style.opacity = tip > start && tip < end ? "1" : "0";
            clip.style.opacity = tip >= end ? "0" : "1";
            const moving = tip < maxTip - 0.05;
            for (const layer of [windowEl, strip, particle])
              layer.style.willChange = moving ? "transform" : "auto";
            const states = stepStates(tip, centers, end);
            const next = states.indexOf("current");
            if (next !== current || tip >= end) {
              current = next;
              steps.forEach((node, i) => {
                if (node.dataset.state !== states[i]) node.dataset.state = states[i];
                if (states[i] === "current") {
                  node.setAttribute("aria-current", "step");
                  if (!visited.has(i)) {
                    visited.add(i);
                    node.dataset.reached = "true";
                  }
                } else node.removeAttribute("aria-current");
                landings[i].dataset.state = states[i];
              });
              process.dataset.progress =
                tip >= end ? "complete" : next < 0 ? "0" : String(next + 1);
            }
            process.dataset.tip = tip.toFixed(2);
            if (!desktop) {
              const roomTops = [1868, 3405, 4988];
              roomTops.forEach((top, i) => {
                if (tip >= top + 40 && !roomPlayed.has(i)) {
                  roomPlayed.add(i);
                  roomTimelines[i].play();
                }
              });
              numbers.forEach((n, i) => {
                if (tip >= geometry.mobile.coreDots[n]) drawLine(i);
              });
              if (tip >= 2260 && !handoffPlayed) {
                handoffPlayed = true;
                handoff.play();
              }
            }
          };
          const quick = gsap.quickTo(ride, "y", {
            duration: 0.5,
            ease: "power3.out",
            onUpdate: protect(apply),
          });
          const drawn = new Set<number>();
          const lineTimelines = leaders.map((group, i) => {
            const tl = gsap.timeline({ paused: true });
            if (desktop)
              tl.fromTo(
                paths[i],
                { strokeDashoffset: 1 },
                { strokeDashoffset: 0, duration: 0.4, ease: reveal },
              );
            else
              tl.fromTo(
                paths[i],
                { scaleX: 0, transformOrigin: "left center", transformBox: "fill-box" },
                { scaleX: 1, duration: 0.3, ease: reveal },
              );
            tl.fromTo(
              group.querySelector("[data-dot]"),
              { scale: 1 },
              { scale: 1.7, duration: 0.3, repeat: 1, yoyo: true, ease: reveal },
            );
            tl.fromTo(
              group.querySelector("[data-dot-halo]"),
              { opacity: 0.6 },
              { opacity: 0, duration: 0.6 },
              "<",
            );
            timelines.push(tl);
            return tl;
          });
          function drawLine(i: number) {
            if (drawn.has(i)) return;
            drawn.add(i);
            lineTimelines[i].play();
          }
          const roomPlayed = new Set<number>();
          const roomTimelines = veils.map((veil) => {
            const tl = gsap
              .timeline({ paused: true })
              .to(veil, { opacity: 0, duration: 0.4, ease: reveal });
            timelines.push(tl);
            return tl;
          });
          let handoffPlayed = false;
          const handoff = gsap.timeline({ paused: true });
          timelines.push(handoff);
          if (desktop) {
            handoff
              .set(q("[data-handoff]"), { opacity: 1 })
              .fromTo(
                q("[data-handoff]"),
                { strokeDashoffset: 0.18 },
                { strokeDashoffset: -1, duration: 0.9, ease: "power1.inOut" },
              )
              .set(q("[data-handoff]"), { opacity: 0 });
            handoff.fromTo(
              q("[data-handoff-node]"),
              { opacity: 1, scale: 1 },
              { opacity: 0, scale: 14 / 6, duration: 0.6 },
            );
          } else
            handoff
              .to(q("[data-mobile-handoff]"), {
                opacity: 0.8,
                duration: 0.45,
                ease: reveal,
              })
              .to(q("[data-mobile-handoff]"), { opacity: 0, duration: 0.45 });

          const panel = q("[data-boundaries-body]");
          const panelTitle = q("#dx-boundaries-title");
          remember(panelTitle);
          const panelTween = gsap.timeline({ paused: true });
          timelines.push(panelTween);
          panelTween.fromTo(
            panel,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0)", duration: 0.56, ease: wipe },
          );
          panelTween.fromTo(
            all("[data-pair-rule]"),
            { scaleY: 0 },
            { scaleY: 1, duration: 0.4 },
            0.24,
          );
          panelTween.fromTo(
            q("[data-pairs-rule]"),
            { scaleX: 0 },
            { scaleX: 1, duration: 0.4 },
            0.24,
          );
          all("[data-pair-item]").forEach((node, i) =>
            panelTween.fromTo(
              node,
              {
                opacity: 0,
                x: desktop ? ((i % 2 ? 12 : -12) * plane.width) / 1440 : 0,
                y: desktop ? 0 : 12,
              },
              { opacity: 1, x: 0, y: 0, duration: desktop ? 0.4 : 0.3, ease: reveal },
              0.3 + i * 0.06,
            ),
          );
          panelTween.fromTo(
            panelTitle,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: reveal },
            0,
          );
          if (desktop) {
            const photo = q("[data-section='boundaries'] img");
            remember(photo);
            panelTween.fromTo(
              photo,
              { scale: 1.06 },
              { scale: 1, duration: DURATION.reveal, ease: reveal },
              0,
            );
          }
          split = SplitText.create(q("[data-process-title]"), {
            type: "chars",
            aria: "auto",
            tag: "span",
          });
          const headingTween = gsap.timeline({ paused: true });
          timelines.push(headingTween);
          headingTween.fromTo(
            split.chars,
            { clipPath: "inset(0 0 100% 0)" },
            {
              clipPath: "inset(0)",
              duration: DURATION.reveal,
              stagger: 0.06,
              ease: reveal,
            },
          );
          headingTween.fromTo(
            q("[data-heading-rule]"),
            { scaleY: 0 },
            { scaleY: 1, duration: 0.9, ease: reveal },
            0,
          );
          headingTween.fromTo(
            q("[data-heading-node]"),
            { opacity: 0 },
            { opacity: 1, duration: 0.3 },
            0.9,
          );
          let panelPlayed = false,
            headingPlayed = false,
            initialPower = true;
          const heroTween = gsap.timeline({
            onComplete: () => {
              initialPower = false;
              update();
            },
          });
          timelines.push(heroTween);

          const setChapter = (next: number) => {
            if (next === chapter) return;
            chapter = next;
            veils.forEach(
              (veil, i) => (veil.dataset.dim = String(next >= 0 && i !== next)),
            );
            all("[data-tick]").forEach((tick, i) => {
              if (i === Math.max(0, next)) tick.dataset.current = "true";
              else delete tick.dataset.current;
            });
            leaders.forEach(
              (leader, i) =>
                (leader.dataset.dim = String(
                  next >= 0 && (i < 2 ? 0 : i - 1) !== next,
                )),
            );
            if (next >= 0) (next === 0 ? [0, 1] : [next + 1]).forEach(drawLine);
            if (next === 1 && !handoffPlayed) {
              handoffPlayed = true;
              handoff.play();
            }
          };
          function update() {
            if (stopped) return;
            const y = scrollY;
            if (desktop) {
              let next = -1;
              sectionBoxes.forEach((b, i) => {
                if (y >= b.top - vh * 0.55 && y <= b.bottom - vh * 0.45) next = i;
              });
              setChapter(next);
            }
            let wanted = clamp((y + vh * 0.6 - plane.top) / scale, start, end);
            // CSS scroll positions round to pixels; the final subpixel must complete.
            if (end - wanted <= 0.5 / scale) wanted = end;
            if (wanted > maxTip) {
              maxTip = wanted;
              if (!initialPower || desktop) quick(maxTip);
            }
            if (!panelPlayed && y + vh * (desktop ? 0.75 : 0.8) >= panelTop) {
              panelPlayed = true;
              panelTween.play();
            }
            if (!headingPlayed && y + vh * 0.78 >= titleTop) {
              headingPlayed = true;
              headingTween.play();
            }
            const dawnProgress = focusCompleted
              ? 1
              : desktop
                ? clamp((y + vh * 0.6 - plane.top - 1262 * scale) / (vh * 0.35), 0, 1)
                : clamp((y + vh - plane.top - 10040 * scale) / (vh * 0.5), 0, 1);
            dawn.style.opacity = String(1 - dawnProgress);
            if (desktop) warm.style.opacity = String(dawnProgress * 0.5);
          }
          const setup = () => {
            measure();
            clip.style.display = "block";
            if (desktop) {
              powerOff.setAttribute("href", `${media}d-map-off.webp`);
              powerOff.style.display = "block";
              gsap.set(all("[data-power-room]"), { fillOpacity: 0 });
              gsap.set(all("[data-power-path]"), {
                strokeDasharray: 1,
                strokeDashoffset: 1,
              });
              heroTween.to(
                q("[data-power-room='staff']"),
                { fillOpacity: 1, duration: 0.4, ease: reveal },
                0,
              );
              const path = q<SVGPathElement>("[data-power-path='main']"),
                length = path.getTotalLength(),
                tip = q<SVGGElement>("[data-power-particle=main]");
              const flow = { p: 0 };
              heroTween.to(
                path,
                { strokeDashoffset: 0, duration: length / 800, ease: "none" },
                0.2,
              );
              heroTween.to(
                flow,
                {
                  p: 1,
                  duration: length / 800,
                  ease: "none",
                  onUpdate: () => {
                    const pt = path.getPointAtLength(flow.p * length);
                    tip.style.transform = `translate(${pt.x}px,${pt.y}px)`;
                    tip.style.opacity = flow.p < 1 ? "1" : "0";
                  },
                },
                0.2,
              );
              const branch = q<SVGPathElement>("[data-power-path='branch']");
              const branchLength = branch.getTotalLength();
              const branchTip = q<SVGGElement>("[data-power-particle=branch]");
              const branchFlow = { p: 0 };
              const branchEnd = 0.6 + branchLength / 800;
              heroTween.to(
                branchFlow,
                {
                  p: 1,
                  duration: branchLength / 800,
                  ease: "none",
                  onUpdate: () => {
                    const pt = branch.getPointAtLength(branchFlow.p * branchLength);
                    branchTip.style.transform = `translate(${pt.x}px,${pt.y}px)`;
                    branchTip.style.opacity = branchFlow.p < 1 ? "1" : "0";
                  },
                },
                0.6,
              );
              heroTween.to(
                branch,
                {
                  strokeDashoffset: 0,
                  duration: branch.getTotalLength() / 800,
                  ease: "none",
                },
                0.6,
              );
              heroTween.to(
                q("[data-power-path='hookOperations']"),
                { strokeDashoffset: 0, duration: 0.075, ease: "none" },
                0.6 + (1420 - 760) / 800,
              );
              heroTween.to(
                q("[data-power-path='hookStoreroom']"),
                { strokeDashoffset: 0, duration: 0.075, ease: "none" },
                branchEnd,
              );
              heroTween.to(
                q("[data-power-room='systems']"),
                { fillOpacity: 1, duration: 0.5, ease: reveal },
                0.2 + (880 - 440) / 800,
              );
              heroTween.to(
                q("[data-power-room='operations']"),
                { fillOpacity: 1, duration: 0.5, ease: reveal },
                0.2 + (1318 - 440) / 800,
              );
              heroTween.to(
                q("[data-power-room='storeroom']"),
                { fillOpacity: 1, duration: 0.5, ease: reveal },
                branchEnd + 0.075,
              );
              heroTween
                .to(powerOff, { opacity: 0, duration: 0.2 })
                .set(powerOff, { display: "none" })
                .call(() => {
                  powerOff.removeAttribute("mask");
                  powerOff.removeAttribute("href");
                });
              const hoverTimelines = veils.map((veil, i) => {
                const line = q<SVGPathElement>(`[data-hover-path="${i}"]`),
                  particle = q<SVGGElement>(`[data-hover-particle="${i}"]`),
                  len = line.getTotalLength(),
                  value = { t: 0 };
                const tl = gsap
                  .timeline({ paused: true })
                  .set(particle, { opacity: 1 })
                  .to(value, {
                    t: 1,
                    duration: 0.6,
                    ease: reveal,
                    onUpdate: () => {
                      const pt = line.getPointAtLength(value.t * len);
                      particle.style.transform = `translate(${pt.x}px,${pt.y}px)`;
                    },
                  })
                  .set(particle, { opacity: 0 });
                timelines.push(tl);
                return tl;
              });
              all("[data-chips] li").forEach((chip) => {
                const i = Number(
                  chip.closest<HTMLElement>("[data-chips]")!.dataset.chips,
                );
                const enter = () => {
                  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                  veils[i].dataset.hover = "true";
                  hoverTimelines[i].restart();
                };
                const leave = () => {
                  delete veils[i].dataset.hover;
                };
                chip.addEventListener("pointerenter", enter);
                chip.addEventListener("pointerleave", leave);
                cleanups.push(() => {
                  chip.removeEventListener("pointerenter", enter);
                  chip.removeEventListener("pointerleave", leave);
                });
              });
            } else {
              gsap.set(veils, { opacity: 1 });
              heroTween.fromTo(
                q("[data-mobile-staff]"),
                { opacity: 1 },
                { opacity: 0, duration: 0.6, ease: reveal },
                0,
              );
              maxTip = clamp((scrollY + vh - plane.top) / scale, 440, end);
              heroTween.to(
                ride,
                { y: maxTip, duration: 1.2, ease: reveal, onUpdate: protect(apply) },
                0.2,
              );
            }
            tracker = ScrollTrigger.create({
              id: "dx-progress",
              trigger: q("[data-body]"),
              start: "top top",
              end: "bottom top",
              onUpdate: protect(update),
              onRefresh: protect(() => {
                measure();
                update();
              }),
            });
            update();
            el.dataset.motion = "ready";
          };
          const onFocus = (event: FocusEvent) => {
            const target = event.target as Element;
            if (target.closest("[data-section='hero']")) heroTween.progress(1);
            if (target.closest("[data-section='boundaries']")) {
              panelPlayed = true;
              panelTween.progress(1);
            }
            if (target.closest("[data-process]")) {
              headingPlayed = true;
              focusCompleted = true;
              headingTween.progress(1);
              quick.tween.pause();
              maxTip = end;
              ride.y = end;
              apply();
              dawn.style.opacity = "0";
              if (desktop) warm.style.opacity = ".5";
            }
            if (target.closest("[data-chapter]"))
              lineTimelines.forEach((t) => t.progress(1));
          };
          const edgeTimelines = all("[data-room-edge]").map((edge) => {
            const t = gsap
              .timeline({ paused: true })
              .to(edge, { opacity: 1, duration: 0.3 })
              .to(edge, { opacity: 0, duration: 0.3 });
            timelines.push(t);
            return t;
          });
          const onIndex = (event: MouseEvent) => {
            const link = (event.target as Element).closest<HTMLElement>(
              "[data-index-link]",
            );
            if (!link) return;
            const i = chapters.findIndex((ch) => ch.id === link.dataset.indexLink);
            if (i >= 0) edgeTimelines[i].restart();
          };
          el.addEventListener("focusin", onFocus);
          el.addEventListener("click", onIndex);
          cleanups.push(() => {
            el.removeEventListener("focusin", onFocus);
            el.removeEventListener("click", onIndex);
          });
          /* Wait for fonts before SplitText line geometry is measured again. */
          protect(setup)();
          void document.fonts.ready.then(() => {
            if (alive && !stopped) {
              measure();
              tracker?.refresh();
            }
          });
          return () => {
            cleanups.forEach((fn) => fn());
            quick.tween.kill();
            finish();
            powerOff.setAttribute("mask", "url(#dxPower)");
          };
        },
        root,
      );
      return () => {
        alive = false;
        observer.disconnect();
        mm.revert();
      };
    },
    { scope: root },
  );
  return <div ref={root}>{children}</div>;
}
