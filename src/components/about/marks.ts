/**
 * The orange pencil marks: rings drawn with a pencil's gesture (they drift outward
 * and overshoot a full turn instead of closing like a compass), and the leaders that
 * tie each phrase to its place. Ported from the adopted mocks' layout scripts
 * (references/adelva/mockups/about-2026-09-29/A2{,-mobile}/build/layout.js) with the
 * same seeded sequence, so the production rings are the mocks' rings.
 */
import { desktopGeometry, mobileGeometry, type Ring } from "@/content/adelva-about";

export type Composition = "desktop" | "mobile";
type Point = readonly [number, number];

export interface RingMarks {
  readonly main: string;
  readonly ghost: string;
  readonly label?: { readonly x: number; readonly y: number; readonly text: string };
}

export interface LeaderMark {
  readonly d: string;
  readonly dot: Point;
}

const RING_KEYS = {
  desktop: ["gable", "windows", "eaves", "c01", "c02", "c03"],
  mobile: ["gable", "windows", "eaves", "c01", "c02", "c03"],
} as const;

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function ringPath(
  rnd: () => number,
  { cx, cy, r }: Ring,
  start: number,
  sweep: number,
  wobble: number,
  steps: number,
) {
  const pts: Point[] = [];
  const rx = r * (1.03 + (rnd() - 0.5) * 0.02),
    ry = r * (0.97 + (rnd() - 0.5) * 0.02),
    rot = (rnd() - 0.5) * 0.25;
  const ph = rnd() * 6.28;
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps;
    const k = 1 + wobble * Math.sin(3 * t + ph) + (i / steps) * 0.035;
    const x = rx * k * Math.cos(t),
      y = ry * k * Math.sin(t);
    pts.push([
      cx + x * Math.cos(rot) - y * Math.sin(rot),
      cy + x * Math.sin(rot) + y * Math.cos(rot),
    ]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i += 2)
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${pts[i + 1][0].toFixed(1)} ${pts[i + 1][1].toFixed(1)}`;
  return d;
}

/**
 * The seeded jitter each desktop leader consumes, in the mocks' order: three wish
 * leaders after the first three rings, three row leaders after the last three.
 */
function sequence(kind: Composition) {
  const g = kind === "desktop" ? desktopGeometry : mobileGeometry;
  const rnd = rng(11);
  const steps = kind === "desktop" ? 72 : 64;
  const ghostScale = kind === "desktop" ? 1.02 : 1.03;
  const rings: Record<string, RingMarks> = {};
  const jitter: Record<string, number> = {};
  const draw = (key: string) => {
    const c = (g.rings as Record<string, Ring>)[key];
    const main = ringPath(rnd, c, -1.2, 6.6, 0.018, steps);
    const ghost = ringPath(rnd, { ...c, r: c.r * ghostScale }, -0.6, 5.9, 0.024, steps);
    const label = c.label
      ? kind === "desktop"
        ? { x: c.cx + c.r * 0.78 + 8, y: c.cy - c.r * 0.72, text: c.label }
        : { x: c.cx + c.r * 0.74 + 4, y: c.cy - c.r * 0.74, text: c.label }
      : undefined;
    rings[key] = { main, ghost, label };
  };
  const keys = RING_KEYS[kind];
  keys.slice(0, 3).forEach(draw);
  if (kind === "desktop") for (const k of keys.slice(0, 3)) jitter[k] = rnd();
  keys.slice(3).forEach(draw);
  if (kind === "desktop") for (const k of keys.slice(3)) jitter[k] = rnd();
  return { rings, jitter };
}

const cache = { desktop: sequence("desktop"), mobile: sequence("mobile") };

export function ringMarks(kind: Composition): Readonly<Record<string, RingMarks>> {
  return cache[kind].rings;
}

/** A leader from a phrase's end (x0, y0) to its ring, in page units. */
export function leaderMark(
  kind: Composition,
  key: string,
  [x0, y0]: Point,
): LeaderMark {
  const g = kind === "desktop" ? desktopGeometry : mobileGeometry;
  const c = (g.rings as Record<string, Ring>)[key];
  if (kind === "desktop") {
    const ang = Math.atan2(y0 - c.cy, x0 - c.cx);
    const x1 = c.cx + (c.r + 4) * Math.cos(ang),
      y1 = c.cy + (c.r + 4) * Math.sin(ang);
    const mx = (x0 + x1) / 2 + (cache.desktop.jitter[key] - 0.5) * 6,
      my = (y0 + y1) / 2 - 6;
    return {
      d: `M${x0.toFixed(1)} ${y0.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      dot: [x0 - 6, y0],
    };
  }
  if (c.route) {
    // Architect's leader with a knee: right to the route column, down, then into
    // the ring's upper right.
    const a = -Math.PI / 4,
      ex = c.cx + (c.r + 3) * Math.cos(a),
      ey = c.cy + (c.r + 3) * Math.sin(a);
    const kneeY = ey - (c.route - ex);
    return {
      d: `M${x0.toFixed(1)} ${y0.toFixed(1)} H${(c.route - 6).toFixed(1)} Q${c.route} ${y0.toFixed(1)} ${c.route} ${(y0 + 6).toFixed(1)} V${kneeY.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`,
      dot: [x0 - 5, y0],
    };
  }
  const ang = Math.atan2(y0 - c.cy, x0 - c.cx);
  const x1 = c.cx + (c.r + 4) * Math.cos(ang),
    y1 = c.cy + (c.r + 4) * Math.sin(ang);
  return {
    d: `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(x0 + 18).toFixed(1)} ${(y0 + 30).toFixed(1)} ${(x1 + 30).toFixed(1)} ${(y1 - 60).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
    dot: [x0 - 5, y0],
  };
}

/** Leaders for the static (server) render, from the mocks' measured text ends. */
export function defaultLeaders(
  kind: Composition,
): Readonly<Record<string, LeaderMark>> {
  const g = kind === "desktop" ? desktopGeometry : mobileGeometry;
  return Object.fromEntries(
    Object.entries(g.leadStarts).map(([key, start]) => [
      key,
      leaderMark(kind, key, start),
    ]),
  );
}

/** The architect's dimension line along the stepping stones, with end ticks. */
export function dimensionPath() {
  const { x1, y1, x2, y2 } = desktopGeometry.dim;
  const a = Math.atan2(y2 - y1, x2 - x1),
    nx = -Math.sin(a) * 9,
    ny = Math.cos(a) * 9;
  const f = (v: number) => v.toFixed(1);
  return `M${x1} ${y1} L${x2} ${y2} M${f(x1 - nx)} ${f(y1 - ny)} L${f(x1 + nx)} ${f(y1 + ny)} M${f(x2 - nx)} ${f(y2 - ny)} L${f(x2 + nx)} ${f(y2 + ny)}`;
}
