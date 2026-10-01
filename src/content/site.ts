/**
 * ADELVA site identity for search engines, social previews and AI answers.
 *
 * Company facts come from the approved /about company profile, so the visible
 * table and the structured data cannot drift apart. The registered name and
 * corporate number were confirmed on the National Tax Agency's corporate number
 * site (2026-10-02); the registry writes the name without the space the /about
 * table uses, so `legalName` follows the registry.
 */
import { company } from "@/content/adelva-about";

export const site = {
  /** Canonical origin: the apex domain and http both 308 to this host. */
  url: "https://www.adelva.jp",
  name: "ADELVA",
  /** Registered furigana (法人番号公表サイト). */
  nameKana: "アデルバ",
  legalName: "ADELVA合同会社",
  positioning: "ホテル・旅館の経営実装パートナー",
  description:
    "ADELVA（アデルバ）は、ホテル・旅館の経営、現場運営、収益成長、ブランド、DX・ITを一つの改善計画につなぐ経営実装パートナーです。課題把握から実行・実装、運用、検証、引継ぎまで支援します。",
  locale: "ja_JP",
  language: "ja",
  /** Header and footer ink; also the browser UI colour. */
  themeColor: "#0e1118",
  logo: { path: "/brand/adelva-logo.png", width: 1024, height: 1024 },
} as const;

/** Every value below is restated from `company` or checked against it in tests. */
export const companyFacts = {
  corporateNumber: "1140003023925",
  /** ISO 8601 form of company.founded ("2026年07月28日"). */
  foundingDate: "2026-07-28",
  capital: company.capital.value,
  representative: {
    name: company.representative.value.replace("　", " "),
    role: company.representative.label,
  },
  address: {
    postalCode: company.address.postal.replace("〒", ""),
    // company.address.value split into its parts (asserted in tests/unit/seo.test.ts).
    region: "兵庫県",
    locality: "川西市",
    street: "けやき坂2-67-6",
  },
  registryUrls: [
    "https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=1140003023925",
    "https://info.gbiz.go.jp/hojin/ichiran?hojinBango=1140003023925",
  ],
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
