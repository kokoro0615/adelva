/**
 * /challenges/general-managers copy and geometry — docs/specs/adelva-general-managers-spec.md.
 *
 * Copy: every string is listed in spec §5 with its approval status; the approved
 * wording comes from the previous GM page and the contact page.
 *
 * Line breaks: "\n" breaks in every layout, "<d>" only at ≥ 1024 px (desktop
 * composition), "<m>" only below it (the 390 px composition, also scaled up to
 * tablets). Geometry is in mock px: desktop 1440 wide, mobile 390 wide.
 */

export const meta = {
  title: "総支配人・現場責任者の方へ — ADELVA",
  description:
    "現場の課題を、続けられる改善へ。現場運営・人材・販売・ITを、一つの改善計画につなぎます。",
} as const;

export const hero = {
  crumbs: [
    { label: "HOME", href: "/" },
    { label: "課題から探す", href: "/challenges" },
  ],
  eyebrow: "総支配人・現場責任者の方へ",
  eyebrowEn: "GENERAL MANAGERS",
  title: ["現場の課題を、", "続けられる改善へ。"],
  lead: "ADELVAは、ホテル・旅館の<m>経営実装パートナー。\n現場運営・人材・販売・ITを、<m>一つの改善計画につなぎます。",
  action: { label: "問い合わせを送信", href: "/contact" },
} as const;

export const chapters = [
  { id: "gm-01", number: "01", label: "現場課題" },
  { id: "gm-02", number: "02", label: "判断" },
  { id: "gm-03", number: "03", label: "支援と成果物" },
  { id: "gm-04", number: "04", label: "役割" },
  { id: "gm-05", number: "05", label: "実行から引継ぎまで" },
  { id: "gm-06", number: "06", label: "確認する内容" },
  { id: "gm-07", number: "07", label: "お問い合わせ" },
] as const;

export type IssueId = "quality" | "people" | "productivity" | "sales" | "system";

export const challengesCopy = {
  title: "いま、現場のどこで\nつまずいていますか。",
  body: "宿泊・料飲・清掃から、採用、販売、ITまで。\n目に見える困りごとを起点に、<m>部門をまたぐ<d>原因と改善の優先順位を<m>整理します。",
  helper: "選んだ課題に関係する支援を、03で示します。",
  legend: "いま、つまずいている課題（複数選択可）",
} as const;

/** `support` is the row of 03 that answers the issue (the previous page's mapping). */
export const issues: readonly {
  readonly id: IssueId;
  readonly title: string;
  readonly description: string;
  readonly support: 0 | 1 | 2;
}[] = [
  {
    id: "quality",
    title: "品質",
    description: "サービスや清掃の品質にばらつきがある",
    support: 0,
  },
  {
    id: "people",
    title: "人材",
    description: "採用と入社後の教育がつながっていない",
    support: 0,
  },
  {
    id: "productivity",
    title: "生産性",
    description: "人員配置や部門間の連携を見直したい",
    support: 0,
  },
  {
    id: "sales",
    title: "販売",
    description: "Web・OTA・営業が宿泊収益につながらない",
    support: 1,
  },
  {
    id: "system",
    title: "システム定着",
    description: "導入したシステムを現場で使い切れていない",
    support: 1,
  },
];

export type PointId = "cause" | "priority" | "authority";

export const decision = {
  title: "施策を選ぶ前に、\n原因と優先順位を。",
  body: "支援内容を選ぶ前に、<m>判断の論点を整理します。",
  groupLabel: "判断の論点",
  points: [
    {
      id: "cause",
      title: "現象と原因",
      text: "品質・工数・収益などの<m>基準値から現状を捉える",
    },
    {
      id: "priority",
      title: "優先順位と影響範囲",
      text: "部門間のつながりを確認し、<m>先に取り組む課題を決める",
    },
    {
      id: "authority",
      title: "現場判断と、<m>オーナー・本部判断",
      text: "現場で決められることと、<m>経営判断が必要なことを分ける",
    },
  ] as const satisfies readonly { id: PointId; title: string; text: string }[],
  /** Marks on the photograph. */
  cause: "原因",
  symptom: "現象",
  field: "現場判断",
  management: "オーナー・本部判断",
} as const;

export const support = {
  title: "必要な支援を、\nひとつの改善計画に。",
  body: "一部門の改善から、販売・ITを含む<m>運用の再設計まで。<d>課題の原因と<m>判断の範囲に応じて、支援を組み合わせます。",
  heads: ["改善の判断", "支援の組み合わせ例", "現場に残すものの例"],
  rows: [
    {
      judge: "一部門の品質・生産性を整える",
      combo: "宿泊部門運営支援／レストラン運営改善\n客室清掃改善／必要に応じて採用支援",
      keep: "標準業務手順（SOP）\n教育・検品の仕組み",
      glyph: "one",
    },
    {
      judge: "販売・業務・ITをつなぎ直す",
      combo: "Web集客・チャネル収益／宿泊営業支援\nDX・システム導入",
      keep: "管理指標（KPI）\n部門間会議・運用設計",
      glyph: "three",
    },
    {
      judge: "経営判断が必要な課題を進める",
      combo: "経営診断・コンサル／\n経営改善・実行支援",
      keep: "優先順位・改善計画\n判断権限・実行範囲",
      glyph: "rise",
    },
  ] as const satisfies readonly {
    judge: string;
    combo: string;
    keep: string;
    glyph: "one" | "three" | "rise";
  }[],
  relatedSuffix: "に関係",
  note: "組み合わせと成果物は課題に応じて設計。<m>改善支援・実運営・保守の範囲は、個別に合意します。",
} as const;

