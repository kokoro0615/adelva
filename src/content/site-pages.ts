/**
 * Every public ADELVA route with its search and sharing metadata.
 *
 * This registry is the single route list for metadata, the sitemap, structured
 * data, llms.txt and the navigation's "available" check. Titles and
 * descriptions are composed only of approved page copy and the approved
 * taxonomy (service and domain names); they add no claims.
 *
 * `breadcrumb` lists the linked ancestors a page shows in its visible
 * breadcrumb. Pages without a visible breadcrumb omit it, so the structured
 * data never describes a trail the reader cannot see.
 */

export type SchemaPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export interface Crumb {
  readonly name: string;
  readonly path: string;
}

export interface SitePage {
  readonly path: string;
  /** Short page name: breadcrumbs, image alt text and llms.txt. */
  readonly name: string;
  /** Search title. The root template appends "｜ADELVA" unless `absoluteTitle`. */
  readonly title: string;
  readonly absoluteTitle?: true;
  readonly description: string;
  /** 1200×630 preview rendered from the page hero by scripts/seo/build-og-images.mjs. */
  readonly ogImage: string;
  readonly schemaType: SchemaPageType;
  readonly breadcrumb?: readonly Crumb[];
  /** Date of the last material content change (sitemap `lastmod`). */
  readonly updated: string;
  /** False keeps the page out of the index and the sitemap. */
  readonly indexable: boolean;
}

const home: Crumb = { name: "HOME", path: "/" };
const challengesCrumb: Crumb = { name: "課題から探す", path: "/challenges" };

