/**
 * HOME target model — `home-target-v1`.
 *
 * HOME has a bespoke composite topology (seven direct `page-content` children,
 * one of which nests a pinned horizontal camps flow). That does not fit the
 * generic `Section` union used by the other 27 routes, so it is modelled here
 * rather than forced through `PageDocument`.
 *
 * Evidence: `.Codex/docs/research/home-fidelity-gap-forensics.md`, mirrored into
 * the binding HOME block of `docs/specs/clone-implementation-spec.md`.
 *
 * Operating mode is authorized client rebuild; copy below is the client's own
 * approved production content (see `docs/asset-provenance.md`).
 */

import { challenges, serviceDomains } from "@/content/adelva-navigation";

import type { AssetId, VideoAssetId } from "@/content/assets";

export interface HomeTripCard {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly number: string;
  readonly excerpt: string;
  readonly assetId: AssetId;
}

export interface HomeCampPanel {
  readonly id: string;
  readonly title: string;
  readonly number: string;
  readonly body: string;
  readonly href: string;
  readonly assetId: AssetId;
}

export interface HomeRouteStat {
  readonly label: string;
  readonly value: string;
}

/** HOME shares ADELVA's authoritative navigation taxonomy. */
const challengeAssets: readonly AssetId[] = [
  "adelva-home-challenge-management",
  "adelva-home-challenge-opening",
  "adelva-home-challenge-people",
  "adelva-home-challenge-brand",
  "adelva-home-challenge-digital",
];
export const homeTrips: readonly HomeTripCard[] = challenges.map((item, index) => ({
  id: item.href.split("#")[1],
  title: item.label,
  href: item.href,
  number: String(index + 1).padStart(2, "0"),
  excerpt: item.description ?? "",
  assetId: challengeAssets[index],
}));
const domainAssets: readonly AssetId[] = [
  "adelva-home-expertise-management",
  "adelva-home-expertise-revenue",
  "adelva-home-expertise-digital",
];
export const homeCamps: readonly HomeCampPanel[] = serviceDomains.map(
  (item, index) => ({
    id: item.id,
    title: item.label,
    number: item.number,
    body: item.description ?? "",
    href: `/challenges#support-${item.id}`,
    assetId: domainAssets[index],
  }),
);

export const homeTarget = {
  hero: {
    title: "ADELVA",
    videoId: "hero-antarctica" as VideoAssetId,
    watchFilmLabel: "Watch Film",
    watchFilmPosterId: "watch-film-preview" as AssetId,
  },
  lastContinent: {
    label: "Our Purpose",
    titleJa: "私たちの役割",
    quote:
      "経営判断を、現場で動く仕組みと成果へ。ホテル・旅館の経営と現場をつなぎ、実行・検証・引継ぎまで支援します。",
  },
  ourSeason: {
    label: "支援対象",
    title: "Who We Support",
    body: [
      "ホテル・旅館の経営を担う方へ。日々の現場を動かす方へ。",
      "それぞれの立場から見える課題を整理し、",
      "経営と現場で共有できる改善計画につなげます。",
    ],
    assetId: "adelva-support-landscape" as AssetId,
  },
  ourTrips: {
    title: "Your Challenges",
    titleJa: "課題から探す",
    /** Measured target label on every card control; not "View trip". */
    cardCta: "支援内容を見る",
    cards: homeTrips,
  },
  founderQuote: {
    text: "経営の課題と、現場の課題は、つながっています。ADELVAは、経営・運営、収益・ブランド、DX・ITを一つの改善計画へ結び、判断を実行へ移します。分析や助言にとどまらず、責任分界とKPIを明確にし、実装、運用、検証、引継ぎまで。支援が終わった後も、お客様自身で改善を続けられる状態を、ともにつくります。",
    author: "kokoro nakagawa",
    role: "Co-Founder & CEO",
  },
  ourCamps: {
    title: "Our Expertise",
    titleJa: "3つの支援領域",
    introTitle: "経営と現場を、一つの改善計画へ。",
    introBody:
      "経営・運営統括、収益・ブランド成長、DX・IT・調達基盤。分断されがちな施策をつなぎ、課題把握から実行・実装、運用、検証、引継ぎまで支援します。",
    finalAssetId: "adelva-home-expertise-final" as AssetId,
    introPrimaryAssetId: "adelva-home-expertise-intro" as AssetId,
    introSecondaryAssetId: "adelva-home-expertise-reveal" as AssetId,
    cardCta: "支援内容を見る",
    panels: homeCamps,
    quote: {
      text: "課題把握から、判断、実行・実装、運用、検証、引継ぎまで。お客様自身が継続して改善できる状態をつくります。",
      author: "ADELVA",
      markAssetId: "quote-mark" as AssetId,
    },
  },
  cptWfr: {
    routeCode: "CPT – WFR",
    origin: "33º 58' 17\" S 18º 36' 13\" E\nCape Town",
    destination: "71° 31' S, 08° 48' E\nWolf’s Fang Runway",
    title: "From Strategy to Action",
    titleJa: "支援の進め方",
    body: "Soaring over an endless array of icebergs, you'll fly business class aboard an Airbus aircraft and land at our blue ice runway in 24-hours of continuous sunshine.",
    assetId: "flight-path" as AssetId,
    posterId: "route-film-poster" as AssetId,
    mapLabels: {
      origin: { eyebrow: "Starting point", name: "Cape Town, South Africa" },
      midOcean: "South\nAtlantic\nOcean",
      ocean: "Indian Ocean",
      destination: { eyebrow: "Wolf\u2019s Fang Runway", name: "Antarctica" },
    },
    watchFilmLabel: "Watch Film",
    stats: [
      { label: "Flying time", value: "05:30 hrs" },
      { label: "Distance", value: "4,220 km / 2,610 mi" },
      { label: "Average summer temp. on ice", value: "-5°C / 23° F" },
    ] as readonly HomeRouteStat[],
  },
  planningCta: {
    title: "Start with a conversation",
    titleJa: "お問い合わせ",
    label: "Get in touch",
    href: "/enquire",
    assetId: "planning-banner" as AssetId,
  },
} as const;
