/**
 * ADELVA 支援の進め方 (`/approach`).
 *
 * Every string on the page lives here. The user adopted the A desktop mock
 * (`A-full.png`) and its mobile translation (`A-mobile/A-mobile-full-390.png`)
 * on 2026-09-26 and asked for them to be built as they stand, so the wording
 * set in those mocks is treated as adopted ("採用＝承認", the same rule the
 * management-operations page records). Each block names where the wording
 * originally comes from; nothing in this file is new copy.
 *
 * Geometry is measured from the adopted mocks; see
 * `docs/specs/adelva-approach-spec.md`. Desktop values are CSS px on a
 * 1440px-wide page ("u"); mobile values are CSS px on a 390px-wide page ("m").
 * Rectangles are `[x, y, width, height]` in page coordinates.
 */

import { adelvaApproach } from "@/content/adelva-approach";
import { audiences, contactCta, serviceDomains } from "@/content/adelva-navigation";

export const copyStatus = "adopted-mock-2026-09-26" as const;
export type CopyStatus = typeof copyStatus;

export type CopySource =
  | "adelva-approach.ts"
  | "home-copy.md §4"
  | "home-copy.md §5"
  | "information-architecture.md §2.1"
  | "information-architecture.md §6.3"
  | "information-architecture.md §8.3"
  | "information-architecture.md §12"
  | "content-taxonomy.md §5"
  | "adelva-management-operations.ts"
  | "audience-page.tsx"
  | "adelva-navigation.ts"
  | "adopted-mock A";

interface Sourced {
  readonly source: CopySource | readonly CopySource[];
  readonly status: CopyStatus;
}

const adopted = <T extends object>(source: Sourced["source"], value: T) =>
  ({ ...value, source, status: copyStatus }) as T & Sourced;

/** A string with the line breaks each adopted mock sets. Both join to `text`. */
export interface Lines {
  readonly desktop: readonly string[];
  readonly mobile: readonly string[];
}

export const route = "/approach" as const;

export const meta = adopted(["adelva-approach.ts", "home-copy.md §5"], {
  title: "支援の進め方 — ADELVA",
  description: `${adelvaApproach.lead}${adelvaApproach.body}`,
});

export const breadcrumb = adopted("adopted-mock A", {
  items: [
    { label: "HOME", href: "/" },
    { label: adelvaApproach.titleJa, href: null, current: true },
  ],
});

export const hero = adopted(["adelva-approach.ts", "home-copy.md §5"], {
  /* Set in capitals by CSS; the text node keeps the approved casing. */
  roman: adelvaApproach.title,
  title: adelvaApproach.titleJa,
  lead: {
    desktop: ["課題把握から、判断、実行・実装、", "運用、検証、引継ぎまで。"],
    mobile: ["課題把握から、判断、実行・実装、", "運用、検証、引継ぎまで。"],
  } satisfies Lines,
  body: {
    desktop: [
      "分析や助言で終わらず、責任分界とKPIを明確にし、",
      "支援終了後もお客様自身が継続して",
      "改善できる状態をつくります。",
    ],
    mobile: [
      "分析や助言で終わらず、",
      "責任分界とKPIを明確にし、",
      "支援終了後もお客様自身が継続して",
      "改善できる状態をつくります。",
    ],
  } satisfies Lines,
  cta: { label: "問い合わせを送信", href: contactCta.href },
});

/** The descent scale on the hero's right edge. UI labels adopted with the mock. */
export const rail = adopted("adopted-mock A", {
  label: "工程",
  top: "俯瞰",
  bottom: "現場",
});

export interface Stage {
  readonly id: `stage-0${1 | 2 | 3 | 4 | 5 | 6}`;
  readonly number: string;
  readonly name: string;
  readonly description: Lines;
  readonly tags: readonly string[];
  /** Accessible description of the photograph's scale, not its decoration. */
  readonly alt: string;
}

const stepNames = adelvaApproach.steps;

