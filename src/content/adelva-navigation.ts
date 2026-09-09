/**
 * ADELVA global navigation data.
 *
 * Content authority is `references/adelva/sources/home-content.ts` — a
 * byte-identical snapshot of `clients/adelva/src/content/home.ts` — plus
 * `references/adelva/sources/information-architecture.md` sections 6 and 7 for
 * ordering, the two index links, and the primary call to action. Nothing here
 * is authored copy: every label and description is carried over verbatim.
 *
 * This module is deliberately separate from `src/lib/navigation.ts`, which
 * still owns the White Desert route groups the global footer renders.
 *
 * See `docs/specs/adelva-navigation-spec.md`.
 */

import { routeManifest } from "@/content/route-manifest";

/**
 * Whether a destination resolves in *this* repository.
 *
 * Derived from the route manifest rather than asserted by hand, so a route
 * that is later implemented reports itself as available without an edit here.
 * The ADELVA source project implements only `/` as well, so these routes are
 * planned in both projects; see the specification for the recorded list.
 */
export type NavRouteStatus = "available" | "pending";

export interface AdelvaNavLink {
  readonly href: string;
  readonly label: string;
  /** Verbatim reference description. Absent where the reference has none. */
  readonly description?: string;
}

export interface AdelvaServiceTheme {
  readonly id: string;
  readonly title: string;
  readonly href: string;
}

export interface AdelvaServiceDomain extends AdelvaNavLink {
  readonly id: string;
  readonly number: string;
  readonly count: number;
  readonly themes: readonly AdelvaServiceTheme[];
}

/** A top-level item that opens a mega panel. */
export type AdelvaMenuId = "challenges" | "services";

export interface AdelvaMenuIntro {
  readonly index: string;
  readonly roman: string;
  readonly title: string;
  /**
   * The panel's own landing page.
   *
   * Present where the trigger is a disclosure button that would otherwise leave
   * its section index unreachable. `about` omits it: its first destination is
   * `/about` already, and repeating the panel title as a link directly beneath
   * itself reads as an error rather than as an affordance.
   */
  readonly indexLink?: AdelvaNavLink;
}

export type AdelvaPrimaryItem =
  | { readonly kind: "menu"; readonly label: string; readonly menu: AdelvaMenuId }
  | { readonly kind: "link"; readonly label: string; readonly href: string };

const implementedPaths = new Set<string>([
  ...routeManifest.map((route) => route.path),
  "/contact",
  "/challenges",
  "/challenges/owner",
  "/challenges/owners",
  "/challenges/general-managers",
]);

/** Fragment-bearing hrefs resolve against their document path. */
export function routeStatusOf(href: string): NavRouteStatus {
  const path = href.split("#")[0] ?? href;
  return implementedPaths.has(path) ? "available" : "pending";
}

export const adelvaBrand = {
  name: "ADELVA",
  homeHref: "/",
  logoSrc: "/brand/adelva-logo.png",
} as const;

/** `information-architecture.md` §6.1: 顧客の状況 → 支援体系 → 進め方 → 証拠 → 会社. */
export const primaryNavigation: readonly AdelvaPrimaryItem[] = [
  { kind: "menu", label: "課題から探す", menu: "challenges" },
  { kind: "menu", label: "支援内容", menu: "services" },
  { kind: "link", label: "支援の進め方", href: "/approach" },
  { kind: "link", label: "ADELVAについて", href: "/about" },
];

export const contactCta = {
  href: "/contact",
  label: "お問い合わせ",
  /** Latest user-approved wording, shared across viewport sizes. */
  compactLabel: "お問い合わせ",
} as const;

export const audiences: readonly AdelvaNavLink[] = [
  {
    label: "オーナー・経営者の方へ",
    description: "経営判断、収益、投資、開業・再建、運営体制から支援を探す",
    href: "/challenges/owners",
  },
  {
    label: "総支配人・現場責任者の方へ",
    description: "現場品質、人材、生産性、販売、システム定着から支援を探す",
    href: "/challenges/general-managers",
  },
];