export const sitePages = [
  {
    path: "/",
    name: "HOME",
    title: "ADELVA（アデルバ）｜ホテル・旅館の経営実装パートナー",
    absoluteTitle: true,
    description:
      "ADELVA（アデルバ）は、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。課題把握から実行・実装、運用、検証、引継ぎまで支援します。",
    ogImage: "/og/home.jpg",
    schemaType: "WebPage",
    updated: "2026-10-02",
    indexable: true,
  },
  {
    path: "/challenges",
    name: "課題から探す",
    title: "課題から探す｜ホテル・旅館の経営と現場の課題",
    description:
      "経営・収益を改善したい、開業・運営体制を整えたい、現場品質・人材を改善したい、集客・ブランドを強くしたい、DX・IT・調達を整えたい。ホテル・旅館の経営と現場の課題を、一つの改善計画へつなぎます。",
    ogImage: "/og/challenges.jpg",
    schemaType: "CollectionPage",
    updated: "2026-09-10",
    indexable: true,
  },
  {
    path: "/challenges/owner",
    name: "オーナー・経営者の方へ",
    title: "オーナー・経営者の方へ｜ホテル・旅館の経営判断を改善計画へ",
    description:
      "ホテル・旅館のオーナー・経営者の方へ。経営・収益、開業・再建、GM不在、投資判断の経営局面ごとに判断の論点を整理し、経営判断を実行可能な改善計画へつなぎます。",
    ogImage: "/og/challenges-owner.jpg",
    schemaType: "WebPage",
    breadcrumb: [home, challengesCrumb],
    updated: "2026-09-30",
    indexable: true,
  },
  {
    path: "/challenges/general-managers",
    name: "総支配人・現場責任者の方へ",
    title: "総支配人・現場責任者の方へ｜ホテル・旅館の現場改善",
    description:
      "ホテル・旅館の総支配人・現場責任者の方へ。品質、人材、生産性、販売、システム定着の課題を、原因と優先順位から整理し、現場運営・人材・販売・ITを一つの改善計画につなぎます。",
    ogImage: "/og/challenges-general-managers.jpg",
    schemaType: "WebPage",
    breadcrumb: [home, challengesCrumb],
    updated: "2026-09-30",
    indexable: true,
  },
  {
    path: "/services/management-operations",
    name: "経営・運営統括",
    title: "経営・運営統括｜ホテル・旅館の経営診断・開業支援・運営改善",
    description:
      "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。経営診断・コンサル、新規開業支援、週2〜3日型総支配人、ホテル全面運営受託、宿泊部門運営支援、客室清掃改善、採用支援など11のサービス。",
    ogImage: "/og/services-management-operations.jpg",
    schemaType: "WebPage",
    breadcrumb: [home],
    updated: "2026-10-01",
    indexable: true,
  },
  {
    path: "/services/revenue-brand",
    name: "収益・ブランド成長",
    title: "収益・ブランド成長｜ホテル・旅館の集客・Web制作・SNS運用",
    description:
      "販売、Web集客、ブランド、SNS、営業を宿泊収益の向上へつなげます。Web集客・チャネル収益、宿泊営業支援、Website制作、Photoブランディング、SNS運用代行の5つのサービス。",
    ogImage: "/og/services-revenue-brand.jpg",
    schemaType: "WebPage",
    breadcrumb: [home],
    updated: "2026-09-30",
    indexable: true,
  },
  {
    path: "/services/dx-it-procurement",
    name: "DX・IT・調達基盤",
    title: "DX・IT・調達基盤｜ホテル・旅館のシステム導入・IT運用・調達",
    description:
      "事業運営を支えるデジタル、システム、IT運用、調達基盤を整備します。DX・システム導入、個別ITシステム開発、IT運用・保守、アメニティ調達支援の4つのサービス。",
    ogImage: "/og/services-dx-it-procurement.jpg",
    schemaType: "WebPage",
    breadcrumb: [home],
    updated: "2026-09-30",
    indexable: true,
  },
  {
    path: "/approach",
    name: "支援の進め方",
    title: "支援の進め方｜課題把握から実行・検証・引継ぎまで",
    description:
      "課題把握から、判断、実行・実装、運用、検証、引継ぎまで。分析や助言で終わらず、責任分界とKPIを明確にし、支援終了後もお客様自身が継続して改善できる状態をつくります。",
    ogImage: "/og/approach.jpg",
    schemaType: "WebPage",
    breadcrumb: [home],
    updated: "2026-10-01",
    indexable: true,
  },
  {
    path: "/about",
    name: "ADELVAについて",
    title: "ADELVAについて｜会社概要・役割・支援スタンス",
    description:
      "ADELVA合同会社（アデルバ）は、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。役割、3つの支援領域、支援スタンスと会社概要。",
    ogImage: "/og/about.jpg",
    schemaType: "AboutPage",
    breadcrumb: [home],
    updated: "2026-10-02",
    indexable: true,
  },
  {
    path: "/contact",
    name: "お問い合わせ",
    title: "お問い合わせ｜ホテル・旅館の経営・運営のご相談",
    description:
      "ホテル・旅館の経営・運営、収益・ブランド、DX・ITに関するお問い合わせ。課題が整理できていなくても、お問い合わせいただけます。",
    ogImage: "/og/contact.jpg",
    schemaType: "ContactPage",
    updated: "2026-10-01",
    indexable: true,
  },
  {
    path: "/contact/thanks",
    name: "お問い合わせを受け付けました",
    title: "お問い合わせを受け付けました",
    description:
      "ホテル・旅館の経営・運営、収益・ブランド、DX・ITに関するお問い合わせ。",
    ogImage: "/og/contact.jpg",
    schemaType: "WebPage",
    updated: "2026-10-01",
    indexable: false,
  },
] as const satisfies readonly SitePage[];

export type SitePath = (typeof sitePages)[number]["path"];

export function sitePage(path: SitePath): SitePage {
  const page = sitePages.find((entry) => entry.path === path);
  if (!page) throw new Error(`No site page registered for ${path}`);
  return page;
}

export const indexablePages: readonly SitePage[] = sitePages.filter(
  (page) => page.indexable,
);
