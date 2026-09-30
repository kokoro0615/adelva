"use client";
import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { desktopGeometry, mobileGeometry, zones } from "@/content/adelva-about";
import { EASE_REVEAL, gsapEase } from "@/lib/motion";
import { FrontRenderer, frontAt } from "./front-renderer";
import { leaderMark, type Composition } from "./marks";
import styles from "./about.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

const media = "/media/adelva/about-a2/";
/** Sweep direction weights (from the right, from the top) per composition. */
const FRONT = {
  desktop: { key: "d", geometry: desktopGeometry, dir: [1, 0.8] as const },
  mobile: { key: "m", geometry: mobileGeometry, dir: [0.4, 1] as const },
};
const reveal = gsapEase(EASE_REVEAL);

/** Pixels → page units for an SVG drawn in page coordinates. */
function svgFrame(svg: SVGSVGElement) {
  const box = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const k = vb.width / box.width;
  return (x: number, y: number) =>
    [(x - box.left) * k + vb.x, (y - box.top) * k + vb.y] as const;
}

function firstLine(node: Element) {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getClientRects()[0] ?? node.getBoundingClientRect();
}

/**
 * Re-measure every leader from the phrase it belongs to, so the pencil line
 * always starts just past the real end of the text whatever the fonts and width.
 */
function measureLeaders(root: HTMLElement, kind: Composition) {
  const svgA = root.querySelector<SVGSVGElement>(`[data-marks="a-${kind}"]`);
  const svgB = root.querySelector<SVGSVGElement>(`[data-marks="b-${kind}"]`);
  const set = (
    svg: SVGSVGElement | null,
    key: string,
    start: readonly [number, number],
  ) => {
    const g = svg?.querySelector<SVGGElement>(`[data-lead="${key}"]`);
    if (!g) return;
    const lead = leaderMark(kind, key, start);
    const path = g.querySelector("path")!;
    if (path.getAttribute("d") !== lead.d) {
      path.setAttribute("d", lead.d);
      // Re-fit the dash to the new length: drawn stays drawn, hidden stays hidden.
      const dash = parseFloat(path.style.strokeDasharray);
      if (!Number.isNaN(dash)) gsap.set(path, { drawSVG: dash > 1 ? "100%" : "0%" });
    }
    const dot = g.querySelector("circle");
    dot?.setAttribute("cx", lead.dot[0].toFixed(1));
    dot?.setAttribute("cy", lead.dot[1].toFixed(1));
  };
  if (svgA) {
    const toUnits = svgFrame(svgA);
    for (const id of ["gable", "windows", "eaves"]) {
      const text = root.querySelector(`[data-wish="${id}"] [data-wish-text]`);
      if (!text) continue;
      const r = firstLine(text);
      const [x, y] = toUnits(r.right, r.top + r.height * 0.55);
      set(svgA, id, [x + (kind === "desktop" ? 18 : 12), y]);
    }
  }
  if (svgB && kind === "desktop") {
    const toUnits = svgFrame(svgB);
    for (const id of ["c01", "c02", "c03"]) {
      const row = root.querySelector(`[data-row="${id}"]`);
      const name = row?.querySelector("[data-row-name]");
      if (!row || !name) continue;
      const r = firstLine(name);
      const [x] = toUnits(row.getBoundingClientRect().right, 0);
      const [, y] = toUnits(0, r.top + r.height * 0.55);
      set(svgB, id, [x + 28, y]);
    }
  }
}

