/**
 * Phone and tablet choreography of HOME (< 1024 px) — a port of the adopted
 * A2r3 phone prototype (`home-r3-mobile-2026-10-02/build/A2m.js`). The adopted
 * plates are reframed by a portrait camera; one orange line runs down the
 * phone: it opens the film, waits beside the purpose, turns 90° into the
 * horizon between the two viewpoints, lies on the lake's horizon of the path
 * and becomes its route, signs the letter, joins the three tiers, and is the
 * way across the lake. Lengths the prototype gave in CSS px of the 390 × 844
 * screen are multiplied by `m` (the module CSS's --m).
 *
 * Phone rendering contract (2026-10-13 polish, spec R1–R5):
 * - every per-frame write is a transform or an opacity (clip windows are two
 *   nested translated boxes, the line is a rotated container of two scaled
 *   segments); geometry is read on start, resize and font loads only;
 * - the scenes follow a damped scroll position and the loop sleeps once it
 *   has settled; the panorama and the lake draw on scroll, otherwise at the
 *   film's 24 fps while their mist and water move, and only one of them keeps
 *   its photographs on the GPU at a time.
 */
import { approach } from "@/content/adelva-home";
import { homeGeometry as G } from "@/content/adelva-home-geometry";
import { setHeaderOverride } from "@/lib/header-state";