export const roles = {
  title: "任せる範囲を、\n曖昧にしない。",
  body: "経営判断と現場の実行をつなぐために。\n関係者の役割と、引継ぎ先を整理します。",
  listLabel: "役割分担を整理する際の観点",
  items: [
    { id: "owner", name: "オーナー・本部", text: "経営・投資の<d>判断と承認" },
    { id: "gm", name: "GM・部門責任者", text: "現場判断と<d>部門間の調整" },
    { id: "adelva", name: "ADELVA", text: "改善計画の推進\n実行・実装支援" },
    { id: "external", name: "外部関係者", text: "契約に応じた\n専門領域の実施" },
  ],
  agreement:
    "判断権限・指揮命令・実行範囲・引継ぎ先を、\nお客様・ADELVA・外部関係者で<m>個別に合意します。",
  crossNote: "経営・運営体制の検討から始めたい方へ",
  cross: { label: "オーナー・経営者の方へ", href: "/challenges/owner" },
} as const;

export const execution = {
  title: "実行から、<m>現場での運用へ。\n検証し、引き継ぐところまで。",
  body: "宿泊・料飲・清掃、販売、ITの担当をつなぎ、\n支援終了後も、お客様自身が<m>改善を続けられる状態を目指します。",
  stepsLabel: "支援の工程",
  steps: ["課題把握", "判断", "実行・実装", "運用", "検証", "引継ぎ"],
  approach: { label: "支援の進め方を見る", href: "/approach" },
} as const;

export const verification = {
  title: "改善の過程を、\n確認できる形に。",
  items: [
    { title: "担当範囲", text: "誰が、どこまで\n担うか" },
    { title: "成果物", text: "現場で使う手順・\n管理指標は何か" },
    { title: "意思決定記録", text: "何を根拠に、\n何を決めたか" },
    { title: "検証・引継ぎ方法", text: "何で確かめ、\n誰へ引き継ぐか" },
  ],
} as const;

export const contact = {
  title: "課題が整理できていなくても、\nお問い合わせいただけます。",
  carryLabel: "課題",
  action: { label: "問い合わせを送信", href: "/contact" },
  flowLabel: "送信後の流れ",
  flow: ["問い合わせを送信", "内容の確認", "担当者からのご連絡", "課題把握"],
} as const;

export const ui = {
  gaugeLabel: "このページの章",
  gaugeOpen: (current?: string) =>
    current ? `章の一覧を開く（現在：${current}）` : "章の一覧を開く",
  close: "閉じる",
  trayGo: "関係する支援",
  trayCount: (n: number) => (n ? `${n}件を選択中` : "課題を選択していません"),
  skip: "本文へ移動",
  crumbsLabel: "パンくず",
} as const;

type Point = readonly [number, number];
type Crop = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Photo anchors, measured on the mocks' own HTML (spec §6). Lit overlays are the
 * crops written by scripts/adelva/prepare-general-managers-assets.mjs, in plate px.
 */
export const geometry = {
  desktop: {
    width: 1440,
    height: 7560,
    plate: { width: 1536, height: 8064, tiles: 8, small: 1024 },
    /** Lit overlays, plate px (`{d}-lit-{id}` crops). */
    lit: {
      quality: { left: 592, top: 780, width: 944, height: 264 },
      people: { left: 438, top: 964, width: 1098, height: 264 },
      productivity: { left: 524, top: 1214, width: 1012, height: 198 },
      sales: { left: 366, top: 1390, width: 1170, height: 262 },
      system: { left: 654, top: 1566, width: 882, height: 226 },
    } satisfies Record<IssueId, Crop>,
    /** Section tops; the hero's content starts at 150. */
    tops: [0, 772, 2196, 2842, 3950, 4578, 5596, 6214],
    heroTop: 150,
    rings: [
      [731, 838],
      [858, 997],
      [679, 1181],
      [930, 1373],
      [814, 1547],
    ] as readonly Point[],
    cause: [930, 2297] as Point,
    symptom: [1003, 2599] as Point,
    roles: [
      [612, 3984],
      [790, 4082],
      [968, 4180],
      [1146, 4278],
    ] as readonly Point[],
    gates: [
      [830, 4474],
      [915, 4662],
      [985, 4788],
      [1030, 4893],
      [1125, 5044],
      [1200, 5182],
    ] as readonly Point[],
  },
  mobile: {
    width: 390,
    height: 7377,
    plate: { width: 853, height: 16136, tiles: 8, small: 600 },
    lit: {
      quality: { left: 0, top: 2170, width: 853, height: 402 },
      people: { left: 0, top: 2464, width: 853, height: 456 },
      productivity: { left: 0, top: 2900, width: 853, height: 328 },
      sales: { left: 302, top: 3220, width: 551, height: 294 },
      system: { left: 0, top: 3494, width: 853, height: 432 },
    } satisfies Record<IssueId, Crop>,
    tops: [0, 652, 1846, 2700, 3790, 4880, 5946, 6400],
    heroTop: 92,
    /** Row tops of the five terraces (full-width rows, 88 tall). */
    rows: [1006, 1160, 1340, 1486, 1634],
    cause: [283, 2044] as Point,
    symptom: [176, 2170] as Point,
    /** 02: the radio group sits below the photo marks. */
    points: 2330,
    /** 05: the link sits below the gates. */
    approach: 5842,
    gates: [
      [147, 5374],
      [182, 5455],
      [214, 5540],
      [240, 5629],
      [269, 5722],
      [286, 5776],
    ] as readonly Point[],
    gaugeTop: 250,
  },
} as const;
