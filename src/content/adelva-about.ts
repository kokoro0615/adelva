/**
 * /about — A2 "INK TO LIFE" content and geometry.
 *
 * Copy sources: references/adelva/mockups/about-2026-09-29/README.md §6. The four
 * body paragraphs are the approved /about prose (docs/specs/adelva-about-brand-spec.md,
 * 2026-09-09 grounding correction) split across chapters without changing a word.
 * Geometry: measured from the adopted mocks' own typesetting (spec §5); page units
 * are CSS px at 1440 (desktop) and 390 (mobile).
 */
import { audiences as navAudiences, serviceDomains } from "@/content/adelva-navigation";

export const route = "/about";

/** A string with its line breaks for each composition (breaks are indices into `text`). */
export interface Broken {
  readonly text: string;
  readonly desktop: readonly number[];
  readonly mobile: readonly number[];
}
function broken(
  parts: readonly string[],
  desktopAfter: readonly number[],
  mobileAfter: readonly number[],
): Broken {
  const text = parts.join("");
  const at = (i: number) => parts.slice(0, i + 1).join("").length;
  return { text, desktop: desktopAfter.map(at), mobile: mobileAfter.map(at) };
}

export const hero = {
  breadcrumb: [{ label: "HOME", href: "/" }, { label: "ADELVAについて" }],
  eyebrow: "ABOUT ADELVA",
  // 経営判断を、｜現場で動く｜仕組みと成果へ。 (desktop: two lines, mobile: three)
  title: broken(["経営判断を、", "現場で動く", "仕組みと成果へ。"], [0], [0, 1]),
  lead: broken(
    [
      "ホテル・旅館の経営を、現場から動かしていく。",
      "ADELVAは、オーナー・経営者と総支配人・現場責任者の",
      "双方に向き合い、経営判断を日々の業務に落とし込み、",
      "改善が続く状態をつくる経営実装パートナーです。",
    ],
    [0, 1, 2],
    [],
  ),
  scroll: "SCROLL",
} as const;

export const role = {
  id: "role",
  eyebrow: "ROLE",
  title: "私たちの役割",
  wishes: [
    { id: "gable", text: broken(["収益を伸ばしたい。"], [], []) },
    { id: "windows", text: broken(["運営体制を整えたい。"], [], []) },
    { id: "eaves", text: broken(["サービスの品質と", "生産性を高めたい。"], [0], [0]) },
  ],
  body: broken(
    [
      "その課題は、人材、販売、業務、システムにまたがっています。",
      "何から着手するか、誰が担うか、現場でどう動かすか。",
      "私たちは、課題の把握と優先順位の整理から、ともに取り組みます。",
    ],
    [0, 1],
    [],
  ),
} as const;

export const domains = {
  id: "domains",
  eyebrow: "DOMAINS",
  title: "3つの支援領域",
  body: broken(
    [
      "「経営・運営統括」「収益・ブランド成長」「DX・IT・調達基盤」。",
      "この3つの支援領域から必要な施策を組み合わせ、一つの改善計画につなぎます。",
      "お客様とADELVAそれぞれの担当範囲、目標、進め方を明確にし、",
      "実行・実装から運用、効果の検証まで支援します。",
    ],
    [0, 1, 2],
    [],
  ),
  /** Rows follow the approved service domains verbatim; `ring` names the pencil mark. */
  rows: serviceDomains.map((d, i) => ({
    number: d.number,
    label: d.label,
    description: d.description ?? "",
    href: d.href,
    ring: (["c01", "c02", "c03"] as const)[i],
  })),
} as const;

export const stance = {
  id: "stance",
  eyebrow: "STANCE",
  title: "支援スタンス",
  statement: broken(
    [
      "大切にしているのは、",
      "支援が終わった後も、",
      "お客様自身で判断し、",
      "改善を続けられること。",
    ],
    [0, 2],
    [0, 1, 2],
  ),
  body: broken(
    [
      "現場で使える仕組みと知識を引き継ぎ、",
      "経営と現場の両方に、",
      "次の一歩を進める力を残します。",
    ],
    [0],
    [0, 1],
  ),
  steps: ["課題把握", "判断", "実行・実装", "運用", "検証", "引継ぎ"],
  link: { label: "支援の進め方を見る", href: "/approach" },
} as const;

/** IA §6.2 wording (information-architecture.md): "…から整理する". */
const audienceDescriptions: Record<string, string> = {
  "/challenges/owners": "経営判断、収益、投資、開業・再建、運営体制から整理する",
  "/challenges/general-managers":
    "現場品質、人材、生産性、販売、システム定着から整理する",
};
export const audiences = navAudiences.map((a, i) => ({
  label: a.label,
  href: a.href,
  description: audienceDescriptions[a.href] ?? "",
  photo: (["owners", "managers"] as const)[i],
}));

export const call = {
  title: broken(
    ["課題が整理できていなくても、", "お問い合わせいただけます。"],
    [0],
    [0],
  ),
  cta: { label: "問い合わせを送信", href: "/contact" },
} as const;

