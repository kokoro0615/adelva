/**
 * ADELVA service domain 01 — 経営・運営統括 (`/services/management-operations`).
 *
 * Every string on the page lives here. The user adopted the A2 desktop and
 * mobile mocks on 2026-09-24 and approved their wording as it stands
 * ("採用＝承認"), so each block records where the wording originally comes from
 * and the adoption status. Nothing in this file is new copy.
 *
 * Geometry is measured from the adopted mocks and from the text-free plates
 * generated from them; see `docs/specs/adelva-management-operations-spec.md`.
 * Desktop section-map values are CSS px at a 1440px-wide section ("u") unless a
 * name ends in `Px`, which means natural pixels of the photographic plate.
 */

export const copyStatus = "adopted-mock-2026-09-24" as const;
export type CopyStatus = typeof copyStatus;

export type CopySource =
  | "home-copy.md §4"
  | "home-copy.md §5"
  | "home-copy.md §7"
  | "content-taxonomy.md §5.A"
  | "content-taxonomy.md §4"
  | "content-taxonomy.md §6.1"
  | "information-architecture.md §8.2"
  | "information-architecture.md §8.3"
  | "information-architecture.md §9"
  | "adelva-navigation.ts"
  | "adopted-mock A2";

interface Sourced {
  readonly source: CopySource | readonly CopySource[];
  readonly status: CopyStatus;
}

const adopted = <T extends object>(source: Sourced["source"], value: T) =>
  ({ ...value, source, status: copyStatus }) as T & Sourced;

export const route = "/services/management-operations" as const;

export const meta = adopted("home-copy.md §4", {
  title: "経営・運営統括 — ADELVA",
  description: "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
});

export const breadcrumb = adopted("adopted-mock A2", {
  items: [
    { label: "HOME", href: "/" },
    /* `/services` is not implemented in this repository, so the label is
       rendered as text rather than a link that cannot resolve. */
    { label: "支援内容", href: null },
    { label: "経営・運営統括", href: null, current: true },
  ],
});

export const hero = adopted(["home-copy.md §4", "adopted-mock A2"], {
  index: "01",
  indexLabel: "支援領域",
  title: "経営・運営統括",
  /* Visual label adopted with the mock; English letters, read as a label. */
  roman: "MANAGEMENT & OPERATIONS",
  /* Desktop breaks after 「人材、」. */
  lead: ["経営判断、開業、運営、人材、", "現場オペレーションを横断して支援します。"],
  cta: { label: "問い合わせを送信", href: "/contact" },
});

export type FloorId = "meeting" | "office" | "lobby" | "restaurant" | "guest" | "staff";

export interface Service {
  readonly number: string;
  readonly name: string;
  /**
   * The detail page, once one exists. Rows render as plain text until then:
   * no arrow, no link and no focus stop (user decision, 2026-09-24).
   */
  readonly href?: string;
  /** Desktop row: top of the glyphs, in u. */
  readonly top: number;
  /** Where the leader line ends, in plate px; `bracket` joins the full-height bracket. */
  readonly target: { readonly x: number; readonly y: number } | "bracket";
}

export interface Chapter extends Sourced {
  readonly id: string;
  readonly title: string;
  /** Desktop chapter heading: top of the glyphs, in u. */
  readonly top: number;
  readonly services: readonly Service[];
  /** Floors lit while this chapter is current; the rest drop to ~40%. */
  readonly floors: readonly FloorId[];
  /** Mobile photograph for the chapter, if it has one of its own. */
  readonly photo?: "meeting" | "building-thumb" | "rooms" | "staff";
}

