/**
 * Phone and tablet choreography of HOME (< 1024 px) — a port of the adopted
 * A2r3 phone prototype (`home-r3-mobile-2026-10-02/build/A2m.js`). The adopted
 * plates are reframed by a portrait camera; one orange line runs down the
 * phone: it opens the film, waits beside the purpose, turns 90° into the
 * horizon between the two viewpoints, lies on the lake's horizon of the path
 * and becomes its route, signs the letter, joins the three tiers, and is the
 * way across the lake. Lengths the prototype gave in CSS px of the 390 × 844
 * screen are multiplied by `m` (the module CSS's --m).
 */
import { approach } from "@/content/adelva-home";
import { homeGeometry as G } from "@/content/adelva-home-geometry";
import { setHeaderOverride } from "@/lib/header-state";

import type { Controller } from "./desktop";
import {
  clamp,
  createEngine,
  ease,
  easeIn,
  easeOut,
  lerp,
  lin,
  rise,
  smooth,
} from "./engine";
import {
  createLake,
  createPanorama,
  type LakeState,
  type PanoramaState,
  type Renderer,
} from "./gl";
import {
  attr,
  createFilm,
  createSignature,
  headerSurface,
  panoMask,
  plateMix,
  q,
  qa,
  setter,
  STEP_TIMING,
  whenNeeded,
  zoomAt,
  type SurfaceRule,
} from "./shared";

interface SpineRequest {
  readonly cx: number;
  readonly cy: number;
  readonly L: number;
  /** degrees, 0 = vertical */
  readonly th: number;
  readonly o: number;
  readonly d0?: number;
  readonly d1?: number;
  readonly g0?: number | null;
  readonly g1?: number | null;
}