import type { Controller } from "./desktop";
import {
  CAPTURE,
  clamp,
  createEngine,
  ease,
  easeIn,
  easeOut,
  forgetRise,
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
  ambient,
  attr,
  createFilm,
  createSignature,
  panoMask,
  plateMix,
  q,
  qa,
  residency,
  setter,
  STEP_TIMING,
  whenNeeded,
  zoomAt,
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

/** Length of a line segment's box before it is scaled (CSS px). */
const SEG = 100;
const px = (v: number) => Math.round(v * 100) / 100;

export function startMobile(root: HTMLElement): Controller {
  const set = setter();
  const engine = createEngine(
    () =>
      q(root, '[data-scene="hero"] [data-stage]').clientHeight || window.innerHeight,
    // iOS samples the scroll irregularly; the scenes follow it with a 60 ms time constant
    { damp: 0.06, surfaceProbe: 30 },
  );
  const mOf = () =>
    clamp(Math.min(window.innerWidth / 390, window.innerHeight / 844), 0.86, 1.5);
  let m = mOf();
  // the window height outside the frame (a toolbar change below 160 px does not count)
  let innerHeightCache = window.innerHeight;
  const disposers: (() => void)[] = [];
  /** Geometry read outside the frame (start, resize, fonts). */
  const measures: (() => void)[] = [];
  const measureAll = () => {
    engine.measure();
    measures.forEach((fn) => fn());
  };

  // ===================================================================== the one line (fixed)
  // Each scene may request the line; the latest scene on the page that has a request wins.
  // The line is a container placed and turned by one transform; its visible parts are two
  // segments scaled along it (the gap opens between them), so no frame lays anything out.
  const spine = q(root, "[data-spine]");
  const segs = qa(spine, "[data-spine-seg]");
  const req: {
    hero: SpineRequest | null;
    who: SpineRequest | null;
    challenges: SpineRequest | null;
  } = {
    hero: null,
    who: null,
    challenges: null,
  };
  let spineOn = false;
  const drawSpine = (r: SpineRequest | null) => {
    if (!r || r.o <= 0.001 || r.L < 0.5) {
      if (spineOn) {
        set(spine, "opacity", "0");
        set(spine, "visibility", "hidden");
        spineOn = false;
      }
      return;
    }
    spineOn = true;
    let iv: [number, number][] = [[clamp(r.d0 ?? 0), clamp(r.d1 ?? 1)]];
    if (r.g0 != null && r.g1 != null && r.g1 > r.g0) {
      const g0 = r.g0;
      const g1 = r.g1;
      iv = [
        [iv[0]![0], Math.min(iv[0]![1], g0)],
        [Math.max(iv[0]![0], g1), iv[0]![1]],
      ];
    }
    set(spine, "visibility", "visible");
    set(spine, "opacity", String(px(r.o)));
    set(
      spine,
      "transform",
      `translate3d(${px(r.cx - 0.5)}px, ${px(r.cy)}px, 0) rotate(${px(r.th)}deg)`,
    );
    segs.forEach((seg, i) => {
      const [a, b] = iv[i] ?? [0, 0];
      const len = Math.max(0, b - a) * r.L;
      set(
        seg,
        "transform",
        len > 0.01
          ? `translate3d(0, ${px((a - 0.5) * r.L)}px, 0) scaleY(${(len / SEG).toFixed(4)})`
          : "scaleY(0)",
      );
    });
  };

  // ===================================================================== 1 hero → purpose
  const hero = q(root, '[data-scene="hero"]');
  const heroStage = q(hero, "[data-stage]");
  const giant = q(hero, "[data-giant]");
  const giantWord = q(hero, "[data-giant-word]");
  const chars = qa(hero, "[data-statement] [data-ch]");
  const marks = qa(hero, "[data-statement] [data-mark]");
  const whole = q(hero, "[data-film-whole]");
  const halves = qa(hero, "[data-half]");
  const purpose = q(hero, "[data-purpose]");
  const purposeBlock = q(hero, "[data-purpose-block]");
  const purposeEyebrow = purposeBlock.firstElementChild as HTMLElement;
  const purposeBody = q(hero, "[data-purpose-body]");
  const film = createFilm(root);
  const filmToggle = q(hero, "[data-film-toggle]");
  disposers.push(() => film.dispose());
  // the giant word's box (untransformed), the header word it flies into, and the purpose block
  // (in the stage's coordinates: the stage is pinned while the line opens around it)
  let giantBox: DOMRect | null = null;
  let brandBox: DOMRect | null = null;
  let purposeBox = { top: 0, bottom: 0 };
  const measureBrand = () => {
    const b = document.querySelector("[data-brand-word]")?.getBoundingClientRect();
    brandBox = b && b.width > 0 ? b : null;
    engine.invalidate();
  };
  measures.push(() => {
    giantWord.style.transform = "";
    set.forget(giantWord, "transform");
    giantBox = giantWord.getBoundingClientRect();
    measureBrand();
    const st = heroStage.getBoundingClientRect();
    const r = purposeBlock.getBoundingClientRect();
    purposeBox = { top: r.top - st.top, bottom: r.bottom - st.top };
    film.measure();
  });
  // the header's bar changes height when it turns compact: read its word again once it has
  const header = document.querySelector<HTMLElement>(
    "[data-fidelity-landmark='header-nav']",
  );
  let brandTimer = 0;
  const brandObserver = new MutationObserver(() => {
    window.clearTimeout(brandTimer);
    brandTimer = window.setTimeout(measureBrand, 420);
  });
  if (header) brandObserver.observe(header, { attributeFilter: ["data-compact"] });
  disposers.push(() => {
    brandObserver.disconnect();
    window.clearTimeout(brandTimer);
  });
  engine.register(
    hero,
    ({ p, leave, visible, vw, vh, moved }) => {
      setHeaderOverride({ brand: p > 0.235 ? "shown" : "hidden" });
      film.visible(visible && p < 0.58);
      if (!visible) {
        req.hero = null;
        return;
      }
      const part = ease(smooth(0.26, 0.56, p));
      const parting = part > 0.0005;
      // the halves show the film while they part: a new picture only when the film has one
      const playing = parting && part < 0.999 ? film.draw(2) : false;
      if (!moved) return playing;
      const a = giantBox;
      const b = brandBox;
      const fly = ease(smooth(0, 0.24, p));
      if (a && b) {
        const dx = b.left - a.left;
        const dy = b.top + b.height / 2 - (a.top + a.height / 2);
        set(
          giantWord,
          "transform",
          `translate3d(${px(dx * fly)}px, ${px(dy * fly)}px, 0) scale(${lerp(1, b.width / a.width, fly).toFixed(4)})`,
        );
      }
      set(giant, "opacity", String(1 - smooth(0.21, 0.245, p)));
      const inset = ease(smooth(0.08, 0.26, p));
      const sc = lerp(1, 0.93, inset).toFixed(4);
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
          `translate3d(${px((i === 0 ? -1 : 1) * part * 0.56 * vw)}px, 0, 0) scale(${sc})`,
        );
      });
      // the line, left behind when the film parts; it opens around the purpose so it never runs through the
      // words, and the opening travels with the words when the stage scrolls away (the line stays)
      const seamScroll = smooth(0.26, 0.32, p);
      let g0: number | null = null;
      let g1: number | null = null;
      const gp = smooth(0.29, 0.38, p);
      if (gp > 0) {
        const c = (purposeBox.top + purposeBox.bottom) / 2;
        g0 = (lerp(c, purposeBox.top - 26 * m, gp) - leave * vh) / vh;
        g1 = (lerp(c, purposeBox.bottom + 26 * m, gp) - leave * vh) / vh;
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
          lerp(0.08, 1, smooth(0.36 + (i / n) * 0.3, 0.43 + (i / n) * 0.3, p)).toFixed(
            3,
          ),
        ),
      );
      marks.forEach((e) => set(e, "--u", smooth(0.68, 0.8, p).toFixed(3)));
      set(purpose, "opacity", smooth(0.235, 0.29, p).toFixed(3));
      set(purposeEyebrow, "opacity", smooth(0.3, 0.4, p).toFixed(3));
      set(purposeBody, "opacity", smooth(0.62, 0.74, p).toFixed(3));
      return playing;
    },
    (p) => (p > 0.235 ? "paper" : "film"),
  );

  // ===================================================================== 2 who we support
  // The two viewpoints stack. The line turns 90° and lies across the middle; the view from the heights
  // opens upward from it, the view from the floor downward. The line moves towards the view being read,
  // and that view's card unfolds; the other keeps only its title.
  // Each view is a window [a, b] of the stage: an outer box whose top edge is a, an inner box whose
  // bottom edge is b (both one stage tall, both clipping, both only translated), and a frame that
  // puts the photograph, its shade and its card back in the stage's coordinates.
  const who = q(root, '[data-scene="who"]');
  const whoStage = q(who, "[data-stage]");
  const whoIntro = q(who, "[data-who-intro]");
  const whoEyebrow = whoIntro.firstElementChild as HTMLElement;
  const h2t = q(who, '[data-who-h="t"]');
  const h2b = q(who, '[data-who-h="b"]');
  const linesT = qa(h2t, "[data-rise]");
  const linesB = qa(h2b, "[data-rise]");
  const whoP = q(who, "[data-who-p]");
  const view = (side: "t" | "b") => {
    const el = q(who, `[data-side="${side}"]`);
    const card = q(el, "[data-card]");
    return {
      el,
      clip: q(el, "[data-side-clip]"),
      frame: q(el, "[data-side-frame]"),
      img: q(el, "[data-side-img]"),
      shade: q(el, "[data-side-shade]"),
      card,
      more: q(card, "[data-more]"),
      moreH: 0,
    };
  };
  const vT = view("t");
  const vB = view("b");
  measures.push(() => {
    vT.moreH = vT.more.offsetHeight;
    vB.moreH = vB.more.offsetHeight;
  });
  const windowOf = (v: typeof vT, a: number, b: number, vh: number) => {
    const open = b - a > 0.5;
    set(v.el, "visibility", open ? "visible" : "hidden");
    if (!open) return;
    set(v.el, "transform", `translate3d(0, ${px(a)}px, 0)`);
    set(v.clip, "transform", `translate3d(0, ${px(b - vh - a)}px, 0)`);
    set(v.frame, "transform", `translate3d(0, ${px(vh - b)}px, 0)`);
  };
  const S_HI = 0.6;
  const S_LO = 0.4;
  engine.register(
    who,
    ({ p, enter, vh, vw, visible, moved }) => {
      if (!visible) {
        req.who = null;
        return;
      }
      if (!moved) return;
      // The line takes over from the purpose's once the purpose has scrolled past it (its opening has
      // closed), turns level, and settles on the paper's middle as the stage arrives; the addresses
      // then rise above and below it while the stage is still arriving, so no screen waits empty.
      const e0 = clamp((purposeBox.bottom + 26 * m) / vh, 0.6, 0.8);
      const rot = p > 0 ? 1 : ease(smooth(e0, e0 + 0.12, enter));
      const arrive = p > 0 ? 1 : smooth(e0 + 0.08, e0 + 0.2, enter);
      let s = 0.5;
      if (p >= 0.4 && p < 0.5) s = lerp(0.5, S_HI, ease(smooth(0.4, 0.5, p)));
      else if (p >= 0.5 && p < 0.6) s = S_HI;
      else if (p >= 0.6 && p < 0.72) s = lerp(S_HI, S_LO, ease(smooth(0.6, 0.72, p)));
      else if (p >= 0.72 && p < 0.85) s = S_LO;
      else if (p >= 0.85) s = lerp(S_LO, 0.5, ease(smooth(0.85, 0.94, p)));
      const sPx = s * vh;
      // the stage's line in screen px (the stage top is (1 − enter) screens down while it arrives)
      const lineY = vh / 2 + ((1 - enter) * vh + sPx - vh / 2) * rot;
      req.who =
        enter > e0
          ? {
              cx: vw / 2,
              cy: lineY,
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
        (smooth(0.7, 0.9, enter) * (1 - smooth(0.12, 0.18, p))).toFixed(3),
      );
      linesT.forEach((sp, i) => rise(sp, lin(i * 0.18, 0.62 + i * 0.18, arrive)));
      linesB.forEach((sp, i) => rise(sp, lin(0.2 + i * 0.18, 0.82 + i * 0.18, arrive)));
      set(
        whoP,
        "opacity",
        (smooth(0, 0.035, p) * (1 - smooth(0.12, 0.17, p))).toFixed(3),
      );
      const push = ease(smooth(0.12, 0.21, p));
      set(h2t, "transform", `translate3d(0, ${px(-push * 46 * m)}px, 0)`);
      set(h2t, "opacity", (1 - smooth(0.13, 0.19, p)).toFixed(3));
      set(h2b, "transform", `translate3d(0, ${px(push * 46 * m)}px, 0)`);
      set(h2b, "opacity", (1 - smooth(0.14, 0.2, p)).toFixed(3));
      // the views open from the line: the upper one upward, the lower one downward
      const rt = ease(smooth(0.12, 0.28, p));
      const rb = ease(smooth(0.14, 0.3, p));
      windowOf(vT, (1 - rt) * sPx, sPx, vh);
      windowOf(vB, sPx, sPx + rb * (vh - sPx), vh);
      // each shade spans its whole view (the upper from the top of the stage to the line, the lower
      // from the line to the bottom), so the cards' text keeps its measured contrast
      set(vT.shade, "transform", `scaleY(${(sPx / vh).toFixed(4)})`);
      set(vB.shade, "transform", `scaleY(${((vh - sPx) / vh).toFixed(4)})`);
      const im = Math.max(vw, 0.66 * vh);
      set(whoStage, "--im", `${im}px`);
      // each square is placed so its subject stays clear of the card
      const kT = clamp((S_HI - s) / (S_HI - S_LO));
      const kB = clamp((s - S_LO) / (S_HI - S_LO));
      const zT = lerp(1.1, 1, ease(smooth(0.12, 0.72, p))).toFixed(4);
      const zB = lerp(1.1, 1, ease(smooth(0.14, 0.95, p))).toFixed(4);
      set(
        vT.img,
        "transform",
        `translate3d(0, ${px(lerp(0, -0.18, kT) * im)}px, 0) scale(${zT})`,
      );
      set(
        vB.img,
        "transform",
        `translate3d(0, ${px(sPx + lerp(-0.08, -0.18, kB) * im)}px, 0) scale(${zB})`,
      );
      // cards: both titles appear; the view being read unfolds its text and cue. The upper card
      // stands on the line, the lower one at the foot of the stage.
      const cin = smooth(0.26, 0.36, p);
      const aT = smooth(0.52, 0.6, s);
      const aB = smooth(0.48, 0.4, s);
      (
        [
          [vT, aT, sPx - vh],
          [vB, aB, 0],
        ] as const
      ).forEach(([v, al, base]) => {
        set(v.card, "opacity", cin.toFixed(3));
        set(v.card, "visibility", cin > 0.001 ? "visible" : "hidden");
        set(
          v.card,
          "transform",
          `translate3d(0, ${px(base + (1 - easeOut(cin)) * 30 * m + (1 - al) * v.moreH)}px, 0)`,
        );
        set(v.more, "opacity", al.toFixed(3));
        set(v.more, "visibility", al > 0.01 ? "visible" : "hidden");
      });
    },
    (p) => (p > 0.25 ? "glass" : "paper"),
  );

  // ===================================================================== 3 challenges — the lakeside path
  const ch = q(root, '[data-scene="challenges"]');
  const chStage = q(ch, "[data-stage]");
  const items = qa(ch, "[data-item]");
  const itemLines = items.map((it) => qa(it, "[data-rise]"));
  const chHead = q(ch, "[data-ch-head]");
  const chTitleLine = q(chHead, "[data-rise]");
  const [shadeTop, shadeFoot] = qa(ch, "[data-ch-shade]") as [HTMLElement, HTMLElement];
  const slot = q(ch, "[data-slot]");
  const rail = q(ch, "[data-rail]");
  const track = q(ch, "[data-track]");
  const nodes = qa(ch, "[data-node]");
  const panoCanvas = q<HTMLCanvasElement>(ch, "canvas[data-pano]");
  // the route rail's track in the stage's coordinates (its foot follows the browser's toolbar)
  let trackBox = { top: 0, left: 0 };
  const measureTrack = () => {
    const st = chStage.getBoundingClientRect();
    const r = track.getBoundingClientRect();
    trackBox = { top: r.top - st.top, left: r.left - st.left };
  };
  measures.push(measureTrack);
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
          .then((r) => {
            pano = r;
            engine.invalidate();
          })
          .catch(() => (panoFailed = true))
          .finally(() => resolve());
      },
      () => engine.y + 2.5 * innerHeightCache > engine.offset(ch).top,
      1500,
    );
    engine.tick(() => load.check());
    disposers.push(() => load.cancel());
  });
  // the panorama keeps its photographs from the top of the page to two screens past the path
  const panoResident = residency(
    engine,
    () => pano,
    () => {
      const o = engine.offset(ch);
      return [0, o.top + o.h + innerHeightCache];
    },
  );
  const panoTick = ambient(24);
  let panoLast: PanoramaState | null = null;
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
  engine.register(
    ch,
    ({ p, enter, vh, vw, t, visible, moved }) => {
      if (!visible) {
        req.challenges = null;
        return;
      }
      const live = pano?.live ?? false;
      if (!moved) {
        // the steam, the bath water and the noren breathe on the film's cadence
        if (live && panoLast && panoTick(t, false)) pano!.render({ ...panoLast, t });
        return live;
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
      panoLast = {
        cx,
        cy,
        scale,
        par,
        ref: G.pano.ref,
        push,
        t,
        fade,
        dim: 1 - smooth(0.2, 0.95, enter),
      };
      if (live) {
        panoTick(t, true);
        pano!.render(panoLast);
      }
      // the line rests on the lake's horizon as the path arrives, then descends onto the route rail
      const hzY = vh / 2 + (G.pano.horizon - cy) * scale;
      const railY = trackBox.top + 0.5;
      const railL = trackBox.left;
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
        (smooth(0.35, 0.8, enter) * (1 - smooth(T0 - 0.01, T0 + 0.03, p))).toFixed(3),
      );
      set(
        chHead,
        "transform",
        `translate3d(${px(-smooth(T0 - 0.01, T0 + 0.05, p) * 80 * m)}px, 0, 0)`,
      );
      set(chHead, "visibility", p < T0 + 0.04 ? "visible" : "hidden");
      rise(chTitleLine, lin(0.4, 0.95, enter));
      set(
        shadeTop,
        "opacity",
        (smooth(0.3, 0.8, enter) * (1 - smooth(T0, T0 + 0.05, p))).toFixed(3),
      );
      set(
        shadeFoot,
        "opacity",
        (smooth(0.3, 0.9, enter) * (1 - smooth(exitA, exitA + 0.05, p))).toFixed(3),
      );
      items.forEach((it, i) => {
        const { b, c } = seg(i);
        const inn = lin(b - 0.045, b + 0.01, p);
        const out = lin(c - 0.006, c + 0.03, p);
        const o = inn * (1 - out);
        set(it, "opacity", o.toFixed(3));
        set(it, "visibility", o > 0.001 ? "visible" : "hidden");
        set(
          it,
          "transform",
          `translate3d(${px(((1 - easeOut(inn)) * 56 - easeIn(out) * 56) * m)}px, 0, 0)`,
        );
        itemLines[i]!.forEach((s, kk) =>
          rise(s, lin(b - 0.04 + kk * 0.008, b + 0.012 + kk * 0.008, p)),
        );
      });
      set(slot, "opacity", (1 - smooth(exitA, exitA + 0.04, p)).toFixed(3));
      const fill = clamp((cx - C[0]!) / (C[4]! - C[0]!));
      set(rail, "--f", (p < LAND[1] ? 0 : fill).toFixed(4));
      // the rail's parts take its opacity (--to) one by one, as the prototype did
      set(
        rail,
        "--to",
        (
          smooth(LAND[0] + 0.02, LAND[1], p) *
          (1 - smooth(exitA, exitA + 0.04, p))
        ).toFixed(3),
      );
      nodes.forEach((n, i) => {
        attr(
          n,
          "data-on",
          i === cur || (i === 0 && cur === -1 && p >= LAND[1] - 0.004 && p < exitA),
        );
        attr(n, "data-done", cur > i || (cur === -1 && p > exitA));
      });
      return live;
    },
    (p) => (p > 0.95 ? "paper" : "glass"),
  );

  // ===================================================================== 4 the founder's letter, signed
  const founder = q(root, '[data-scene="founder"]');
  const quoteMark = q(founder, "[data-quote-mark]");
  const founderChars = qa(founder, "[data-founder-lead] [data-ch]");
  const founderPs = qa(founder, "[data-founder-p]");
  const signer = q(founder, "[data-signer]");
  const signature = createSignature(founder);
  const letter = q(founder, "[data-letter]");
  const sign = q(founder, "[data-sign]");
  // Short screens (an iPhone SE: 667 or 568 px tall) cannot hold the letter above the signature: the
  // letter then moves up by the overlap while its last paragraphs are read, before the pen starts.
  let letterOverlap = 0;
  // ...and if that carries the opening lines under the bar, they fade as they go (they have been read)
  let leadFades = false;
  const lead0 = q(founder, "[data-founder-lead]");
  measures.push(() => {
    letter.style.transform = "";
    set.forget(letter, "transform");
    const last = founderPs[founderPs.length - 1]!.getBoundingClientRect();
    const pen = sign.getBoundingClientRect();
    letterOverlap = Math.max(0, last.bottom + 18 * m - pen.top);
    const bar = document
      .querySelector("[data-fidelity-landmark='header-nav']")
      ?.getBoundingClientRect().bottom;
    // (in the stage's coordinates: the stage is pinned while the letter is read)
    const stageTop = q(founder, "[data-stage]").getBoundingClientRect().top;
    leadFades =
      letterOverlap > 0 &&
      quoteMark.getBoundingClientRect().top - stageTop - letterOverlap < (bar ?? 64);
    signature.measure();
  });
  disposers.push(() => signature.reset());
  engine.register(
    founder,
    ({ p, enter, visible, moved }) => {
      if (!visible || !moved) return;
      // the letter is written as it arrives (it starts while the path's haze is still leaving)
      const leadOut = leadFades ? 1 - smooth(0.2, 0.31, p) : 1;
      set(quoteMark, "opacity", (smooth(0.12, 0.36, enter) * leadOut).toFixed(3));
      set(lead0, "opacity", leadOut.toFixed(3));
      const n = founderChars.length;
      founderChars.forEach((c, i) =>
        set(
          c,
          "--o",
          lerp(
            0.06,
            1,
            smooth(0.17 + (i / n) * 0.55, 0.25 + (i / n) * 0.55, enter),
          ).toFixed(3),
        ),
      );
      founderPs.forEach((pp, i) =>
        set(
          pp,
          "--o",
          lerp(0.2, 1, smooth(0.02 + i * 0.09, 0.1 + i * 0.09, p)).toFixed(3),
        ),
      );
      if (letterOverlap > 0)
        set(
          letter,
          "transform",
          `translate3d(0, ${px(-letterOverlap * ease(smooth(0.18, 0.33, p)))}px, 0)`,
        );

      signature.draw(Math.round(lin(0.34, 0.86, p) * 2000) / 2000, true);
      set(signer, "opacity", smooth(0.84, 0.92, p).toFixed(3));
    },
    () => "paper",
  );

  // ===================================================================== 5 our expertise — three tiers, one mountain
  // The desktop's three strips become three horizontal bands of one portrait photograph (the massif's
  // three-tier autumn), listed one under another with their text; then they gather into one picture, the
  // orange joins show for a moment, the picture opens to the full screen and the joins disappear.
  // Each band is a window of the stage made of two nested translated boxes (as the viewpoints above);
  // the photograph inside is placed by one transform at a fixed size.
  const exp = q(root, '[data-scene="expertise"]');
  const E = G.expertise;
  const bands = qa(exp, "[data-strip]");
  const bandClips = bands.map((b) => q(b, "[data-strip-clip]"));
  const bandImgs = bands.map((b) => q(b, "img"));
  const labels = qa(exp, "[data-domain]");
  const hairs = qa(exp, "[data-hair]");
  const eb = exp.querySelector<HTMLElement>("p[id]")!;
  const veil = q(exp, "[data-veil]");
  const plan = q(exp, "[data-plan]");
  const index = q(exp, "[data-index]");
  const TIER = [0, E.tiers[0], E.tiers[1], 1];
  const OFF = [-14, 16, -6];
  const ZOOM = [1.22, 1.0, 1.3];
  let labelH = [0, 0, 0];
  // the photograph's drawn size at full screen: the largest it ever shows, so it is never upscaled
  let kRef = 1;
  measures.push(() => {
    labelH = labels.map((l) => l.offsetHeight);
  });
  engine.register(
    exp,
    ({ p, vw, vh, visible, moved }) => {
      if (!visible || !moved) return;
      const [PW, PH] = E.tallSize;
      const J = { x: 22 * m, w: vw - 44 * m, h: Math.round(0.68 * vh), y: 0 };
      J.y = Math.round((vh - J.h) / 2 + 24 * m);
      const kJ = Math.max(J.w / PW, J.h / PH);
      const kF = Math.max(vw / PW, vh / PH);
      if (kF !== kRef) {
        kRef = kF;
        bandImgs.forEach((img) => {
          set(img, "width", `${PW * kF}px`);
          set(img, "height", `${PH * kF}px`);
        });
      }
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
        const bh = lerp(bandH[i]!, jh, mm) + (mm > 0.98 && i < 2 ? 0.6 : 0);
        // the window [bx, bx + bw] × [by, by + bh]
        const x1 = bx + bw - vw;
        const y1 = by + bh - vh;
        set(b, "transform", `translate3d(${px(bx)}px, ${px(by)}px, 0)`);
        set(b, "visibility", by < vh && by + bh > 0 ? "visible" : "hidden");
        set(
          bandClips[i]!,
          "transform",
          `translate3d(${px(x1 - bx)}px, ${px(y1 - by)}px, 0)`,
        );
        const z = lerp(ZOOM[i]!, 1, mm);
        const cxB = bw / 2;
        const cyB = (bh - (mm > 0.98 && i < 2 ? 0.6 : 0)) / 2;
        const ax = bx + cxB + (plateX - bx - cxB) * z;
        const ay = by + cyB + (plateY - jy - cyB) * z;
        set(
          bandImgs[i]!,
          "transform",
          `translate3d(${px(ax - x1)}px, ${px(ay - y1)}px, 0) scale(${((k * z) / kF).toFixed(5)})`,
        );
        // each label is revealed as it scrolls into the lower part of the screen, and leaves with the gathering
        const l = labels[i]!;
        const lt = pos[i]!.label - a * scrollA + (by - ly);
        const show = smooth(vh - 10 * m, vh - 150 * m, lt);
        const lo = show * (1 - smooth(0.32, 0.42, p));
        set(l, "opacity", lo.toFixed(3));
        set(l, "visibility", lo > 0.001 ? "visible" : "hidden");
        set(
          l,
          "transform",
          `translate3d(0, ${px(lt + (1 - easeOut(show)) * 18 * m)}px, 0)`,
        );
      });
      // the joins: the line appears where the tiers meet, then dissolves when they are one
      hairs.forEach((h, j) => {
        const yj = plateY + TIER[j + 1]! * plateH;
        const o = smooth(0.46, 0.52, p) * (1 - smooth(0.8, 0.94, p));
        set(h, "opacity", o.toFixed(3));
        set(
          h,
          "transform",
          `translate3d(${px(pictX)}px, ${px(yj - 0.5)}px, 0) scaleX(${(pictW / vw).toFixed(4)})`,
        );
      });
      set(eb, "transform", `translate3d(0, ${px(-a * scrollA)}px, 0)`);
      set(eb, "opacity", (1 - smooth(0.4, 0.5, p)).toFixed(3));
      set(veil, "opacity", smooth(0.6, 0.78, p).toFixed(3));
      set(plan, "opacity", smooth(0.72, 0.84, p).toFixed(3));
      set(plan, "visibility", p > 0.71 ? "visible" : "hidden");
      const io = smooth(0.8, 0.92, p);
      set(index, "opacity", io.toFixed(3));
      set(index, "visibility", io > 0.001 ? "visible" : "hidden");
    },
    (p) => (p > 0.62 ? "glass" : "paper"),
  );

  // ===================================================================== 6 across the lake (portrait)
  const ap = q(root, '[data-scene="approach"]');
  const apStage = q(ap, "[data-stage]");
  const L = G.lake;
  const { A_PAPER, A_GLUE, A_FALL, FALL_LEN, FALL_STAG, A_ROUTE, TRAVEL0, PER, END } =
    STEP_TIMING;
  const stepEls = qa(ap, "[data-step]");
  const stepLines = stepEls.map((el) => q(el, "[data-rise]"));
  const stepTags = stepEls.map((el) => qa(el, "[data-tag]"));
  const ticks = q(ap, "[data-ticks]");
  const tickEls = qa(ap, "[data-tick]");
  const domWords = qa(ap, "[data-st]");
  const glues = qa(ap, "[data-glue]");
  const apShade = q(ap, "[data-ap-shade]");
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
          .then((r) => {
            lake = r;
            engine.invalidate();
          })
          .catch(() => (lakeFailed = true))
          .finally(() => resolve());
      },
      () => engine.y + 3 * innerHeightCache > engine.offset(ap).top,
      // a phone never holds the panorama and the lake at once: the lake waits for the reader
      // (verification loads both after load, as before)
      CAPTURE ? 5000 : null,
    );
    engine.tick(() => load.check());
    disposers.push(() => load.cancel());
  });
  const lakeResident = residency(
    engine,
    () => lake,
    () => [engine.offset(ap).top - 3 * innerHeightCache, Number.POSITIVE_INFINITY],
  );
  const lakeTick = ambient(24);
  let lakeLast: LakeState | null = null;
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
  // the six words' boxes in the stage (the sentence they fall from), read outside the frame
  let wordBoxes: { left: number; bottom: number; width: number; height: number }[] = [];
  measures.push(() => {
    const st = apStage.getBoundingClientRect();
    wordBoxes = domWords.map((el) => {
      const b = el.getBoundingClientRect();
      return {
        left: b.left - st.left,
        bottom: b.bottom - st.top,
        width: b.width,
        height: b.height,
      };
    });
  });
  engine.register(
    ap,
    ({ p, enter, vw, vh, t, visible, moved }) => {
      if (!visible) return;
      const live = lake?.live ?? false;
      if (!moved) {
        // the mist drifts and the words on the water ripple on the film's cadence
        if (live && lakeLast && lakeTick(t, false)) lake!.render({ ...lakeLast, t });
        return live;
      }
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
      set(lead, "opacity", smooth(0.14, 0.55, enter).toFixed(3));
      const go = (1 - smooth(A_GLUE[0], A_GLUE[1], p)).toFixed(3);
      glues.forEach((g) => set(g, "opacity", go));
      set(
        leadEyebrow,
        "opacity",
        (smooth(0.1, 0.4, enter) * (1 - smooth(A_ROUTE[0], A_ROUTE[1], p))).toFixed(3),
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
      const zs = 300;
      const kk = zs / f;
      const w0: number[][] = [];
      const w1: number[][] = [];
      W.forEach((w, i) => {
        const b = wordBoxes[i] ?? { left: 0, bottom: 0, width: 0, height: 0 };
        const s = {
          x: (b.left + b.width / 2 - hz[0]) * kk,
          y: HM + (hz[1] - b.bottom) * kk,
          z: zs,
          w: b.width * kk,
          h: b.height * kk,
        };
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
        set(domWords[i]!, "opacity", u > 0 && live ? "0" : "1");
      });
      const routeReveal = lerp(
        0,
        W[5]!.z + 90,
        ease(smooth(A_ROUTE[0], A_ROUTE[1], p)),
      );
      const hand = smooth(END + 0.035, END + 0.09, p);
      const glow = smooth(TRAVEL0 + 2.4 * PER, TRAVEL0 + 4.6 * PER, p);
      const sunB = smooth(END - 0.01, END + 0.045, p);
      const sun = smooth(END + 0.02, END + 0.085, p);
      const zb = Math.pow(zoom, 0.04) * lerp(1, 1.02, smooth(END, 1, p));
      const mixed = L.mist[pa]!.map((v, j) =>
        lerp(v, L.mist[Math.min(2, pa + 1)]![j]!, pmix),
      );
      lakeLast = {
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
      };
      if (live) {
        lakeTick(t, true);
        lake!.render(lakeLast);
      }
      // —— UI: the step card at the foot of the screen, over the near water
      const co = (
        smooth(TRAVEL0 - 0.01, TRAVEL0 + 0.03, p) *
        (1 - smooth(END + 0.04, END + 0.07, p))
      ).toFixed(3);
      set(apShade, "opacity", co);
      set(ticks, "opacity", co);
      set(ticks, "--rc", hand > 0.5 ? "var(--ice)" : "var(--flare)");
      stepEls.forEach((el, i) => {
        const a = TRAVEL0 + i * PER;
        const inn = lin(a + PER * 0.18, a + PER * 0.42, p);
        const out =
          i === 5
            ? lin(END + 0.04, END + 0.07, p)
            : lin(a + PER * 0.93, a + PER * 1.04, p);
        const o = inn * (1 - out);
        set(el, "opacity", o.toFixed(3));
        set(el, "visibility", o > 0.001 ? "visible" : "hidden");
        set(el, "transform", `translate3d(0, ${px(-easeIn(out) * 18 * m)}px, 0)`);
        rise(stepLines[i]!, inn);
        stepTags[i]!.forEach((g, j) => {
          const tt = lin(a + PER * (0.3 + j * 0.05), a + PER * (0.5 + j * 0.05), p);
          set(g, "opacity", tt.toFixed(3));
          set(g, "transform", `translate3d(0, ${px((1 - easeOut(tt)) * 12 * m)}px, 0)`);
        });
        if (i === 5) set(el, "--sc", hand > 0.3 ? "var(--ice)" : "var(--flare)");
      });
      tickEls.forEach((r, i) => {
        attr(r, "data-on", p >= TRAVEL0 && i === stepIdx);
        attr(r, "data-done", p >= TRAVEL0 && i < stepIdx);
      });
      const fo = smooth(END + 0.06, END + 0.1, p);
      set(finalEl, "opacity", fo.toFixed(3));
      set(finalEl, "visibility", fo > 0.001 ? "visible" : "hidden");
      set(
        lead,
        "transform",
        `translate3d(0, ${px(-smooth(A_FALL + 0.06, A_ROUTE[1], p) * 24 * m)}px, 0)`,
      );
      return live;
    },
    (p) => (p > 0.175 ? "glass" : "paper"),
  );

  // ===================================================================== header + the line + residency
  engine.tick((t, y, vh, moved) => {
    if (y > vh) setHeaderOverride({ intro: false });
    if (y > vh * 2.5) setHeaderOverride({ brand: "shown" });
    if (moved) drawSpine(req.challenges ?? req.who ?? req.hero);
    panoResident(vh);
    lakeResident(vh);
  });

  // a phone's toolbar changes the height while scrolling: keep the layout unless the width changes
  // or the height jumps (rotation); only the rail's foot, which rides on the toolbar, is read again
  let width = window.innerWidth;
  let height = window.innerHeight;
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === width && Math.abs(h - height) < 160) {
      measureTrack();
      engine.invalidate();
      return;
    }
    width = w;
    height = h;
    innerHeightCache = h;
    m = mOf();
    measureAll();
    engine.frame();
  };
  window.addEventListener("resize", onResize);
  const fonts = document.fonts;
  const onFonts = () => {
    measureAll();
    engine.invalidate();
  };
  fonts.addEventListener("loadingdone", onFonts);
  measures.forEach((fn) => fn());
  engine.start();

  const ready = Promise.all([panoReady, lakeReady, document.fonts.ready]).then(() => {
    if (panoFailed || lakeFailed) root.dataset.gl = "failed";
  });

  return {
    engine,
    ready,
    renderers: CAPTURE ? () => ({ pano, lake }) : undefined,
    stop() {
      engine.stop();
      window.removeEventListener("resize", onResize);
      fonts.removeEventListener("loadingdone", onFonts);
      disposers.forEach((d) => d());
      set.clear();
      const lines = qa(root, "[data-rise], [data-node], [data-rail6], [data-tick]");
      lines.forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-on");
        el.removeAttribute("data-done");
      });
      forgetRise(lines);
      pano?.dispose();
      lake?.dispose();
    },
  };
}
