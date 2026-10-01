/**
 * /challenges/owner copy and geometry — docs/specs/adelva-owner-spec.md.
 *
 * Copy: every string is listed in spec §5 with its approval status; the approved
 * wording is the previous owner page's (src/components/audience, removed) plus
 * the contact line from references/adelva/sources/home-copy.md §7.
 *
 * Line breaks: "\n" breaks in every layout, "<d>" only at ≥ 1024 px (desktop
 * composition), "<m>" only below it (the 390 px composition, also scaled up to
 * tablets). Geometry is in mock px: desktop 1440 wide, mobile 390 wide.
 */

export const ui = {
  skip: "本文へ移動",
  crumbsLabel: "パンくず",
  indexLabel: "このページの章",
} as const;

export const hero = {
  crumbs: [
    { label: "HOME", href: "/" },
    { label: "課題から探す", href: "/challenges" },
  ],
  eyebrow: "オーナー・経営者の方へ",
  title: ["経営判断を、", "実行可能な", "改善計画へ。"],
  lead: "ホテル・旅館の経営と現場を、<m>一つの改善計画につなぐ。",
  action: { label: "問い合わせを送信", href: "/contact" },
  scroll: { label: "SCROLL", name: "経営局面を見る" },
} as const;

export const chapters = [
  { id: "owner-01", number: "01", label: "経営局面" },
  { id: "owner-02", number: "02", label: "判断の整理" },
  { id: "owner-03", number: "03", label: "支援の組み合わせ" },
  { id: "owner-04", number: "04", label: "責任分界" },
  { id: "owner-05", number: "05", label: "実行から引継ぎまで" },
  { id: "owner-06", number: "06", label: "検証・引継ぎ" },
] as const;

export type PhaseId = "management" | "opening" | "gm" | "investment";

/**
 * The four phases of 01. `point` is the matching point of judgement in 02 (its
 * index on the scale), and the phase's own index is its row of 03.
 */
export const phases: readonly {
  readonly id: PhaseId;
  readonly title: string;
  readonly text: string;
  readonly point: 0 | 1 | 2 | 3;
}[] = [
  {
    id: "management",
    title: "経営・収益",
    text: "原因と優先順位を<d>整理する",
    point: 0,
  },
  { id: "opening", title: "開業・再建", text: "運営体制を<d>整える", point: 1 },
  { id: "gm", title: "GM不在", text: "GM機能と権限を<d>整理する", point: 3 },
  {
    id: "investment",
    title: "投資判断",
    text: "投資対象と実行条件を\n見極める",
    point: 2,
  },
];

export const phasesCopy = {
  title: "いま、どの<m>経営局面に\nありますか。",
} as const;

export const decision = {
  title: "最初に、\n決めること。",
  body: "支援内容を選ぶ前に、<m>判断の論点を整理します。",
  listLabel: "判断の論点",
  points: ["原因・優先順位", "運営モデル", "投資対象", "実行責任者"],
} as const;

export const support = {
  title: "判断に応じて、\n支援を<m>組み合わせる。",
  heads: ["経営局面", "支援の組み合わせ", "整理すること"],
  /** One row per phase, in the order of `phases`. */
  rows: [
    ["経営診断 × 収益改善", "原因と優先順位"],
    ["開業支援 × 運営体制", "運営モデル"],
    ["GM機能 × 現場運営", "権限と実行体制"],
    ["経営判断 × DX・IT", "投資対象と実行条件"],
  ],
  cardsLabel: "経営局面ごとの支援の組み合わせ",
  note: "必要な範囲に応じて、<m>単独の支援も選択できます。\n診断と実行、GM機能と全面運営、<m>導入支援と開発を区別します。",
} as const;

export type Side = "top" | "right" | "bottom" | "left";

export const roles = {
  title: "誰が決め、<m>誰が実行し、\n何を残すか。",
  listLabel: "炉を囲む4者",
  /** Clockwise from the far side of the hearth; ADELVA sits on the near side. */
  items: [
    { id: "owner", name: "オーナー・経営者", side: "top" },
    { id: "gm", name: "GM・現場", side: "right" },
    { id: "adelva", name: "ADELVA", side: "bottom" },
    { id: "external", name: "外部関係者", side: "left" },
  ] as const satisfies readonly { id: string; name: string; side: Side }[],
  agreement: "意思決定・権限・<m>担当範囲・成果物を<m>合意する",
  note: "権限・担当範囲・条件は、<m>個別の契約で確認します。",
  cross: { label: "総支配人・現場責任者の方へ", href: "/challenges/general-managers" },
} as const;