export const chapters: readonly Chapter[] = [
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "management-improvement",
    title: "経営診断・改善",
    top: 737,
    floors: ["meeting", "office"] as const,
    photo: "meeting" as const,
    services: [
      {
        number: "01",
        name: "経営診断・コンサル",
        top: 810,
        target: { x: 912, y: 654 },
      },
      {
        number: "02",
        name: "経営改善・実行支援",
        top: 866,
        target: { x: 866, y: 698 },
      },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "opening-operations",
    title: "開業・運営体制",
    top: 991,
    floors: ["meeting", "office", "lobby", "restaurant", "guest", "staff"] as const,
    photo: "building-thumb" as const,
    services: [
      { number: "03", name: "新規開業支援", top: 1066, target: "bracket" as const },
      {
        number: "04",
        name: "週2〜3日型総支配人",
        top: 1122,
        target: "bracket" as const,
      },
      {
        number: "05",
        name: "ホテル全面運営受託",
        top: 1177,
        target: "bracket" as const,
      },
      { number: "11", name: "民泊立上げ・運営", top: 1233, target: "bracket" as const },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "operations-improvement",
    title: "現場運営改善",
    top: 1350,
    floors: ["lobby", "restaurant", "guest"] as const,
    photo: "rooms" as const,
    services: [
      {
        number: "06",
        name: "宿泊部門運営支援",
        top: 1424,
        target: { x: 975, y: 1266 },
      },
      {
        number: "07",
        name: "レストラン運営改善",
        top: 1509,
        target: { x: 848, y: 1548 },
      },
      {
        number: "08",
        name: "朝食・レストラン実運営",
        top: 1567,
        target: { x: 965, y: 1589 },
      },
      { number: "09", name: "客室清掃改善", top: 1693, target: { x: 938, y: 1776 } },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "people-recruitment",
    title: "人材・採用",
    top: 1828,
    floors: ["staff"] as const,
    photo: "staff" as const,
    services: [
      { number: "10", name: "採用支援", top: 1907, target: { x: 965, y: 2048 } },
    ],
  }),
];

/** Mobile chapter index: in-page anchors with the chapter's service numbers. */
export const chapterIndex = adopted("adopted-mock A2", {
  label: "章索引",
  items: chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    numbers: chapter.services.map((service) => service.number).join("・"),
  })),
});

/** Carousel rooms for 現場運営改善 and the rows each one emphasises. */
export const rooms = adopted("adopted-mock A2", {
  label: "部屋の写真",
  previous: "前の部屋",
  next: "次の部屋",
  items: [
    { id: "lobby", name: "ロビー", services: ["06"] },
    { id: "restaurant", name: "レストラン", services: ["07", "08"] },
    { id: "guest", name: "客室", services: ["09"] },
  ],
});

export interface Boundary {
  readonly number: string;
  readonly name: string;
  readonly scope: string;
}

export const boundaries = adopted(
  ["content-taxonomy.md §6.1", "information-architecture.md §9"],
  {
    title: "サービスの違い",
    pairs: [
      [
        {
          number: "01",
          name: "経営診断・コンサル",
          scope: "現状把握・原因・優先順位・方針",
        },
        {
          number: "02",
          name: "経営改善・実行支援",
          scope: "担当・期限・KPI・成果物を伴う実行推進",
        },
      ],
      [
        { number: "04", name: "週2〜3日型総支配人", scope: "GM機能の個別設計" },
        { number: "05", name: "ホテル全面運営受託", scope: "施設運営全体の包括支援" },
      ],
      [
        { number: "07", name: "レストラン運営改善", scope: "改善" },
        { number: "08", name: "朝食・レストラン実運営", scope: "実運営を含む個別設計" },
      ],
    ] as const satisfies ReadonlyArray<readonly [Boundary, Boundary]>,
    note: "契約・許認可が関係する範囲は、個別に確認します。",
  },
);

export interface ProcessStep {
  readonly number: string;
  readonly name: string;
  readonly tags: readonly string[];
}

export const processCopy = adopted(
  [
    "home-copy.md §5",
    "information-architecture.md §8.2",
    "information-architecture.md §8.3",
    "information-architecture.md §9",
  ],
  {
    title: "支援の進め方",
    lead: "課題把握から、判断、実行・実装、運用、検証、引継ぎまで。",
    body: "分析や助言で終わらず、責任分界とKPIを明確にし、支援終了後もお客様自身が継続して改善できる状態をつくります。",
    /* Line breaks as set in the adopted mocks; each joins back to the string above. */
    leadLines: {
      desktop: ["課題把握から、判断、実行・実装、", "運用、検証、引継ぎまで。"],
      mobile: ["課題把握から、判断、", "実行・実装、運用、", "検証、引継ぎまで。"],
    },
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
    },
    stepsLabel: "支援の工程",
    steps: [
      { number: "01", name: "課題把握", tags: ["現象と原因", "優先順位", "影響範囲"] },
      { number: "02", name: "判断", tags: ["判断論点", "責任分界"] },
      { number: "03", name: "実行・実装", tags: ["担当", "期限", "KPI", "成果物"] },
      { number: "04", name: "運用", tags: ["SOP", "会議", "教育"] },
      { number: "05", name: "検証", tags: ["KPI・成果検証"] },
      { number: "06", name: "引継ぎ", tags: ["継続して改善できる状態"] },
    ] satisfies readonly ProcessStep[],
    /* Same destination as the audience pages; `/approach` is not yet
       implemented in this repository (recorded in the report). */
    link: { label: "支援の進め方を見る", href: "/approach" },
  },
);

