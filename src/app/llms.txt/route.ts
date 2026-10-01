import { company } from "@/content/adelva-about";
import { serviceDomains } from "@/content/adelva-navigation";
import { absoluteUrl, companyFacts, site } from "@/content/site";
import { indexablePages } from "@/content/site-pages";
import { serviceCatalog } from "@/lib/seo";

export const dynamic = "force-static";

/**
 * llms.txt (llmstxt.org) for AI agents that read it. Google Search ignores the
 * file; it is generated from the same typed content as the pages, so it can
 * only restate what the site already says.
 */
function body(): string {
  const lines = [
    `# ${site.name}（${site.nameKana}）`,
    "",
    `> ${site.description}`,
    "",
    "## 会社概要",
    "",
    `- 社名: ${site.legalName}`,
    `- ${company.founded.label}: ${company.founded.value}`,
    `- ${company.capital.label}: ${company.capital.value}`,
    `- ${company.representative.label}: ${companyFacts.representative.name}`,
    `- ${company.address.label}: ${company.address.postal} ${company.address.value}`,
    `- 法人番号: ${companyFacts.corporateNumber}`,
    "",
    "## 支援領域とサービス",
    "",
  ];
  for (const domain of serviceDomains) {
    lines.push(`### ${domain.label}`, "", domain.description ?? "", "");
    for (const theme of serviceCatalog(domain.href) ?? []) {
      lines.push(`- ${theme.title}: ${theme.services.join("、")}`);
    }
    lines.push("", `詳細: ${absoluteUrl(domain.href)}`, "");
  }
  lines.push("## ページ", "");
  for (const page of indexablePages) {
    lines.push(`- [${page.name}](${absoluteUrl(page.path)}): ${page.description}`);
  }
  lines.push("", "## お問い合わせ", "", `- ${absoluteUrl("/contact")}`, "");
  return lines.join("\n");
}

export function GET() {
  return new Response(body(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