export const challenges: readonly AdelvaNavLink[] = [
  {
    label: "経営・収益を改善したい",
    description: "経営状態、P&L、優先順位、収益改善を整理する",
    href: "/challenges#management-profit",
  },
  {
    label: "開業・運営体制を整えたい",
    description: "開業準備、GM機能、全面運営、責任体制を整える",
    href: "/challenges#opening-operations",
  },
  {
    label: "現場品質・人材を改善したい",
    description: "宿泊、料飲、清掃、採用、教育、生産性を改善する",
    href: "/challenges#operations-people",
  },
  {
    label: "集客・ブランドを強くしたい",
    description: "Web、OTA、営業、写真、SNSを収益へつなぐ",
    href: "/challenges#revenue-brand",
  },
  {
    label: "DX・IT・調達を整えたい",
    description: "システム導入、IT運用、個別開発、調達を整える",
    href: "/challenges#digital-foundation",
  },
];

export const serviceDomains: readonly AdelvaServiceDomain[] = [
  {
    id: "management",
    number: "01",
    label: "経営・運営統括",
    description: "経営判断、開業、運営、人材、現場オペレーションを横断して支援します。",
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
    label: "収益・ブランド成長",
    description: "販売、Web集客、ブランド、SNS、営業を宿泊収益の向上へつなげます。",
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
    label: "DX・IT・調達基盤",
    description: "事業運営を支えるデジタル、システム、IT運用、調達基盤を整備します。",
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
];

/** `information-architecture.md` §6.4. The reference carries no descriptions. */
export const aboutLinks: readonly AdelvaNavLink[] = [
  { label: "ADELVAについて", href: "/about" },
];

export const menuIntros: Record<AdelvaMenuId, AdelvaMenuIntro> = {
  challenges: {
    index: "01",
    roman: "CHALLENGES",
    title: "課題から探す",
    indexLink: { label: "課題一覧を見る", href: "/challenges" },
  },
  services: {
    index: "02",
    roman: "SERVICES",
    title: "支援内容",
    indexLink: { label: "支援内容一覧", href: "/services" },
  },
};

/**
 * Group names, so no heading element has to be invented to label a list.
 *
 * All four are lifted from the approved sources rather than authored:
 * 「対象者から探す」 and 「困りごとから探す」 are the reference header's own group
 * labels, 「支援領域」 is the term the taxonomy uses throughout ("3支援領域"), and
 * 「会社情報」 is the description `information-architecture.md` §6.1 gives the
 * ADELVAについて menu.
 */
export const groupLabels = {
  audiences: "対象者から探す",
  challenges: "困りごとから探す",
  domains: "支援領域",
  about: "会社情報",
} as const;

/** Every destination the navigation can reach, in DOM order. */
export const navigationDestinations: readonly string[] = [
  ...Object.values(menuIntros).flatMap((intro) =>
    intro.indexLink ? [intro.indexLink.href] : [],
  ),
  ...audiences.map((item) => item.href),
  ...challenges.map((item) => item.href),
  ...serviceDomains.flatMap((domain) => [
    domain.href,
    ...domain.themes.map((theme) => theme.href),
  ]),
  ...aboutLinks.map((item) => item.href),
  ...primaryNavigation.flatMap((item) => (item.kind === "link" ? [item.href] : [])),
  contactCta.href,
];

/**
 * Destinations this repository cannot resolve.
 *
 * Recorded rather than hidden: the navigation still emits the canonical ADELVA
 * hrefs, marks them `data-route-status="pending"` in the DOM, and links them
 * with plain anchors so no unresolvable route is ever prefetched.
 */
export const pendingDestinations: readonly string[] = Array.from(
  new Set(navigationDestinations.filter((href) => routeStatusOf(href) === "pending")),
);
