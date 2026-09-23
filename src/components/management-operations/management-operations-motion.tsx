"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

import {
  buildingPlate,
  chapters,
  mobileProcessStage,
  processStage,
} from "@/content/adelva-management-operations";
import { DURATION, EASE_REVEAL, EASE_WIPE } from "@/lib/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, SplitText);

type StepState = "passed" | "current" | "upcoming";

/** Cabin centre per landing, keyframe px (the cabin sits 8px above its line). */
const cabinStops = processStage.landingsPx.map((y) => y - 8);
/**
 * Upper bound of the l5→l6 warm light. The 06 name and tags sit on the wall
 * this layer brightens; 0.85 keeps their measured contrast above 4.5:1
 * (docs/reports/adelva-management-operations-2026-09-24/contrast.json).
 */
const DAWN_MAX = 0.85;

function setStates(
  root: HTMLElement,
  selector: string,
  current: number,
  attribute: "data-step" | "data-landing",
) {
  root.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    const index = Number(node.getAttribute(attribute)) - 1;
    const state: StepState =
      index < current ? "passed" : index === current ? "current" : "upcoming";
    if (node.dataset.state !== state) node.dataset.state = state;
    if (attribute === "data-step") {
      if (state === "current") node.setAttribute("aria-current", "step");
      else node.removeAttribute("aria-current");
    }
  });
}

/*
 * History restoration. The browser (or the router) restores a scroll offset
 * before the pinned process has added its five screens of scroll distance, so
 * a return lands somewhere else entirely. The page remembers where the reader
 * was and restores it itself — only on a back/forward traversal, and only
 * after ScrollTrigger has measured the pin.
 */
const SCROLL_KEY = "adelva:management-operations:scroll";
let lastTraversal = Number.NEGATIVE_INFINITY;
let firstMount = true;
if (typeof window !== "undefined")
  window.addEventListener("popstate", () => {
    lastTraversal = performance.now();
  });

function isTraversal() {
  const entry = performance.getEntriesByType("navigation")[0] as
    PerformanceNavigationTiming | undefined;
  const fromLoad = firstMount && entry?.type === "back_forward";
  firstMount = false;
  return fromLoad || performance.now() - lastTraversal < 3000;
}

function readSavedScroll(): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(SCROLL_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function saveScroll(y: number) {
  try {
    window.sessionStorage.setItem(SCROLL_KEY, String(Math.round(y)));
  } catch {
    // Storage can be unavailable (private mode, blocked); restoration is optional.
  }
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
      console.error("[management-operations] motion skipped", error);
    }
  };
}

/**
 * Motion for /services/management-operations.
 *
 * The server renders every element in its finished state — all floors lit,
 * every leader line drawn, the process at 06 with all six steps passed — so
 * JavaScript-less and reduced-motion visitors read the complete page. This
 * component rewinds those states only under `prefers-reduced-motion:
 * no-preference`, and hands them back on cleanup.
 */