export function startMobile(root: HTMLElement): Controller {
  const set = setter();
  const engine = createEngine(
    () =>
      q(root, '[data-scene="hero"] [data-stage]').clientHeight || window.innerHeight,
  );
  const surfaces: SurfaceRule[] = [];
  const mOf = () =>
    clamp(Math.min(window.innerWidth / 390, window.innerHeight / 844), 0.86, 1.5);
  let m = mOf();
  const disposers: (() => void)[] = [];

  // ===================================================================== the one line (fixed)
  // Each scene may request the line; the latest scene on the page that has a request wins.
  const spine = q(root, "[data-spine]");
  const req: {
    hero: SpineRequest | null;
    who: SpineRequest | null;
    challenges: SpineRequest | null;
  } = {
    hero: null,
    who: null,
    challenges: null,
  };
  let spineKey = "";
  const drawSpine = (r: SpineRequest | null) => {
    if (!r || r.o <= 0.001 || r.L < 0.5) {
      if (spineKey !== "off") {
        spine.style.opacity = "0";
        spineKey = "off";
      }
      return;
    }
    let iv: [number, number][] = [[clamp(r.d0 ?? 0), clamp(r.d1 ?? 1)]];
    if (r.g0 != null && r.g1 != null && r.g1 > r.g0) {
      const g0 = r.g0;
      const g1 = r.g1;
      iv = iv
        .flatMap(([a, b]): [number, number][] => [
          [a, Math.min(b, g0)],
          [Math.max(a, g1), b],
        ])
        .filter(([a, b]) => b > a);
    }
    const pc = (v: number) => `${(v * 100).toFixed(3)}%`;
    const stops = ["transparent 0%"];
    iv.forEach(([a, b]) =>
      stops.push(
        `transparent ${pc(a)}`,
        `#000 ${pc(a)}`,
        `#000 ${pc(b)}`,
        `transparent ${pc(b)}`,
      ),
    );
    stops.push("transparent 100%");
    const mask =
      iv.length === 1 && iv[0]![0] <= 0 && iv[0]![1] >= 1
        ? "none"
        : `linear-gradient(to bottom, ${stops.join(", ")})`;
    const key = [r.cx, r.cy, r.L, r.th, r.o].map((v) => v.toFixed(2)).join("|") + mask;
    if (key === spineKey) return;
    spineKey = key;
    spine.style.height = `${r.L}px`;
    spine.style.transform = `translate(${r.cx - 0.5}px, ${r.cy - r.L / 2}px) rotate(${r.th}deg)`;
    spine.style.opacity = String(r.o);
    spine.style.webkitMaskImage = mask;
    spine.style.maskImage = mask;
  };

  // ===================================================================== 1 hero → purpose
  const hero = q(root, '[data-scene="hero"]');
  const giant = q(hero, "[data-giant]");
  const giantWord = q(hero, "[data-giant-word]");
  const chars = qa(hero, "[data-statement] [data-ch]");
  const marks = qa(hero, "[data-statement] [data-mark]");
  const whole = q(hero, "[data-film-whole]");
  const halves = qa(hero, "[data-half]");
  const purposeBlock = q(hero, "[data-purpose-block]");
  const purposeEyebrow = purposeBlock.firstElementChild as HTMLElement;
  const purposeBody = q(hero, "[data-purpose-body]");
  const film = createFilm(root);
  const filmToggle = q(hero, "[data-film-toggle]");
  disposers.push(() => film.dispose());
  let giantBox: DOMRect | null = null;
  engine.register(hero, ({ p, visible, vw, vh }) => {
    setHeaderOverride({ brand: p > 0.235 ? "shown" : "hidden" });
    film.visible(visible && p < 0.58);
    if (!visible) {
      req.hero = null;
      return;
    }
    if (!giantBox) {
      giantWord.style.transform = "";
      giantBox = giantWord.getBoundingClientRect();
    }
    const a = giantBox;
    const b = document.querySelector("[data-brand-word]")?.getBoundingClientRect();
    const fly = ease(smooth(0, 0.24, p));
    if (b && b.width > 0) {
      const dx = b.left - a.left;
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      set(
        giantWord,
        "transform",
        `translate(${dx * fly}px, ${dy * fly}px) scale(${lerp(1, b.width / a.width, fly)})`,
      );
    }
    set(giant, "opacity", String(1 - smooth(0.21, 0.245, p)));
    const inset = ease(smooth(0.08, 0.26, p));
    const part = ease(smooth(0.26, 0.56, p));
    const sc = lerp(1, 0.93, inset);
    const parting = part > 0.0005;
    set(whole, "visibility", parting ? "hidden" : "visible");
    // the pause control belongs to the film: it leaves when the film starts to part
    const tg = 1 - smooth(0.26 - 0.06, 0.26, p);
    set(filmToggle, "opacity", String(tg));
    set(filmToggle, "visibility", tg > 0.01 ? "visible" : "hidden");
    set(whole, "transform", `scale(${sc})`);
    halves.forEach((h, i) => {
      set(h, "visibility", parting ? "visible" : "hidden");
      set(
        h,
        "transform",
        `translateX(${(i === 0 ? -1 : 1) * part * 56}vw) scale(${sc})`,
      );
    });
    if (parting && part < 0.999) film.draw(2);
    // the line, left behind when the film parts; it opens around the purpose so it never runs through the words
    const seamScroll = smooth(0.26, 0.32, p);
    let g0: number | null = null;
    let g1: number | null = null;
    const gp = smooth(0.29, 0.38, p);
    if (gp > 0) {
      const r = purposeBlock.getBoundingClientRect();
      const c = (r.top + r.bottom) / 2;
      g0 = lerp(c, r.top - 26 * m, gp) / vh;
      g1 = lerp(c, r.bottom + 26 * m, gp) / vh;
    }
    req.hero =
      p > 0.26
        ? {
            cx: vw / 2,
            cy: vh / 2,
            L: vh,
            th: 0,
            o: seamScroll,
            d0: 0,
            d1: smooth(0.26, 0.5, p),
            g0,
            g1,
          }
        : null;
    const n = chars.length;
    chars.forEach((c, i) =>
      set(
        c,
        "--o",
        String(lerp(0.08, 1, smooth(0.36 + (i / n) * 0.3, 0.43 + (i / n) * 0.3, p))),
      ),
    );
    marks.forEach((e) => set(e, "--u", String(smooth(0.68, 0.8, p))));
    set(hero, "--po", String(smooth(0.235, 0.29, p)));
    set(purposeEyebrow, "opacity", String(smooth(0.3, 0.4, p)));
    set(purposeBody, "opacity", String(smooth(0.62, 0.74, p)));
  });
  surfaces.push({ el: hero, kind: (p) => (p > 0.235 ? "paper" : "film") });

  // ===================================================================== 2 who we support
  // The two viewpoints stack. The line turns 90° and lies across the middle; the view from the heights
  // opens upward from it, the view from the floor downward. The line moves towards the view being read,
  // and that view's card unfolds; the other keeps only its title.
  const who = q(root, '[data-scene="who"]');
  const whoStage = q(who, "[data-stage]");
  const whoIntro = q(who, "[data-who-intro]");
  const whoEyebrow = whoIntro.firstElementChild as HTMLElement;
  const h2t = q(who, '[data-who-h="t"]');
  const h2b = q(who, '[data-who-h="b"]');
  const linesT = qa(h2t, "[data-rise]");
  const linesB = qa(h2b, "[data-rise]");
  const whoP = q(who, "[data-who-p]");
  const sideT = q(who, '[data-side="t"]');
  const sideB = q(who, '[data-side="b"]');
  const imgT = q(sideT, "[data-side-img]");
  const imgB = q(sideB, "[data-side-img]");
  const cardT = q(sideT, "[data-card]");
  const cardB = q(sideB, "[data-card]");
  const moreT = q(cardT, "[data-more]");
  const moreB = q(cardB, "[data-more]");
  const S_HI = 0.6;
  const S_LO = 0.4;
  engine.register(who, ({ p, enter, vh, vw, visible }) => {
    if (!visible) {
      req.who = null;
      return;
    }
    const rot = p > 0 ? 1 : ease(smooth(0.62, 1, enter));
    let s = 0.5;
    if (p >= 0.4 && p < 0.5) s = lerp(0.5, S_HI, ease(smooth(0.4, 0.5, p)));
    else if (p >= 0.5 && p < 0.6) s = S_HI;
    else if (p >= 0.6 && p < 0.72) s = lerp(S_HI, S_LO, ease(smooth(0.6, 0.72, p)));
    else if (p >= 0.72 && p < 0.85) s = S_LO;
    else if (p >= 0.85) s = lerp(S_LO, 0.5, ease(smooth(0.85, 0.94, p)));
    const sPx = s * vh;
    set(whoStage, "--s", `${sPx}px`);
    req.who =
      enter > 0.6
        ? {
            cx: vw / 2,
            cy: sPx,
            L: lerp(vh, vw, rot),
            th: 90 * rot,
            o: 1,
            d0: 0,
            d1: 1,
          }
        : null;
    // the two addresses, above and below the line, then pushed apart by the opening views
    // (they rise only once the line is level and the stage is pinned, so the line never crosses them)
    set(
      whoEyebrow,
      "opacity",
      String(smooth(0.9, 1, enter) * (1 - smooth(0.12, 0.18, p))),
    );
    linesT.forEach((sp, i) => rise(sp, lin(0.002 + i * 0.008, 0.032 + i * 0.008, p)));
    linesB.forEach((sp, i) => rise(sp, lin(0.014 + i * 0.008, 0.044 + i * 0.008, p)));
    set(whoP, "opacity", String(smooth(0.04, 0.07, p) * (1 - smooth(0.12, 0.17, p))));
    const push = ease(smooth(0.12, 0.21, p));
    set(h2t, "transform", `translateY(${-push * 46 * m}px)`);
    set(h2t, "opacity", String(1 - smooth(0.13, 0.19, p)));
    set(h2b, "transform", `translateY(${push * 46 * m}px)`);
    set(h2b, "opacity", String(1 - smooth(0.14, 0.2, p)));
    const rt = ease(smooth(0.12, 0.28, p));
    const rb = ease(smooth(0.14, 0.3, p));
    set(sideT, "clipPath", `inset(${(1 - rt) * 100}% 0 0 0)`);
    set(sideB, "clipPath", `inset(0 0 ${(1 - rb) * 100}% 0)`);
    const im = Math.max(vw, 0.66 * vh);
    set(whoStage, "--im", `${im}px`);
    // each square is placed so its subject stays clear of the card
    const kT = clamp((S_HI - s) / (S_HI - S_LO));
    const kB = clamp((s - S_LO) / (S_HI - S_LO));
    const zT = lerp(1.1, 1, ease(smooth(0.12, 0.72, p)));
    const zB = lerp(1.1, 1, ease(smooth(0.14, 0.95, p)));
    set(imgT, "transform", `translateY(${lerp(0, -0.18, kT) * im}px) scale(${zT})`);
    set(imgB, "transform", `translateY(${lerp(-0.08, -0.18, kB) * im}px) scale(${zB})`);
    // cards: both titles appear; the view being read unfolds its text and cue
    const cin = smooth(0.26, 0.36, p);
    const aT = smooth(0.52, 0.6, s);
    const aB = smooth(0.48, 0.4, s);
    (
      [
        [cardT, moreT, aT],
        [cardB, moreB, aB],
      ] as const
    ).forEach(([c, mo, al]) => {
      const mh = mo.offsetHeight;
      set(c, "opacity", String(cin));
      set(c, "visibility", cin > 0.001 ? "visible" : "hidden");
      set(
        c,
        "transform",
        `translateY(${(1 - easeOut(cin)) * 30 * m + (1 - al) * mh}px)`,
      );
      set(mo, "opacity", String(al));
      set(mo, "visibility", al > 0.01 ? "visible" : "hidden");
    });
  });
  surfaces.push({ el: who, kind: (p) => (p > 0.25 ? "glass" : "paper") });

  // ===================================================================== 3 challenges — the lakeside path
  const ch = q(root, '[data-scene="challenges"]');
  const items = qa(ch, "[data-item]");
  const itemLines = items.map((it) => qa(it, "[data-rise]"));
  const chHead = q(ch, "[data-ch-head]");
  const chTitleLine = q(chHead, "[data-rise]");
  const slot = q(ch, "[data-slot]");
  const rail = q(ch, "[data-rail]");
  const track = q(ch, "[data-track]");
  const nodes = qa(ch, "[data-node]");
  const panoCanvas = q<HTMLCanvasElement>(ch, "canvas[data-pano]");
  let pano: Renderer<PanoramaState> | null = null;
  let panoFailed = false;
  const panoReady = new Promise<void>((resolve) => {
    const load = whenNeeded(
      () => {
        createPanorama(panoCanvas, {
          tiles: G.pano.mobile,
          depth: G.pano.depth,
          mask: panoMask(),
          size: G.pano.size,
          dprCap: 2,
          mip: false,
        })
          .then((r) => (pano = r))
          .catch(() => (panoFailed = true))
          .finally(() => resolve());
      },
      () =>
        window.scrollY + window.innerHeight * 2.5 >
        ch.getBoundingClientRect().top + window.scrollY,
      1500,
    );
    engine.tick(() => load.check());
    disposers.push(() => load.cancel());
  });
  const T0 = 0.07;
  const TR = 0.075;
  const DW = 0.095;
  const seg = (i: number) => ({
    a: T0 + i * (TR + DW),
    b: T0 + i * (TR + DW) + TR,
    c: T0 + (i + 1) * (TR + DW),
  });
  const exitA = T0 + 5 * (TR + DW);
  const LAND = [0.0, 0.05] as const; // the line lies on the lake's horizon, then descends onto the route
  engine.register(ch, ({ p, enter, vh, vw, t, visible }) => {
    if (!visible) {
      req.challenges = null;
      return;
    }
    const C = G.pano.stops;
    const base = vh / G.pano.size[1]; // height-cover: the whole height of the photograph
    const minX = vw / 2 / base;
    let vel = 0;
    let push = 0;
    let cur = -1;
    const travel = (from: number, to: number, a: number, b: number) => {
      const u = clamp((p - a) / (b - a));
      vel = (((to - from) * 6 * u * (1 - u)) / (b - a)) * 0.0012;
      return lerp(from, to, ease(u));
    };
    // intro: close on the old cedar at the left end, then the camera steps back and walks to the study
    const intro = ease(smooth(0, T0 + TR, p));
    let zoom = lerp(1.3, 1, intro);
    let cx = lerp(minX * 1.02, C[0]!, intro);
    for (let i = 1; i < 5; i++) {
      const { a, b } = seg(i);
      if (p >= a && p < b) cx = travel(C[i - 1]! + 40, C[i]!, a, b);
    }
    for (let i = 0; i < 5; i++) {
      const { a, b, c } = seg(i);
      if (p >= a && p < c) cur = i;
      if (p >= b && p < c) {
        const u = (p - b) / (c - b);
        cx = C[i]! + u * 40;
        push = Math.sin(Math.PI * clamp(u)) * 0.06;
      }
    }
    if (p >= exitA) {
      cx = travel(C[4]! + 40, G.pano.exitXMobile, exitA, 1);
      zoom = lerp(1, 1.18, ease(smooth(exitA, 1, p)));
    }
    const scale = base * zoom;
    cx = clamp(cx, vw / 2 / scale, G.pano.size[0] - vw / 2 / scale);
    const cy = G.pano.size[1] / 2 + 4;
    const par = clamp(-vel * 520, -30, 30) * (vh / 844);
    const fade = smooth(exitA + 0.03, 1, p);
    pano?.render({
      cx,
      cy,
      scale,
      par,
      ref: G.pano.ref,
      push,
      t,
      fade,
      dim: 1 - smooth(0.2, 0.95, enter),
    });
    // the line rests on the lake's horizon as the path arrives, then descends onto the route rail
    const hzY = vh / 2 + (G.pano.horizon - cy) * scale;
    const tr = track.getBoundingClientRect();
    const railY = tr.top + 0.5;
    const railL = tr.left;
    const onHz = ease(smooth(0.25, 1, enter));
    const down = ease(smooth(LAND[0] + 0.012, LAND[1] - 0.012, p));
    const shrink = ease(smooth(LAND[0] + 0.03, LAND[1] + 0.01, p));
    const y = lerp(lerp(vh / 2, hzY, onHz), railY, down);
    const xa = lerp(0, railL, down);
    const xb = lerp(vw, railL + 0.5, shrink);
    req.challenges =
      enter > 0.02
        ? {
            cx: (xa + xb) / 2,
            cy: y,
            L: Math.max(0, xb - xa),
            th: 90,
            o: 1 - smooth(LAND[1] - 0.004, LAND[1] + 0.012, p),
            d0: 0,
            d1: 1,
          }
        : null;
    // texts
    set(
      chHead,
      "opacity",
      String(smooth(0.35, 0.8, enter) * (1 - smooth(T0 - 0.01, T0 + 0.03, p))),
    );
    set(
      chHead,
      "transform",
      `translateX(${-smooth(T0 - 0.01, T0 + 0.05, p) * 80 * m}px)`,
    );
    set(chHead, "visibility", p < T0 + 0.04 ? "visible" : "hidden");
    rise(chTitleLine, lin(0.4, 0.95, enter));
    set(ch, "--ho", String(smooth(0.3, 0.8, enter) * (1 - smooth(T0, T0 + 0.05, p))));
    set(
      ch,
      "--so",
      String(smooth(0.3, 0.9, enter) * (1 - smooth(exitA, exitA + 0.05, p))),
    );
    items.forEach((it, i) => {
      const { b, c } = seg(i);
      const inn = lin(b - 0.045, b + 0.01, p);
      const out = lin(c - 0.006, c + 0.03, p);
      const o = inn * (1 - out);
      set(it, "opacity", String(o));
      set(it, "visibility", o > 0.001 ? "visible" : "hidden");
      set(
        it,
        "transform",
        `translateX(${((1 - easeOut(inn)) * 56 - easeIn(out) * 56) * m}px)`,
      );
      itemLines[i]!.forEach((s, kk) =>
        rise(s, lin(b - 0.04 + kk * 0.008, b + 0.012 + kk * 0.008, p)),
      );
    });
    set(slot, "opacity", String(1 - smooth(exitA, exitA + 0.04, p)));
    const fill = clamp((cx - C[0]!) / (C[4]! - C[0]!));
    set(rail, "--f", String(p < LAND[1] ? 0 : fill));
    set(
      rail,
      "--to",
      String(smooth(LAND[0] + 0.02, LAND[1], p) * (1 - smooth(exitA, exitA + 0.04, p))),
    );
    nodes.forEach((n, i) => {
      attr(
        n,
        "data-on",
        i === cur || (i === 0 && cur === -1 && p >= LAND[1] - 0.004 && p < exitA),
      );
      attr(n, "data-done", cur > i || (cur === -1 && p > exitA));
    });
  });
  surfaces.push({ el: ch, kind: (p) => (p > 0.95 ? "paper" : "glass") });

  // ===================================================================== 4 the founder's letter, signed
  const founder = q(root, '[data-scene="founder"]');
  const quoteMark = q(founder, "[data-quote-mark]");
  const founderChars = qa(founder, "[data-founder-lead] [data-ch]");
  const founderPs = qa(founder, "[data-founder-p]");
  const signer = q(founder, "[data-signer]");
  const signature = createSignature(founder);
  disposers.push(() => signature.reset());
  engine.register(founder, ({ p, enter, visible }) => {
    if (!visible) return;
    set(quoteMark, "opacity", String(smooth(0.35, 0.7, enter)));
    const n = founderChars.length;
    founderChars.forEach((c, i) =>
      set(
        c,
        "--o",
        String(lerp(0.06, 1, smooth(0.4 + (i / n) * 0.5, 0.48 + (i / n) * 0.5, enter))),
      ),
    );
    founderPs.forEach((pp, i) =>
      set(pp, "--o", String(lerp(0.2, 1, smooth(0.02 + i * 0.09, 0.1 + i * 0.09, p)))),
    );
    signature.draw(lin(0.34, 0.86, p), true);
    set(signer, "opacity", String(smooth(0.84, 0.92, p)));
  });
  surfaces.push({ el: founder, kind: () => "paper" });

  // ===================================================================== 5 our expertise — three tiers, one mountain
  // The desktop's three strips become three horizontal bands of one portrait photograph (the massif's
  // three-tier autumn), listed one under another with their text; then they gather into one picture, the
  // orange joins show for a moment, the picture opens to the full screen and the joins disappear.
  const exp = q(root, '[data-scene="expertise"]');
  const E = G.expertise;
  const bands = qa(exp, "[data-strip]");
  const bandImgs = bands.map((b) => q(b, "img"));
  const labels = qa(exp, "[data-domain]");
  const hairs = qa(exp, "[data-hair]");
  const eb = exp.querySelector<HTMLElement>("p[id]")!;
  const plan = q(exp, "[data-plan]");
  const index = q(exp, "[data-index]");
  const TIER = [0, E.tiers[0], E.tiers[1], 1];
  const OFF = [-14, 16, -6];
  const ZOOM = [1.22, 1.0, 1.3];
  engine.register(exp, ({ p, vw, vh, visible }) => {
    if (!visible) return;
    const [PW, PH] = E.tallSize;
    const J = { x: 22 * m, w: vw - 44 * m, h: Math.round(0.68 * vh), y: 0 };
    J.y = Math.round((vh - J.h) / 2 + 24 * m);
    const kJ = Math.max(J.w / PW, J.h / PH);
    const kF = Math.max(vw / PW, vh / PH);
    const labelH = labels.map((l) => l.offsetHeight);
    const listTop = 150 * m;
    const bandH = [0, 1, 2].map((i) => (TIER[i + 1]! - TIER[i]!) * PH * kJ);
    const pos: { band: number; label: number }[] = [];
    let y = listTop;
    for (let i = 0; i < 3; i++) {
      pos.push({ band: y, label: y + bandH[i]! + 16 * m });
      y += bandH[i]! + 16 * m + labelH[i]! + 40 * m;
    }
    const listEnd = y - 40 * m;
    const scrollA = Math.max(0, listEnd - (vh - 36 * m));
    const a = ease(smooth(0.0, 0.3, p));
    const mm = ease(smooth(0.3, 0.52, p));
    const f = ease(smooth(0.54, 0.74, p));
    const k = lerp(kJ, kF, f);
    const pictX = lerp(J.x, 0, f);
    const pictW = lerp(J.w, vw, f);
    const pictY = lerp(J.y, 0, f);
    const plateX = pictX + (pictW - PW * k) / 2;
    const plateH = PH * k;
    const pictH = lerp(J.h, vh, f);
    const plateY = pictY + (pictH - plateH) / 2;
    bands.forEach((b, i) => {
      const jy = plateY + TIER[i]! * plateH;
      const jh = (TIER[i + 1]! - TIER[i]!) * plateH;
      const ly = pos[i]!.band - a * scrollA;
      const bx = lerp(J.x + OFF[i]! * m, pictX, mm);
      const bw = lerp(J.w, pictW, mm);
      const by = lerp(ly, jy, mm);
      const bh = lerp(bandH[i]!, jh, mm);
      set(b, "left", `${bx}px`);
      set(b, "top", `${by}px`);
      set(b, "width", `${bw}px`);
      set(b, "height", `${bh + (mm > 0.98 && i < 2 ? 0.6 : 0)}px`);
      const img = bandImgs[i]!;
      const z = lerp(ZOOM[i]!, 1, mm);
      const ix = plateX - bx;
      const iy = plateY - jy;
      const cxB = bw / 2;
      const cyB = bh / 2;
      set(img, "width", `${PW * k}px`);
      set(img, "height", `${plateH}px`);
      set(
        img,
        "transform",
        `translate(${cxB + (ix - cxB) * z}px, ${cyB + (iy - cyB) * z}px) scale(${z})`,
      );
      // each label is revealed as it scrolls into the lower part of the screen, and leaves with the gathering
      const l = labels[i]!;
      const lt = pos[i]!.label - a * scrollA + (by - ly);
      set(l, "top", `${lt}px`);
      const lo = smooth(vh - 10 * m, vh - 150 * m, lt) * (1 - smooth(0.32, 0.42, p));
      set(l, "opacity", String(lo));
      set(l, "visibility", lo > 0.001 ? "visible" : "hidden");
      set(
        l,
        "transform",
        `translateY(${(1 - easeOut(smooth(vh - 10 * m, vh - 150 * m, lt))) * 18 * m}px)`,
      );
    });
    // the joins: the line appears where the tiers meet, then dissolves when they are one
    hairs.forEach((h, j) => {
      const yj = plateY + TIER[j + 1]! * plateH;
      set(h, "top", `${yj - 0.5}px`);
      set(h, "left", `${pictX}px`);
      set(h, "width", `${pictW}px`);
      set(h, "opacity", String(smooth(0.46, 0.52, p) * (1 - smooth(0.8, 0.94, p))));
    });
    set(eb, "transform", `translateY(${-a * scrollA}px)`);
    set(eb, "opacity", String(1 - smooth(0.4, 0.5, p)));
    set(exp, "--vo", String(smooth(0.6, 0.78, p)));
    set(exp, "--po", String(smooth(0.72, 0.84, p)));
    set(plan, "visibility", p > 0.71 ? "visible" : "hidden");
    const io = smooth(0.8, 0.92, p);
    set(exp, "--io", String(io));
    set(index, "visibility", io > 0.001 ? "visible" : "hidden");
  });
  surfaces.push({ el: exp, kind: (p) => (p > 0.62 ? "glass" : "paper") });

  // ===================================================================== 6 across the lake (portrait)
  const ap = q(root, '[data-scene="approach"]');
  const L = G.lake;
  const { A_PAPER, A_GLUE, A_FALL, FALL_LEN, FALL_STAG, A_ROUTE, TRAVEL0, PER, END } =
    STEP_TIMING;
  const stepEls = qa(ap, "[data-step]");
  const stepLines = stepEls.map((el) => q(el, "[data-rise]"));
  const stepTags = stepEls.map((el) => qa(el, "[data-tag]"));
  const tickEls = qa(ap, "[data-tick]");
  const domWords = qa(ap, "[data-st]");
  const lead = q(ap, "[data-lead]");
  const leadEyebrow = lead.previousElementSibling as HTMLElement;
  const finalEl = q(ap, "[data-final]");
  const lakeCanvas = q<HTMLCanvasElement>(ap, "canvas[data-lake]");
  let lake: Renderer<LakeState> | null = null;
  let lakeFailed = false;
  const lakeReady = new Promise<void>((resolve) => {
    const load = whenNeeded(
      () => {
        document.fonts
          .load('500 240px "HM Serif"', approach.steps.map((s) => s.name).join(""))
          .catch(() => undefined)
          .then(() =>
            createLake(lakeCanvas, {
              back: L.backMobile,
              backRows: L.backRows,
              front: L.frontMobile,
              depth: L.depth,
              words: approach.steps.map((s) => s.name),
              font: '"HM Serif", "Noto Serif JP", serif',
              dprCap: 2,
              mip: false,
            }),
          )
          .then((r) => (lake = r))
          .catch(() => (lakeFailed = true))
          .finally(() => resolve());
      },
      () =>
        window.scrollY + window.innerHeight * 3 >
        ap.getBoundingClientRect().top + window.scrollY,
      5000,
    );
    engine.tick(() => load.check());
    disposers.push(() => load.cancel());
  });
  // world of the six words (metres). A 390-px window sees ±9.5°: the words are smaller, closer to the
  // centre line, stretched more along the water, and the camera reads each one from 95 m
  const HM = 22;
  const CH = 4.9;
  const STRETCH = 4.2;
  const DWELL = 95;
  const W = approach.steps.map((s, i) => ({
    x: [-2, 2, -2, 2, -1.6, 0][i]!,
    z: 120 + 230 * i,
    w: CH * [...s.name].length * 0.98,
    l: CH * STRETCH,
  }));
  const routeX = [
    0,
    2,
    Math.PI / 230,
    -Math.PI / 2 - (Math.PI * (W[0]!.z + W[0]!.l / 2)) / 230,
  ];
  let domStart: {
    vw: number;
    vh: number;
    poses: { x: number; y: number; z: number; w: number; h: number }[];
  } | null = null;
  engine.register(ap, ({ p, enter, vw, vh, t, visible }) => {
    if (!visible) return;
    const base = Math.max(vw / 1536, vh / 1024);
    // the portrait camera: at first the window holds both the great peak and the ryokan; while crossing,
    // it turns slowly until the ryokan is centred
    const pan = ease(smooth(TRAVEL0, END, p));
    const mid = (L.anchors[0][0] + L.peak[0]) / 2;
    const vpx = lerp(vw / 2 - (mid - L.anchors[0][0]) * base, vw / 2, pan);
    const vp: [number, number] = [vpx, vh / 2 + (L.anchors[0][1] - 512) * base];
    const hz: [number, number] = [vw / 2, vp[1] - 18 * base];
    const f = vh / 2 / Math.tan((20 * Math.PI) / 180);
    const paper =
      0.5 * ease(smooth(A_PAPER[0], A_PAPER[1], p)) +
      0.72 * ease(smooth(A_FALL + 0.05, A_ROUTE[0] + 0.02, p));
    set(lead, "opacity", String(smooth(0.3, 0.75, enter)));
    set(ap, "--go", String(1 - smooth(A_GLUE[0], A_GLUE[1], p)));
    set(
      leadEyebrow,
      "opacity",
      String(smooth(0.3, 0.6, enter) * (1 - smooth(A_ROUTE[0], A_ROUTE[1], p))),
    );
    const qq = clamp((p - TRAVEL0) / PER, 0, 6);
    const stepIdx = Math.min(5, Math.floor(qq));
    const within = qq - stepIdx;
    const dwellZ = (i: number) => W[i]!.z - DWELL;
    let camZ: number;
    if (p < TRAVEL0) camZ = 0;
    else {
      const from = stepIdx === 0 ? 0 : dwellZ(stepIdx - 1) + 12;
      const to = dwellZ(stepIdx);
      camZ =
        within < 0.5 ? lerp(from, to, ease(within / 0.5)) : to + (within - 0.5) * 16;
    }
    if (qq >= 6) camZ = dwellZ(5) + 8;
    const zoom = zoomAt(
      p < TRAVEL0
        ? 0
        : stepIdx + (within < 0.5 ? ease(within / 0.5) * 0.5 : 0.5 + (within - 0.5)),
    );
    const [pa, pmix, bank] = plateMix(zoom);
    if (!domStart || domStart.vw !== vw || domStart.vh !== vh) {
      const st = q(ap, "[data-stage]").getBoundingClientRect();
      domStart = {
        vw,
        vh,
        poses: domWords.map((el) => {
          const b = el.getBoundingClientRect();
          const left = b.left - st.left;
          const bottom = b.bottom - st.top;
          const zs = 300;
          const kk = zs / f;
          return {
            x: (left + b.width / 2 - hz[0]) * kk,
            y: HM + (hz[1] - bottom) * kk,
            z: zs,
            w: b.width * kk,
            h: b.height * kk,
          };
        }),
      };
    }
    const w0: number[][] = [];
    const w1: number[][] = [];
    W.forEach((w, i) => {
      const s = domStart!.poses[i]!;
      const u = clamp((p - (A_FALL + i * FALL_STAG)) / FALL_LEN);
      const e = ease(u);
      const th = easeIn(clamp(u * 1.15)) * (Math.PI / 2);
      w0.push([
        lerp(s.x, w.x, e),
        lerp(s.y, 0, ease(clamp(u * 1.1))),
        lerp(s.z, w.z, e),
        lerp(s.w, w.w, e),
      ]);
      w1.push([lerp(s.h, w.l, e), th, u > 0 ? 1 : 0, i === 5 ? 1 : 0.35]);
      set(domWords[i]!, "opacity", u > 0 && lake ? "0" : "1");
    });
    const routeReveal = lerp(0, W[5]!.z + 90, ease(smooth(A_ROUTE[0], A_ROUTE[1], p)));
    const hand = smooth(END + 0.035, END + 0.09, p);
    const glow = smooth(TRAVEL0 + 2.4 * PER, TRAVEL0 + 4.6 * PER, p);
    const sunB = smooth(END - 0.01, END + 0.045, p);
    const sun = smooth(END + 0.02, END + 0.085, p);
    const zb = Math.pow(zoom, 0.04) * lerp(1, 1.02, smooth(END, 1, p));
    const mixed = L.mist[pa]!.map((v, j) =>
      lerp(v, L.mist[Math.min(2, pa + 1)]![j]!, pmix),
    );
    lake?.render({
      vp,
      hz,
      base,
      zoom,
      zb,
      anchors: L.anchors,
      mags: L.mags,
      mix: [pa, pmix],
      glow,
      sunB,
      sun,
      mist: bank * 0.95,
      mistCol:
        sun > 0
          ? mixed.map((v, j) => lerp(v, [0.98, 0.83, 0.62][j]!, sun * 0.6))
          : mixed,
      t,
      paper,
      f,
      h: HM,
      camZ,
      w0,
      w1,
      route: [
        routeReveal,
        W[5]!.z + 60,
        hand,
        smooth(A_ROUTE[0], A_ROUTE[0] + 0.02, p),
      ],
      routeX,
    });
    // —— UI: the step card at the foot of the screen, over the near water
    set(
      ap,
      "--co",
      String(
        smooth(TRAVEL0 - 0.01, TRAVEL0 + 0.03, p) *
          (1 - smooth(END + 0.04, END + 0.07, p)),
      ),
    );
    set(ap, "--rc", hand > 0.5 ? "var(--ice)" : "var(--flare)");
    stepEls.forEach((el, i) => {
      const a = TRAVEL0 + i * PER;
      const inn = lin(a + PER * 0.18, a + PER * 0.42, p);
      const out =
        i === 5
          ? lin(END + 0.04, END + 0.07, p)
          : lin(a + PER * 0.93, a + PER * 1.04, p);
      const o = inn * (1 - out);
      set(el, "opacity", String(o));
      set(el, "visibility", o > 0.001 ? "visible" : "hidden");
      set(el, "transform", `translateY(${-easeIn(out) * 18 * m}px)`);
      rise(stepLines[i]!, inn);
      stepTags[i]!.forEach((g, j) => {
        const tt = lin(a + PER * (0.3 + j * 0.05), a + PER * (0.5 + j * 0.05), p);
        set(g, "opacity", String(tt));
        set(g, "transform", `translateY(${(1 - easeOut(tt)) * 12 * m}px)`);
      });
      if (i === 5) set(el, "--sc", hand > 0.3 ? "var(--ice)" : "var(--flare)");
    });
    tickEls.forEach((r, i) => {
      attr(r, "data-on", p >= TRAVEL0 && i === stepIdx);
      attr(r, "data-done", p >= TRAVEL0 && i < stepIdx);
    });
    const fo = smooth(END + 0.06, END + 0.1, p);
    set(ap, "--fo", String(fo));
    set(finalEl, "visibility", fo > 0.001 ? "visible" : "hidden");
    set(
      lead,
      "transform",
      `translateY(${-smooth(A_FALL + 0.06, A_ROUTE[1], p) * 24 * m}px)`,
    );
  });
  surfaces.push({ el: ap, kind: (p) => (p > 0.175 ? "glass" : "paper") });

  // ===================================================================== header surface + the line
  engine.tick((t, y, vh) => {
    if (y > vh) setHeaderOverride({ intro: false });
    if (y > vh * 2.5) setHeaderOverride({ brand: "shown" });
    drawSpine(req.challenges ?? req.who ?? req.hero);
    headerSurface(surfaces, 30, vh);
  });

  // a phone's toolbar changes the height while scrolling: keep the layout unless the width changes
  // or the height jumps (rotation)
  let width = window.innerWidth;
  let height = window.innerHeight;
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === width && Math.abs(h - height) < 160) return;
    width = w;
    height = h;
    m = mOf();
    giantBox = null;
    domStart = null;
    engine.measure();
    engine.frame();
  };
  window.addEventListener("resize", onResize);
  const fonts = document.fonts;
  const onFonts = () => {
    giantBox = null;
    domStart = null;
    engine.measure();
  };
  fonts.addEventListener("loadingdone", onFonts);
  engine.start();

  const ready = Promise.all([panoReady, lakeReady, document.fonts.ready]).then(() => {
    if (panoFailed || lakeFailed) root.dataset.gl = "failed";
  });

  return {
    engine,
    ready,
    stop() {
      engine.stop();
      window.removeEventListener("resize", onResize);
      fonts.removeEventListener("loadingdone", onFonts);
      disposers.forEach((d) => d());
      set.clear();
      qa(root, "[data-rise], [data-node], [data-rail6], [data-tick]").forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-on");
        el.removeAttribute("data-done");
      });
      pano?.dispose();
      lake?.dispose();
      spine.style.cssText = "";
    },
  };
}