export const execution = {
  title: "経営指標を、\n現場の行動へ。",
  stepsLabel: "支援の工程",
  steps: ["課題把握", "判断", "実行・実装", "運用", "検証", "引継ぎ"],
} as const;

export const verification = {
  title: "確認し、\n引き継げる<m>状態へ。",
  body: "支援終了後も、継続して<m>改善できる状態をつくります。",
  items: ["担当範囲", "成果物", "意思決定記録", "検証・引継ぎ方法"],
} as const;

export const contact = {
  title: "課題が整理できていなくても、\nお問い合わせいただけます。",
  action: { label: "問い合わせを送信", href: "/contact" },
} as const;

/**
 * Mock geometry (spec §6). `tops` are the scene tops (hero, 01–06, contact),
 * `height` the photograph's height on the page.
 */
export const geometry = {
  desktop: {
    width: 1440,
    height: 10266,
    tops: [0, 1010, 2060, 4060, 5830, 6880, 7820, 9330],
    plate: { width: 1536, height: 10950, tiles: 10, small: 1024 },
    dawn: { width: 1536, height: 1024, small: 1024 },
    /** The charcoal bed (page px) and the kettle's spout. */
    ember: [440, 5280, 1000, 5680],
    spout: [880, 5080],
    /** Centres of the four points of judgement on the scale, from the scale's top (2500). */
    points: [60, 260, 460, 660],
    /** Soft darkness behind the text: [left, top, width, height] in page px. */
    pools: [
      [20, 286, 860, 760],
      [40, 950, 720, 320],
      [40, 2000, 700, 380],
      [220, 2440, 620, 860],
      [20, 3980, 780, 960],
      [20, 5770, 800, 920],
      [20, 6820, 760, 340],
      [20, 7120, 1400, 260],
      [0, 7720, 1180, 700],
      [640, 8070, 640, 300],
      [20, 9250, 820, 420],
    ],
  },
  mobile: {
    width: 390,
    height: 8104,
    tops: [0, 760, 1470, 2440, 3380, 5970, 6470, 6880],
    plate: { width: 853, height: 17724, tiles: 9, small: 600 },
    dawn: { width: 853, height: 1844, small: 600 },
    ember: [176, 4350, 390, 4650],
    spout: [186, 4238],
    points: [60, 190, 320, 450],
    pools: [
      [-40, 136, 390, 580],
      [-40, 720, 400, 640],
      [-40, 1430, 400, 300],
      [0, 1770, 360, 620],
      [-40, 2400, 420, 960],
      [-30, 3050, 340, 200],
      [-40, 3340, 420, 520],
      [-40, 4850, 380, 330],
      [-40, 5930, 420, 700],
      [-40, 6100, 360, 360],
      [-30, 6140, 230, 260],
      [-40, 6410, 470, 640],
      [-50, 6700, 420, 250],
      [-40, 6830, 420, 300],
    ],
  },
} as const;

/** Rows of plate tile n; every tile but the last overlaps the next by 4 rows (prepare-owner-assets.mjs). */
export function tileRows(height: number, tiles: number, n: number): [number, number] {
  const step = Math.floor(height / tiles);
  const top = n * step;
  const end = n === tiles - 1 ? height : top + step + 4;
  return [top, end - top];
}

/** Copy as one plain string (line-break markers removed), for accessible names and tests. */
export const plain = (text: string) => text.replace(/\n|<d>|<m>/g, "");

/** URL hash of a phase (`#phase-gm`) and back. */
export const phaseHash = (id: PhaseId) => `#phase-${id}`;
export const phaseFromHash = (hash: string): PhaseId | null => {
  const id = hash.replace(/^#phase-/, "");
  return phases.some((p) => p.id === id) && hash.startsWith("#phase-")
    ? (id as PhaseId)
    : null;
};