export const stages = adopted(
  [
    "adelva-approach.ts",
    "adelva-management-operations.ts",
    "information-architecture.md §2.1",
    "information-architecture.md §8.3",
    "content-taxonomy.md §5",
    "home-copy.md §5",
    "adopted-mock A",
  ],
  {
    title: "支援の工程",
    items: [
      {
        id: "stage-01",
        number: "01",
        name: stepNames[0],
        description: {
          desktop: ["経営と現場のどこに原因があるかを見極めます。"],
          mobile: ["経営と現場のどこに原因があるかを", "見極めます。"],
        },
        tags: ["現象と原因", "優先順位", "影響範囲"],
        alt: "霧の立つ渓谷を上空から見下ろした写真。川沿いの森の中に、旅館の屋根が小さく見える。",
      },
      {
        id: "stage-02",
        number: "02",
        name: stepNames[1],
        description: {
          desktop: ["現場で決める範囲と、経営判断が必要な範囲を分けます。"],
          mobile: ["現場で決める範囲と、", "経営判断が必要な範囲を分けます。"],
        },
        tags: ["判断論点", "責任分界"],
        alt: "朝の森に建つ旅館の敷地を低い空から見た写真。本館、湯気の立つ湯屋、砂紋の庭、岩の多い川が見える。",
      },
      {
        id: "stage-03",
        number: "03",
        name: stepNames[2],
        description: {
          desktop: ["担当・期限・KPI・成果物を決め、", "現場で動かします。"],
          mobile: ["担当・期限・KPI・成果物を決め、", "現場で動かします。"],
        },
        tags: ["担当", "期限", "KPI", "成果物"],
        alt: "夕暮れの旅館の車寄せ。石灯籠に明かりが入り、ガラス戸の奥が温かく光っている。",
      },
      {
        id: "stage-04",
        number: "04",
        name: stepNames[3],
        description: {
          desktop: ["手順・会議・教育を、", "日々の運営に組み込みます。"],
          mobile: ["手順・会議・教育を、", "日々の運営に組み込みます。"],
        },
        tags: ["SOP", "会議", "教育"],
        alt: "夜の旅館の玄関。藍の暖簾と行灯の奥に、明かりの入ったフロントが見える。",
      },
      {
        id: "stage-05",
        number: "05",
        name: stepNames[4],
        description: {
          desktop: ["KPIと成果を確かめます。"],
          mobile: ["KPIと成果を確かめます。"],
        },
        tags: ["KPI・成果検証"],
        alt: "旅館のフロント。木のカウンターに台帳と呼び鈴が置かれ、奥の壁に山水の掛軸が掛かっている。",
      },
      {
        id: "stage-06",
        number: "06",
        name: stepNames[5],
        description: {
          desktop: ["支援終了後も、お客様自身が改善を続けられる状態へ。"],
          mobile: ["支援終了後も、お客様自身が", "改善を続けられる状態へ。"],
        },
        tags: ["継続して改善できる状態"],
        alt: "床の間の掛軸。雲海と山並みを描いた水墨画で、ページの最初と同じ景色が描かれている。",
      },
    ] satisfies readonly Stage[],
  },
);

export const responsibilities = adopted(["audience-page.tsx", "adopted-mock A"], {
  label: "責任分界",
  title: {
    desktop: ["誰が決め、誰が実行し、何を残すか。"],
    mobile: ["誰が決め、誰が実行し、", "何を残すか。"],
  } satisfies Lines,
  axis: { start: rail.top, end: rail.bottom },
  roles: [
    {
      id: "owner",
      name: "オーナー・本部",
      scope: "経営・投資の判断と承認",
      /* Where on the 俯瞰→現場 axis the role takes part, as fractions. */
      ranges: [[0, 0.315]],
    },
    {
      id: "manager",
      name: "GM・部門責任者",
      scope: "現場判断と部門間の調整",
      ranges: [[0.504, 1]],
    },
    {
      id: "adelva",
      name: "ADELVA",
      scope: "改善計画の推進・実行・実装支援",
      ranges: [[0, 1]],
    },
    {
      id: "partners",
      name: "外部関係者",
      scope: "契約に応じた専門領域の実施",
      ranges: [
        [0.414, 0.578],
        [0.666, 0.831],
      ],
    },
  ] as const,
  note: {
    desktop: [
      "判断権限・指揮命令・実行範囲・引継ぎ先を、",
      "お客様・ADELVA・外部関係者で個別に合意します。",
    ],
    mobile: [
      "判断権限・指揮命令・実行範囲・引継ぎ先を、",
      "お客様・ADELVA・外部関係者で個別に合意します。",
    ],
  } satisfies Lines,
});

