/**
 * Desktop choreography of HOME (≥ 1024 px) — a port of the adopted A2r3
 * prototype (`home-r3-2026-10-02/build/A2.js`). Every timing and formula is the
 * prototype's; lengths it gave in CSS px of the 1440 × 900 stage are
 * multiplied by `k` (the module CSS's --k). The load intro (seam, film opening,
 * letters, header) runs in CSS from the first paint.
 */
import { approach } from "@/content/adelva-home";
import { homeGeometry as G } from "@/content/adelva-home-geometry";
import { setHeaderOverride } from "@/lib/header-state";

import {
  CAPTURE,
  clamp,
  createEngine,
  ease,
  easeIn,
  easeOut,
  lerp,
  lin,
  rise,
  smooth,
  type Engine,
} from "./engine";
import {
  createLake,
  createPanorama,
  type Renderer,
  type LakeState,
  type PanoramaState,
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

export interface Controller {
  readonly engine: Engine;
  /** The renderers, for verification in capture mode only. */
  readonly renderers?: () => { pano: unknown; lake: unknown };
  /** Resolves once the photographs and fonts are ready (verification). */
  readonly ready: Promise<void>;
  stop(): void;
}

export function startDesktop(root: HTMLElement): Controller {
  const set = setter();
  const stageOf = (scene: string) => q(root, `[data-scene="${scene}"] [data-stage]`);
  const engine = createEngine(() => stageOf("hero").clientHeight || window.innerHeight);
  const surfaces: SurfaceRule[] = [];
  const kOf = () => Math.min(window.innerWidth / 1440, window.innerHeight / 900, 1.4);
  let k = kOf();
  const disposers: (() => void)[] = [];

  // ===================================================================== 1 hero → purpose
  const hero = q(root, '[data-scene="hero"]');
  const giant = q(hero, "[data-giant]");
  const giantWord = q(hero, "[data-giant-word]");
  const chars = qa(hero, "[data-statement] [data-ch]");
  const marks = qa(hero, "[data-statement] [data-mark]");
  const whole = q(hero, "[data-film-whole]");
  const halves = qa(hero, "[data-half]");
  const seam = q(hero, "[data-seam]");
  const purposeBlock = q(hero, "[data-purpose-block]");
  const purposeEyebrow = purposeBlock.firstElementChild as HTMLElement;
  const purposeBody = q(hero, "[data-purpose-body]");
  const film = createFilm(root);
  const filmToggle = q(hero, "[data-film-toggle]");
  disposers.push(() => film.dispose());
  let giantBox: DOMRect | null = null;
  const measureGiant = () => {
    giantWord.style.transform = "";
    giantBox = giantWord.getBoundingClientRect();
  };
  engine.register(hero, ({ p, visible }) => {
    setHeaderOverride({ brand: p > 0.27 ? "shown" : "hidden" });
    film.visible(visible && p < 0.66);
    if (!visible) return;
    // —— ADELVA flies into the header's word, the film steps back and parts down the middle
    if (!giantBox) measureGiant();
    const a = giantBox!;
    const b = document.querySelector("[data-brand-word]")?.getBoundingClientRect();
    const fly = ease(smooth(0, 0.28, p));
    if (b && b.width > 0) {
      const dx = b.left - a.left;
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const s = b.width / a.width;
      set(
        giantWord,
        "transform",
        `translate(${dx * fly}px, ${dy * fly}px) scale(${lerp(1, s, fly)})`,
      );
    }
    set(giant, "opacity", String(1 - smooth(0.25, 0.29, p)));
    const inset = ease(smooth(0.1, 0.3, p));
    const part = ease(smooth(0.3, 0.64, p));
    const sc = lerp(1, 0.93, inset);
    const parting = part > 0.0005;
    set(whole, "visibility", parting ? "hidden" : "visible");
    // the pause control belongs to the film: it leaves when the film starts to part
    const tg = 1 - smooth(0.3 - 0.06, 0.3, p);
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
    if (parting && part < 0.999) film.draw(1.5);
    // the seam, left behind when the film parts
    set(seam, "opacity", String(smooth(0.3, 0.36, p)));
    set(seam, "transform", `scaleY(${smooth(0.3, 0.6, p)})`);
    // the statement is read in, its two key words underlined
    const n = chars.length;
    chars.forEach((c, i) =>
      set(
        c,
        "--o",
        String(lerp(0.08, 1, smooth(0.38 + (i / n) * 0.3, 0.45 + (i / n) * 0.3, p))),
      ),
    );
    marks.forEach((e) => set(e, "--u", String(smooth(0.7, 0.82, p))));
    set(hero, "--po", String(smooth(0.26, 0.32, p)));
    set(purposeEyebrow, "opacity", String(smooth(0.34, 0.44, p)));
    set(purposeBody, "opacity", String(smooth(0.66, 0.78, p)));
  });
  surfaces.push({ el: hero, kind: (p) => (p > 0.27 ? "paper" : "film") });

  // ===================================================================== 2 who we support
  const who = q(root, '[data-scene="who"]');
  const whoLines = qa(who, "[data-who-intro] [data-rise]");
  const whoIntro = q(who, "[data-who-intro]");
  const whoEyebrow = whoIntro.firstElementChild as HTMLElement;
  const whoP = q(who, "[data-who-p]");
  const [sideL, sideR] = qa(who, "[data-side]") as [HTMLElement, HTMLElement];
  const [imgL, imgR] = [q(sideL, "[data-side-img]"), q(sideR, "[data-side-img]")];
  const whoSeam = q(who, "[data-who-seam]");
  const cards = qa(who, "[data-card]");
  engine.register(who, ({ p, enter, visible }) => {
    if (!visible) return;
    whoLines.forEach((s, i) => rise(s, lin(0.45 + i * 0.07, 0.95 + i * 0.07, enter)));
    set(whoEyebrow, "opacity", String(smooth(0.3, 0.7, enter)));
    set(whoP, "opacity", String(smooth(0.75, 1, enter)));
    set(whoIntro, "opacity", String(1 - smooth(0.09, 0.16, p)));
    set(
      whoIntro,
      "transform",
      `translateY(${-ease(smooth(0.06, 0.17, p)) * 70 * k}px)`,
    );
    // the two photographs rise into their halves
    const rl = ease(smooth(0.08, 0.25, p));
    const rr = ease(smooth(0.11, 0.28, p));
    set(sideL, "clipPath", `inset(${(1 - rl) * 100}% 0 0 0)`);
    set(sideR, "clipPath", `inset(${(1 - rr) * 100}% 0 0 0)`);
    // the seam goes to the view being read
    let s = 50;
    if (p < 0.42) s = 50;
    else if (p < 0.52) s = lerp(50, 60, ease(smooth(0.42, 0.52, p)));
    else if (p < 0.62) s = 60;
    else if (p < 0.72) s = lerp(60, 40, ease(smooth(0.62, 0.72, p)));
    else if (p < 0.84) s = 40;
    else s = lerp(40, 50, ease(smooth(0.84, 0.94, p)));
    set(who, "--s", `${s}%`);
    set(
      whoSeam,
      "transform",
      `scaleY(${lerp(0.56, 1, smooth(0.1, 0.3, p)) * smooth(0.0, 0.6, enter)})`,
    );
    const cin = smooth(0.28, 0.38, p);
    const lo = s >= 50 ? 1 : lerp(1, 0.5, (50 - s) / 10);
    const ro = s <= 50 ? 1 : lerp(1, 0.5, (s - 50) / 10);
    set(cards[0]!, "opacity", String(cin * lo));
    set(cards[1]!, "opacity", String(cin * ro));
    cards.forEach((c) => {
      set(c, "transform", `translateY(${(1 - easeOut(cin)) * 40 * k}px)`);
      set(c, "visibility", cin > 0.001 ? "visible" : "hidden");
    });
    // the photographs ease back from 1.1× around their subjects while they rise and settle
    set(imgL, "transform", `scale(${lerp(1.1, 1, ease(smooth(0.08, 0.7, p)))})`);
    set(imgR, "transform", `scale(${lerp(1.1, 1, ease(smooth(0.11, 0.95, p)))})`);
  });
  surfaces.push({ el: who, kind: (p) => (p > 0.27 ? "glass" : "paper") });

  // ===================================================================== 3 challenges — along the garden path
  const ch = q(root, '[data-scene="challenges"]');
  const items = qa(ch, "[data-item]");
  const itemLines = items.map((it) => qa(it, "[data-rise]"));
  const chHead = q(ch, "[data-ch-head]");
  const chTitleLine = q(chHead, "[data-rise]");
  const slot = q(ch, "[data-slot]");
  const rail = q(ch, "[data-rail]");
  const nodes = qa(ch, "[data-node]");
  const panoCanvas = q<HTMLCanvasElement>(ch, "canvas[data-pano]");
  let pano: Renderer<PanoramaState> | null = null;
  let panoFailed = false;
  const panoReady = new Promise<void>((resolve) => {
    const load = whenNeeded(
      () => {
        createPanorama(panoCanvas, {
          tiles: G.pano.desktop,
          depth: G.pano.depth,
          mask: panoMask(),
          size: G.pano.size,
          dprCap: 1.5,
          mip: true,
        })
          .then((r) => (pano = r))
          .catch(() => (panoFailed = true))
          .finally(() => resolve());
      },
      () =>
        window.scrollY + window.innerHeight * 2.5 >
        ch.getBoundingClientRect().top + window.scrollY,
      1200,
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
  engine.register(ch, ({ p, enter, vh, vw, t, visible }) => {
    if (!visible) return;
    const B = G.pano.buildings;
    const base = (vh / G.pano.size[1]) * 1.02;
    const minX = vw / 2 / base;
    const maxX = G.pano.size[0] - vw / 2 / base;
    const C = B.map((x) => clamp(x, minX + 10, maxX - 120));
    let cx = minX;
    let vel = 0;
    let push = 0;
    let cur = -1;
    const travel = (from: number, to: number, a: number, b: number) => {
      const u = clamp((p - a) / (b - a));
      vel = (((to - from) * 6 * u * (1 - u)) / (b - a)) * 0.0012;
      return lerp(from, to, ease(u));
    };
    // intro: close on the cedar and the study, then the camera steps back to the path
    const intro = ease(smooth(0, T0 + TR, p));
    let zoom = lerp(1.34, 1, intro);
    cx = lerp(minX * 0.92, C[0]!, intro);
    for (let i = 1; i < 5; i++) {
      const { a, b } = seg(i);
      if (p >= a && p < b) cx = travel(C[i - 1]! + 50, C[i]!, a, b);
    }
    for (let i = 0; i < 5; i++) {
      const { a, b, c } = seg(i);
      if (p >= a && p < c) cur = i;
      if (p >= b && p < c) {
        const u = (p - b) / (c - b);
        cx = C[i]! + u * 50;
        push = Math.sin(Math.PI * clamp(u)) * 0.06;
      }
    }
    if (p >= exitA) {
      cx = travel(C[4]! + 50, G.pano.exitX, exitA, 1);
      zoom = lerp(1, 1.18, ease(smooth(exitA, 1, p)));
    }
    const scale = base * zoom;
    cx = clamp(cx, vw / 2 / scale, G.pano.size[0] - vw / 2 / scale);
    const par = clamp(-vel * 900, -46, 46) * (vh / 900);
    const fade = smooth(exitA + 0.03, 1, p);
    pano?.render({
      cx,
      cy: G.pano.size[1] / 2 + 6,
      scale,
      par,
      ref: G.pano.ref,
      push,
      t,
      fade,
      dim: 1 - smooth(0.2, 0.95, enter),
    });
    // texts
    set(
      chHead,
      "opacity",
      String(smooth(0.35, 0.8, enter) * (1 - smooth(T0 - 0.01, T0 + 0.03, p))),
    );
    set(
      chHead,
      "transform",
      `translateX(${-smooth(T0 - 0.01, T0 + 0.05, p) * 120 * k}px)`,
    );
    set(chHead, "visibility", p < T0 + 0.04 ? "visible" : "hidden");
    rise(chTitleLine, lin(0.4, 0.95, enter));
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
        `translateX(${((1 - easeOut(inn)) * 90 - easeIn(out) * 90) * k}px)`,
      );
      // the desktop title is one line in one mask: both halves rise together
      itemLines[i]!.forEach((s) => rise(s, lin(b - 0.04, b + 0.012, p)));
    });
    set(slot, "opacity", String(1 - smooth(exitA, exitA + 0.04, p)));
    set(rail, "--f", String(clamp((cx - C[0]!) / (C[4]! - C[0]!))));
    set(
      rail,
      "opacity",
      String(smooth(T0, T0 + 0.04, p) * (1 - smooth(exitA, exitA + 0.04, p))),
    );
    nodes.forEach((n, i) => {
      attr(n, "data-on", i === cur);
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
      set(pp, "--o", String(lerp(0.22, 1, smooth(0.02 + i * 0.09, 0.1 + i * 0.09, p)))),
    );
    signature.draw(lin(0.33, 0.86, p), false);
    set(signer, "opacity", String(smooth(0.84, 0.92, p)));
  });
  surfaces.push({ el: founder, kind: () => "paper" });

  // ===================================================================== 5 our expertise
  const exp = q(root, '[data-scene="expertise"]');
  const strips = qa(exp, "[data-strip]");
  const stripImgs = strips.map((s) => q(s, "img"));
  const domains = qa(exp, "[data-domain]");
  const hairs = qa(exp, "[data-hair]");
  const plan = q(exp, "[data-plan]");
  engine.register(exp, ({ p, vw: W, vh: H, visible }) => {
    if (!visible) return;
    const m = ease(smooth(0, 0.42, p));
    const f = ease(smooth(0.46, 0.7, p));
    const sw = 392 * k;
    const sh = 600 * k;
    const gap = 68 * k;
    const top0 = 196 * k;
    const left0 = (W - (3 * sw + 2 * gap)) / 2;
    const off = [-44, 54, -12];
    const zoom = [1.22, 1.0, 1.32];
    const joinedLeft = (W - 3 * sw) / 2;
    const joinedTop = 170 * k;
    strips.forEach((s, i) => {
      const x0 = left0 + i * (sw + gap);
      const y0 = top0 + off[i]! * k;
      const x1 = joinedLeft + i * sw;
      const y1 = joinedTop;
      const x2 = (i * W) / 3;
      const y2 = 0;
      const x = lerp(lerp(x0, x1, m), x2, f);
      const y = lerp(lerp(y0, y1, m), y2, f);
      const w = lerp(sw, W / 3, f);
      const h = lerp(sh, H, f);
      set(s, "left", `${x}px`);
      set(s, "top", `${y}px`);
      set(s, "width", `${w + (f > 0.98 ? 1 : 0)}px`);
      set(s, "height", `${h}px`);
      set(
        stripImgs[i]!,
        "transform",
        `scale(${lerp(zoom[i]!, 1, m) * lerp(1, 1.04, smooth(0.7, 1, p))})`,
      );
      set(stripImgs[i]!, "transformOrigin", `${(i * 2 + 1) * 16.667}% 50%`);
      const d = domains[i]!;
      const dx0 = x0;
      const dy0 = y0 + sh + 34 * k;
      const dx2 = x2 + 64 * k * (i === 0 ? 1 : 0.5);
      const dy2 = H - 300 * k;
      set(d, "left", `${lerp(lerp(dx0, x1, m), dx2, f)}px`);
      set(d, "top", `${lerp(lerp(dy0, y1 + sh + 34 * k, m), dy2, f)}px`);
      set(d, "width", `${lerp(sw, W / 3 - 96 * k, f)}px`);
      set(d, "--dc", f > 0.55 ? "var(--ice)" : "var(--ink)");
      set(d, "--nc", f > 0.55 ? "var(--ice-86)" : "var(--ink-70)");
    });
    hairs.forEach((hh, j) => {
      set(hh, "left", `${lerp(joinedLeft + (j + 1) * sw, ((j + 1) * W) / 3, f)}px`);
      set(hh, "top", `${lerp(joinedTop, 0, f)}px`);
      set(hh, "height", `${lerp(sh, H, f)}px`);
    });
    set(exp, "--vo", String(smooth(0.5, 0.72, p)));
    set(exp, "--po", String(smooth(0.7, 0.84, p)));
    set(plan, "visibility", p > 0.69 ? "visible" : "hidden");
    set(exp, "--eo", String(1 - smooth(0.4, 0.5, p)));
    set(exp, "--ho", String(smooth(0.38, 0.46, p) * (1 - smooth(0.86, 1, p))));
  });
  surfaces.push({ el: exp, kind: (p) => (p > 0.6 ? "glass" : "paper") });

  // ===================================================================== 6 across the lake
  const ap = q(root, '[data-scene="approach"]');
  const L = G.lake;
  const { A_PAPER, A_GLUE, A_FALL, FALL_LEN, FALL_STAG, A_ROUTE, TRAVEL0, PER, END } =
    STEP_TIMING;
  const stepEls = qa(ap, "[data-step]");
  const stepLines = stepEls.map((el) => q(el, "[data-rise]"));
  const stepTags = stepEls.map((el) => qa(el, "[data-tag]"));
  const railEls = qa(ap, "[data-rail6]");
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
              back: L.back,
              backRows: L.backRows,
              front: L.front,
              depth: L.depth,
              words: approach.steps.map((s) => s.name),
              font: '"HM Serif", "Noto Serif JP", serif',
              dprCap: 1.5,
              mip: true,
            }),
          )
          .then((r) => (lake = r))
          .catch(() => (lakeFailed = true))
          .finally(() => resolve());
      },
      () =>
        window.scrollY + window.innerHeight * 3 >
        ap.getBoundingClientRect().top + window.scrollY,
      4000,
    );
    engine.tick(() => load.check());
    disposers.push(() => load.cancel());
  });
  // world layout of the six words (metres; camera height h, looking along +Z)
  const HM = 22;
  const CH = 8.2;
  const STRETCH = 3.1;
  const W = approach.steps.map((s, i) => ({
    x: [-7, 7, -7, 7, -6, 0][i]!,
    z: 120 + 230 * i,
    w: CH * [...s.name].length * 0.98,
    l: CH * STRETCH,
  }));
  const routeX = [
    0,
    7,
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
    const vp: [number, number] = [
      vw / 2 + (L.anchors[0][0] - 768) * base,
      vh / 2 + (L.anchors[0][1] - 512) * base,
    ];
    const hz: [number, number] = [vp[0], vp[1] - 18 * base];
    const f = vh / 2 / Math.tan((20 * Math.PI) / 180);
    // the paper withdraws upward: first to the horizon (the lake appears under the sentence), then away
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
    // progress along the lake
    const qq = clamp((p - TRAVEL0) / PER, 0, 6);
    const stepIdx = Math.min(5, Math.floor(qq));
    const within = qq - stepIdx;
    const dwellZ = (i: number) => W[i]!.z - 84;
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
    // the six words: in the sentence, falling, then lying on the lake
    if (!domStart || domStart.vw !== vw || domStart.vh !== vh) {
      // measured against the sticky stage, so the result is the pinned layout whenever it is taken
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
    // —— UI
    set(
      ap,
      "--ro",
      String(
        smooth(A_ROUTE[0] + 0.03, A_ROUTE[1], p) *
          (1 - smooth(END + 0.05, END + 0.08, p)),
      ),
    );
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
      set(el, "transform", `translateY(${-easeIn(out) * 30 * k}px)`);
      rise(stepLines[i]!, inn);
      stepTags[i]!.forEach((g, j) => {
        const tt = lin(a + PER * (0.3 + j * 0.05), a + PER * (0.5 + j * 0.05), p);
        set(g, "opacity", String(tt));
        set(g, "transform", `translateY(${(1 - easeOut(tt)) * 14 * k}px)`);
      });
      if (i === 5) set(el, "--sc", hand > 0.3 ? "var(--ice)" : "var(--flare)");
    });
    railEls.forEach((r, i) => {
      attr(r, "data-on", p >= TRAVEL0 && i === stepIdx);
      attr(r, "data-done", p >= TRAVEL0 && i < stepIdx);
    });
    const fo = smooth(END + 0.06, END + 0.1, p);
    set(ap, "--fo", String(fo));
    set(finalEl, "visibility", fo > 0.001 ? "visible" : "hidden");
    set(
      lead,
      "transform",
      `translateY(${-smooth(A_FALL + 0.06, A_ROUTE[1], p) * 30 * k}px)`,
    );
  });
  surfaces.push({ el: ap, kind: (p) => (p > 0.07 ? "glass" : "paper") });

  // ===================================================================== header surface
  engine.tick((t, y, vh) => {
    if (y > vh) setHeaderOverride({ intro: false });
    headerSurface(surfaces, 36, vh);
  });

  const onResize = () => {
    k = kOf();
    giantBox = null;
    domStart = null;
    engine.measure();
    engine.frame();
  };
  window.addEventListener("resize", onResize);
  const fonts = document.fonts;
  const onFonts = () => onResize();
  fonts.addEventListener("loadingdone", onFonts);
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
      qa(root, "[data-rise], [data-node], [data-rail6], [data-tick]").forEach((el) => {
        el.style.transform = "";
        el.removeAttribute("data-on");
        el.removeAttribute("data-done");
      });
      pano?.dispose();
      lake?.dispose();
    },
  };
}
