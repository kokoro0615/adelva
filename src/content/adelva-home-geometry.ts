/**
 * Geometry measured on the adopted HOME A2r3 plates (Opus 5.5), in each plate's
 * own 1× pixels (`home-r3-2026-10-02/build/geometry.js` and
 * `home-r3-mobile-2026-10-02/build/geometry-m.js`). The production files are
 * 2× (desktop) and 1.5× (phone) redraws of the same plates, so every value
 * here stays valid; renderers sample by UV.
 */
export const homeMedia = "/media/adelva/home/";
const M = homeMedia;

export interface PanoTile {
  readonly src: string;
  readonly x0: number;
  readonly x1: number;
  readonly use0: number;
  readonly use1: number;
}

/** Split a 6144-px panorama into textures, each covering [x0, x1] with an overlap. */
const tiles = (
  name: string,
  cuts: readonly (readonly [number, number])[],
): PanoTile[] =>
  cuts.map(([x0, x1], i) => ({
    src: `${M}${name}-${i}.webp`,
    x0,
    x1,
    use0: i === 0 ? -1e9 : (x0 + cuts[i - 1]![1]) / 2,
    use1: i === cuts.length - 1 ? 1e9 : (x1 + cuts[i + 1]![0]) / 2,
  }));

export const homeGeometry = {
  who: {
    /** W-1 (the management's view from the ridge) and W-2 (behind the counter), 1254 × 1254. */
    owner: `${M}who-owner.webp`,
    field: `${M}who-field.webp`,
  },
  pano: {
    size: [6144, 1024] as const,
    /** 2× redraw (12288 × 2048) in two textures of ≤ 6176 px. */
    desktop: tiles("path", [
      [0, 3088],
      [3056, 6144],
    ]),
    /** 1.5× (9216 × 1536) in three textures of ≤ 3120 px, for phone GPUs. */
    mobile: tiles("path-m", [
      [0, 2080],
      [2032, 4112],
      [4064, 6144],
    ]),
    depth: `${M}path-depth.webp`,
    /** Still frames of the five places, for the reduced-motion and script-free layout. */
    stills: [0, 1, 2, 3, 4].map((i) => `${M}path-still-${i}.webp`),
    /** Desktop: the centre of each place (study, entrance, guest room, open-air bath, back office). */
    buildings: [985, 2152, 3204, 4300, 5228],
    exitX: 5900,
    /** Phone: where the portrait camera stops for each place (chosen on 473 × 1024 windows). */
    stops: [1010, 2110, 3240, 4330, 5250],
    exitXMobile: 5930,
    /** The lake's far edge where the mist meets the water (near the bath). */
    horizon: 542,
    ref: 0.42,
    /** Regions that breathe (r steam, g water, b noren), traced on the panorama. */
    mask: [
      {
        ch: "b",
        poly: [
          [2042, 455],
          [2262, 455],
          [2262, 556],
          [2042, 556],
        ],
        grad: [455, 556],
      },
      {
        ch: "g",
        poly: [
          [4176, 694],
          [4606, 694],
          [4606, 726],
          [4176, 726],
        ],
      },
      {
        ch: "g",
        poly: [
          [4056, 540],
          [4796, 540],
          [4796, 688],
          [4056, 688],
        ],
      },
      {
        ch: "g",
        poly: [
          [3700, 545],
          [3960, 545],
          [3960, 640],
          [3700, 640],
        ],
      },
      { ch: "r", ellipse: [4500, 640, 230, 130] },
    ] as const,
  },
  expertise: {
    /** Desktop: E-l (2× redraw, 3072 × 2048), cut into three vertical strips. */
    wide: `${M}expertise-wide.webp`,
    /** Phone: E-m (1024 × 1536), cut into three horizontal tiers. */
    tall: `${M}expertise-tall.webp`,
    tallSize: [1024, 1536] as const,
    /** Tier borders of E-m as fractions of its height (snow | larch | forest). */
    tiers: [0.31, 0.51] as const,
  },
  lake: {
    /** P-1 (the sky and the great peak), P-1g (alpenglow) and P-1s (sunrise), opaque, cropped to the top rows. */
    back: [`${M}lake-sky.webp`, `${M}lake-glow.webp`, `${M}lake-sun.webp`] as const,
    backRows: 576,
    /** P-1F, P-2F, P-3F, P-3LF: RGBA front plates (alpha = the cedar-top matte). */
    front: [
      `${M}lake-1.webp`,
      `${M}lake-2.webp`,
      `${M}lake-3.webp`,
      `${M}lake-3-sun.webp`,
    ] as const,
    frontMobile: [
      `${M}lake-1-m.webp`,
      `${M}lake-2-m.webp`,
      `${M}lake-3-m.webp`,
      `${M}lake-3-sun-m.webp`,
    ] as const,
    backMobile: [
      `${M}lake-sky-m.webp`,
      `${M}lake-glow-m.webp`,
      `${M}lake-sun-m.webp`,
    ] as const,
    depth: `${M}lake-3-depth.webp`,
    /** The crossing's last light (P-3L), for the reduced-motion and script-free layout. */
    still: `${M}lake-still.webp`,
    /** The plate pixel on the vanishing point (P-1: the ryokan) and each plate's cumulative magnification. */
    anchors: [
      [765, 515],
      [794, 544],
      [814, 568],
    ] as const,
    mags: [1, 2.376, 4.163] as const,
    mist: [
      [0.66, 0.69, 0.75],
      [0.69, 0.71, 0.75],
      [0.74, 0.73, 0.72],
    ] as const,
    /** The great peak's summit in P-1; the portrait camera keeps it in frame. */
    peak: [920, 84] as const,
  },
} as const;