const domainLines: Record<string, Lines> = {
  management: {
    desktop: [
      "経営判断、開業、運営、人材、",
      "現場オペレーションを横断して",
      "支援します。",
    ],
    mobile: [
      "経営判断、開業、運営、人材、",
      "現場オペレーションを横断して支援します。",
    ],
  },
  revenue: {
    desktop: [
      "販売、Web集客、ブランド、",
      "SNS、営業を宿泊収益の向上へ",
      "つなげます。",
    ],
    mobile: ["販売、Web集客、ブランド、SNS、営業を", "宿泊収益の向上へつなげます。"],
  },
  digital: {
    desktop: [
      "事業運営を支えるデジタル、",
      "システム、IT運用、調達基盤を",
      "整備します。",
    ],
    mobile: ["事業運営を支えるデジタル、システム、", "IT運用、調達基盤を整備します。"],
  },
};

export const integrated = adopted(
  [
    "information-architecture.md §6.3",
    "information-architecture.md §12",
    "adelva-navigation.ts",
    "adopted-mock A",
  ],
  {
    /* `/approach#integrated-support` is the IA's menu anchor for this block. */
    id: "integrated-support",
    label: "横断支援の考え方",
    title: {
      desktop: ["複数の施策を、", "一つの改善計画に。"],
      mobile: ["複数の施策を、", "一つの改善計画に。"],
    } satisfies Lines,
    domains: serviceDomains.map((domain) => ({
      id: domain.id,
      number: domain.number,
      label: domain.label,
      /* Every service domain carries its approved description. */
      description: domain.description ?? domainLines[domain.id]!.desktop.join(""),
      lines: domainLines[domain.id]!,
      href: domain.href,
    })),
    example: {
      label: "組み合わせの例",
      /* IA §12's related-link example, in the order the mock sets it. */
      items: ["客室清掃改善", "採用支援", "DX・システム導入"],
    },
  },
);

export const verification = adopted(["audience-page.tsx", "adopted-mock A"], {
  title: {
    desktop: ["確認し、引き継げる状態へ。"],
    mobile: ["確認し、", "引き継げる状態へ。"],
  } satisfies Lines,
  items: [
    { name: "担当範囲", lines: ["誰が、どこまで担うか"] },
    { name: "成果物", lines: ["現場で使う手順・", "管理指標は何か"] },
    { name: "意思決定記録", lines: ["何を根拠に、", "何を決めたか"] },
    { name: "検証・引継ぎ方法", lines: ["何で確かめ、", "誰へ引き継ぐか"] },
  ],
});

export const audienceLinks = adopted("adelva-navigation.ts", {
  /* Visually hidden heading; the approved group label, not new copy. */
  title: "対象者から探す",
  items: audiences.map((item) => ({ label: item.label, href: item.href })),
});

/** Every string the page must render as DOM text (used by the e2e gate). */
export const requiredStrings: readonly string[] = [
  ...breadcrumb.items.map((item) => item.label),
  hero.roman,
  hero.title,
  hero.lead.desktop.join(""),
  hero.body.desktop.join(""),
  hero.cta.label,
  rail.top,
  rail.bottom,
  ...stages.items.flatMap((stage) => [
    stage.number,
    stage.name,
    stage.description.desktop.join(""),
    ...stage.tags,
  ]),
  responsibilities.label,
  responsibilities.title.desktop.join(""),
  ...responsibilities.roles.flatMap((role) => [role.name, role.scope]),
  responsibilities.note.desktop.join(""),
  integrated.label,
  integrated.title.desktop.join(""),
  ...integrated.domains.flatMap((domain) => [
    domain.number,
    domain.label,
    domain.description,
  ]),
  integrated.example.label,
  ...integrated.example.items,
  verification.title.desktop.join(""),
  ...verification.items.flatMap((item) => [item.name, item.lines.join("")]),
  ...audienceLinks.items.map((item) => item.label),
];

/* ------------------------------------------------------------------ geometry */

export type Rect = readonly [x: number, y: number, width: number, height: number];

export interface Plate {
  readonly src: string;
  /** Smaller rendition for 1× screens; absent where the plate is already small. */
  readonly small?: { readonly src: string; readonly width: number };
  readonly width: number;
  readonly height: number;
}

const media = "/media/adelva/approach";
const plate = (name: string, width: number, height: number, small?: number): Plate => ({
  src: `${media}/${name}.webp`,
  ...(small ? { small: { src: `${media}/${name}-${small}.webp`, width: small } } : {}),
  width,
  height,
});