export function ManagementOperationsMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const reveal = CustomEase.create("mo-reveal", EASE_REVEAL.join(","));
      const wipe = CustomEase.create("mo-wipe", EASE_WIPE.join(","));
      const mm = gsap.matchMedia();

      /* Leader lines start where each row label actually ends. This is layout,
         not motion, so it runs under every motion preference. */
      mm.add(
        "(min-width: 1024px)",
        guarded(() => {
          const scene = element.querySelector<HTMLElement>("[data-scene]");
          if (!scene) return;
          const measure = () => {
            const box = scene.getBoundingClientRect();
            if (!box.width) return;
            const scale = buildingPlate.widthPx / box.width;
            for (const chapter of chapters)
              for (const service of chapter.services) {
                const name = element.querySelector<HTMLElement>(
                  `[data-row="${service.number}"] [data-row-name]`,
                );
                const path = element.querySelector<SVGPathElement>(
                  `[data-leader="${service.number}"] path`,
                );
                if (!name || !path) continue;
                const rect = name.getBoundingClientRect();
                const x =
                  (rect.right - box.left) * scale + 18 * (scale * (box.width / 1440));
                const y = (rect.top + rect.height / 2 - box.top) * scale;
                if (service.target === "bracket") {
                  path.setAttribute(
                    "d",
                    `M${x.toFixed(1)} ${y.toFixed(1)}H${buildingPlate.bracketPx.x}`,
                  );
                } else {
                  const kink = Math.max(buildingPlate.kinkPx, x + 20);
                  path.setAttribute(
                    "d",
                    Math.abs(service.target.y - y) < 2
                      ? `M${x.toFixed(1)} ${y.toFixed(1)}H${service.target.x}`
                      : `M${x.toFixed(1)} ${y.toFixed(1)}H${kink.toFixed(1)}L${service.target.x} ${service.target.y}`,
                  );
                }
              }
          };
          measure();
          const trigger = ScrollTrigger.create({ trigger: scene, onRefresh: measure });
          let active = true;
          void document.fonts.ready.then(() => active && measure());
          return () => {
            active = false;
            trigger.kill();
          };
        }),
      );

      mm.add(
        {
          desktop: "(min-width: 1024px)",
          tablet: "(min-width: 600px) and (max-width: 1023.98px)",
          motion: "(prefers-reduced-motion: no-preference)",
        },
        guarded((context: gsap.Context) => {
          const { desktop, tablet, motion } = context.conditions!;
          if (!motion) return;
          element.dataset.motion = "on";
          const cleanups: Array<() => void> = [];

          /* Hero: the floors light from the top, 80ms apart, 600ms each. */
          const veils = [
            ...element.querySelectorAll<SVGElement>(
              desktop || tablet
                ? "[data-map-overlay] [data-floor-veil]"
                : "svg:not([data-map-overlay]) [data-floor-veil]",
            ),
          ];
          gsap.fromTo(
            veils,
            { opacity: 0.72 },
            {
              opacity: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: reveal,
              delay: 0.1,
              clearProps: "opacity",
            },
          );

          /* The process heading: one character after another, once. */
          const title = element.querySelector<HTMLElement>("[data-process-title]");
          const rule = element.querySelector<HTMLElement>("[data-heading-rule]");
          const node = rule?.querySelector<HTMLElement>("[data-heading-node]");
          let split: SplitText | null = null;
          if (title && rule) {
            split = SplitText.create(title, {
              type: "chars",
              aria: "auto",
              tag: "span",
            });
            gsap.set(split.chars, { clipPath: "inset(0% 0% 100% 0%)" });
            gsap.set(rule, { scaleY: 0, transformOrigin: "top" });
            if (node) gsap.set(node, { opacity: 0 });
            const chars = split.chars;
            ScrollTrigger.create({
              trigger: title,
              start: "top 78%",
              once: true,
              onEnter: () => {
                gsap.to(chars, {
                  clipPath: "inset(0% 0% 0% 0%)",
                  duration: DURATION.reveal,
                  stagger: 0.06,
                  ease: reveal,
                });
                gsap.to(rule, { scaleY: 1, duration: 0.9, ease: reveal });
                if (node) gsap.to(node, { opacity: 1, duration: 0.3, delay: 0.9 });
              },
            });
          }
          cleanups.push(() => split?.revert());

          if (desktop) cleanups.push(sectionMap(element), desktopProcess(element));
          else cleanups.push(mobileChapters(element, wipe), mobileProcess(element));

          /* Keyboard travel can outrun an entrance: finish what is running. */
          const finish = (event: FocusEvent) => {
            if (!(event.target instanceof Element)) return;
            const section = event.target.closest("[data-section], [data-chapter]");
            section
              ?.querySelectorAll<Element>(
                "[data-line], [data-floor-veil], [data-heading-rule], [data-heading-node], [data-photo], [data-process-title] span",
              )
              .forEach((target) =>
                gsap.getTweensOf(target).forEach((tween) => tween.progress(1)),
              );
          };
          element.addEventListener("focusin", finish);
          cleanups.push(() => element.removeEventListener("focusin", finish));

          let alive = true;
          void document.fonts.ready.then(() => {
            if (!alive) return;
            ScrollTrigger.refresh();
            /* Measured and pinned: scroll positions now mean what they say. */
            element.dataset.motion = "ready";
          });
          return () => {
            alive = false;
            cleanups.forEach((cleanup) => cleanup());
            delete element.dataset.motion;
          };
        }),
        root,
      );

      let lastY = window.scrollY;
      const track = () => {
        lastY = window.scrollY;
      };
      const persist = () => saveScroll(lastY);
      window.addEventListener("scroll", track, { passive: true });
      window.addEventListener("pagehide", persist);
      let restoring = true;
      if (isTraversal()) {
        const saved = readSavedScroll();
        if (saved !== null)
          void document.fonts.ready.then(() =>
            requestAnimationFrame(() => {
              if (!restoring) return;
              ScrollTrigger.refresh();
              window.scrollTo({ top: saved, behavior: "instant" });
              ScrollTrigger.update();
            }),
          );
      }

      /* Chapter-index anchors flash the destination photograph's edge once. */
      const onIndex = (event: MouseEvent) => {
        const link = (event.target as Element | null)?.closest?.("[data-index-link]");
        if (!link) return;
        const target = document.getElementById(
          link.getAttribute("data-index-link") ?? "",
        );
        if (!target) return;
        target.dataset.arrived = "";
        window.setTimeout(() => delete target.dataset.arrived, 1200);
      };
      element.addEventListener("click", onIndex);

      return () => {
        restoring = false;
        persist();
        window.removeEventListener("scroll", track);
        window.removeEventListener("pagehide", persist);
        element.removeEventListener("click", onIndex);
        mm.revert();
      };
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}

