/** Approved A mock copy, IMPLEMENTATION-PROMPT §4 (2026-09-28).
 * Photographic geometry: supplied plates.json; no image-derived UI copy. */
import { processCopy as sharedProcess } from "./adelva-management-operations";
import { audiences, serviceDomains } from "./adelva-navigation";

export const route = "/services/dx-it-procurement" as const;
export const media = "/media/adelva/dx-it-procurement/";
export const copyStatus = "adopted-mock-2026-09-28" as const;
interface Sourced {
  readonly source: string;
  readonly status: typeof copyStatus;
}
const adopted = <T extends object>(
  source: string,
  value: T,
): Omit<T, keyof Sourced> & Sourced => ({
  ...value,
  source,
  status: copyStatus,
});
const source = "adopted-mock A / IMPLEMENTATION-PROMPT §4";
export const hero = adopted(source, {
  index: "03",
  indexLabel: "支援領域",
  title: "DX・IT・調達基盤",
  roman: "DIGITAL, IT & PROCUREMENT",
  lead: ["事業運営を支えるデジタル、システム、", "IT運用、調達基盤を整備します。"],
  cta: { label: "問い合わせを送信", href: "/contact" },
});
export const breadcrumb = adopted(source, {
  items: [
    { label: "HOME", href: "/" },
    { label: "支援内容", href: null },
    { label: hero.title, href: null, current: true },
  ],
});
export interface Service {
  readonly number: string;
  readonly name: string;
  readonly scope?: string;
  readonly href?: string;
}
export interface Chapter extends Sourced {
  readonly id: string;
  readonly title: string;
  readonly numbers: string;
  readonly services: readonly Service[];
  readonly scope?: string;
  readonly tags: readonly (readonly string[])[];
  readonly top: number;
  readonly mobileTop: number;
  readonly headingOffset: number;
  readonly mobileHeadingOffset: number;
}
export const chapters: readonly Chapter[] = [
  adopted(source, {
    id: "system-delivery",
    title: "DX・システム導入・個別開発",
    numbers: "17・19",
    top: 804,
    mobileTop: 2385,
    headingOffset: 45,
    mobileHeadingOffset: 43,
    services: [
      { number: "17", name: "DX・システム導入", scope: "選定・導入・連携・定着" },
      {
        number: "19",
        name: "個別ITシステム開発",
        scope: "要件定義・開発・運用・引継ぎ",
      },
    ],
    tags: [["PMS", "POS", "予約", "CRM", "業務管理"]],
  }),
  adopted(source, {
    id: "it-operations-maintenance",
    title: "IT運用・保守",
    numbers: "18",
    top: 1268,
    mobileTop: 3940,
    headingOffset: 37,
    mobileHeadingOffset: 52,
    services: [{ number: "18", name: "IT運用・保守" }],
    scope: "Web・システム・クラウド・アカウント",
    tags: [
      ["監視", "更新", "障害対応", "変更"],
      ["権限", "文書化", "引継ぎ"],
    ],
  }),
  adopted(source, {
    id: "amenity-procurement",
    title: "アメニティ調達支援",
    numbers: "20",
    top: 1638,
    mobileTop: 5510,
    headingOffset: 34,
    mobileHeadingOffset: 48,
    services: [{ number: "20", name: "アメニティ調達支援" }],
    tags: [
      ["コンセプト", "ブランド", "品質"],
      ["コスト", "運用条件"],
    ],
  }),
];
export const chapterIndex = adopted(source, { label: "章索引", items: chapters });
export const boundaries = adopted(source, {
  title: "サービスの違い",
  pairs: [
    [
      { number: "17", name: "DX・システム導入", scope: "選定・導入・連携・定着" },
      {
        number: "19",
        name: "個別ITシステム開発",
        scope: "既製サービスで満たせない要件への個別開発",
      },
    ],
    [
      {
        number: "13",
        name: "Website制作",
        scope: "Webサイトの企画・設計・制作",
        label: "02 収益・ブランド成長",
      },
      { number: "18", name: "IT運用・保守", scope: "継続的な運用・保守" },
    ],
  ],
  note: "保守の対象・対応範囲と、調達の実施主体は、個別に確認します。",
});
const stepTags = [
  ["経営・業務課題"],
  ["選定", "要件定義", "責任分界"],
  ["導入", "連携", "個別開発"],
  ["定着", "監視", "更新"],
  ["KPI・成果検証"],
  ["文書化", "権限", "継続して改善できる状態"],
];
export const processCopy = adopted(
  "adelva-management-operations.ts processCopy; adopted-mock A tags",
  {
    ...sharedProcess,
    steps: sharedProcess.steps.map((step, i) => ({ ...step, tags: stepTags[i] })),
  },
);
export const related = adopted(
  "adelva-navigation.ts serviceDomains; adopted-mock A heading",
  {
    title: "関連する支援領域",
    items: serviceDomains.slice(0, 2),
  },
);
export const audienceLinks = adopted("adelva-navigation.ts audiences", {
  title: "対象者から探す",
  items: audiences,
});
export const requiredStrings: readonly string[] = [
  ...breadcrumb.items.map((item) => item.label),
  hero.index,
  hero.indexLabel,
  hero.roman,
  ...hero.lead,
  hero.cta.label,
  ...chapters.flatMap((ch) => [
    ch.title,
    ch.numbers,
    ...ch.services.flatMap((s) => [s.number, s.name, ...(s.scope ? [s.scope] : [])]),
    ...(ch.scope ? [ch.scope] : []),
    ...ch.tags.flat(),
  ]),
  boundaries.title,
  ...boundaries.pairs
    .flat()
    .flatMap((item) => [
      item.number,
      item.name,
      item.scope,
      ...("label" in item && item.label ? [item.label] : []),
    ]),
  boundaries.note,
  processCopy.title,
  processCopy.lead,
  processCopy.body,
  ...processCopy.steps.flatMap((s) => [s.number, s.name, ...s.tags]),
  processCopy.link.label,
  related.title,
  ...related.items.flatMap((item) => [item.number, item.label, item.description!]),
  audienceLinks.title,
  ...audienceLinks.items.map((item) => item.label),
];