export const plates = {
  desktop: {
    hero: plate("d-hero", 1562, 1007, 1024),
    stages: [
      plate("d-01", 2106, 747, 1280),
      plate("d-02", 2076, 757, 1280),
      plate("d-03", 1855, 848, 1280),
      plate("d-04", 1855, 848, 1280),
      plate("d-05", 1855, 848, 1280),
      plate("d-06", 1714, 918, 1280),
    ],
    integrated: plate("d-integrated", 1368, 1149),
    ridge: plate("ridge", 1353, 1163),
  },
  mobile: {
    hero: plate("m-hero", 905, 1737),
    stages: [
      plate("m-01", 1046, 1504, 720),
      plate("m-02", 1051, 1496, 720),
      plate("m-03", 1049, 1499, 720),
      plate("m-04", 1056, 1489, 720),
      plate("m-05", 1055, 1490, 720),
      plate("m-06", 975, 1613, 720),
    ],
    integrated: plate("m-integrated", 1153, 1364),
  },
} as const;

/**
 * One viewport family's measured layout.
 *
 * `photos[i]` is stage i+1's photograph. `finders[0]` sits in the hero and
 * frames stage 01; `finders[i]` (i ≥ 1) sits in stage i and frames stage i+1;
 * the last one is stage 06's ivory frame, which points nowhere.
 */
export interface DescentGeometry {
  readonly width: number;
  readonly heroHeight: number;
  readonly photos: readonly Rect[];
  readonly finders: readonly Rect[];
  readonly dots: readonly (readonly [cx: number, cy: number])[];
  readonly dotRadius: number;
  /** Where the descent section ends (the 06 text block included). */
  readonly descentBottom: number;
}

export const desktopGeometry: DescentGeometry = {
  width: 1440,
  heroHeight: 929,
  photos: [
    [52, 985.8, 1336, 476.7],
    [52, 1524.4, 1336, 490.8],
    [45, 2227.5, 1350, 620.2],
    [45, 2922.2, 1350, 620.1],
    [45, 3615.5, 1350, 620.1],
    [52, 4394.5, 1336, 718.6],
  ],
  finders: [
    [805.8, 596.3, 120.9, 67.5],
    [666.6, 1184.1, 182.8, 97],
    [694.7, 1722.7, 137.8, 88.6],
    [662.3, 2546.7, 241.9, 139.2],
    [646.9, 3148.6, 227.8, 165.9],
    [673.6, 3654.8, 216.6, 240.5],
    [662.3, 4691.3, 122.3, 80.2],
  ],
  dots: [
    [1118.8, 1679.3],
    [1189.2, 1800],
    [873.5, 1856.1],
  ],
  dotRadius: 8.8,
  descentBottom: 5540,
};

export const mobileGeometry: DescentGeometry = {
  width: 390,
  heroHeight: 750,
  photos: [
    [20, 839, 350, 503],
    [20, 1430.5, 350, 497.5],
    [20, 2016.5, 350, 496.5],
    [20, 2601.5, 350, 490.5],
    [20, 3180.5, 350, 495.5],
    [17.5, 3764.5, 355, 586.5],
  ],
  finders: [
    [184, 557, 53.5, 61.5],
    [198.5, 1100.5, 74.5, 81],
    [160, 1682.5, 63, 68.5],
    [181.5, 2272.5, 61, 75.5],
    [170, 2802.5, 71, 86.5],
    [209.5, 3311, 69.5, 118.5],
    [204.5, 4114, 40.5, 49],
  ],
  dots: [
    [315.7, 1635.9],
    [351, 1702.9],
    [246.9, 1759.9],
  ],
  dotRadius: 4.3,
  descentBottom: 4648,
};

export type Point = readonly [x: number, y: number];
export interface MagnificationLine {
  /** Index of the finder the line leaves from. */
  readonly finder: number;
  /** Index of the photograph the line lands on. */
  readonly photo: number;
  readonly left: readonly [Point, Point];
  readonly right: readonly [Point, Point];
}

/**
 * Scientific-plate magnification lines: from a finder's lower corners to the
 * enlarged photograph's upper corners. Computed rather than traced, so each
 * one lands exactly on its corner (the mock's generated lines did not).
 */
export function magnificationLines(geometry: DescentGeometry): MagnificationLine[] {
  return geometry.photos.map((photo, index) => {
    const [fx, fy, fw, fh] = geometry.finders[index]!;
    const [px, py, pw] = photo;
    return {
      finder: index,
      photo: index,
      left: [
        [fx, fy + fh],
        [px, py],
      ],
      right: [
        [fx + fw, fy + fh],
        [px + pw, py],
      ],
    };
  });
}
