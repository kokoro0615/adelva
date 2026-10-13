"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { DURATION } from "@/lib/motion";

/*
 * Motion for /approach (spec §14, polish 2026-10-13).
 *
 * The server renders the finished, static descent: every photograph open,
 * every magnification line drawn, every bar at length. That is also the
 * reduced-motion and JavaScript-less page. The hero's one-time settle runs in
 * CSS from the first paint. Under `prefers-reduced-motion: no-preference`
 * this layer adds, and on cleanup removes:
 *
 *   1. the dive: stage 01's item carries a sticky stage (CSS) holding the hero
 *      photograph and frame 01. While it sticks, the camera zooms into the
 *      finder, the finder becomes a window and frame 01 opens out of it,
 *      landing exactly where the static page has it when the stage releases;
 *   2. focus between stages: each next photograph opens from a finder-shaped
 *      window while its magnification lines follow the window's corners and
 *      the previous finder settles;
 *   3. one-time reveals (stage copy, the 06 hand-over, role bars, the example
 *      line, check marks), the fixed descent rail and the integrated
 *      photograph's parallax.
 *
 * Everything that follows the scroll position is a Web Animation on a scroll
 * or view timeline, animating `transform` and `opacity` only, so the
 * compositor runs it in step with the finger and the main thread does no work
 * per frame (R1–R4). Where scroll timelines are missing, the dive follows a
 * damped scroll progress inside its sticky stage and each focus plays once,
 * time-based, as its photograph reaches the reading line.
 */

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
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const px = (value: number) => `${value.toFixed(2)}px`;
const num = (value: number) => value.toFixed(5);

/** Keyframes sampled from a function of progress; linear between samples. */
function sample(count: number, at: (p: number) => Keyframe): Keyframe[] {
  return Array.from({ length: count }, (_, index) => {
    const p = index / (count - 1);
    return { ...at(p), offset: p };
  });
}

/** Opacity keyframes through the given (progress, value) stops. */
function stops(points: ReadonlyArray<readonly [number, number]>): Keyframe[] {
  return points.map(([offset, opacity]) => ({ offset, opacity }));
}

/** Layout box relative to an ancestor, ignoring transforms. */
function offsetBox(element: HTMLElement, ancestor: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: element.offsetWidth, h: element.offsetHeight };
}

const center = (box: Box) => [box.x + box.w / 2, box.y + box.h / 2] as const;

/**
 * Runs one motion setup. A failure leaves the server-rendered finished state
 * in place instead of unmounting the page: nothing here is needed to read it.
 */
function guarded(setup: (root: HTMLElement) => () => void) {
  return (root: HTMLElement): (() => void) | null => {
    try {
      return setup(root);
    } catch (error) {
      console.error("[approach] motion skipped", error);
      delete root.dataset.motion;
      delete root.dataset.dive;
      return null;
    }
  };
}

/** Line geometry: a box rotated about its start, see `.magLine`. */
interface LineBase {
  node: HTMLElement;
  ox: number;
  oy: number;
  length: number;
}

function lineTransform(base: LineBase, from: readonly number[], to: readonly number[]) {
  const dx = to[0]! - from[0]!;
  const dy = to[1]! - from[1]!;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const scale = Math.hypot(dx, dy) / (base.length || 1);
  return `translate(${px(from[0]! - base.ox)}, ${px(from[1]! - base.oy)}) rotate(${angle.toFixed(4)}deg) scaleX(${num(scale)})`;
}