/** Desktop section map: the chapter at the viewport centre lights its floors. */
function sectionMap(element: HTMLElement) {
  const map = element.querySelector<HTMLElement>("[data-map]");
  if (!map) return () => {};
  const lines = [...map.querySelectorAll<SVGPathElement>("[data-chapter-line]")];
  gsap.set(lines, { strokeDashoffset: 1 });
  const drawn = new Set<string>();
  const floors = [...map.querySelectorAll<SVGGElement>("[data-floor]")];
  const ticks = [...map.querySelectorAll<HTMLElement>("[data-tick]")];
  const sections = chapters.map((chapter) =>
    map.querySelector<HTMLElement>(`[data-chapter="${chapter.id}"]`),
  );

  const setCurrent = (index: number) => {
    const chapter = chapters[index];
    floors.forEach((floor) => {
      const lit = !chapter || chapter.floors.includes(floor.dataset.floor as never);
      floor.dataset.dim = String(!lit);
    });
    ticks.forEach((tick, i) => {
      if (i === Math.max(0, index)) tick.dataset.current = "";
      else delete tick.dataset.current;
    });
    if (chapter && !drawn.has(chapter.id)) {
      drawn.add(chapter.id);
      gsap.to(
        lines.filter((line) => line.dataset.chapterLine === chapter.id),
        {
          strokeDashoffset: 0,
          duration: DURATION.panel,
          stagger: 0.06,
          ease: "power2.out",
        },
      );
    }
  };

  const triggers = sections.map((section, index) =>
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      endTrigger: sections[index + 1] ?? section,
      end: sections[index + 1] ? "top center" : "top+=360 center",
      onToggle: (self) => {
        if (self.isActive) setCurrent(index);
        else if (index === 0 && self.direction < 0) setCurrent(-1);
      },
    }),
  );
  return () => {
    triggers.forEach((trigger) => trigger.kill());
    floors.forEach((floor) => delete floor.dataset.dim);
    ticks.forEach((tick, i) => {
      if (i === 0) tick.dataset.current = "";
      else delete tick.dataset.current;
    });
    gsap.set(lines, { clearProps: "strokeDashoffset" });
  };
}

