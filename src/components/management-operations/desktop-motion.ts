/**
 * Desktop choreography of /services/management-operations (≥ 1024 px).
 *
 * A port of the adopted B-hq prototype (`hq.js`): the light walks the four
 * themes while the stage holds (CSS sticky, see the module CSS), eleven comets
 * run down the trunks into the platform's knuckles, the pair being read warms
 * its knuckle, a warm band descends the old trunk with the process rail and the
 * young daisugi lights at the audience routes. Distances the prototype gave in
 * u (CSS px of the 1440-wide stage) are multiplied by `k`; prose distances by `z`.
 *
 * Only transform, opacity and canvas drawing change while scrolling. Document
 * offsets are measured on setup and resize, never per frame.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { moGeometry as G } from "@/content/adelva-management-operations-geometry";

const S = G.plate.cssScale;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Path {
  readonly points: readonly (readonly [number, number])[];
  readonly distances: readonly number[];
  readonly length: number;
  readonly group: number;
}

export interface DesktopOptions {
  readonly reduced: boolean;
  /** Snap the pinned index to its four stops (mouse and trackpad only). */
  readonly snap: boolean;
}

export function startDesktop(root: HTMLElement, options: DesktopOptions): () => void {
  const q = <T extends Element = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector)!;
  const qa = <T extends Element = HTMLElement>(selector: string) => [
    ...root.querySelectorAll<T>(selector),
  ];

  const track = q("[data-track]");
  const stage = q("[data-stage]");
  const themes = qa("li[data-theme]");
  const forks = qa("[data-fork]");
  const knuckles = qa("[data-knuckle]");
  const steps = qa("[data-step]");
  const warm = qa("[data-warm-knuckle]");
  const lights = qa("[data-light-window]");
  const ticks = qa("[data-tick]");
  const rail = q("[data-rail]");
  const old = q("[data-old-window]");
  const oldCounter = q("[data-old-counter]");
  const young = q("[data-young]");
  const routes = q("[data-routes]");
  const dawn = q("[data-dawn]");
  const audience = q("[data-audience]");
  const canvas = q<HTMLCanvasElement>("canvas[data-comets]");
  const ctx = canvas.getContext("2d")!;

  const stationary = options.reduced;
  const ctxGsap = gsap.context(() => {}, root);

  let k = 1;
  let z = 1;
  let vh = window.innerHeight;
  let stageHeight = 0;
  let trackTop = 0;
  let pinStart = Infinity;
  let pinLength = 0;
  let pinEnd = Infinity;
  let clock = 0;
  let scroll = -1;
  let descent = 0;
  let pair = 0;
  let focus = 1;
  let priorTheme = 0;
  let priorPair = -1;
  let routesEntered = false;
  let drawn = false;
  /** Scrubbed position of the light across the four themes (0–3). */
  const focusState = { position: 0 };
  const pulses: (number | null)[] = [null, null, null, null];
  const arrivals: (number | null)[] = [null, null, null, null];
  const cached = {
    forks: [] as number[],
    steps: [] as number[],
    audience: 0,
    forkLengths: [] as number[],
    oldStart: 0,
    oldEnd: 0,
    knuckleY: 0,
  };

  /* Comet paths in u; columns may outgrow the photograph's scale below
     1440 px (index type has a floor), so each comet starts below its column. */
  const rawPaths = G.paths.map((path) => ({
    group: path.group,
    id: path.id,
    points: path.points.map(([x, y]) => [x * S, y * S] as const),
  }));
  let flat: Path[] = [];

  /** Inline styles this controller writes; cleared when the regime changes. */
  const clearInline = () =>
    gsap.set(
      [
        ...lights,
        ...lights.map((el) => el.firstElementChild),
        ...warm,
        old,
        oldCounter,
        young,
        routes,
        rail,
        ...qa("[data-hairline] i"),
        ...qa("[data-service] > span[aria-hidden] > span"),
        ...qa("[data-fork-mark] path"),
        ...knuckles.flatMap((el) => [
          el.querySelector("div"),
          el.querySelector("circle"),
          el.querySelector("span"),
        ]),
      ].filter(Boolean),
      { clearProps: "all" },
    );

  const attr = (el: HTMLElement, key: string, value: number | string) => {
    const text = String(value);
    if (el.dataset[key] !== text) el.dataset[key] = text;
  };

  function buildPaths(columnBottoms: Map<string, number>) {
    flat = rawPaths.map((raw) => {
      const minY = (columnBottoms.get(raw.id) ?? 0) + 20 / k;
      let points = raw.points;
      const first = points.findIndex(([, y]) => y >= minY);
      if (first > 0) points = points.slice(first);
      const distances = [0];
      for (let i = 1; i < points.length; i++)
        distances.push(
          distances[i - 1]! +
            Math.hypot(
              points[i]![0] - points[i - 1]![0],
              points[i]![1] - points[i - 1]![1],
            ),
        );
      return { points, distances, length: distances.at(-1)!, group: raw.group };
    });
  }

  function setup() {
    vh = window.innerHeight;
    const width = track.clientWidth;
    k = Math.min(width, 1920) / 1440;
    z = clamp(width / 1440, 0.92, 1.15);
    stageHeight = stage.offsetHeight;
    trackTop = track.getBoundingClientRect().top + window.scrollY;
    if (stationary) {
      pinStart = Infinity;
      pinLength = 0;
    } else {
      // Whole pixels: scroll positions are integers, so a snapped stop must
      // compare equal to the start of the hold.
      pinStart = Math.round(trackTop - parseFloat(getComputedStyle(stage).top || "0"));
      pinLength = Math.max(0, track.offsetHeight - stageHeight);
    }
    pinEnd = pinStart + pinLength;
    const stageRect = stage.getBoundingClientRect();
    const local = (el: Element) => el.getBoundingClientRect().top - stageRect.top;
    cached.forks = forks.map((el) => local(el) + el.getBoundingClientRect().height / 2);
    cached.steps = steps.map((el) => local(el) + 21 * z);
    cached.audience = local(audience);
    cached.forkLengths = forks.map((el) =>
      el.querySelector<SVGPathElement>("[data-fork-mark] path")!.getTotalLength(),
    );
    cached.oldStart = G.oldTrunk.top * S * k;
    cached.oldEnd = G.oldTrunk.bottom * S * k;
    cached.knuckleY = G.knuckles[0]!.center[1] * S * k;
    const bottoms = new Map<string, number>();
    for (const el of qa("[data-service]")) {
      const rect = el.getBoundingClientRect();
      bottoms.set(el.dataset.service!, (rect.bottom - stageRect.top) / k);
    }
    buildPaths(bottoms);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawn = true;
  }

  /** The stage's scroll offset: frozen while the index holds. */
  const stageY = () =>
    (scroll < pinStart ? scroll : scroll < pinEnd ? pinStart : scroll - pinLength) -
    trackTop;

  function setFocus(position: number, animate = true) {
    focus = clamp(position, 0, 3);
    const a = Math.floor(focus);
    const b = Math.min(3, a + 1);
    const t = focus - a;
    const rangeA = G.themeRanges[a]!;
    const rangeB = G.themeRanges[b]!;
    const left = lerp(rangeA[0], rangeB[0], t) * S - 140;
    const width = lerp(rangeA[1] - rangeA[0], rangeB[1] - rangeB[0], t) * S + 280;
    const scale = width / 650;
    for (const el of lights) {
      gsap.set(el, { x: left * k, scaleX: scale, transformOrigin: "left top" });
      gsap.set(el.firstElementChild, {
        x: (-left * k) / scale,
        scaleX: 1 / scale,
        transformOrigin: "left top",
      });
    }
    const current = Math.round(focus) + 1;
    if (priorTheme === current) return;
    priorTheme = current;
    themes.forEach((el, i) => {
      const on = i + 1 === current;
      attr(el, "current", on ? 1 : 0);
      const line = el.querySelector("[data-hairline] i");
      gsap.killTweensOf(line);
      if (on && animate && !stationary)
        gsap.fromTo(
          line,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.46, ease: "power3.inOut", overwrite: true },
        );
      else gsap.set(line, { scaleX: on ? 1 : 0 });
      const chars = el.querySelectorAll("[data-service] > span[aria-hidden] > span");
      if (on && animate && !stationary) {
        el.querySelectorAll<HTMLElement>("li[data-service]").forEach((service) => {
          const column = service.lastElementChild!;
          gsap.fromTo(
            column.children,
            { opacity: 0.56 },
            { opacity: 1, duration: 0.3, stagger: 0.024, overwrite: true },
          );
        });
      } else if (chars.length) gsap.set(chars, { opacity: 1 });
    });
    ticks.forEach((el, i) => attr(el, "current", i + 1 === current ? 1 : 0));
  }

  function setKnuckles(group: number, visible: boolean) {
    knuckles.forEach((el, i) => {
      attr(el, "active", group === i + 1 ? 1 : 0);
      const label = el.querySelector("div");
      if (visible) gsap.set(label, { opacity: 1, y: 0 });
      else gsap.set(label, { opacity: 0, y: 12 * z });
    });
  }

  function setPair(value: number, ready: boolean) {
    pair = value;
    if (priorPair !== value) {
      forks.forEach((el, i) => {
        attr(el, "active", value === i + 1 ? 1 : 0);
        if (value === i + 1 && !stationary) {
          const len = cached.forkLengths[i]!;
          gsap.fromTo(
            el.querySelector("[data-fork-mark] path"),
            { strokeDasharray: len, strokeDashoffset: len },
            {
              strokeDashoffset: 0,
              duration: 0.46,
              ease: "power3.inOut",
              overwrite: true,
            },
          );
        }
      });
      if (ready && !stationary && value) pulses[value - 1] = clock;
      priorPair = value;
    }
    if (!ready) return;
    knuckles.forEach((el, i) => attr(el, "active", value === i + 1 ? 1 : 0));
    warm.forEach((el, i) => {
      const target = i + 1 === value ? 0.85 : 0;
      if (stationary) gsap.set(el, { opacity: target });
      else if (el.dataset.target !== String(target)) {
        el.dataset.target = String(target);
        gsap.to(el, { opacity: target, duration: 0.6, overwrite: true });
      }
    });
  }

  function setSteps(n: number, current: boolean) {
    steps.forEach((el, i) =>
      attr(
        el,
        "state",
        i + 1 < n || (!current && i + 1 <= n)
          ? "reached"
          : i + 1 === n
            ? i === 5
              ? "reached"
              : "current"
            : "pending",
      ),
    );
  }

  function placeOldBand(bandY: number) {
    gsap.set(old, { y: bandY - 3030 * k });
    gsap.set(oldCounter, { y: -bandY });
  }

  function onScroll(y: number) {
    scroll = y;
    const view = stageY();
    // Before the hold the light rests on theme 02; from its first pixel the
    // scrubbed position leads (its tween does not update at progress 0).
    if (scroll < pinStart) setFocus(1, false);
    else setFocus(focusState.position);
    const end = trackTop + cached.knuckleY - vh * 0.6 + pinLength;
    descent = clamp((scroll - pinEnd) / (end - pinEnd));
    const descended = descent > 0.05 ? 1 : 0;
    themes.forEach((el) => attr(el, "descended", descended));
    const reading = view + vh * 0.52;
    let p = 0;
    for (let i = 0; i < cached.forks.length; i++)
      if (reading >= cached.forks[i]! - 70 * z) p = i + 1;
    if (reading > cached.forks.at(-1)! + 320 * z) p = 0;
    setPair(p, descent >= 1);
    attr(dawn, "disabled", scroll >= pinStart ? 1 : 0);
    let n = 0;
    for (let i = 0; i < cached.steps.length; i++)
      if (reading >= cached.steps[i]!) n = i + 1;
    setSteps(n, false);
    const first = cached.steps[0]!;
    const last = cached.steps.at(-1)!;
    gsap.set(rail, { scaleY: clamp((reading - first) / (last - first)) });
    const bandY = clamp(
      reading - 360 * k,
      cached.oldStart - 360 * k,
      cached.oldEnd - 360 * k,
    );
    placeOldBand(bandY);
    gsap.set(old, {
      opacity:
        reading > cached.oldStart - 200 * k && reading < cached.oldEnd + 700 * k
          ? 1
          : 0,
    });
    const youngLight =
      clamp((reading - (cached.audience - vh * 0.4)) / (vh * 0.6)) * 0.9;
    gsap.set(young, { opacity: youngLight });
    if (!routesEntered && view + vh - cached.audience > 0) {
      routesEntered = true;
      gsap.to(routes, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power4.out",
        overwrite: true,
      });
    }
  }

  function pointAt(path: Path, distance: number) {
    const d = clamp(distance, 0, path.length);
    const arr = path.distances;
    let lo = 0;
    let hi = arr.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid]! < d) lo = mid;
      else hi = mid;
    }
    const a = path.points[lo]!;
    const b = path.points[hi]!;
    const t = arr[hi] === arr[lo] ? 0 : (d - arr[lo]!) / (arr[hi]! - arr[lo]!);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] as const;
  }

  /** Comets, knuckle arrivals and pulses; returns whether anything moves. */
  function draw() {
    const view = stageY();
    const top = clamp(view, 0, Math.max(0, stageHeight - vh));
    const width = stage.clientWidth;
    const comets = descent > 0 && descent < 1;
    if (comets || drawn) {
      ctx.clearRect(0, 0, width, vh);
      drawn = false;
    }
    let moving = comets;
    if (comets) {
      drawn = true;
      ctx.save();
      ctx.scale(k, k);
      const viewU = top / k;
      const heightU = vh / k;
      flat.forEach((path, i) => {
        const progress = clamp((descent - i * 0.004) / 0.94);
        if (progress <= 0 || progress >= 1) return;
        const distance = progress * path.length;
        const [x, y] = pointAt(path, distance);
        const visible = y - viewU >= -120 && y - viewU <= heightU + 120;
        if (visible) {
          const before = pointAt(path, distance - 12);
          const after = pointAt(path, distance + 12);
          const angle =
            Math.atan2(after[1] - before[1], after[0] - before[0]) - Math.PI / 2;
          // A narrow, elongated lift on the wood.
          ctx.save();
          ctx.translate(x, y - viewU);
          ctx.rotate(angle);
          ctx.scale(20, 60);
          const sheen = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
          sheen.addColorStop(0, "rgba(255,176,102,.24)");
          sheen.addColorStop(0.4, "rgba(255,176,102,.12)");
          sheen.addColorStop(1, "rgba(255,176,102,0)");
          ctx.fillStyle = sheen;
          ctx.beginPath();
          ctx.arc(0, 0, 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "butt";
        for (let tail = 240; tail > 0; tail -= 4) {
          const a = pointAt(path, distance - tail);
          const b = pointAt(path, distance - tail + 4);
          if (a[1] - viewU > heightU + 30 || b[1] - viewU < -30) continue;
          const p = 1 - tail / 240;
          const near = clamp((p - 0.55) / 0.45);
          ctx.strokeStyle = `rgba(255,${lerp(176, 126, near)},${lerp(102, 21, near)},${p * 0.8})`;
          ctx.lineWidth = Math.max(0.02, 3 * p);
          ctx.beginPath();
          ctx.moveTo(a[0], a[1] - viewU);
          ctx.lineTo(b[0], b[1] - viewU);
          ctx.stroke();
        }
        if (visible) {
          const glow = ctx.createRadialGradient(x, y - viewU, 0, x, y - viewU, 8);
          glow.addColorStop(0, "rgba(255,150,50,.35)");
          glow.addColorStop(1, "rgba(255,126,21,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y - viewU, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ff7e15";
          ctx.beginPath();
          ctx.arc(x, y - viewU, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      });
      ctx.restore();
    }
    knuckles.forEach((el, i) => {
      const entered = descent >= 0.94 + [1, 5, 9, 10][i]! * 0.004;
      const label = el.querySelector("div");
      const outline = el.querySelector("circle");
      if (entered && arrivals[i] === null) {
        arrivals[i] =
          i === 0 ? clock : Math.max(clock, (arrivals[i - 1] ?? clock) + 0.12);
        pulses[i] = arrivals[i]!;
      }
      if (!entered) {
        arrivals[i] = null;
        gsap.set(label, { opacity: 0, y: 12 * z });
        gsap.set(outline, { opacity: 0, scale: 0.8, transformOrigin: "center" });
      } else {
        const t = clamp((clock - arrivals[i]!) / 0.3);
        if (t < 1) moving = true;
        gsap.set(label, { opacity: t, y: 12 * z * (1 - t) });
        gsap.set(outline, {
          opacity: t,
          scale: 0.8 + 0.2 * t,
          transformOrigin: "center",
        });
        if (!pair) attr(el, "active", 1);
      }
      const pulse = pulses[i] === null ? 1 : clamp((clock - pulses[i]!) / 0.9);
      if (pulse < 1) moving = true;
      gsap.set(el.querySelector("span"), {
        scale: 1 + pulse * 1.6,
        opacity: 0.5 * (1 - pulse),
      });
    });
    return moving;
  }

  /* ------------------------------------------------------------- start */
  if (stationary) {
    delete root.dataset.pin;
    setup();
    setFocus(1, false);
    setKnuckles(2, true);
    setPair(2, true);
    setSteps(5, true);
    gsap.set(rail, { scaleY: 0.8 });
    gsap.set(young, { opacity: 0.9 });
    gsap.set(routes, { opacity: 1, y: 0 });
    placeOldBand(cached.steps[4]! - 360 * k);
    gsap.set(old, { opacity: 1 });
    root.dataset.motion = "ready";
    const onResize = () => {
      setup();
      placeOldBand(cached.steps[4]! - 360 * k);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctxGsap.revert();
      clearInline();
      delete root.dataset.motion;
    };
  }

  root.dataset.pin = "1";
  setup();
  ctxGsap.add(() => {
    setFocus(1, false);
    gsap.set(warm, { opacity: 0 });
    setKnuckles(0, false);
    gsap.set(routes, { opacity: 0, y: 16 * z });
    setSteps(0, false);
  });

  let trigger: ScrollTrigger | undefined;
  // Where the page last came to rest (still for 0.3 s; the snap decides after
  // 0.15 s): entering the hold lands on the first station it meets instead of
  // skipping it, as a plain directional snap did.
  let restZone: "before" | "inside" | "after" = "before";
  let lastMove = 0;
  /** One station per gesture in the scroll direction (hq.js snap stops). */
  const STOPS = [0, 1 / 3, 2 / 3, 1];
  function snapStop(value: number, self?: ScrollTrigger) {
    const down = (self?.direction ?? 1) > 0;
    if (down && restZone === "before" && value < STOPS[1]!) return 0;
    if (!down && restZone === "after" && value > STOPS[2]!) return 1;
    return down
      ? (STOPS.find((stop) => stop >= value - 0.001) ?? 1)
      : (STOPS.findLast((stop) => stop <= value + 0.001) ?? 0);
  }
  ctxGsap.add(() => {
    const tween = gsap.to(focusState, {
      position: 3,
      duration: 3,
      ease: "none",
      paused: true,
      onUpdate: () => {
        if (scroll >= pinStart) setFocus(focusState.position);
      },
    });
    trigger = ScrollTrigger.create({
      start: () => pinStart,
      end: () => pinEnd,
      animation: tween,
      scrub: 0.6,
      invalidateOnRefresh: true,
      snap: options.snap
        ? { snapTo: snapStop, duration: 0.6, ease: "power3.out", delay: 0.15 }
        : undefined,
    });
  });

  let moving = true;
  const tick = (time: number) => {
    clock = time;
    const y = window.scrollY;
    const scrolled = y !== scroll;
    if (scrolled) {
      lastMove = time;
      onScroll(y);
    } else if (time - lastMove > 0.3)
      restZone = scroll < pinStart ? "before" : scroll > pinEnd ? "after" : "inside";
    if (scrolled || moving) moving = draw();
  };
  gsap.ticker.add(tick);
  onScroll(window.scrollY);
  root.dataset.motion = "ready";
  // Read-only inspection for the verification scripts and e2e tests.
  (window as unknown as { __mo?: unknown }).__mo = {
    marks: () => ({
      pinStart,
      pinLength,
      pinEnd,
      trackTop,
      vh,
      z,
      forks: cached.forks,
      steps: cached.steps,
      audience: cached.audience,
    }),
    state: () => ({ scroll, focus, descent, pair, restZone }),
  };

  let width = window.innerWidth;
  let height = window.innerHeight;
  const remeasure = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    setup();
    ScrollTrigger.refresh();
    scroll = -1;
    moving = true;
  };
  const onResize = () => {
    if (window.innerWidth === width && Math.abs(window.innerHeight - height) < 2)
      return;
    remeasure();
  };
  window.addEventListener("resize", onResize);
  const fonts = document.fonts;
  fonts?.addEventListener?.("loadingdone", remeasure);

  return () => {
    window.removeEventListener("resize", onResize);
    fonts?.removeEventListener?.("loadingdone", remeasure);
    gsap.ticker.remove(tick);
    trigger?.kill();
    ctxGsap.revert();
    clearInline();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    delete root.dataset.pin;
    delete root.dataset.motion;
    delete (window as unknown as { __mo?: unknown }).__mo;
  };
}