export const audienceLinks = adopted("adelva-navigation.ts", {
  /* Visually hidden heading; the approved group label, not new copy. */
  title: "対象者から探す",
  items: [
    { label: "オーナー・経営者の方へ", href: "/challenges/owners" },
    { label: "総支配人・現場責任者の方へ", href: "/challenges/general-managers" },
  ],
});

/** Every string the page must render as DOM text (used by the e2e gate). */
export const requiredStrings: readonly string[] = [
  ...breadcrumb.items.map((item) => item.label),
  hero.index,
  hero.indexLabel,
  hero.title,
  hero.roman,
  ...hero.lead,
  hero.cta.label,
  ...chapters.flatMap((chapter) => [
    chapter.title,
    ...chapter.services.flatMap((service) => [service.number, service.name]),
  ]),
  boundaries.title,
  ...boundaries.pairs.flat().flatMap((item) => [item.number, item.name, item.scope]),
  boundaries.note,
  processCopy.lead,
  processCopy.body,
  ...processCopy.steps.flatMap((step) => [step.number, step.name, ...step.tags]),
  processCopy.link.label,
  ...audienceLinks.items.map((item) => item.label),
];

/* ------------------------------------------------------------------ geometry */

/** Desktop hero + section map plate (three joined 1536×1024 edits). */
export const buildingPlate = {
  src: "/media/adelva/management-operations/building.webp",
  srcSmall: "/media/adelva/management-operations/building-1024.webp",
  widthPx: 1536,
  heightPx: 2304,
  /** Floor openings, plate px: [top, bottom]; x spans the glazed facade. */
  facadePx: { left: 772, right: 1446 },
  floorsPx: {
    meeting: [486, 742],
    office: [782, 1016],
    lobby: [1056, 1310],
    restaurant: [1352, 1611],
    guest: [1656, 1871],
    staff: [1916, 2119],
  } satisfies Record<FloorId, readonly [number, number]>,
  /** Full-height bracket for 開業・運営体制, plate px. */
  bracketPx: { x: 726, top: 486, bottom: 2130, tick: 30 },
  /** Where each leader line leaves the horizontal and turns to its room. */
  kinkPx: 620,
} as const;

/** Desktop process stage: natural pixels of the 1536×1024 keyframes. */
export const processStage = {
  base: "/media/adelva/management-operations/process-base.webp",
  lit: "/media/adelva/management-operations/process-lit.webp",
  cabin: "/media/adelva/management-operations/cabin.webp",
  widthPx: 1536,
  heightPx: 1024,
  /** The delivered plates carry this much repeated wall around the frame. */
  extendPx: { top: 262, side: 256 },
  landingsPx: [78, 212, 353, 506, 668, 812],
  lineFromPx: 668,
  lineToPx: 1010,
  shaftPx: { left: 668, right: 962 },
  doorPx: { left: 700, right: 930, top: 700, bottom: 966 },
  cabinPx: { x: 819, offset: -8, size: 235 },
} as const;

/** Mobile process plate: natural pixels of the 853px-wide joined edit. */
export const mobileProcessStage = {
  base: "/media/adelva/management-operations/m-process-base.webp",
  lit: "/media/adelva/management-operations/m-process-lit-shaft.webp",
  widthPx: 853,
  heightPx: 3348,
  landingsPx: [897, 1208, 1523, 1891, 2129, 2393],
  lineFromPx: 60,
  lineToPx: 423,
  shaftPx: { left: 64, right: 436, top: 716, bottom: 2680 },
  hallPx: { top: 2680, bottom: 3348 },
  cabinPx: { x: 251, size: 343 },
} as const;