/** Desktop process: one pinned viewport, five screens of scroll, six landings. */
function desktopProcess(element: HTMLElement) {
  const section = element.querySelector<HTMLElement>("[data-process]");
  const stage = section?.querySelector<HTMLElement>("[data-stage]");
  const plate = stage?.querySelector<HTMLElement>("[data-plate]");
  if (!section || !stage || !plate) return () => {};
  let current = -1;
  const update = (progress: number) => {
    const next = Math.round(progress * (cabinStops.length - 1));
    if (next === current) return;
    current = next;
    stage.dataset.progress = String(next + 1);
    setStates(plate, "li[data-step]", next, "data-step");
    setStates(plate, "[data-landings='desktop'] [data-landing]", next, "data-landing");
  };

  /* One scrubbed value drives every layer: t runs 0 → 5, one unit per
     landing, which keeps forward and reverse travel, snapping and refresh
     (invalidateOnRefresh) exactly symmetrical. Each frame writes only the
     compositor-friendly properties of the five moving layers; writing the
     plate's custom properties instead restyled its whole subtree per frame. */
  const cabin = plate.querySelector<HTMLElement>("[data-cabin]");
  const shaftWindow = plate.querySelector<HTMLElement>(
    "[data-shaft] [data-shaft-window]",
  );
  const shaftImage = shaftWindow?.querySelector<HTMLElement>("img") ?? null;
  const door = plate.querySelector<HTMLElement>("[data-door]");
  const dawn = plate.querySelector<HTMLElement>("[data-dawn]");
  const layers = [cabin, shaftWindow, shaftImage, door, dawn];
  let scale = plate.clientWidth / processStage.widthPx;
  const last = cabinStops.length - 1;
  const proxy = { t: 0 };
  const apply = () => {
    const t = gsap.utils.clamp(0, last, proxy.t);
    const segment = Math.min(Math.floor(t), last - 1);
    const y =
      cabinStops[segment] +
      (cabinStops[segment + 1] - cabinStops[segment]) * (t - segment);
    const opened = gsap.utils.clamp(0, 1, t - (last - 1));
    const lit = (Math.min(y, 700) - 700) * scale;
    if (cabin) {
      cabin.style.transform = `translateY(${((y - 117.5) * scale).toFixed(2)}px)`;
      cabin.style.opacity = (1 - opened).toFixed(3);
    }
    if (shaftWindow) shaftWindow.style.transform = `translateY(${lit.toFixed(2)}px)`;
    if (shaftImage) shaftImage.style.transform = `translateY(${(-lit).toFixed(2)}px)`;
    const side = `${(50 * (1 - opened)).toFixed(2)}%`;
    if (door) door.style.clipPath = `inset(0 ${side} 0 ${side})`;
    if (dawn) dawn.style.opacity = (opened * DAWN_MAX).toFixed(3);
    update(t / last);
  };
  const timeline = gsap.timeline({
    scrollTrigger: {
      id: "mo-process",
      trigger: section,
      pin: stage,
      start: "top top",
      end: () => `+=${window.innerHeight * 5}`,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      /* No built-in `snap`: with the desktop Lenis smoothing it never fired
         after a wheel gesture (verified; the page settled mid-landing), so the
         scroll-end settle below is the single owner of landing on a stop. */
      onRefresh: () => {
        scale = plate.clientWidth / processStage.widthPx;
        apply();
      },
    },
  });
  /* The header stops feathering its veil over the stage from just before the
     stage reaches the top until it has scrolled away, both ends included. The
     labels inside the bar keep their full veil throughout. */
  const veil = ScrollTrigger.create({
    trigger: section,
    start: "top 25%",
    end: "bottom top",
    onToggle: (self) => {
      if (self.isActive) document.documentElement.dataset.moStage = "pinned";
      else delete document.documentElement.dataset.moStage;
    },
  });
  timeline.fromTo(
    proxy,
    { t: 0 },
    { t: last, duration: last, ease: "none", onUpdate: apply },
    0,
  );
  cabinStops.forEach((_, index) => timeline.addLabel(`l${index + 1}`, index));
  apply();

  /* Landing on a stop. When scrolling ends between two landings, glide to
     the next landing in the direction of travel (never to the nearest one:
     that pulled every short move — an arrow key, a gentle wheel — back to
     where it started, so keyboard users could not advance). Values follow
     the spec's snap: 0.08s delay, 0.25–0.6s by distance, power3.out. */
  let settle: gsap.core.Tween | null = null;
  let glide: gsap.core.Tween | null = null;
  const check = () => {
    const trigger = timeline.scrollTrigger;
    if (!trigger?.isActive) return;
    const t = trigger.progress * last;
    if (Math.abs(t - Math.round(t)) < 0.004) return;
    const landing = trigger.direction < 0 ? Math.floor(t) : Math.ceil(t);
    const target = trigger.start + (landing / last) * (trigger.end - trigger.start);
    const position = { y: window.scrollY };
    let written = window.scrollY;
    const distance = Math.abs(landing - t);
    glide = gsap.to(position, {
      y: target,
      duration: gsap.utils.clamp(0.25, 0.6, 0.25 + 0.35 * distance),
      ease: "power3.out",
      onUpdate: () => {
        // Anything else moved the page (a link, a script, the reader): stop.
        if (Math.abs(window.scrollY - written) > 2) {
          glide?.kill();
          return;
        }
        window.scrollTo({ top: position.y, behavior: "instant" });
        written = window.scrollY;
      },
    });
  };

  const onScrollEnd = () => {
    settle?.kill();
    settle = gsap.delayedCall(0.08, check);
  };
  const onScrollStart = () => {
    settle?.kill();
  };
  /* A resize (or any refresh) re-measures the pin; keep the reader on the
     landing they were on instead of the one the old offset now maps to. */
  let kept: number | null = null;
  const remember = () => {
    const trigger = timeline.scrollTrigger;
    kept = trigger?.isActive ? Math.round(trigger.progress * last) : null;
  };
  const reapply = () => {
    const trigger = timeline.scrollTrigger;
    if (kept === null || !trigger) return;
    const top = trigger.start + (kept / last) * (trigger.end - trigger.start);
    kept = null;
    window.scrollTo({ top, behavior: "instant" });
  };
  ScrollTrigger.addEventListener("refreshInit", remember);
  ScrollTrigger.addEventListener("refresh", reapply);

  /* The reader always wins: any input cancels a glide in progress. */
  const yieldToInput = () => glide?.kill();
  ScrollTrigger.addEventListener("scrollEnd", onScrollEnd);
  ScrollTrigger.addEventListener("scrollStart", onScrollStart);
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
    window.addEventListener(type, yieldToInput, { passive: true });

  return () => {
    ScrollTrigger.removeEventListener("scrollEnd", onScrollEnd);
    ScrollTrigger.removeEventListener("scrollStart", onScrollStart);
    ScrollTrigger.removeEventListener("refreshInit", remember);
    ScrollTrigger.removeEventListener("refresh", reapply);
    for (const type of ["wheel", "touchstart", "keydown", "pointerdown"] as const)
      window.removeEventListener(type, yieldToInput);
    settle?.kill();
    glide?.kill();
    veil.kill();
    timeline.scrollTrigger?.kill();
    timeline.kill();
    delete document.documentElement.dataset.moStage;
    for (const layer of layers)
      for (const property of ["transform", "opacity", "clip-path"])
        layer?.style.removeProperty(property);
    stage.dataset.progress = "complete";
    plate.querySelectorAll<HTMLElement>("[data-state]").forEach((node) => {
      node.dataset.state = "passed";
      node.removeAttribute("aria-current");
    });
  };
}

