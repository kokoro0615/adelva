// Build the river-line geometry for /services/revenue-brand (Opus 5.5).
// Inputs: mock traces (records/trace-*.json), plate traces and hand-placed
// points read off the clean plates with tools/grid-crop.mjs. Output: one JSON
// per viewport in PLATE pixels (the SVG viewBox equals the plate's natural
// size, so lines and photograph share one coordinate plane).
// usage: node tools/build-geometry.mjs  → plates/geometry-desktop.json, plates/geometry-mobile.json
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const td = read("records/trace-desktop-mock.json"); // mock raster (1024 wide)
const tm = read("records/trace-mobile-mock-2x.json"); // mock @2x (780 wide)
const dWhite = read("records/trace-desktop-white.json").dWhite; // plate px
const mPlate = read("records/trace-mobile-plate.json"); // plate px
const D = 1.5; // desktop mock raster -> plate
const M = 853 / 780; // mobile mock @2x -> plate
const sc = (pts, k) => pts.map(([x, y]) => [x * k, y * k]);

// Light smoothing (keeps end points) and decimation to a minimum spacing.
function tidy(pts, { spacing = 22, passes = 2 } = {}) {
  let p = pts.map((q) => [...q]);
  for (let s = 0; s < passes; s++)
    p = p.map((q, i) =>
      i === 0 || i === p.length - 1
        ? q
        : [
            (p[i - 1][0] + 2 * q[0] + p[i + 1][0]) / 4,
            (p[i - 1][1] + 2 * q[1] + p[i + 1][1]) / 4,
          ],
    );
  const out = [p[0]];
  for (const q of p.slice(1, -1))
    if (Math.hypot(q[0] - out.at(-1)[0], q[1] - out.at(-1)[1]) >= spacing) out.push(q);
  out.push(p.at(-1));
  return out;
}
// Catmull-Rom (uniform) -> cubic Bezier path string.
function toPath(pts) {
  const r = (v) => Math.round(v * 10) / 10;
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}
const join = (...parts) => {
  const out = [];
  for (const part of parts)
    for (const q of part)
      if (!out.length || Math.hypot(q[0] - out.at(-1)[0], q[1] - out.at(-1)[1]) > 2)
        out.push(q);
  return out;
};
// x of a polyline at a given y (first crossing after index `from`).
function xAt(pts, y) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1])
      return a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
  }
  return null;
}
const round = (q) => q.map((v) => Math.round(v));
// Point and heading at a fraction of a polyline's length (for the loop's
// "back upstream" arrowhead, placed between 改善 and ブランド方針).
function alongPolyline(pts, frac) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    segs.push(l);
    total += l;
  }
  let target = total * frac;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const t = target / segs[i];
      const [a, b] = [pts[i], pts[i + 1]];
      return {
        x: Math.round(a[0] + (b[0] - a[0]) * t),
        y: Math.round(a[1] + (b[1] - a[1]) * t),
        angle: Math.round((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI),
      };
    }
    target -= segs[i];
  }
  return null;
}

// ─── Desktop (plate 1536 × 8704; 1 plate px = 1440/1536 u) ───
// Desktop source streams and tributaries: snapped onto the plate's water with
// tools/snap-to-water.mjs (records/snap-desktop-*.json), Opus review 2026-09-29.
const dSnapSources = read("records/snap-desktop-sources.json");
const dSnapTribs = read("records/snap-desktop-tribs.json");
const dSources = dSnapSources;
const dNodesY = { web: 156, ota: 222, sales: 270, photo: 322, sns: 334 };
const dCascade = sc(td.main1, D);
const dLakeEnd = [[783, 3420]];
const dLake = [
  dCascade.at(-1),
  [766, 2500],
  [768, 2700],
  [768, 2900],
  [770, 3100],
  [776, 3250],
  ...dLakeEnd,
];
const dRiver = sc(td.main2, D);
const dBridge = [
  [750, 4150],
  [700, 4192],
];
const dLoopR = sc(td.loopR, D);
const dExit = sc(td.exit, D);
const dHidden2 = [
  [775, 6200],
  [790, 6350],
];
const dProc = sc(td.proc, D);
const dMainPts = tidy(
  // Desktop: the river between the chapter index and the confluence runs under
  // the forest in the photograph, and A4 draws no line there. The main line
  // starts at the confluence; the SCROLL cue ends at the index band.
  join(
    [[511.6 * D, 1091.8 * D]],
    dCascade,
    dLake.slice(1),
    dRiver,
    dBridge,
    dLoopR,
    dExit,
    dHidden2,
    dProc,
    dWhite,
  ),
  { spacing: 20 },
);
// The left half of the loop must close onto the main line: A4 puts ブランド方針
// on that junction. Extend it to the main line at the node's height.
const dLoopBackRaw = sc(td.loopL, D);
const dJunctionY = 2797.6 * D;
const dJunction = [xAt(dMainPts, dJunctionY), dJunctionY];
const dLoopBack = tidy([...dLoopBackRaw, dJunction], { spacing: 20 });
// Clockwise ring from ブランド方針 (top): right half then left half. Used by the one-time particle run.
const dCycle = tidy(join([dJunction], sc(td.loopR, D), sc(td.loopL, D), [dJunction]), {
  spacing: 20,
});
const dTribL = tidy(dSnapTribs.L, { spacing: 14, passes: 1 });
const dTribR = tidy(dSnapTribs.R, { spacing: 14, passes: 1 });