export function AboutMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      ScrollTrigger.config({ ignoreMobileResize: true });
      const desktopQuery = matchMedia("(min-width: 1024px)");
      const composition = (): Composition =>
        desktopQuery.matches ? "desktop" : "mobile";

      /* ---------------------------------------------------- leaders (always) */
      let measureFrame = 0;
      const measure = () => {
        cancelAnimationFrame(measureFrame);
        measureFrame = requestAnimationFrame(() => measureLeaders(el, composition()));
      };
      document.fonts.ready.then(measure);
      const resize = new ResizeObserver(measure);
      resize.observe(el.querySelector("[data-stage]")!);

      /* --------------------------------------------- chapter index (always) */
      const links = zones.map((z) =>
        el.querySelector<HTMLAnchorElement>(`[data-zone="${z.id}"]`)!,
      );
      const targets = zones.map((z) => document.getElementById(z.id)!);
      let current = -1;
      const updateZones = () => {
        const line = innerHeight * 0.5;
        let index = 0;
        targets.forEach((t, i) => {
          if (t && t.getBoundingClientRect().top < line) index = i;
        });
        if (index === current) return;
        current = index;
        links.forEach((a, i) => {
          if (i === index) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      };
      const zoneTrigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: updateZones,
        onRefresh: updateZones,
      });
      updateZones();

      /* ------------------------------------------------------------ motion */
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 1024px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop, motion } = context.conditions as {
            desktop: boolean;
            motion: boolean;
          };
          if (!motion) return;
          const kind: Composition = desktop ? "desktop" : "mobile";
          el.dataset.motion = "on";
          const cleanups: (() => void)[] = [];

          /* M2 — the three wishes draw their leaders and rings */
          const svgA = el.querySelector<SVGSVGElement>(`[data-marks="a-${kind}"]`)!;
          for (const id of ["gable", "windows", "eaves"]) {
            const lead = svgA.querySelector(`[data-lead="${id}"]`)!;
            const ring = svgA.querySelector(`[data-ring="${id}"]`)!;
            const paths = [
              lead.querySelector("path")!,
              ...ring.querySelectorAll("path"),
            ];
            const dot = lead.querySelector("circle")!;
            gsap.set(paths, { drawSVG: "0%" });
            gsap.set(dot, { opacity: 0 });
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: el.querySelector(`[data-wish="${id}"]`),
                  start: "top 78%",
                  once: true,
                },
                delay: 0.08 * ["gable", "windows", "eaves"].indexOf(id),
              })
              .to(dot, { opacity: 1, duration: 0.15 })
              .to(lead.querySelector("path"), {
                drawSVG: "100%",
                duration: 0.3,
                ease: "power1.inOut",
              })
              .to(
                ring.querySelectorAll("path"),
                { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", stagger: 0.12 },
                "-=0.04",
              );
          }

          /* M3a — the domain rings are drawn as the rows arrive */
          const svgB = el.querySelector<SVGSVGElement>(`[data-marks="b-${kind}"]`)!;
          const ringIds = ["c01", "c02", "c03"] as const;
          const bDraw = svgB.querySelectorAll<SVGGeometryElement>(
            "[data-draw='ring'], [data-draw='lead']",
          );
          const bFade = svgB.querySelectorAll<SVGElement>(
            "[data-draw='dot'], [data-draw='label']",
          );
          gsap.set(bDraw, { drawSVG: "0%" });
          gsap.set(bFade, { opacity: 0 });
          const rowsTl = gsap.timeline({
            scrollTrigger: {
              trigger: el.querySelector("[data-row='c01']"),
              start: "top 70%",
              once: true,
            },
          });
          ringIds.forEach((id, i) => {
            const lead = svgB.querySelector(`[data-lead="${id}"]`);
            const ring = svgB.querySelector(`[data-ring="${id}"]`)!;
            const at = i * 0.16;
            if (lead) {
              rowsTl.to(
                lead.querySelector("circle"),
                { opacity: 1, duration: 0.15 },
                at,
              );
              rowsTl.to(
                lead.querySelector("path"),
                { drawSVG: "100%", duration: 0.34, ease: "power1.inOut" },
                at + 0.1,
              );
            }
            rowsTl.to(
              ring.querySelectorAll("path"),
              { drawSVG: "100%", duration: 0.6, ease: "power2.inOut", stagger: 0.12 },
              at + (lead ? 0.4 : 0.1),
            );
            rowsTl.to(
              ring.querySelector("text"),
              { opacity: 1, duration: 0.3 },
              at + 0.8,
            );
          });
          const dim = svgB.querySelector("[data-lead='dim'] path");
          if (dim)
            rowsTl.to(
              dim,
              { drawSVG: "100%", duration: 0.5, ease: "power1.inOut" },
              0.9,
            );

          /* M3 — the implementation front */
          const pin = el.querySelector<HTMLElement>("[data-pin]")!;
          const seg = pin.querySelector<HTMLElement>("[data-seg='b']")!;
          const canvas = el.querySelector<HTMLCanvasElement>("[data-front]")!;
          const spec = FRONT[kind];
          const g = spec.geometry;
          const renderer = FrontRenderer.create(canvas, {
            before: `${media}${spec.key}-front-before.webp`,
            after: `${media}${spec.key}-front-after.webp`,
            window: g.front.window,
            dir: spec.dir,
          });
          if (!renderer) {
            el.dataset.front = "off";
          } else {
            const box = {
              left: 0,
              width: g.width,
              top: g.front.top,
              height: g.front.height,
            };
            const thresholds = ringIds.map((id) => {
              const c = g.rings[id];
              return frontAt(c.cx, c.cy, box, g.front.window, spec.dir);
            });
            const ringGroups = ringIds.map((id) =>
              svgB.querySelector<SVGGElement>(`[data-ring="${id}"]`)!,
            );
            const leadGroups = ringIds.map((id) =>
              svgB.querySelector<SVGGElement>(`[data-lead="${id}"]`),
            );
            const rows = ringIds.map((id) =>
              el.querySelector<HTMLElement>(`[data-row="${id}"]`)!,
            );
            const last = ringIds.map(() => ({ o: -1, live: false }));
            const apply = (f: number) => {
              renderer.front = f;
              thresholds.forEach((t, i) => {
                const raw = 1 - gsap.utils.clamp(0, 1, (f - t - 0.03) / 0.08);
                const o = raw < 0.01 ? 0 : raw > 0.99 ? 1 : raw;
                const live = f > t - 0.1 && f < t + 0.03;
                if (
                  o !== last[i].o &&
                  (Math.abs(o - last[i].o) > 0.004 || o === 0 || o === 1)
                ) {
                  last[i].o = o;
                  ringGroups[i].style.opacity = String(o);
                  if (leadGroups[i]) leadGroups[i]!.style.opacity = String(o);
                  if (i === 1 && dim)
                    (dim.parentNode as SVGGElement).style.opacity = String(o);
                }
                if (live !== last[i].live) {
                  last[i].live = live;
                  ringGroups[i].toggleAttribute("data-live-now", live);
                  rows[i].toggleAttribute("data-live-now", live);
                }
              });
            };
            const state = { f: 0 };
            const pinned = () => pin.offsetHeight - seg.offsetHeight > 1;
            const stickyTop = () => parseFloat(getComputedStyle(seg).top) || 0;
            const docTop = () => pin.getBoundingClientRect().top + scrollY;
            const tween = gsap.to(state, {
              f: 1,
              ease: "none",
              onUpdate: () => apply(state.f),
              scrollTrigger: {
                trigger: pin,
                start: () => (pinned() ? docTop() - stickyTop() : "top 55%"),
                end: () =>
                  pinned()
                    ? docTop() - stickyTop() + pin.offsetHeight - seg.offsetHeight
                    : "bottom bottom",
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            });
            // Textures load once the section is within a screen and a half.
            const io = new IntersectionObserver(
              (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                io.disconnect();
                renderer.resize();
                renderer
                  .load()
                  .then((ok) => {
                    if (!ok) return;
                    renderer.front = state.f;
                    canvas.dataset.ready = "true";
                  })
                  .catch(() => {
                    el.dataset.front = "off";
                    ScrollTrigger.refresh();
                  });
              },
              { rootMargin: "150% 0px" },
            );
            io.observe(pin);
            const ro = new ResizeObserver(() => renderer.resize());
            ro.observe(canvas);
            cleanups.push(() => {
              io.disconnect();
              ro.disconnect();
              tween.scrollTrigger?.kill();
              tween.kill();
              renderer.destroy();
              delete canvas.dataset.ready;
              ringGroups.forEach((r) => {
                r.style.removeProperty("opacity");
                r.removeAttribute("data-live-now");
              });
              leadGroups.forEach((l) => l?.style.removeProperty("opacity"));
              rows.forEach((r) => r.removeAttribute("data-live-now"));
              if (dim) (dim.parentNode as SVGGElement).style.removeProperty("opacity");
            });
          }

          /* M4 — the scale bar is inked segment by segment */
          const fills = el.querySelectorAll<HTMLElement>(
            "[data-scale] [data-tone='flare'] i, [data-scale] [data-tone='ink'] i",
          );
          gsap.set(
            fills,
            desktop ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 },
          );
          gsap.to(fills, {
            ...(desktop ? { scaleX: 1 } : { scaleY: 1 }),
            duration: 0.4,
            ease: reveal,
            stagger: 0.12,
            scrollTrigger: {
              trigger: el.querySelector("[data-scale]"),
              start: "top 82%",
              once: true,
            },
          });

          /* M5 — the title block is ruled, then filled in */
          const block = el.querySelector<HTMLElement>("[data-title-block]")!;
          const top = block.querySelector("[data-rule='top']"),
            left = block.querySelector("[data-rule='left']");
          const cells = block.querySelectorAll<HTMLElement>("[data-cell]");
          const items = block.querySelectorAll<HTMLElement>(
            "[data-cell] > dt, [data-cell] > dd",
          );
          gsap.set(top, { scaleX: 0 });
          gsap.set(left, { scaleY: 0 });
          gsap.set(cells, { "--p": 0 });
          gsap.set(items, { opacity: 0, y: 8 });
          gsap
            .timeline({
              scrollTrigger: { trigger: block, start: "top 80%", once: true },
            })
            .to(top, { scaleX: 1, duration: 0.8, ease: reveal })
            .to(left, { scaleY: 1, duration: 0.8, ease: reveal }, 0.1)
            .to(cells, { "--p": 1, duration: 0.6, ease: reveal, stagger: 0.06 }, 0.45)
            .to(
              items,
              { opacity: 1, y: 0, duration: 0.4, ease: reveal, stagger: 0.06 },
              0.6,
            );

          return () => {
            cleanups.forEach((c) => c());
            delete el.dataset.motion;
            delete el.dataset.front;
          };
        },
      );

      return () => {
        mm.revert();
        zoneTrigger.kill();
        resize.disconnect();
        cancelAnimationFrame(measureFrame);
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.page} lang="ja" data-about>
      {children}
    </div>
  );
}