/** Pure state rule shared by motion and unit coverage. A visited box is current
 * until the next box; the end cap completes all six. */
export function stepStates(tip: number, centers: readonly number[], end: number) {
  const current =
    tip >= end ? centers.length : centers.findLastIndex((y) => tip >= y + 10);
  return centers.map((_, i) =>
    i < current ? "passed" : i === current ? "current" : "upcoming",
  );
}

/** Supplied photographic coordinates; natural pixels, unchanged. */
export const geometry = {
  desktop: {
    map: {
      src: "d-map.webp",
      srcSmall: "d-map-1024.webp",
      widthPx: 1536,
      heightPx: 2304,
      sectionCss: "1440 × 2160 u (hero + three chapters)",
      off: {
        src: "d-map-off.webp",
        x: 780,
        y: 0,
        widthPx: 756,
        heightPx: 1960,
        note: "Power-off state of the staff floor, the three rooms and all conduits (pixel-derived from d-map, exactly registered). Used only for the one-time hero power-up; removed afterwards.",
      },
      rooms: {
        staff: {
          x0: 860,
          y0: 140,
          x1: 1420,
          y1: 450,
          note: "lowest hotel floor (building), above ground",
        },
        systems: {
          x0: 785,
          y0: 880,
          x1: 1405,
          y1: 1205,
          chapter: "system-delivery",
        },
        operations: {
          x0: 765,
          y0: 1318,
          x1: 1375,
          y1: 1645,
          chapter: "it-operations-maintenance",
        },
        storeroom: {
          x0: 765,
          y0: 1725,
          x1: 1395,
          y1: 2065,
          chapter: "amenity-procurement",
        },
      },
      conduits: {
        main: "M1136 0 V1409",
        branch:
          "M1136 760 C1136 786 1146 796 1176 803 L1337 836 C1360 841 1370 855 1370 880 V1790",
        hookOperations: "M1370 1420 C1370 1440 1360 1448 1325 1448",
        hookStoreroom: "M1370 1780 C1370 1800 1362 1812 1346 1812",
        nodes: {
          mainEnd: [1136, 1409],
          operations: [1325, 1448],
          storeroom: [1346, 1812],
        },
        handoffSegment: "M1136 1205 V1409",
        note: "Centre lines of the glowing conduits in the plate (the glow is ~24 px wide, halo ~70 px). 'handoffSegment' is the main core between the systems-room floor and its node in the operations room (17・19 → 18).",
      },
      leaderTargets: {
        "17": [885, 996],
        "18": [910, 1413],
        "19": [960, 1106],
        "20": [915, 1809],
        note: "Where each UI leader line ends (inside the room), from the adopted mock ×1.5. The line starts 18 u after the end of the row's name (measured in the DOM).",
      },
    },
    boundaries: {
      src: "d-diff.webp",
      widthPx: 768,
      heightPx: 1152,
      note: "Left photograph of サービスの違い (mock band2 x 0–304, y 0–425 → CSS 0–427.5 u × 598 u). object-fit: cover, object-position: 50% 0.",
    },
    process: {
      src: "d-process.webp",
      widthPx: 1536,
      heightPx: 1664,
      sectionCss: "1440 × 1560 u",
      off: {
        src: "d-process-off.webp",
        x: 740,
        y: 0,
        widthPx: 340,
        heightPx: 1330,
        note: "Unlit channel (rods, boxes, rim light) — exactly registered.",
      },
      channel: {
        centerX: 905,
        x0: 855,
        x1: 960,
        top: 0,
        endY: 1262,
      },
      boxes: [
        {
          step: "01",
          top: 108,
          bottom: 175,
          centerY: 142,
        },
        {
          step: "02",
          top: 313,
          bottom: 383,
          centerY: 348,
        },
        {
          step: "03",
          top: 512,
          bottom: 583,
          centerY: 548,
        },
        {
          step: "04",
          top: 700,
          bottom: 774,
          centerY: 737,
        },
        {
          step: "05",
          top: 908,
          bottom: 982,
          centerY: 945,
        },
        {
          step: "06",
          top: 1112,
          bottom: 1174,
          centerY: 1143,
        },
      ],
      boxX: {
        x0: 858,
        x1: 952,
      },
      dawn: {
        x0: 720,
        y0: 1262,
        x1: 1130,
        y1: 1664,
        note: "The rock arch opens onto the sunrise valley below the channel end.",
      },
    },
    cards: {
      "01": {
        src: "card-01.webp",
        srcSmall: "card-01-560.webp",
        size: 960,
        note: "01 経営・運営統括: cliff hotel at blue hour with the orange core",
      },
      "02": {
        src: "card-02.webp",
        srcSmall: "card-02-560.webp",
        size: 960,
        note: "02 収益・ブランド成長: terrace at sunset",
      },
    },
  },
  mobile: {
    body: {
      tiles: [
        "m-body-0.webp",
        "m-body-1.webp",
        "m-body-2.webp",
        "m-body-3.webp",
        "m-body-4.webp",
        "m-body-5.webp",
        "m-body-6.webp",
        "m-body-7.webp",
      ],
      tileHeightPx: 1375,
      widthPx: 780,
      heightPx: 11000,
      note: "One continuous text-free section from the hotel's lowest floors down to the dawn valley, fading to #0d1015 at the bottom (last row mean rgb 13,16,21). Derived from the adopted mobile mock: only the text/UI areas were replaced by image_gen fills (see plates/M-body@2x.json).",
    },
    coreOff: {
      tiles: [
        "m-core-off-0.webp",
        "m-core-off-1.webp",
        "m-core-off-2.webp",
        "m-core-off-3.webp",
        "m-core-off-4.webp",
      ],
      x: 560,
      y: 440,
      widthPx: 220,
      heightPx: 9630,
      tileHeightPx: 1926,
      note: "Unlit core and channel, exactly registered to the body plate.",
    },
    coreX: 681,
    coreTop: 440,
    channelTop: 7340,
    channelEndCapY: 10004,
    rooms: {
      building: {
        x0: 300,
        y0: 0,
        x1: 780,
        y1: 440,
        note: "two lowest hotel floors; slab bottom ≈ 440",
      },
      systems: {
        x0: 60,
        y0: 1868,
        x1: 740,
        y1: 2250,
      },
      operations: {
        x0: 60,
        y0: 3405,
        x1: 740,
        y1: 3820,
      },
      storeroom: {
        x0: 60,
        y0: 4988,
        x1: 740,
        y1: 5390,
      },
    },
    coreDots: {
      "17": 2527,
      "18": 4011,
      "19": 2627,
      "20": 5578,
    },
    boxes: [
      {
        step: "01",
        centerY: 8132,
      },
      {
        step: "02",
        centerY: 8315,
      },
      {
        step: "03",
        centerY: 8501,
      },
      {
        step: "04",
        centerY: 8690,
      },
      {
        step: "05",
        centerY: 8873,
      },
      {
        step: "06",
        centerY: 9056,
      },
    ],
    boxX: {
      x0: 632,
      x1: 732,
    },
    dawn: {
      y0: 10040,
      y1: 10700,
    },
    heroGroundLine: {
      y: 1168,
      note: "Straight top edge of the rock plateau under the CTA; soften with a dark scrim across plate y 1100–1250, x 0–640.",
    },
    textRowsFromMock: {
      $comment:
        "Top of glyphs in plate px (@2x) measured on the adopted mock; x = left edge. Verify against references/adelva/mockups/dx-it-procurement-2026-09-24/A-mobile/A-mobile-full@2x.png.",
      breadcrumb: 670,
      eyebrow: 730,
      h1: [791, 855],
      roman: 889,
      lead: [948, 993],
      cta: {
        x0: 38,
        x1: 484,
        y0: 1075,
        y1: 1149,
      },
      indexRules: [1215, 1305, 1395, 1487],
      ch1: {
        numbers: 2385,
        heading: 2428,
        row17: 2515,
        scope17: 2562,
        row19: 2615,
        scope19: 2660,
        chips: [2713, 2756],
      },
      ch2: {
        number: 3940,
        heading: 3992,
        scope: 4066,
        chipsRow1: [4115, 4165],
        chipsRow2: [4182, 4231],
      },
      ch3: {
        number: 5510,
        heading: 5558,
        chipsRow1: [5635, 5685],
        chipsRow2: [5696, 5745],
      },
      panel: {
        x0: 0,
        x1: 604,
        y0: 6518,
        y1: 7331,
        title: 6568,
        rows: {
          "13": 6975,
          "17": 6690,
          "18": 7112,
          "19": 6830,
        },
        note: [7240, 7270],
      },
      process: {
        headingX: [55, 118],
        headingY: [7418, 7836],
        ruleX: 147,
        leadX: 182,
        lead: [7452, 7502, 7552],
        body: [7648, 7688, 7727, 7766, 7805],
      },
      steps: {
        numberX: 51,
        nameX: 173,
        rows: [8112, 8290, 8476, 8666, 8852, 9031],
        link: {
          y: 9255,
          underline: 9287,
        },
      },
    },
  },
} as const;