const dDots = {
  ch1: {
    "official-site": [221.5, 804.8],
    ota: [270.3, 858.8],
    search: [262.3, 903.7],
    content: [275.1, 949],
    "sales-channel": [306.6, 997.3],
    measurement: [311.1, 1045.4],
    corporate: [787.6, 843.9],
    "travel-agency": [775.5, 914.3],
    group: [764.9, 980.2],
    "regional-business": [763.4, 1029.6],
  },
  confluence: [511.6, 1091.8],
  loop: {
    "brand-policy": [434.5, 2797.6],
    improvement: [184.3, 2850.6],
    planning: [532.2, 2925.1],
    posting: [511, 3050],
    analysis: [157.8, 3053.6],
    "web-booking": [468.2, 3176.6],
  },
  process: {
    "01": [546, 4332],
    "02": [465, 4428],
    "03": [571, 4566],
    "04": [449, 4692],
    "05": [599, 4843],
    "06": [466, 5038],
    end: [504, 5360],
  },
};
const dChips = {
  sources: {
    web: [299, 87.5],
    ota: [466, 123.5],
    sales: [634.5, 155],
    photo: [795.5, 188],
    sns: [943.5, 190.5],
  },
  ch1: {
    "official-site": [147, 790],
    ota: [171, 837],
    search: [192, 884],
    content: [175, 931],
    "sales-channel": [195, 981],
    measurement: [235, 1029],
    corporate: [844, 830],
    "travel-agency": [847, 901],
    group: [832, 966],
    "regional-business": [840, 1029],
    revenue: [604, 1090],
  },
  loop: {
    "brand-policy": [522, 2799.5],
    improvement: [147, 2810],
    planning: [593, 2924],
    posting: [573, 3052],
    analysis: [118, 3087],
    "web-booking": [567, 3175.5],
  },
};
const toPlate = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      typeof v[0] === "number" && v.length === 2
        ? round([v[0] * D, v[1] * D])
        : toPlate(v),
    ]),
  );
const snap = (pts, p) => {
  const x = xAt(pts, p[1]);
  return x == null ? round(p) : round([x, p[1]]);
};
const dDotsP = toPlate(dDots);
// Snap nodes that sit on the main line to the line itself.
dDotsP.confluence = snap(dMainPts, dDotsP.confluence);
dDotsP.loop["brand-policy"] = round(dJunction);
for (const k of Object.keys(dDotsP.process))
  dDotsP.process[k] = snap(dMainPts, dDotsP.process[k]);
for (const k of ["posting", "web-booking"])
  dDotsP.loop[k] = snap(k === "posting" ? dLoopR : dMainPts, dDotsP.loop[k]);
const sourceNodes = Object.fromEntries(
  Object.entries(dSources).map(([k, pts]) => [
    k,
    round([xAt(pts, dNodesY[k]), dNodesY[k]]),
  ]),
);

