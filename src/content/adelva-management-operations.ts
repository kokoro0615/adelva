/**
 * ADELVA service domain 01 — 経営・運営統括 (`/services/management-operations`).
 *
 * Every string on the page lives here. The page follows the B 台杉「降りてくる朝」
 * prototypes the user adopted on 2026-10-01; their wording is the approved copy
 * already in use (A2 adoption, 2026-09-24, and `home-copy.md`), plus two labels
 * the user approved on 2026-10-01. Each block records its source and status.
 * Nothing in this file is new copy.
 *
 * Photograph geometry lives in `adelva-management-operations-geometry.ts`; see
 * `docs/specs/adelva-management-operations-spec.md`.
 */

/** Approved with the A2 mocks (「採用＝承認」, 2026-09-24). */
export const copyStatus = "adopted-mock-2026-09-24" as const;
/** Approved by the user with the B-hq implementation (2026-10-01). */
export const labelStatus = "approved-2026-10-01" as const;
export type CopyStatus = typeof copyStatus | typeof labelStatus;

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
  | "adopted-mock A2"
  | "adopted-mock B-hq";

interface Sourced {
  readonly source: CopySource | readonly CopySource[];
  readonly status: CopyStatus;
}

const adopted = <T extends object>(source: Sourced["source"], value: T) =>
  ({ ...value, source, status: copyStatus }) as T & Sourced;

const approvedLabel = <T extends object>(source: Sourced["source"], value: T) =>
  ({ ...value, source, status: labelStatus }) as T & Sourced;

/** Line breaks of one approved string, per regime; each joins back to the string. */
export interface Lines {
  readonly desktop: readonly string[];
  readonly mobile: readonly string[];
}

export const route = "/services/management-operations" as const;

export const ui = {
  skip: "本文へ移動",
} as const;

export const breadcrumb = adopted("adopted-mock A2", {
  label: "パンくずリスト",
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
  /** Set in two lines on every viewport, as both prototypes do. */
  titleLines: ["経営・", "運営統括"],
  /* Visual label adopted with the mock; English letters, read as a label. */
  roman: "MANAGEMENT & OPERATIONS",
  lead: "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
  leadLines: {
    desktop: [
      "経営判断、開業、運営、人材、",
      "現場オペレーションを横断して支援します。",
    ],
    mobile: [
      "経営判断、開業、運営、人材、",
      "現場オペレーションを",
      "横断して支援します。",
    ],
  } satisfies Lines,
  cta: { label: "問い合わせを送信", href: "/contact" },
});

export const heroTitle = hero.titleLines.join("");

export interface Service {
  readonly number: string;
  readonly name: string;
  /**
   * The detail page, once one exists. Services render as plain text until
   * then: no arrow, no link and no focus stop (user decision, 2026-09-24).
   */
  readonly href?: string;
}

export interface Chapter extends Sourced {
  readonly id: string;
  readonly title: string;
  readonly services: readonly Service[];
}

export const chapters: readonly Chapter[] = [
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "management-improvement",
    title: "経営診断・改善",
    services: [
      { number: "01", name: "経営診断・コンサル" },
      { number: "02", name: "経営改善・実行支援" },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "opening-operations",
    title: "開業・運営体制",
    services: [
      { number: "03", name: "新規開業支援" },
      { number: "04", name: "週2〜3日型総支配人" },
      { number: "05", name: "ホテル全面運営受託" },
      { number: "11", name: "民泊立上げ・運営" },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "operations-improvement",
    title: "現場運営改善",
    services: [
      { number: "06", name: "宿泊部門運営支援" },
      { number: "07", name: "レストラン運営改善" },
      { number: "08", name: "朝食・レストラン実運営" },
      { number: "09", name: "客室清掃改善" },
    ],
  }),
  adopted(["content-taxonomy.md §4", "content-taxonomy.md §5.A"], {
    id: "people-recruitment",
    title: "人材・採用",
    services: [{ number: "10", name: "採用支援" }],
  }),
];

/** The index heading over the grove (B-full label, approved 2026-10-01). */
export const serviceIndex = approvedLabel("adopted-mock B-hq", {
  title: "4つの支援テーマ・11のサービス",
});

/**
 * The label under each knuckle of the platform: the theme's service numbers
 * and its title, both approved strings (a UI combination, not new copy).
 */
export const knuckleLabels = chapters.map((chapter) => ({
  numbers: chapter.services.map((service) => service.number).join("・"),
  title: chapter.title,
}));

export interface Boundary {
  readonly number: string;
  readonly name: string;
  readonly scope: string;
  /** Mobile line breaks of the scope, where the prototype sets them. */
  readonly scopeLines?: Lines;
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
          scopeLines: {
            desktop: ["担当・期限・KPI・成果物を伴う実行推進"],
            mobile: ["担当・期限・KPI・成果物を伴う", "実行推進"],
          },
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
    noteLines: {
      desktop: ["契約・許認可が関係する範囲は、個別に確認します。"],
      mobile: ["契約・許認可が関係する範囲は、", "個別に確認します。"],
    } satisfies Lines,
  },
);

export interface ProcessStep {
  readonly number: string;
  readonly name: string;
  readonly tags: readonly string[];
}

/* Shared: /services/revenue-brand and /services/dx-it-procurement import this
   block. Keep its shape and values. */
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
    link: { label: "支援の進め方を見る", href: "/approach" },
  },
);

/* The group label is approved navigation copy; showing it as a visible
   heading was approved on 2026-10-01. */
export const audienceLinks = approvedLabel("adelva-navigation.ts", {
  title: "対象者から探す",
  items: [
    { label: "オーナー・経営者の方へ", href: "/challenges/owners" },
    { label: "総支配人・現場責任者の方へ", href: "/challenges/general-managers" },
  ],
});

export const contact = adopted("home-copy.md §7", {
  title: "課題が整理できていなくても、お問い合わせいただけます。",
  titleLines: {
    desktop: ["課題が整理できていなくても、", "お問い合わせいただけます。"],
    mobile: ["課題が整理できて", "いなくても、", "お問い合わせ", "いただけます。"],
  } satisfies Lines,
  cta: { label: "問い合わせを送信", href: "/contact" },
});

/** Every string the page must render as DOM text (used by the e2e gate). */
export const requiredStrings: readonly string[] = [
  ...breadcrumb.items.map((item) => item.label),
  hero.index,
  hero.indexLabel,
  heroTitle,
  hero.roman,
  hero.lead,
  hero.cta.label,
  serviceIndex.title,
  ...chapters.flatMap((chapter) => [
    chapter.title,
    ...chapter.services.flatMap((service) => [service.number, service.name]),
  ]),
  boundaries.title,
  ...boundaries.pairs.flat().flatMap((item) => [item.number, item.name, item.scope]),
  boundaries.note,
  processCopy.title,
  processCopy.lead,
  processCopy.body,
  ...processCopy.steps.flatMap((step) => [step.number, step.name, ...step.tags]),
  processCopy.link.label,
  audienceLinks.title,
  ...audienceLinks.items.map((item) => item.label),
  contact.title,
  contact.cta.label,
];
