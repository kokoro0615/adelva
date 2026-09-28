/** Approved copy and measured layout: docs/specs/adelva-revenue-brand-spec.md. */
import {
  audiences,
  contactCta,
  groupLabels,
  serviceDomains,
} from "./adelva-navigation";
import { processCopy as sharedProcess } from "./adelva-management-operations";
export type CopyStatus = "approved" | "adopted-mock-2026-09-28";
const approved = <T extends object>(value: T, source = "adelva-navigation.ts") => ({
  ...value,
  source,
  status: "approved" as const,
});
const adopted = <T extends object>(value: T) => ({
  ...value,
  source: "A4 mock / revenue-brand spec §5",
  status: "adopted-mock-2026-09-28" as const,
});
export const route = "/services/revenue-brand";
const domain = serviceDomains[1];
export const meta = approved({
  title: `${domain.label} — ADELVA`,
  description: domain.description!,
});
export const hero = approved({
  number: domain.number,
  title: domain.label,
  indexLabel: groupLabels.domains,
  lead: domain.description!,
  cta: { href: contactCta.href, label: "問い合わせを送信" },
  roman: "REVENUE & BRAND GROWTH",
});
export const breadcrumb = approved({
  items: [
    { label: "HOME", href: "/" },
    { label: "支援内容", href: null },
    { label: domain.label, href: null },
  ],
});
export const chapters = domain.themes.map((theme, i) =>
  approved({
    id: `rb-ch${i + 1}`,
    title: theme.title,
    number: ["12・16", "13・14", "15"][i],
    xD: [720, 720, 966][i],
    yD: [1014, 2375, 3908][i],
    xM: [195, 195, 22][i],
    yM: [1009, 1978, 3026][i],
  }),
);
export const sources = adopted({
  items: [
    { id: "web", label: "Web" },
    { id: "ota", label: "OTA" },
    { id: "sales", label: "営業" },
    { id: "photo", label: "写真" },
    { id: "sns", label: "SNS" },
  ],
});
export const acquisition = adopted({
  label: "集客・販売チャネルの要素",
  initial: "ota",
  items: [
    ["official-site", "公式サイト"],
    ["ota", "OTA"],
    ["search", "検索"],
    ["content", "コンテンツ"],
    ["sales-channel", "販売チャネル"],
    ["measurement", "計測"],
    ["corporate", "法人"],
    ["travel-agency", "旅行会社"],
    ["group", "団体"],
    ["regional-business", "地域企業"],
  ].map(([id, label], i) => ({ id, label, branch: i < 6 ? "left" : "right" })),
});
export const photos = adopted({
  label: "Photoブランディング",
  initial: "room",
  items: [
    ["facility", "施設"],
    ["room", "客室"],
    ["food", "料理"],
    ["staff", "スタッフ"],
  ].map(([id, label]) => ({ id, label })),
});
export const services = [
  approved(
    { number: "12", name: "Web集客・チャネル収益" },
    "spec §5 / approved service taxonomy",
  ),
  approved(
    { number: "16", name: "宿泊営業支援" },
    "spec §5 / approved service taxonomy",
  ),
  approved(
    { number: "13", name: "Website制作" },
    "spec §5 / approved service taxonomy",
  ),
  approved(
    { number: "14", name: "Photoブランディング" },
    "spec §5 / approved service taxonomy",
  ),
  approved(
    { number: "15", name: "SNS運用代行" },
    "spec §5 / approved service taxonomy",
  ),
] as const;
export const detail = adopted({
  revenue: "宿泊収益",
  acquisition: "集客・販売チャネル・計測を宿泊収益へ",
  sales: "法人・旅行会社・団体・地域企業への営業",
  websiteTags: ["事業目的", "ブランド", "顧客導線", "SEO", "運用"],
  note: "一部のWebサイト制作は、一般事業者も対象です。",
  social: "ブランド方針から改善まで継続し、Web・予約導線へつなぐ",
});
export const loop = adopted({
  items: [
    ["brand-policy", "ブランド方針"],
    ["planning", "企画"],
    ["posting", "投稿"],
    ["analysis", "分析"],
    ["improvement", "改善"],
  ].map(([id, label]) => ({ id, label })),
  exit: { id: "web-booking", label: "Web・予約導線" },
});
export const differences = adopted({
  title: "サービスの違い",
  items: [
    { ...services[0], description: "集客・販売チャネル・計測を宿泊収益へつなぐ" },
    { ...services[2], description: "Webサイトの企画・設計・制作" },
    { ...services[3], description: "写真表現の設計と素材の準備" },
    { ...services[4], description: "企画・投稿・分析・改善の継続運用" },
  ],
  note: "Webサイト公開後の保守、撮影の権利、SNSで対応する範囲は、個別に確認します。",
});
export const processCopy = approved(
  {
    title: sharedProcess.title,
    lead: sharedProcess.lead,
    body: sharedProcess.body,
    link: sharedProcess.link,
    steps: sharedProcess.steps.map((step, i) =>
      adopted({
        number: step.number,
        name: step.name,
        tags: [
          ["集客・販売の現状"],
          ["ブランド方針", "ターゲット"],
          ["Webサイト", "写真", "営業資料"],
          ["投稿", "チャネル運用"],
          ["計測", "分析"],
          ["改善", "継続して改善できる状態"],
        ][i],
        desktop: {
          x: [861, 390, 900, 353, 922, 758][i],
          nameX: [928, 467, 973, 432, 994, 834][i],
          y: [6044, 6207, 6404, 6570, 6792, 7076][i],
        },
        mobile: { side: ["left", "right", "left", "right", "right", "left"][i] },
      }),
    ),
  },
  "adelva-management-operations.ts / approved common process",
);
export const related = adopted({
  title: "関連する支援領域",
  items: [serviceDomains[0], serviceDomains[2]].map((d, i) =>
    approved({ ...d, photo: `c${i + 1}` }),
  ),
});
export const audienceLinks = approved({
  title: groupLabels.audiences,
  items: audiences,
});
export const viewfinderTargets = {
  desktop: {
    facility: [390, 3190, 910, 3360],
    room: [713, 3221, 900, 3353],
    food: [394, 3198, 573, 3346],
    staff: [550, 3252, 667, 3353],
  },
  mobile: {
    facility: [130, 5765, 550, 5915],
    room: [387, 5791, 542, 5911],
    food: [136, 5765, 260, 5872],
    staff: [253, 5814, 356, 5883],
  },
} as const;
export type PhotoId = keyof typeof viewfinderTargets.desktop;
export const requiredStrings = [
  ...breadcrumb.items.map((i) => i.label),
  hero.number,
  hero.indexLabel,
  hero.title,
  hero.roman,
  hero.lead,
  hero.cta.label,
  "SCROLL",
  ...sources.items.map((i) => i.label),
  ...chapters.flatMap((c) => [c.number, c.title]),
  ...acquisition.items.map((i) => i.label),
  ...photos.items.map((i) => i.label),
  ...services.flatMap((s) => [s.number, s.name]),
  detail.revenue,
  detail.acquisition,
  detail.sales,
  ...detail.websiteTags,
  detail.note,
  detail.social,
  ...loop.items.map((i) => i.label),
  loop.exit.label,
  differences.title,
  ...differences.items.map((i) => i.description),
  differences.note,
  processCopy.title,
  processCopy.lead,
  processCopy.body,
  processCopy.link.label,
  ...processCopy.steps.flatMap((s) => [s.number, s.name, ...s.tags]),
  related.title,
  ...related.items.flatMap((i) => [i.number, i.label, i.description!]),
  audienceLinks.title,
  ...audienceLinks.items.map((i) => i.label),
] as const;