export const company = {
  id: "company",
  eyebrow: "COMPANY",
  title: "会社概要",
  name: { label: "社名", value: "ADELVA 合同会社" },
  founded: { label: "設立年月日", value: "2026年07月28日" },
  capital: { label: "資本金", value: "100万円" },
  representative: { label: "代表", value: "中川　心" },
  address: {
    label: "所在地（本社）",
    postal: "〒666-0145",
    value: "兵庫県川西市けやき坂2-67-6",
  },
} as const;

export const zones = [
  { id: role.id, label: "役割" },
  { id: domains.id, label: "支援領域" },
  { id: stance.id, label: "支援スタンス" },
  { id: company.id, label: "会社概要" },
] as const;

export const zonesLabel = "このページの章";

/** Every visible string, for content tests. */
export const requiredStrings: readonly string[] = [
  "HOME",
  "ADELVAについて",
  hero.eyebrow,
  hero.title.text,
  hero.lead.text,
  role.title,
  ...role.wishes.map((w) => w.text.text),
  role.body.text,
  domains.title,
  domains.body.text,
  ...domains.rows.flatMap((r) => [r.number, r.label, r.description]),
  stance.title,
  stance.statement.text,
  stance.body.text,
  ...stance.steps,
  stance.link.label,
  ...audiences.flatMap((a) => [a.label, a.description]),
  call.title.text,
  call.cta.label,
  company.title,
  ...[company.name, company.founded, company.capital, company.representative].flatMap(
    (r) => [r.label, r.value],
  ),
  company.address.label,
  company.address.postal,
  company.address.value,
  ...zones.map((z) => z.label),
];

/* --------------------------------------------------------------------------- */
/* Geometry (page units). Desktop = CSS px at 1440, mobile = CSS px at 390.     */
/* --------------------------------------------------------------------------- */

export interface Ring {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly label?: string;
  /** Mobile only: the x of the vertical run of an architect's knee leader. */
  readonly route?: number;
}

export const segments = {
  desktop: { b: 2160, c: 3390, frameBottomPad: 64 },
  mobile: { b: 2060, c: 3400, frameBottomPad: 48 },
} as const;

export const desktopGeometry = {
  width: 1440,
  plate: { rows: 6912, tiles: 8, scale: 0.9375, fade: 220, height: 6480 },
  frame: { left: 39, right: 1403, tick: 168 },
  rings: {
    gable: { cx: 1080.3, cy: 1155.2, r: 68.6 },
    windows: { cx: 1058.4, cy: 1371.4, r: 84.1 },
    eaves: { cx: 1048.1, cy: 1560.8, r: 64.0 },
    c01: { cx: 1019.1, cy: 2810.1, r: 100.0, label: "01" },
    c02: { cx: 1003.1, cy: 3247.3, r: 110.1, label: "02" },
    c03: { cx: 1290.2, cy: 3035.1, r: 88.6, label: "03" },
  } satisfies Record<string, Ring>,
  /** Leader starts measured on the mock (text end + 18, 55 % of the first line box). */
  leadStarts: {
    gable: [435.0, 1184.6],
    windows: [472.4, 1266.8],
    eaves: [397.5, 1349.0],
    c01: [728.0, 2584.7],
    c02: [728.0, 2702.5],
    c03: [728.0, 2820.3],
  } as Record<string, readonly [number, number]>,
  /** Dimension line along the stepping stones. */
  dim: { x1: 768, y1: 3165, x2: 838, y2: 3324 },
  /** Front texture rect (plate rows 2304–3616) and the variant window inside it. */
  front: { top: 2160, height: 1230, window: [0, 1024 / 1312] as const, bottom: 3060 },
  veils: [
    { top: 2120, left: -140, width: 1150, height: 980, kind: "dom" },
    { top: 4120, left: -120, width: 1560, height: 1180, kind: "stance" },
  ],
} as const;

export const mobileGeometry = {
  width: 390,
  plate: {
    rows: 10534,
    tiles: 10,
    scale: 390 / 853,
    fade: 160,
    height: (10534 * 390) / 853,
  },
  frame: { left: 10, right: 380, tick: 120 },
  rings: {
    gable: { cx: 256, cy: 1374, r: 40, route: 300 },
    windows: { cx: 318, cy: 1507, r: 40, route: 350 },
    eaves: { cx: 112, cy: 1628, r: 36 },
    c01: { cx: 223, cy: 2703, r: 52, label: "01" },
    c02: { cx: 170, cy: 2931, r: 54, label: "02" },
    c03: { cx: 338, cy: 2836, r: 38, label: "03" },
  } satisfies Record<string, Ring>,
  leadStarts: {
    gable: [251.2, 1120.2],
    windows: [274.9, 1170.7],
    eaves: [227.5, 1221.2],
  } as Record<string, readonly [number, number]>,
  /** Front texture rect: plate rows 4505–7437. Variant window = band rows 240–1549 at 5514. */
  front: {
    top: (4505 * 390) / 853,
    height: (2932 * 390) / 853,
    window: [(5514 + 240 - 4505) / 2932, (5514 + 1549 - 4505) / 2932] as const,
    bottom: 3094,
  },
  veils: [
    { top: 1850, left: -60, width: 510, height: 250, kind: "role" },
    { top: 2020, left: -60, width: 510, height: 900, kind: "dom" },
    { top: 3480, left: -60, width: 510, height: 880, kind: "stance" },
  ],
} as const;

export type Geometry = typeof desktopGeometry | typeof mobileGeometry;
