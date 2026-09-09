export const primaryNavigation = [
  { label: "課題から探す", href: "/challenges", menu: "challenges" },
  { label: "支援内容", href: "/services", menu: "services" },
  { label: "支援の進め方", href: "/approach" },
  { label: "導入事例", href: "/cases" },
  { label: "ADELVAについて", href: "/about", menu: "about" },
] as const;

export const audiences = [
  {
    title: "オーナー・経営者の方へ",
    titleLines: ["オーナー・", "経営者の方へ"],
    description: "経営判断、収益、投資、開業・再建、運営体制から支援を探す",
    href: "/challenges/owners",
    image: "owner",
  },
  {
    title: "総支配人・現場責任者の方へ",
    titleLines: ["総支配人・", "現場責任者の方へ"],
    description: "現場品質、人材、生産性、販売、システム定着から支援を探す",
    href: "/challenges/general-managers",
    image: "operations",
  },
] as const;

export const challenges = [
  {
    label: "経営・収益を改善したい",
    shortLabel: "経営・収益",
    description: "経営状態、P&L、優先順位、収益改善を整理する",
    href: "/challenges#management-profit",
    glyph: "revenue",
  },
  {
    label: "開業・運営体制を整えたい",
    shortLabel: "開業・運営体制",
    description: "開業準備、GM機能、全面運営、責任体制を整える",
    href: "/challenges#opening-operations",
    glyph: "opening",
  },
  {
    label: "現場品質・人材を改善したい",
    shortLabel: "現場品質・人材",
    description: "宿泊、料飲、清掃、採用、教育、生産性を改善する",
    href: "/challenges#operations-people",
    glyph: "people",
  },
  {
    label: "集客・ブランドを強くしたい",
    shortLabel: "集客・ブランド",
    description: "Web、OTA、営業、写真、SNSを収益へつなぐ",
    href: "/challenges#revenue-brand",
    glyph: "brand",
  },
  {
    label: "DX・IT・調達を整えたい",
    shortLabel: "DX・IT・調達",
    description: "システム導入、IT運用、個別開発、調達を整える",
    href: "/challenges#digital-foundation",
    glyph: "digital",
  },
] as const;

export const serviceDomains = [
  {
    id: "management",
    number: "01",
    title: "経営・運営統括",
    description:
      "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
    href: "/services/management-operations",
    count: 11,
    themes: [
      {
        id: "management-improvement",
        title: "経営診断・改善",
        href: "/services/management-operations/management-improvement",
      },
      {
        id: "opening-operations",
        title: "開業・運営体制",
        href: "/services/management-operations/opening-operations",
      },
      {
        id: "operations-improvement",
        title: "現場運営改善",
        href: "/services/management-operations/operations-improvement",
      },
      {
        id: "people-recruitment",
        title: "人材・採用",
        href: "/services/management-operations/people-recruitment",
      },
    ],
  },
  {
    id: "revenue",
    number: "02",
    title: "収益・ブランド成長",
    description:
      "販売、Web集客、ブランド、SNS、営業を宿泊収益の向上へつなげます。",
    href: "/services/revenue-brand",
    count: 5,
    themes: [
      {
        id: "acquisition-sales",
        title: "集客・販売チャネル支援",
        href: "/services/revenue-brand/acquisition-sales",
      },
      {
        id: "web-visual-production",
        title: "Webサイト・ビジュアル制作",
        href: "/services/revenue-brand/web-visual-production",
      },
      {
        id: "social-media-operations",
        title: "SNS運用支援",
        href: "/services/revenue-brand/social-media-operations",
      },
    ],
  },
  {
    id: "digital",
    number: "03",
    title: "DX・IT・調達基盤",
    description:
      "事業運営を支えるデジタル、システム、IT運用、調達基盤を整備します。",
    href: "/services/dx-it-procurement",
    count: 4,
    themes: [
      {
        id: "system-delivery",
        title: "DX・システム導入・個別開発",
        href: "/services/dx-it-procurement/system-delivery",
      },
      {
        id: "it-operations-maintenance",
        title: "IT運用・保守",
        href: "/services/dx-it-procurement/it-operations-maintenance",
      },
      {
        id: "amenity-procurement",
        title: "アメニティ調達支援",
        href: "/services/dx-it-procurement/amenity-procurement",
      },
    ],
  },
] as const;

export const approachStages = [
  "課題把握",
  "判断",
  "実行・実装",
  "運用",
  "検証",
  "引継ぎ",
] as const;
