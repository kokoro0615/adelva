import { describe, expect, it } from "vitest";

import { company } from "../../src/content/adelva-about";
import { routeStatusOf, serviceDomains } from "../../src/content/adelva-navigation";
import { companyFacts, site } from "../../src/content/site";
import { indexablePages, sitePages } from "../../src/content/site-pages";
import { allServiceNames, pageGraph, pageMetadata, siteGraph } from "../../src/lib/seo";

type Node = Record<string, unknown>;
const graphOf = (data: Record<string, unknown>) => data["@graph"] as Node[];

describe("site page registry", () => {
  it("registers each path once, with an existing preview image name", () => {
    const paths = sitePages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const page of sitePages) {
      expect(page.ogImage).toMatch(/^\/og\/[a-z-]+\.jpg$/);
      expect(page.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps titles and descriptions within what result pages display", () => {
    for (const page of indexablePages) {
      const title = page.absoluteTitle ? page.title : `${page.title}｜ADELVA`;
      expect(title.length, page.path).toBeLessThanOrEqual(40);
      expect(page.description.length, page.path).toBeGreaterThanOrEqual(60);
      expect(page.description.length, page.path).toBeLessThanOrEqual(130);
    }
    const titles = indexablePages.map((page) => page.title);
    const descriptions = indexablePages.map((page) => page.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("only the post-submission page stays out of the index", () => {
    expect(
      sitePages.filter((page) => !page.indexable).map((page) => page.path),
    ).toEqual(["/contact/thanks"]);
  });

  it("marks every registered page available in the navigation", () => {
    for (const page of sitePages) expect(routeStatusOf(page.path)).toBe("available");
    expect(routeStatusOf("/challenges/owners")).toBe("available");
    expect(routeStatusOf("/services")).toBe("pending");
  });
});

describe("company facts", () => {
  it("restate the visible /about company profile", () => {
    const { address, representative } = companyFacts;
    expect(`${address.region}${address.locality}${address.street}`).toBe(
      company.address.value,
    );
    expect(`〒${address.postalCode}`).toBe(company.address.postal);
    expect(representative.role).toBe("代表");
    expect(company.representative.value.replace("　", " ")).toBe(representative.name);
    expect(company.founded.value).toBe("2026年07月28日");
    expect(companyFacts.foundingDate).toBe("2026-07-28");
  });
});

describe("metadata", () => {
  it("gives every page a canonical URL, a preview and its own robots rule", () => {
    for (const page of sitePages) {
      const metadata = pageMetadata(page.path);
      expect(metadata.alternates?.canonical).toBe(page.path);
      expect(metadata.description).toBe(page.description);
      const images = metadata.openGraph?.images as { url: string }[];
      expect(images[0]?.url).toBe(page.ogImage);
      if (page.indexable) expect(metadata.robots).toBeUndefined();
      else expect(metadata.robots).toEqual({ index: false, follow: true });
    }
  });

  it("uses an absolute HOME title and the template elsewhere", () => {
    expect(pageMetadata("/").title).toEqual({
      absolute: "ADELVA（アデルバ）｜ホテル・旅館の経営実装パートナー",
    });
    expect(pageMetadata("/about").title).toBe(
      "ADELVAについて｜会社概要・役割・支援スタンス",
    );
  });
});

describe("structured data", () => {
  it("describes the organisation with registry facts", () => {
    const [organization, website] = graphOf(siteGraph());
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "ADELVA",
      legalName: "ADELVA合同会社",
      foundingDate: "2026-07-28",
      identifier: { propertyID: "法人番号", value: "1140003023925" },
      address: { postalCode: "666-0145", addressCountry: "JP" },
    });
    expect(website).toMatchObject({ "@type": "WebSite", url: `${site.url}/` });
  });

  it("lists all 20 approved services once", () => {
    expect(allServiceNames).toHaveLength(20);
    expect(new Set(allServiceNames).size).toBe(20);
    const total = serviceDomains.reduce((sum, domain) => sum + domain.count, 0);
    expect(allServiceNames).toHaveLength(total);
  });

  it("adds a Service with its catalogue to each domain page", () => {
    for (const domain of serviceDomains) {
      const graph = graphOf(pageGraph(domain.href as "/services/revenue-brand"));
      const service = graph.find((node) => node["@type"] === "Service");
      const catalog = service?.hasOfferCatalog as { itemListElement: Node[] };
      const offers = catalog.itemListElement.flatMap(
        (theme) => theme.itemListElement as Node[],
      );
      expect(offers).toHaveLength(domain.count);
    }
  });

  it("builds breadcrumbs only for pages that show one", () => {
    const owner = graphOf(pageGraph("/challenges/owner"));
    const breadcrumb = owner.find((node) => node["@type"] === "BreadcrumbList");
    expect(
      (breadcrumb?.itemListElement as Node[]).map((item) => [item.position, item.name]),
    ).toEqual([
      [1, "HOME"],
      [2, "課題から探す"],
      [3, "オーナー・経営者の方へ"],
    ]);
    expect(
      graphOf(pageGraph("/contact")).some((node) => node["@type"] === "BreadcrumbList"),
    ).toBe(false);
  });
});