/** Mobile/tablet: chapter photographs open from the top, once. */
function mobileChapters(element: HTMLElement, wipe: gsap.EaseFunction) {
  const photos = [
    ...element.querySelectorAll<HTMLElement>(
      "[data-chapters] [data-photo], [data-carousel]",
    ),
  ];
  const tweens = photos.map((photo) =>
    gsap.fromTo(
      photo,
      { clipPath: "inset(0% 0% 100% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.56,
        ease: wipe,
        clearProps: "clipPath",
        scrollTrigger: { trigger: photo, start: "top 88%", once: true },
      },
    ),
  );
  return () => tweens.forEach((tween) => tween.scrollTrigger?.kill());
}

/** Mobile/tablet process: the landing past the viewport centre is current. */
function mobileProcess(element: HTMLElement) {
  const stage = element.querySelector<HTMLElement>("[data-stage]");
  const plate = stage?.querySelector<HTMLElement>("[data-plate]");
  const cabin = plate?.querySelector<HTMLElement>("[data-mobile-cabin]") ?? null;
  const dawn = plate?.querySelector<HTMLElement>("[data-mobile-dawn]") ?? null;
  const shaftWindow =
    plate?.querySelector<HTMLElement>("[data-mobile-shaft] [data-shaft-window]") ??
    null;
  const shaftImage = shaftWindow?.querySelector<HTMLElement>("img") ?? null;
  if (!stage || !plate) return () => {};
  const layers = [cabin, dawn, shaftWindow, shaftImage];
  const landings = mobileProcessStage.landingsPx;
  const bottom = mobileProcessStage.shaftPx.bottom;
  /* Same approach as the desktop stage: tween a plain value and write the
     moving layers' transforms, never an inherited custom property. */
  const ride = { y: landings[0] };
  const apply = () => {
    const scale = stage.clientWidth / mobileProcessStage.widthPx;
    const lit = (ride.y - bottom) * scale;
    if (shaftWindow) shaftWindow.style.transform = `translateY(${lit.toFixed(2)}px)`;
    if (shaftImage) shaftImage.style.transform = `translateY(${(-lit).toFixed(2)}px)`;
    if (cabin)
      cabin.style.transform = `translateY(${((ride.y - 171.5) * scale).toFixed(2)}px)`;
  };
  let current = -1;
  if (cabin) cabin.style.opacity = "1";
  if (dawn) dawn.style.opacity = "0";
  apply();
  const setCurrent = (next: number) => {
    if (next === current) return;
    current = next;
    setStates(plate, "li[data-step]", next, "data-step");
    setStates(plate, "[data-landings='mobile'] [data-landing]", next, "data-landing");
    gsap.to(ride, {
      y: landings[next],
      duration: DURATION.state,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: apply,
    });
  };
  setCurrent(0);
  const tracker = ScrollTrigger.create({
    trigger: stage,
    start: "top bottom",
    end: "bottom top",
    onUpdate: () => {
      const box = stage.getBoundingClientRect();
      const plateY =
        ((window.innerHeight / 2 - box.top) / box.width) * mobileProcessStage.widthPx;
      let passed = 0;
      landings.forEach((y, index) => {
        if (plateY >= y) passed = index;
      });
      setCurrent(passed);
    },
    onRefresh: apply,
  });
  const hall = dawn
    ? ScrollTrigger.create({
        trigger: dawn,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(dawn, { opacity: 1, duration: DURATION.reveal, ease: "power1.out" });
        },
      })
    : null;
  return () => {
    tracker.kill();
    hall?.kill();
    gsap.killTweensOf(ride);
    if (dawn) gsap.killTweensOf(dawn);
    for (const layer of layers)
      for (const property of ["transform", "opacity"])
        layer?.style.removeProperty(property);
    plate.querySelectorAll<HTMLElement>("[data-state]").forEach((node) => {
      node.dataset.state = "passed";
      node.removeAttribute("aria-current");
    });
  };
}
