/**
 * kokoro nakagawa — the project's original single-line cursive (the same pen
 * paths as `home/founder-signature.tsx`), as the adopted HOME prototype lays it
 * out: fourteen letters on a gently rising baseline, then one orange flourish.
 * Each path follows the pen, so the letters are written in stroke order.
 */
export const signatureViewBox = "0 0 656.82 120.12";
export const signatureWidth = 656.82;

const letters = {
  k: "M0 78 C10 69 27 31 25 19 C23 7 13 21 12 39 L5 81 C9 65 20 50 29 51 C39 53 25 67 14 66 C23 65 22 85 32 80 L42 71",
  o: "M0 78 C7 74 9 55 21 53 C36 49 30 79 17 81 C3 83 6 59 21 53 C18 64 28 70 36 68",
  r: "M0 78 C8 71 13 58 16 51 C10 64 14 64 22 58 C33 51 29 69 25 77 C23 84 32 81 37 74",
  n: "M0 78 C8 70 12 58 15 53 L7 81 C18 59 28 49 32 56 C36 63 22 87 35 79 L43 72",
  a: "M0 78 C7 73 10 54 23 53 C36 51 26 79 15 81 C3 82 9 56 23 53 C29 52 30 54 30 56 L23 76 C21 85 31 81 38 73",
  g: "M0 78 C7 73 10 54 23 53 C36 51 26 79 15 81 C3 82 9 56 23 53 C29 52 30 54 30 56 C24 77 21 103 10 108 C-4 114 -2 99 12 93 C25 88 34 78 41 71",
  w: "M0 78 C7 73 12 61 15 53 C11 65 5 84 15 81 C23 78 28 62 30 56 C24 72 22 86 32 80 C44 72 47 55 43 53 C38 55 40 71 52 68",
} as const;

const strokes: readonly (readonly [keyof typeof letters, number])[] = [
  ["k", 12],
  ["o", 52],
  ["k", 87],
  ["o", 127],
  ["r", 162],
  ["o", 197],
  ["n", 261],
  ["a", 302],
  ["k", 338],
  ["a", 378],
  ["g", 414],
  ["a", 453],
  ["w", 489],
  ["a", 539],
];

export interface SignatureStroke {
  readonly d: string;
  /** Offset applied by the path's transform, in viewBox units. */
  readonly dx: number;
  readonly dy: number;
  readonly flourish: boolean;
}

export const signatureStrokes: readonly SignatureStroke[] = [
  ...strokes.map(([letter, x]) => ({
    d: letters[letter],
    dx: x,
    dy: 8 - x * 0.025,
    flourish: false,
  })),
  {
    d: "M89 107 C208 96 396 89 559 87 C600 86 625 80 636 74",
    dx: 0,
    dy: 0,
    flourish: true,
  },
];

/** Pen lifts before each stroke, in writing seconds (longer between the two names and before the flourish). */
export const signatureGaps: readonly number[] = signatureStrokes.map((_, i) =>
  i === 0 ? 0 : i === 6 ? 0.12 : i === 14 ? 0.16 : 0.03,
);
/** Viewbox units written per writing second. */
export const signatureSpeed = 140;