function setup(root: HTMLElement): () => void {
  const scrollDriven =
    typeof window.ViewTimeline === "function" &&
    typeof window.ScrollTimeline === "function";
  root.dataset.motion = "on";
  root.dataset.timeline = scrollDriven ? "scroll" : "fallback";

  const q = <T extends Element = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);
  const qa = <T extends Element = HTMLElement>(selector: string) =>
    Array.from(root.querySelectorAll<T>(selector));

  const descentFrame = q("[data-descent-frame]")!;
  const items = qa("[data-stage]");
  const frames = items.map((item) => item.querySelector<HTMLElement>("[data-frame]")!);
  const lenses = frames.map((frame) =>
    frame.querySelector<HTMLElement>("[data-lens]")!,
  );
  const track = q("[data-dive-track]")!;
  const probe = q("[data-dive-probe]")!;
  const svhProbe = q("[data-svh-probe]")!;
  const stage = q("[data-dive-stage]")!;
  const zoom = q("[data-hero-zoom]")!;
  const heroFinder = q('[data-hero-push] [data-finder="0"]')!;
  const night = q("[data-dive-night]")!;
  const diveWindow = q("[data-dive-window]")!;
  const edges = Object.fromEntries(
    qa("[data-dive-window] [data-edge]").map((edge) => [edge.dataset.edge!, edge]),
  ) as Record<"top" | "right" | "bottom" | "left", HTMLElement>;
  const lifted = qa("[data-dive-lift]");
  const hero = q("[data-hero]")!;
  const desktopQuery = window.matchMedia("(min-width: 1024px)");

  const cleanups: Array<() => void> = [];
  let animations: Animation[] = [];
  /** Per-build listeners and observers, released before every rebuild. */
  let buildCleanups: Array<() => void> = [];

  const play = (
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    const animation = element.animate(keyframes, options);
    animations.push(animation);
    return animation;
  };

  /* ------------------------------------------------- one-time reveals */

  /**
   * Hides `host`'s content until `target` crosses the line `margin` from the
   * viewport's foot. Only content wholly below the fold at setup is hidden,
   * so nothing visible is ever hidden and shown again (R8).
   */
  const reveals = new Set<IntersectionObserver>();
  const revealOnce = (
    target: Element,
    host: HTMLElement,
    attribute: string,
    margin: string,
  ) => {
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    host.setAttribute(attribute, "");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        host.removeAttribute(attribute);
        observer.disconnect();
        reveals.delete(observer);
      },
      { rootMargin: `0px 0px ${margin} 0px` },
    );
    observer.observe(target);
    reveals.add(observer);
    cleanups.push(() => {
      host.removeAttribute(attribute);
      observer.disconnect();
    });
  };

  const stageTexts = items.map((item) =>
    item.querySelector<HTMLElement>("[data-stage-text]")!,
  );
  stageTexts.forEach((text, index) => {
    if (index === 0) return; // stage 01's copy follows the landing (see build)
    const final = index === stageTexts.length - 1;
    revealOnce(
      final ? text : frames[index]!,
      text,
      "data-reveal-pending",
      final ? "-12%" : "-45%",
    );
  });

  const final = items[items.length - 1]!;
  revealOnce(final, final, "data-handover-pending", "-45%");
  const roles = q('[data-section="responsibilities"]')!;
  revealOnce(roles, roles, "data-bars-pending", "-38%");
  const example = q("[data-example]");
  if (example) revealOnce(example, example, "data-example-pending", "-18%");
  const verification = q('[data-section="verification"]')!;
  revealOnce(verification, verification, "data-checks-pending", "-30%");

  /* ------------------------------------------------- the descent rail */

  const railFixed = q("[data-descent-rail]")!;
  const railFill = q("[data-descent-rail-fill]")!;
  const railDots = qa("[data-rail-dot]");
  const heroStops = qa("[data-rail] a");
  const passed = items.map(() => false);
  let current = -1;
  const setCurrent = () => {
    const next = Math.max(0, passed.lastIndexOf(true));
    if (next === current) return;
    current = next;
    railDots.forEach((dot, index) => {
      dot.dataset.state =
        index < current ? "passed" : index === current ? "current" : "upcoming";
    });
    heroStops.forEach((stop, index) => {
      if (index === current) stop.setAttribute("data-current", "");
      else stop.removeAttribute("data-current");
    });
    if (current === items.length - 1) railFixed.dataset.client = "";
    else delete railFixed.dataset.client;
    if (!scrollDriven)
      railFill.style.transform = `scaleY(${num(current / (items.length - 1))})`;
  };
  /* A stage is reached once its top is above the middle of the viewport. */
  const stageObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const index = items.indexOf(entry.target as HTMLElement);
        const middle = entry.rootBounds
          ? entry.rootBounds.bottom
          : window.innerHeight / 2;
        passed[index] = entry.boundingClientRect.top < middle;
      }
      setCurrent();
    },
    { rootMargin: "0px 0px -50% 0px" },
  );
  items.forEach((item) => stageObserver.observe(item));
  cleanups.push(() => {
    stageObserver.disconnect();
    railDots.forEach((dot) => delete dot.dataset.state);
    delete railFixed.dataset.client;
    railFill.style.removeProperty("transform");
    heroStops.forEach((stop, index) =>
      index === 0
        ? stop.setAttribute("data-current", "")
        : stop.removeAttribute("data-current"),
    );
  });

  /* The rail shows from the landing until 06 has been read. */
  let landed = false;
  let finalPassed = false;
  const showRail = () => {
    if (landed && !finalPassed) railFixed.dataset.shown = "";
    else delete railFixed.dataset.shown;
  };
  const finalObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      finalPassed =
        !entry.isIntersecting &&
        entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? 0);
      showRail();
    },
    { rootMargin: "-35% 0px 0px 0px" },
  );
  finalObserver.observe(final);
  cleanups.push(() => {
    finalObserver.disconnect();
    delete railFixed.dataset.shown;
  });

  /* ------------------------------------------------- keyboard */

  /* The hero's links stay in the tab order while the dive lifts them away; a
     keyboard user returning to them brings the page back to the top. */
  const onHeroFocus = () => {
    if (window.scrollY > 1) window.scrollTo({ top: 0, behavior: "instant" });
  };
  hero.addEventListener("focusin", onHeroFocus);
  cleanups.push(() => hero.removeEventListener("focusin", onHeroFocus));

  /* ------------------------------------------------- build */

  let lastWidth = -1;
  let lastDive = -1;

  const build = () => {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    buildCleanups.forEach((cleanup) => cleanup());
    buildCleanups = [];

    const desktop = desktopQuery.matches;
    const variant = desktop ? "desktop" : "mobile";

    /* --- the dive: on only when frame 01 fits the small viewport --- */
    root.dataset.dive = "on";
    const dive = probe.offsetHeight;
    const svh = svhProbe.offsetHeight;
    const landing = offsetBox(frames[0]!, stage);
    const diveOn = dive >= 160 && landing.h <= svh + 0.5;
    if (!diveOn) delete root.dataset.dive;
    /** Frame 01's layout box in the stage (at its landing when diving). */
    const L = diveOn ? landing : offsetBox(frames[0]!, stage);
    lastWidth = descentFrame.offsetWidth;
    lastDive = dive;

    const frameRoot = descentFrame.getBoundingClientRect();
    const local = (element: Element): Box => {
      const box = element.getBoundingClientRect();
      return {
        x: box.left - frameRoot.left,
        y: box.top - frameRoot.top,
        w: box.width,
        h: box.height,
      };
    };
    /* Frame boxes in descent coordinates, where the static page has them. */
    const item0 = local(items[0]!);
    const frameBoxes = frames.map((frame, index) =>
      index === 0
        ? // With the dive on, frame 01 is laid out at its landing inside the
          // stage, `dive` px above where it rests once the stage releases.
          { ...L, x: item0.x + L.x, y: item0.y + L.y + (diveOn ? dive : 0) }
        : local(items[index]!),
    );
    /* Finder i frames photograph i: 0 is the hero's, i ≥ 1 sits in frame i−1. */
    const finders = frames.map((_, index) => {
      if (index === 0) return null;
      const node = frames[index - 1]!.querySelector<HTMLElement>(
        `[data-finder="${index}"]`,
      )!;
      const box = offsetBox(node, frames[index - 1]!);
      const host = frameBoxes[index - 1]!;
      return { node, box: { ...box, x: host.x + box.x, y: host.y + box.y } };
    });
    const pairGroup = (pair: number) =>
      q(`[data-lines-overlay] [data-lines="${variant}"] [data-line-pair="${pair}"]`);
    const lineBases = (pair: number) => {
      const group = pairGroup(pair);
      if (!group) return null;
      return (["left", "right"] as const).map((side) => {
        const node = group.querySelector<HTMLElement>(`[data-side="${side}"]`)!;
        return {
          node,
          ox: node.offsetLeft,
          oy: node.offsetTop + node.offsetHeight / 2,
          length: node.offsetWidth,
        } satisfies LineBase;
      });
    };

    const stageOneTarget = () =>
      diveOn
        ? probe.getBoundingClientRect().bottom + window.scrollY
        : frames[0]!.getBoundingClientRect().top + window.scrollY - 72;
    /* Links to #stage-01 (the hero finder, the scale's 01) glide through the
       dive to the landing (or to frame 01 when there is no dive): the item
       itself starts at the top of the page, where a native or smoothed jump
       would stop. */
    const onStageLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest?.(
        `a[href="#${items[0]!.id}"]`,
      );
      if (!link) return;
      event.preventDefault();
      history.pushState(null, "", `#${items[0]!.id}`);
      items[0]!.focus({ preventScroll: true });
      // After the shared scroller has adopted the focus change.
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          window.scrollTo({ top: stageOneTarget(), behavior: "smooth" }),
        ),
      );
    };
    root.addEventListener("click", onStageLink);
    buildCleanups.push(() => root.removeEventListener("click", onStageLink));

    /* --- 1. the dive --- */

    let diveTimeline: AnimationTimeline | null = null;
    let diveRange: Partial<KeyframeAnimationOptions> = {};
    if (diveOn) {
      const F0 = offsetBox(heroFinder, zoom);
      /* Frame 01 is laid out at its landing (CSS), so the dive ends on no
         transform at all: the landed page is the plain layout. */
      const N: Box = L;
      const [f0x, f0y] = center(F0);
      const [nx, ny] = center(N);
      const [lx, ly] = center(L);
      const windowAt = (p: number): Box => {
        const e = smooth(p);
        const w = F0.w * (N.w / F0.w) ** e;
        const h = F0.h * (N.h / F0.h) ** e;
        const g = (w - F0.w) / (N.w - F0.w || 1);
        const cx = lerp(f0x, nx, g);
        const cy = lerp(f0y, ny, g);
        return { x: cx - w / 2, y: cy - h / 2, w, h };
      };

      if (scrollDriven) {
        diveTimeline = new ViewTimeline({ subject: probe, axis: "block" });
        diveRange = { rangeStart: "exit-crossing 0%", rangeEnd: "exit-crossing 100%" };
      }
      const options: KeyframeAnimationOptions = scrollDriven
        ? { timeline: diveTimeline, ...diveRange, fill: "both", easing: "linear" }
        : { duration: 1000, fill: "both", easing: "linear" };
      const diveAnimations: Animation[] = [];
      const add = (element: Element, keyframes: Keyframe[]) => {
        const animation = play(element, keyframes, options);
        if (!scrollDriven) animation.pause();
        diveAnimations.push(animation);
      };

      // The camera: the hero photograph zooms so its finder becomes the window.
      add(
        zoom,
        sample(41, (p) => {
          const W = windowAt(p);
          const z = W.w / F0.w;
          const [wx, wy] = center(W);
          return {
            transform: `translate(${px(wx - z * f0x)}, ${px(wy - z * f0y)}) scale(${num(z)})`,
          };
        }),
      );
      // Frame 01 fills the window: uniformly scaled, clipped to it, landing
      // with no scale where the static page has it.
      add(
        frames[0]!,
        sample(41, (p) => {
          const W = windowAt(p);
          const [wx, wy] = center(W);
          return {
            transform: `translate(${px(wx - lx)}, ${px(wy - ly)}) scale(${num(W.w / L.w)}, ${num(W.h / L.h)})`,
            opacity: span(p, 0, 0.08),
          };
        }),
      );
      add(
        lenses[0]!,
        sample(41, (p) => {
          const W = windowAt(p);
          const sx = W.w / L.w;
          const sy = W.h / L.h;
          const k = Math.max(sx, sy);
          return { transform: `scale(${num(k / sx)}, ${num(k / sy)})` };
        }),
      );
      // The window's four edges keep their stroke while the window grows.
      const edgeAt = (
        side: "top" | "right" | "bottom" | "left",
      ): ((p: number) => Keyframe) => {
        return (p) => {
          const W = windowAt(p);
          const sx = num(W.w / L.w);
          const sy = num(W.h / L.h);
          switch (side) {
            case "top":
              return {
                transform: `translate(${px(W.x - L.x)}, ${px(W.y - L.y)}) scaleX(${sx})`,
              };
            case "bottom":
              return {
                transform: `translate(${px(W.x - L.x)}, ${px(W.y + W.h - L.y - L.h)}) scaleX(${sx})`,
              };
            case "left":
              return {
                transform: `translate(${px(W.x - L.x)}, ${px(W.y - L.y)}) scaleY(${sy})`,
              };
            case "right":
              return {
                transform: `translate(${px(W.x + W.w - L.x - L.w)}, ${px(W.y - L.y)}) scaleY(${sy})`,
              };
          }
        };
      };
      (["top", "right", "bottom", "left"] as const).forEach((side) =>
        add(edges[side], sample(41, edgeAt(side))),
      );
      add(
        diveWindow,
        stops([
          [0, 0],
          [0.004, 0],
          [0.05, 1],
          [0.82, 1],
          [0.99, 0],
          [1, 0],
        ]),
      );
      // The finder hands over to the window; its lines go with it.
      const finderOut = stops([
        [0, 1],
        [0.06, 0],
        [1, 0],
      ]);
      add(heroFinder, finderOut);
      const pair0 = q(
        `[data-hero-media] [data-lines="${variant}"] [data-line-pair="0"]`,
      );
      if (pair0) add(pair0, finderOut);
      // The hero copy scrolls away with the page and fades as it goes.
      for (const node of lifted)
        add(
          node,
          stops([
            [0, 1],
            [0.02, 1],
            [0.36, 0],
            [1, 0],
          ]),
        );
      // Night: the camera dims behind the window, and is wholly dark as the
      // stage releases, so the stage scrolls on as plain page ground.
      add(
        night,
        sample(29, (p) => ({
          opacity:
            0.46 * smooth(span(p, 0.04, 0.5)) + 0.54 * smooth(span(p, 0.72, 0.98)),
        })),
      );
      // Landed, the camera is wholly under the night: it leaves the stage, so
      // the stage scrolls on as frame 01 alone (a hidden, huge zoomed layer
      // is not composited every frame).
      const gone: Keyframe[] = [
        { offset: 0, visibility: "visible" },
        { offset: 0.999, visibility: "visible" },
        { offset: 1, visibility: "hidden" },
      ];
      add(q("[data-hero-media]")!, gone);
      add(
        night,
        gone.map((frame) => ({ ...frame })),
      );
      // Lines from frame 01's finder exist only where frame 01 rests.
      const pair1 = pairGroup(1);
      if (pair1)
        add(
          pair1,
          stops([
            [0, 0],
            [0.9999, 0],
            [1, 1],
          ]),
        );

      if (!scrollDriven) {
        /* Damped follow of the scroll progress (R3): frame-rate independent,
           settles in ~200 ms, idle once settled. */
        const sStart = probe.getBoundingClientRect().top + window.scrollY;
        let shown = 0;
        let frame = 0;
        let last = 0;
        const target = () => clamp01((window.scrollY - sStart) / dive);
        const write = (p: number) =>
          diveAnimations.forEach((animation) => (animation.currentTime = p * 1000));
        const step = (time: number) => {
          const goal = target();
          const dt = last ? Math.min(64, time - last) : 16;
          last = time;
          shown += (goal - shown) * (1 - Math.exp(-dt / 65));
          if (Math.abs(goal - shown) < 0.0005) shown = goal;
          write(shown);
          frame = shown === goal ? 0 : requestAnimationFrame(step);
          if (!frame) last = 0;
        };
        const onScroll = () => {
          if (!frame) frame = requestAnimationFrame(step);
        };
        shown = target();
        write(shown);
        window.addEventListener("scroll", onScroll, { passive: true });
        buildCleanups.push(() => {
          window.removeEventListener("scroll", onScroll);
          cancelAnimationFrame(frame);
        });
      }

      /* The stage is sticky only around the dive. Well before it, and once it
         has released and scrolled on, it is parked as a plain relative box at
         the very place sticky positioning would hold it, so engines that
         repaint viewport-constrained boxes while scrolling do no extra work
         for the rest of the page. The switch happens 200px of scroll away
         from either end, where both positions coincide. */
      const band = 200;
      const park = (state: "before" | "after" | null) => {
        if (state) root.dataset.divePark = state;
        else delete root.dataset.divePark;
      };
      const probeBox = probe.getBoundingClientRect();
      park(probeBox.top > band ? "before" : probeBox.bottom < -band ? "after" : null);
      const parking = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) park(null);
          else park(entry.boundingClientRect.top > 0 ? "before" : "after");
        },
        {
          rootMargin: `${band}px 0px ${Math.round(band - window.innerHeight)}px 0px`,
        },
      );
      parking.observe(probe);
      buildCleanups.push(() => {
        parking.disconnect();
        park(null);
      });

      /* Stage 01's copy follows the landing; the rail appears with it. */
      const text = stageTexts[0]!;
      const isLanded = () => probe.getBoundingClientRect().bottom <= 0.5;
      if (!isLanded()) text.setAttribute("data-reveal-pending", "");
      const landing = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        landed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0.5;
        if (landed) text.removeAttribute("data-reveal-pending");
        showRail();
      });
      landing.observe(probe);
      buildCleanups.push(() => {
        landing.disconnect();
        text.removeAttribute("data-reveal-pending");
      });

      const landingY = () => probe.getBoundingClientRect().bottom + window.scrollY;
      /* A keyboard user reaching frame 01's links mid-dive lands it first. */
      const onFrameFocus = (event: FocusEvent) => {
        if (event.target === items[0]) return;
        const end = landingY();
        if (window.scrollY < end - 1)
          window.scrollTo({ top: end, behavior: "instant" });
      };
      items[0]!.addEventListener("focusin", onFrameFocus);
      buildCleanups.push(() => items[0]!.removeEventListener("focusin", onFrameFocus));
    } else {
      /* No dive: frame 01 is simply there; its copy and the rail follow it. */
      const text = stageTexts[0]!;
      const reached = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          landed = entry.isIntersecting || entry.boundingClientRect.top < 0;
          if (landed) text.removeAttribute("data-reveal-pending");
          showRail();
        },
        { rootMargin: "0px 0px -45% 0px" },
      );
      if (frames[0]!.getBoundingClientRect().top >= window.innerHeight)
        text.setAttribute("data-reveal-pending", "");
      reached.observe(frames[0]!);
      buildCleanups.push(() => {
        reached.disconnect();
        text.removeAttribute("data-reveal-pending");
      });
    }

    /* --- 2. focus between stages --- */

    frames.forEach((frame, index) => {
      if (index === 0) return;
      const finder = finders[index]!;
      const box = frameBoxes[index]!;
      const bases = lineBases(index);
      const aspect = finder.box.w / finder.box.h;
      let w0 = box.w * 0.34;
      let h0 = w0 / aspect;
      if (h0 > box.h * 0.62) {
        h0 = box.h * 0.62;
        w0 = h0 * aspect;
      }
      const top0 = box.h * 0.08;
      /** The window inside the frame, top-anchored so it shows as soon as the
          photograph enters, opening fast and settling slowly. */
      const windowAt = (p: number): Box => {
        const e = easeOutCubic(p);
        const w = lerp(w0, box.w, e);
        const h = lerp(h0, box.h, e);
        return { x: (box.w - w) / 2, y: lerp(top0, 0, e), w, h };
      };
      const [fcx, fcy] = center(finder.box);
      const corners = {
        left: [finder.box.x, finder.box.y + finder.box.h],
        right: [finder.box.x + finder.box.w, finder.box.y + finder.box.h],
      } as const;

      const focusOptions: KeyframeAnimationOptions = scrollDriven
        ? {
            timeline: new ViewTimeline({ subject: items[index]!, axis: "block" }),
            rangeStart: "entry 0px",
            rangeEnd: `entry ${Math.round(box.h * 0.78)}px`,
            fill: "both",
            easing: "linear",
          }
        : { duration: DURATION.reveal * 750, fill: "both", easing: "linear" };
      const focusAnimations: Animation[] = [];
      const add = (element: Element, keyframes: Keyframe[]) => {
        const animation = play(element, keyframes, focusOptions);
        if (!scrollDriven) animation.pause();
        focusAnimations.push(animation);
      };

      add(
        frame,
        sample(25, (p) => {
          const W = windowAt(p);
          return {
            transform: `translate(${px(W.x + W.w / 2 - box.w / 2)}, ${px(W.y + W.h / 2 - box.h / 2)}) scale(${num(W.w / box.w)}, ${num(W.h / box.h)})`,
          };
        }),
      );
      add(
        lenses[index]!,
        sample(25, (p) => {
          const W = windowAt(p);
          const sx = W.w / box.w;
          const sy = W.h / box.h;
          const dx = W.x + W.w / 2 - box.w / 2;
          const dy = W.y + W.h / 2 - box.h / 2;
          const z = 1.25 - 0.25 * easeOutCubic(p);
          return {
            transform: `translate(${px(-dx / sx)}, ${px(-dy / sy)}) scale(${num(z / sx)}, ${num(z / sy)})`,
          };
        }),
      );
      // The finder that framed this photograph settles as it opens.
      const settle = (p: number) => 1 + 0.08 * (1 - easeOutCubic(p));
      add(
        finder.node,
        sample(13, (p) => ({ transform: `scale(${num(settle(p))})` })),
      );
      if (bases)
        bases.forEach((base, sideIndex) => {
          const side = sideIndex === 0 ? "left" : "right";
          add(
            base.node,
            sample(25, (p) => {
              const s = settle(p);
              const W = windowAt(p);
              const corner = corners[side];
              const from = [fcx + (corner[0] - fcx) * s, fcy + (corner[1] - fcy) * s];
              const to = [box.x + W.x + (side === "left" ? 0 : W.w), box.y + W.y];
              return { transform: lineTransform(base, from, to) };
            }),
          );
        });

      if (!scrollDriven) {
        /* Time-based once, as the photograph's top reaches the reading line. */
        const begin = () => focusAnimations.forEach((animation) => animation.play());
        if (items[index]!.getBoundingClientRect().top < window.innerHeight * 0.9) {
          focusAnimations.forEach((animation) => animation.finish());
          return;
        }
        const observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            begin();
            observer.disconnect();
          },
          { rootMargin: "0px 0px -10% 0px" },
        );
        observer.observe(items[index]!);
        buildCleanups.push(() => observer.disconnect());
      }
    });

    /* --- 3. the rail's fill follows the descent --- */

    if (scrollDriven) {
      const svhHalf = svh / 2;
      const scrollTops = items.map((item, index) => {
        if (index === 0) {
          return diveOn
            ? probe.getBoundingClientRect().bottom + window.scrollY
            : frames[0]!.getBoundingClientRect().top + window.scrollY - svhHalf;
        }
        return item.getBoundingClientRect().top + window.scrollY - svhHalf;
      });
      const first = scrollTops[0]!;
      const lastTop = scrollTops[scrollTops.length - 1]!;
      if (lastTop > first + 1)
        play(
          railFill,
          scrollTops.map((top, index) => ({
            offset: (top - first) / (lastTop - first),
            transform: `scaleY(${num(index / (scrollTops.length - 1))})`,
          })),
          {
            timeline: new ScrollTimeline({
              source: document.documentElement,
              axis: "block",
            }),
            rangeStart: `${Math.round(first)}px`,
            rangeEnd: `${Math.round(lastTop)}px`,
            fill: "both",
            easing: "linear",
          },
        );
    }

    /* --- 4. integrated support: the aerial drifts behind its heading --- */

    const integratedMedia = q("[data-integrated-media]");
    const integratedPicture = integratedMedia?.querySelector("picture");
    if (scrollDriven && integratedMedia && integratedPicture)
      play(
        integratedPicture,
        [
          { transform: "translateY(-5%) scale(1.1)" },
          { transform: "translateY(5%) scale(1.1)" },
        ],
        {
          timeline: new ViewTimeline({ subject: integratedMedia, axis: "block" }),
          rangeStart: "cover 0%",
          rangeEnd: "cover 100%",
          fill: "both",
          easing: "linear",
        },
      );
  };

  build();

  /* Rebuild only when the laid-out geometry changes: the page width, or the
     dive's length (svh/lvh-based, so iOS toolbar changes never trigger it). */
  let pending = 0;
  const resize = new ResizeObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      if (descentFrame.offsetWidth !== lastWidth || probe.offsetHeight !== lastDive)
        build();
    });
  });
  resize.observe(descentFrame);
  resize.observe(probe);
  resize.observe(track);
  cleanups.push(() => {
    resize.disconnect();
    cancelAnimationFrame(pending);
  });

  return () => {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    buildCleanups.forEach((cleanup) => cleanup());
    buildCleanups = [];
    cleanups.reverse().forEach((cleanup) => cleanup());
    reveals.forEach((observer) => observer.disconnect());
    delete root.dataset.motion;
    delete root.dataset.dive;
    delete root.dataset.divePark;
    delete root.dataset.timeline;
  };
}

export function ApproachMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let teardown: (() => void) | null = null;
    const start = () => {
      teardown?.();
      teardown = null;
      if (query.matches) teardown = guarded(setup)(element);
    };
    start();
    query.addEventListener("change", start);
    return () => {
      query.removeEventListener("change", start);
      teardown?.();
    };
  }, []);

  return (
    <div ref={root} data-approach-motion>
      {children}
    </div>
  );
}
