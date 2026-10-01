/**
 * Production media registry for HOME.
 *
 * Every entry maps one-to-one onto a row in `docs/asset-provenance.md`. All
 * entries are ADELVA-owned or licensed media; the White Desert target media
 * this registry used to hold was removed with that site on 2026-10-02.
 *
 * `assets` holds still imagery; `videoAssets` holds motion sources.
 */

export interface AssetRecord {
  /** Provenance manifest asset ID. */
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** Meaningful description; empty string marks a decorative role. */
  readonly alt: string;
  /** `object-position` for intentional crops. */
  readonly focal: string;
}

export const assets = {
  "adelva-home-challenge-management": {
    id: "adelva-home-challenge-management",
    src: "/media/adelva/home-2026-09-10/challenge-management.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-challenge-opening": {
    id: "adelva-home-challenge-opening",
    src: "/media/adelva/home-2026-09-10/challenge-opening.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-challenge-people": {
    id: "adelva-home-challenge-people",
    src: "/media/adelva/home-2026-09-10/challenge-people.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-challenge-brand": {
    id: "adelva-home-challenge-brand",
    src: "/media/adelva/home-2026-09-10/challenge-brand.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-challenge-digital": {
    id: "adelva-home-challenge-digital",
    src: "/media/adelva/home-2026-09-10/challenge-digital.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-intro": {
    id: "adelva-home-expertise-intro",
    src: "/media/adelva/home-2026-09-10/expertise-intro.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-reveal": {
    id: "adelva-home-expertise-reveal",
    src: "/media/adelva/home-2026-09-10/expertise-reveal.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-management": {
    id: "adelva-home-expertise-management",
    src: "/media/adelva/home-2026-09-10/expertise-management.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-revenue": {
    id: "adelva-home-expertise-revenue",
    src: "/media/adelva/home-2026-09-10/expertise-revenue.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-digital": {
    id: "adelva-home-expertise-digital",
    src: "/media/adelva/home-2026-09-10/expertise-digital.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },
  "adelva-home-expertise-final": {
    id: "adelva-home-expertise-final",
    src: "/media/adelva/home-2026-09-10/expertise-final.webp",
    width: 1536,
    height: 1024,
    alt: "",
    focal: "50% 50%",
  },

  "adelva-support-landscape": {
    id: "adelva-support-landscape",
    src: "/media/adelva/who-we-support-landscape.webp",
    width: 1448,
    height: 1086,
    alt: "",
    focal: "50% 50%",
  },
  // --- Authorized target media (client rebuild, 2026-08-31) ---------------
  "hero-poster": {
    id: "hero-poster",
    src: "/media/target/hero-poster.webp",
    width: 1920,
    height: 1080,
    alt: "",
    focal: "50% 50%",
  },
} as const satisfies Record<string, AssetRecord>;

export type AssetId = keyof typeof assets;

export function getAsset(id: AssetId): AssetRecord {
  return assets[id];
}

export interface VideoSourceRecord {
  readonly src: string;
  /** MIME type with codecs, so browsers skip files they cannot decode. */
  readonly type: string;
  /** Media query the viewport must match for this file to be chosen. */
  readonly media?: string;
}

export interface VideoAssetRecord {
  readonly id: string;
  /** Universal H.264 landscape file; also the last `<source>` candidate. */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly durationSeconds: number;
  /** Ordered `<source>` candidates; the browser plays the first match. */
  readonly sources?: readonly VideoSourceRecord[];
}

const H264_HIGH_41 = 'video/mp4; codecs="avc1.640029"';
const PORTRAIT = "(orientation: portrait)";

/**
 * Motion sources. Local files only — a remote origin here would breach the
 * production-hygiene gate in `tests/e2e/home-manifest.spec.ts`.
 */
export const videoAssets = {
  "hero-antarctica": {
    id: "hero-antarctica",
    src: "/media/video/hero-antarctica.mp4",
    width: 1920,
    height: 1080,
    durationSeconds: 32,
    // Portrait screens get a 9:16 edit framed per shot instead of a centre
    // crop of the 16:9 file. Only the reviewed H.264 CRF18 encodes are served:
    // the AV1 CRF28 encodes lost ~10% fine detail and jumped texture at every
    // 2 s keyframe, which read as breakage in production.
    sources: [
      {
        src: "/media/video/hero-antarctica-portrait.mp4",
        type: H264_HIGH_41,
        media: PORTRAIT,
      },
      { src: "/media/video/hero-antarctica.mp4", type: H264_HIGH_41 },
    ],
  },
} as const satisfies Record<string, VideoAssetRecord>;

export type VideoAssetId = keyof typeof videoAssets;

export function getVideoAsset(id: VideoAssetId): VideoAssetRecord {
  return videoAssets[id];
}
