/**
 * ADELVA HOME (`/`) — A2r3「二つの視点 — 一本の線」.
 *
 * Every string on the page lives here. The user adopted the desktop motion
 * mock `home-r3-2026-10-02/A2r3-motion.mp4` and its phone translation
 * `home-r3-mobile-2026-10-02/A2r3-mobile-motion.mp4` (2026-10-02) and asked for
 * them to be built as they stand ("採用＝承認"). The wording itself is the
 * approved HOME and navigation copy; only the line breaks differ per regime.
 * Each block names where its wording comes from; nothing here is new copy.
 *
 * `Lines` holds one approved string cut into the lines of each prototype:
 * `desktop` for ≥ 1024 px (A2.html), `mobile` for < 1024 px (A2m.html).
 */

import { adelvaApproach } from "@/content/adelva-approach";
import { stages } from "@/content/adelva-approach-page";
import { audiences, challenges, serviceDomains } from "@/content/adelva-navigation";
import { homeTarget } from "@/content/home-target";

export interface Lines {
  readonly desktop: readonly string[];
  readonly mobile: readonly string[];
}

/** The shared ADELVA skip-link label (adelva-management-operations `ui.skip`). */
export const skipLabel = "本文へ移動";

/** home-target `lastContinent` (Our Purpose). */
export const purpose = {
  eyebrow: { en: homeTarget.lastContinent.label, ja: homeTarget.lastContinent.titleJa },
  /** 経営判断を、｜現場で動く｜仕組みと成果へ。 — the two key words are underlined. */
  statement: "経営判断を、現場で動く仕組みと成果へ。",
  statementLines: {
    desktop: ["経営判断を、", "現場で動く仕組みと成果へ。"],
    mobile: ["経営判断を、", "現場で動く", "仕組みと成果へ。"],
  } satisfies Lines,
  marked: ["経営判断", "現場"],
  body: ["ホテル・旅館の経営と現場をつなぎ、", "実行・検証・引継ぎまで支援します。"],
} as const;

/** home-target `ourSeason` + navigation `audiences`. */
export const who = {
  eyebrow: { en: "Who We Support", ja: homeTarget.ourSeason.label },
  owner: ["ホテル・旅館の", "経営を担う方へ。"],
  field: ["日々の現場を", "動かす方へ。"],
  intro: [
    "それぞれの立場から見える課題を整理し、",
    "経営と現場で共有できる改善計画につなげます。",
  ],
  cards: [
    {
      number: "01",
      viewpoint: "経営の視点",
      title: ["オーナー・", "経営者の方へ"],
      body: ["経営判断、収益、投資、開業・再建、", "運営体制から支援を探す"],
      href: audiences[0]!.href,
    },
    {
      number: "02",
      viewpoint: "現場の視点",
      title: ["総支配人・", "現場責任者の方へ"],
      body: ["現場品質、人材、生産性、販売、", "システム定着から支援を探す"],
      href: audiences[1]!.href,
    },
  ],
} as const;

/** home-target `ourTrips` + navigation `challenges`; the phone breaks each title in two. */
const challengeBreaks: readonly (readonly [string, string])[] = [
  ["経営・収益を", "改善したい"],
  ["開業・運営体制を", "整えたい"],
  ["現場品質・人材を", "改善したい"],
  ["集客・ブランドを", "強くしたい"],
  ["DX・IT・調達を", "整えたい"],
];

export const yourChallenges = {
  eyebrow: { en: homeTarget.ourTrips.title, ja: homeTarget.ourTrips.titleJa },
  title: homeTarget.ourTrips.titleJa,
  cue: homeTarget.ourTrips.cardCta,
  items: challenges.map((item, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: challengeBreaks[index]!,
    description: item.description,
    href: item.href,
  })),
} as const;

/** home-target `founderQuote`. */
export const founder = {
  lead: ["経営の課題と、", "現場の課題は、", "つながっています。"],
  paragraphs: [
    "ADELVAは、経営・運営、収益・ブランド、DX・ITを一つの改善計画へ結び、判断を実行へ移します。",
    "分析や助言にとどまらず、責任分界とKPIを明確にし、実装、運用、検証、引継ぎまで。",
    "支援が終わった後も、お客様自身で改善を続けられる状態を、ともにつくります。",
  ],
  author: homeTarget.founderQuote.author,
  role: homeTarget.founderQuote.role,
  signatureLabel: `${homeTarget.founderQuote.author} の署名`,
} as const;

/** home-target `ourCamps` + navigation `serviceDomains`. */
export const expertise = {
  eyebrow: { en: homeTarget.ourCamps.title, ja: homeTarget.ourCamps.titleJa },
  plan: ["経営と現場を、", "一つの改善計画へ。"],
  planBody: homeTarget.ourCamps.introBody,
  cue: homeTarget.ourCamps.cardCta,
  domains: serviceDomains.map((domain) => ({
    number: domain.number,
    label: domain.label,
    description: domain.description,
    href: domain.href,
  })),
} as const;

/** adelva-approach (lead, body, steps) + adelva-approach-page `stages` (tags). */
export const approach = {
  eyebrow: { en: adelvaApproach.title, ja: adelvaApproach.titleJa },
  /** The six step names inside the lead, with the glue between them. */
  lead: [
    { step: 0, glue: "から、" },
    { step: 1, glue: "、" },
    { step: 2, glue: "、" },
    { step: 3, glue: "、" },
    { step: 4, glue: "、" },
    { step: 5, glue: "まで。" },
  ],
  /** Break after these step indices: desktop after 実行・実装、 ; phone after 判断、 and 運用、 */
  leadBreaks: { desktop: [2], mobile: [1, 3] },
  steps: stages.items.map((stage) => ({
    number: stage.number,
    name: stage.name,
    tags: stage.tags,
  })),
  body: adelvaApproach.body,
  bodyLines: {
    desktop: [
      "分析や助言で終わらず、責任分界とKPIを明確にし、",
      "支援終了後もお客様自身が継続して",
      "改善できる状態をつくります。",
    ],
    mobile: [
      "分析や助言で終わらず、",
      "責任分界とKPIを明確にし、",
      "支援終了後もお客様自身が",
      "継続して改善できる状態を",
      "つくります。",
    ],
  } satisfies Lines,
  cue: "支援の進め方を見る",
  href: "/approach",
} as const;