const desktop = {
  plate: { width: 1536, height: 8704, cssWidthAt: 1440, platePerCss: 1536 / 1440 },
  note: "All coordinates are plate px. SVG viewBox = 0 0 1536 8704, drawn over the plate at the same size. Mock raster px ×1.5 = plate px; plate px × 1440/1536 = CSS px at a 1440 px wide page (u).",
  paths: {
    main: {
      d: toPath(dMainPts),
      from: "confluence (chapter 1)",
      to: "end square below the ryokan",
      points: dMainPts.map(round),
    },
    sources: Object.fromEntries(
      Object.entries(dSources).map(([k, pts]) => [
        k,
        { d: toPath(pts), node: sourceNodes[k] },
      ]),
    ),
    tributaryLeft: { d: toPath(dTribL) },
    tributaryRight: { d: toPath(dTribR) },
    loopOther: {
      d: toPath(dLoopBack),
      note: "half of the loop NOT on the main line (desktop: left half, 投稿-side bottom → 分析 → 改善 → ブランド方針); drawn once when chapter 15 enters",
    },
    cycle: {
      d: toPath(dCycle),
      note: "full ring, clockwise from ブランド方針 via 企画, 投稿, 分析, 改善; the particle runs it once and stops at 投稿",
    },
  },
  lakeDottedRangeY: [dCascade.at(-1)[1], 3180],
  loopArrow: alongPolyline(dCycle, 0.93),
  lineMasks: [
    { id: "index-band", rect: [0, 880, 1536, 150] },
    { id: "ch1-title", rect: [440, 1068, 656, 132] },
    { id: "ch2-title-reflection", rect: [220, 2525, 1096, 270] },
    { id: "ch2-note", rect: [570, 3045, 396, 44] },
    { id: "ryokan", rect: [380, 3178, 560, 226] },
    { id: "differences-title", rect: [548, 4952, 440, 76] },
    { id: "differences-note", rect: [356, 5455, 828, 68] },
    { id: "process-header", rect: [320, 6160, 900, 250] },
  ],
  dots: dDotsP,
  chips: toPlate(dChips),
};

// ─── Mobile (plate 853 × 12960; 1 plate px = 390/853 CSS px) ───
const mHero = sc(tm.hero, M);
const mStem = mPlate.mStem;
const mTribC = sc(tm.tribC, M);
const mCascade = sc(tm.main1, M);
const mLakeEnd = [[504, 6015]];
const mLake = [
  mCascade.at(-1),
  [427, 4300],
  [427, 4700],
  [427, 5100],
  [427, 5500],
  [440, 5800],
  [470, 5930],
  ...mLakeEnd,
];
const mRiver = sc(tm.main2, M);
const mLoopR = sc(tm.loopR, M);
const mLoopLeftDown = sc(tm.loopL, M).slice().reverse();
const mExit = sc(tm.exit, M);
const mProc = sc(tm.proc, M);
const mWhite = [
  [282, 11662],
  [300, 11700],
  [350, 11740],
  [420, 11780],
  [480, 11810],
  [522, 11832],
  [530, 11880],
  [510, 11940],
  [470, 11990],
  [434, 12022],
  [410, 12080],
  [397, 12166],
];
const mMainPts = tidy(
  join(
    [[426, 1312], ...mHero],
    mStem,
    mTribC,
    mCascade,
    mLake.slice(1),
    mRiver,
    mLoopLeftDown,
    mExit,
    mProc,
    mWhite,
  ),
  { spacing: 18 },
);
// On mobile the river enters the loop top heading left, so the main line runs the
// loop counter-clockwise (left half) and the right half is the other branch.
const mLoopBack = tidy(mLoopR, { spacing: 18 });
const mCycle = tidy(join(mLoopR, sc(tm.loopL, M)), { spacing: 18 });
const mTribL = tidy(sc(tm.tribL, M), { spacing: 18 });
const mTribR = tidy(sc(tm.tribR, M), { spacing: 18 });
const mDots = {
  sources: {
    web: [95.8, 275.1],
    ota: [257.9, 332.3],
    sales: [409.5, 379.3],
    photo: [538.7, 425],
    sns: [677.2, 397.7],
  },
  ch1: {
    "official-site": [185.4, 2198.7],
    ota: [226, 2276.7],
    search: [211.2, 2350.7],
    content: [206.4, 2426.2],
    "sales-channel": [224.8, 2500.6],
    measurement: [238.4, 2573.9],
    corporate: [596.1, 2258.2],
    "travel-agency": [604.7, 2362.7],
    group: [586.8, 2475.1],
    "regional-business": [585, 2567.6],
  },
  confluence: [401.9, 2654],
  loop: {
    "brand-policy": [414.6, 6385],
    improvement: [161.6, 6492.2],
    planning: [609, 6558.5],
    posting: [593, 6712],
    analysis: [135.5, 6720.3],
    "web-booking": [392.6, 6916.3],
  },
  differences: {
    12: [113.9, 7693],
    13: [113.9, 7865.9],
    14: [115.1, 8050],
    15: [118.6, 8217.1],
  },
  process: {
    "01": [666, 9362],
    "02": [267, 9618],
    "03": [543, 9870],
    "04": [258, 10664],
    "05": [477, 10820],
    "06": [397, 10993],
    end: [363, 11125],
  },
};
const mChips = {
  sources: {
    web: [158, 253],
    ota: [322, 305],
    sales: [474, 352],
    photo: [603, 396],
    sns: [734, 360],
  },
  ch1: {
    "official-site": [97, 2187],
    ota: [113, 2255],
    search: [126, 2323],
    content: [108, 2402],
    "sales-channel": [122, 2479],
    measurement: [157, 2552],
    corporate: [697, 2235],
    "travel-agency": [693, 2341],
    group: [674, 2450],
    "regional-business": [677, 2552],
    revenue: [497, 2655],
  },
  loop: {
    "brand-policy": [517, 6373],
    improvement: [123, 6452],
    planning: [681, 6537],
    posting: [679, 6716],
    analysis: [86, 6754],
    "web-booking": [508, 6908],
  },
};
const toPlateM = (o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k,
      typeof v[0] === "number" && v.length === 2
        ? round([v[0] * M, v[1] * M])
        : toPlateM(v),
    ]),
  );
