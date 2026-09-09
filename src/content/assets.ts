/**
 * Production media registry.
 *
 * Every entry maps one-to-one onto a row in `docs/asset-provenance.md`.
 *
 * Operating mode is **authorized client rebuild** (recorded 2026-08-31): the
 * client representative authorized all target identity, copy, imagery, video
 * and type. Target media is therefore approved production content. It is served
 * from local optimized derivatives only — nothing in this registry may point at
 * `white-desert.com`, `cdn.sanity.io` or `cloudflarestream.com`.
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
  "hero-emperor-penguin": {
    id: "hero-emperor-penguin",
    src: "/media/hero-emperor-penguin.webp",
    width: 1536,
    height: 1024,
    alt: "An emperor penguin in profile against a pale overcast snowfield.",
    focal: "62% 48%",
  },
  "aerial-blue-ice": {
    id: "aerial-blue-ice",
    src: "/media/aerial-blue-ice.webp",
    width: 1672,
    height: 941,
    alt: "Travellers crossing wind-carved blue ice seen from the air.",
    focal: "50% 55%",
  },
  "polar-camp-exterior": {
    id: "polar-camp-exterior",
    src: "/media/polar-camp-exterior.webp",
    width: 1536,
    height: 1024,
    alt: "Low sleeping pods lit from inside on a snowfield at blue hour.",
    focal: "50% 62%",
  },
  "ice-runway-flight": {
    id: "ice-runway-flight",
    src: "/media/ice-runway-flight.webp",
    width: 1536,
    height: 1024,
    alt: "An aircraft wing aligned with a snow plateau and a dark escarpment.",
    focal: "50% 50%",
  },
  "blue-ice-cave": {
    id: "blue-ice-cave",
    src: "/media/blue-ice-cave.webp",
    width: 1024,
    height: 1536,
    alt: "A small figure framed by the layered arch of a translucent ice cave.",
    focal: "50% 45%",
  },
  "polar-camp-interior": {
    id: "polar-camp-interior",
    src: "/media/polar-camp-interior.webp",
    width: 1536,
    height: 1024,
    alt: "A warm lounge interior with a panoramic window onto a snowfield.",
    focal: "50% 45%",
  },
  "emperor-colony": {
    id: "emperor-colony",
    src: "/media/emperor-colony.webp",
    width: 1536,
    height: 1024,
    alt: "An adult emperor penguin and chick with a loose colony behind them.",
    focal: "42% 55%",
  },
  "polar-plateau": {
    id: "polar-plateau",
    src: "/media/polar-plateau.webp",
    width: 1731,
    height: 908,
    alt: "A lone traveller crossing sastrugi towards dark Antarctic mountains.",
    focal: "50% 58%",
  },
  "expedition-leaders": {
    id: "expedition-leaders",
    src: "/media/expedition-leaders.webp",
    width: 1024,
    height: 1536,
    alt: "Two field leaders in conversation beside a ski-equipped aircraft.",
    focal: "52% 40%",
  },
  // --- Authorized target media (client rebuild, 2026-08-31) ---------------
  "season-landscape": {
    id: "season-landscape",
    src: "/media/target/textIntroImage.webp",
    width: 2000,
    height: 1343,
    alt: "The Antarctic interior during the short polar summer season.",
    focal: "50% 50%",
  },
  "season-landscape-mobile": {
    id: "season-landscape-mobile",
    src: "/media/target/textIntroImageMobi.webp",
    width: 2000,
    height: 1343,
    alt: "The Antarctic interior during the short polar summer season.",
    focal: "50% 50%",
  },
  "trip-early-emperor-penguins": {
    id: "trip-early-emperor-penguins",
    src: "/media/target/trip-early-emperor-penguins.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "trip-south-pole-emperor-penguins": {
    id: "trip-south-pole-emperor-penguins",
    src: "/media/target/trip-south-pole-emperor-penguins.webp",
    width: 2000,
    height: 1250,
    alt: "",
    focal: "50% 50%",
  },
  "trip-south-pole-blue-rivers": {
    id: "trip-south-pole-blue-rivers",
    src: "/media/target/trip-south-pole-blue-rivers.webp",
    width: 2000,
    height: 1499,
    alt: "",
    focal: "50% 50%",
  },
  "trip-the-long-stay": {
    id: "trip-the-long-stay",
    src: "/media/target/trip-the-long-stay.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "trip-antarctica-in-a-day": {
    id: "trip-antarctica-in-a-day",
    src: "/media/target/trip-antarctica-in-a-day.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "camp-whichaway": {
    id: "camp-whichaway",
    src: "/media/target/camp-whichaway.webp",
    width: 2000,
    height: 1250,
    alt: "",
    focal: "50% 50%",
  },
  "camp-echo": {
    id: "camp-echo",
    src: "/media/target/camp-echo.webp",
    width: 2000,
    height: 1250,
    alt: "",
    focal: "50% 50%",
  },
  "camp-explorer": {
    id: "camp-explorer",
    src: "/media/target/camp-explorer.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "camps-final-background": {
    id: "camps-final-background",
    src: "/media/target/camps-gallery-1.webp",
    width: 2000,
    height: 1250,
    alt: "",
    focal: "50% 50%",
  },
  "camps-intro-primary": {
    id: "camps-intro-primary",
    src: "/media/target/camps-gallery-2.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "camps-intro-secondary": {
    id: "camps-intro-secondary",
    src: "/media/target/camps-gallery-3.webp",
    width: 2000,
    height: 1250,
    alt: "",
    focal: "50% 50%",
  },
  "quote-mark": {
    id: "quote-mark",
    src: "/media/target/camps-quote-mark.webp",
    width: 447,
    height: 223,
    alt: "",
    focal: "50% 50%",
  },
  "flight-path": {
    id: "flight-path",
    src: "/media/target/flight-path_large.webp",
    width: 2000,
    height: 2390,
    alt: "",
    focal: "50% 50%",
  },
  "route-film-poster": {
    id: "route-film-poster",
    src: "/media/target/routeWidgetWatchFilmImage.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "watch-film-preview": {
    id: "watch-film-preview",
    src: "/media/target/watch-film-preview.webp",
    width: 2000,
    height: 2500,
    alt: "",
    focal: "50% 50%",
  },
  "planning-banner": {
    id: "planning-banner",
    src: "/media/target/outroBannerMedia.webp",
    width: 2000,
    height: 1333,
    alt: "",
    focal: "50% 50%",
  },
  "hero-poster": {
    id: "hero-poster",
    src: "/media/target/hero-poster.webp",
    width: 1920,
    height: 1080,
    alt: "",
    focal: "50% 50%",
  },
  "mist-plate": {
    id: "mist-plate",
    src: "/media/target/cloud-gradient.webp",
    width: 1440,
    height: 900,
    alt: "",
    focal: "50% 100%",
  },
  "cloud-near": {
    id: "cloud-near",
    src: "/media/target/cloud-1-cropped.webp",
    width: 1440,
    height: 550,
    alt: "",
    focal: "50% 50%",
  },
  "cloud-far": {
    id: "cloud-far",
    src: "/media/target/cloud-2-full.webp",
    width: 1440,
    height: 900,
    alt: "",
    focal: "50% 50%",
  },
} as const satisfies Record<string, AssetRecord>;

export type AssetId = keyof typeof assets;

export function getAsset(id: AssetId): AssetRecord {
  return assets[id];
}

export interface VideoAssetRecord {
  readonly id: string;
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly durationSeconds: number;
}

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
    durationSeconds: 17.52,
  },
  "white-desert-film": {
    id: "white-desert-film",
    src: "/media/video/white-desert-film-web.mp4",
    width: 1280,
    height: 720,
    durationSeconds: 420.928,
  },
} as const satisfies Record<string, VideoAssetRecord>;

export type VideoAssetId = keyof typeof videoAssets;

export function getVideoAsset(id: VideoAssetId): VideoAssetRecord {
  return videoAssets[id];
}
