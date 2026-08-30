/**
 * Production media registry.
 *
 * Every entry maps one-to-one onto an `Approved original` row in
 * `docs/asset-provenance.md`. No target photograph, video, logo, icon or font
 * file may be added here, and nothing outside this registry may be rendered as
 * production imagery.
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
} as const satisfies Record<string, AssetRecord>;

export type AssetId = keyof typeof assets;

export function getAsset(id: AssetId): AssetRecord {
  return assets[id];
}