const mDotsP = toPlateM(mDots);
mDotsP.confluence = snap(mMainPts, mDotsP.confluence);
for (const k of Object.keys(mDotsP.process))
  if (k !== "end") mDotsP.process[k] = snap(mMainPts, mDotsP.process[k]);
mDotsP.process.end = round(mMainPts.at(-1));
for (const k of Object.keys(mDotsP.differences))
  mDotsP.differences[k] = snap(mMainPts, mDotsP.differences[k]);
// Mobile source streams, read off plates/mobile-plate.png with tools/grid-crop.mjs (1:1).
const mSources = {
  web: [
    [60, 155],
    [85, 200],
    [100, 250],
    [105, 300],
    [120, 340],
    [125, 380],
    [120, 405],
  ],
  ota: [
    [265, 160],
    [250, 210],
    [265, 260],
    [285, 310],
    [295, 360],
    [310, 410],
    [320, 450],
    [330, 490],
  ],
  sales: [
    [460, 185],
    [440, 230],
    [430, 280],
    [440, 330],
    [450, 380],
    [455, 430],
    [445, 480],
    [445, 530],
    [465, 580],
    [490, 610],
  ],
  photo: [
    [605, 180],
    [590, 230],
    [570, 280],
    [580, 330],
    [575, 380],
    [585, 430],
    [595, 480],
    [605, 530],
    [615, 580],
    [625, 630],
    [620, 680],
    [600, 720],
    [620, 760],
    [650, 790],
    [630, 840],
    [600, 880],
    [570, 930],
    [555, 980],
    [540, 1030],
    [525, 1070],
  ],
  sns: [
    [740, 195],
    [725, 240],
    [740, 280],
    [720, 320],
    [740, 370],
    [740, 420],
    [745, 470],
    [740, 520],
    [735, 570],
    [725, 605],
  ],
};
const mobile = {
  plate: { width: 853, height: 12960, cssWidthAt: 390, platePerCss: 853 / 390 },
  note: "All coordinates are plate px. SVG viewBox = 0 0 853 12960 over the plate. Mock @2x px × 853/780 = plate px; plate px × 390/853 = CSS px at 390 wide.",
  paths: {
    main: {
      d: toPath(mMainPts),
      from: "SCROLL cue",
      to: "end square on the lake shore",
      points: mMainPts.map(round),
    },
    sources: Object.fromEntries(
      Object.entries(mSources).map(([k, pts]) => [
        k,
        {
          d: toPath(pts),
          node: round([xAt(pts, mDots.sources[k][1] * M), mDots.sources[k][1] * M]),
        },
      ]),
    ),
    tributaryLeft: { d: toPath(mTribL) },
    tributaryRight: { d: toPath(mTribR) },
    loopOther: {
      d: toPath(mLoopBack),
      note: "right half of the loop (ブランド方針 → 企画 → 投稿 → bottom), not on the main line on mobile; drawn once when chapter 15 enters",
    },
    cycle: {
      d: toPath(mCycle),
      note: "full ring, clockwise from ブランド方針 via 企画, 投稿, 分析, 改善; the particle runs it once and stops at 投稿",
    },
  },
  lakeDottedRangeY: [mCascade.at(-1)[1], 5990],
  loopArrow: alongPolyline(mCycle, 0.93),
  lineMasks: [
    { id: "index-panel", rect: [40, 1812, 773, 345] },
    { id: "ch1-title", rect: [140, 2190, 574, 118] },
    { id: "ch2-title-reflection", rect: [90, 4300, 673, 190] },
    { id: "ch2-rows-note-ryokan", rect: [0, 5060, 853, 935] },
  ],
  dots: mDotsP,
  chips: toPlateM(mChips),
};
writeFileSync("plates/geometry-desktop.json", `${JSON.stringify(desktop, null, 1)}\n`);
writeFileSync("plates/geometry-mobile.json", `${JSON.stringify(mobile, null, 1)}\n`);
console.log("desktop main pts", dMainPts.length, "mobile main pts", mMainPts.length);
