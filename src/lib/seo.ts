import type { Metadata } from "next";

import { chapters as dxChapters } from "@/content/adelva-dx-it-procurement";
import { chapters as managementChapters } from "@/content/adelva-management-operations";
import { serviceDomains } from "@/content/adelva-navigation";
import {
  chapters as revenueChapters,
  services as revenueServices,
} from "@/content/adelva-revenue-brand";
import { absoluteUrl, companyFacts, site } from "@/content/site";
import { sitePage, type SitePage, type SitePath } from "@/content/site-pages";

const ids = {
  organization: absoluteUrl("/#organization"),
  website: absoluteUrl("/#website"),
} as const;

/** Full Next.js metadata for one registered page. */
export function pageMetadata(path: SitePath): Metadata {
  const page = sitePage(path);
  const title = page.absoluteTitle ? page.title : `${page.title}｜${site.name}`;
  const image = { url: page.ogImage, width: 1200, height: 630, alt: page.name };
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      locale: site.locale,
      siteName: site.name,
      url: page.path,
      title,
      description: page.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: [image],
    },
    ...(page.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** One service per approved service name, grouped as each domain page shows them. */
const domainCatalogs: Record<string, readonly { title: string; services: string[] }[]> =
  {
    "/services/management-operations": managementChapters.map((chapter) => ({
      title: chapter.title,
      services: chapter.services.map((service) => service.name),
    })),
    // The revenue page numbers each theme by its services ("12・16").
    "/services/revenue-brand": revenueChapters.map((chapter) => ({
      title: chapter.title,
      services: chapter.number
        .split("・")
        .map(
          (number) =>
            revenueServices.find((service) => service.number === number)!.name,
        ),
    })),
    "/services/dx-it-procurement": dxChapters.map((chapter) => ({
      title: chapter.title,
      services: chapter.services.map((service) => service.name),
    })),
  };

export const allServiceNames: readonly string[] = Object.values(domainCatalogs).flatMap(
  (themes) => themes.flatMap((theme) => theme.services),
);

export function serviceCatalog(path: string) {
  return domainCatalogs[path];
}

type JsonLdNode = Record<string, unknown>;

/** Organization and WebSite: rendered once per document by the root layout. */
export function siteGraph(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ids.organization,
        name: site.name,
        alternateName: [site.nameKana, site.legalName],
        legalName: site.legalName,
        url: absoluteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl(site.logo.path),
          width: site.logo.width,
          height: site.logo.height,
        },
        description: site.description,
        slogan: site.positioning,
        foundingDate: companyFacts.foundingDate,
        address: {
          "@type": "PostalAddress",
          postalCode: companyFacts.address.postalCode,
          addressRegion: companyFacts.address.region,
          addressLocality: companyFacts.address.locality,
          streetAddress: companyFacts.address.street,
          addressCountry: "JP",
        },
        identifier: {
          "@type": "PropertyValue",
          propertyID: "法人番号",
          value: companyFacts.corporateNumber,
        },
        // A 合同会社's representative is a member of the company (代表社員).
        member: {
          "@type": "OrganizationRole",
          roleName: companyFacts.representative.role,
          member: { "@type": "Person", name: companyFacts.representative.name },
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "お問い合わせ",
          url: absoluteUrl("/contact"),
          availableLanguage: "ja",
        },
        knowsAbout: [
          ...serviceDomains.map((domain) => domain.label),
          ...allServiceNames,
        ],
        sameAs: companyFacts.registryUrls,
      },
      {
        "@type": "WebSite",
        "@id": ids.website,
        url: absoluteUrl("/"),
        name: site.name,
        alternateName: [site.nameKana, site.legalName],
        description: site.description,
        inLanguage: site.language,
        publisher: { "@id": ids.organization },
      },
    ],
  };
}

function breadcrumbList(page: SitePage, pageUrl: string): JsonLdNode | null {
  if (!page.breadcrumb) return null;
  const trail = [...page.breadcrumb, { name: page.name, path: page.path }];
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function serviceNode(page: SitePage, pageUrl: string): JsonLdNode | null {
  const catalog = domainCatalogs[page.path];
  if (!catalog) return null;
  return {
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: page.name,
    serviceType: page.name,
    description: page.description,
    url: pageUrl,
    provider: { "@id": ids.organization },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "ホテル・旅館を中心とする宿泊事業者",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: page.name,
      itemListElement: catalog.map((theme) => ({
        "@type": "OfferCatalog",
        name: theme.title,
        itemListElement: theme.services.map((name) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name,
            provider: { "@id": ids.organization },
          },
        })),
      })),
    },
  };
}

/** WebPage, its breadcrumb and (on domain pages) the Service it describes. */
export function pageGraph(path: SitePath): JsonLdNode {
  const page = sitePage(path);
  const pageUrl = absoluteUrl(page.path);
  const breadcrumb = breadcrumbList(page, pageUrl);
  const service = serviceNode(page, pageUrl);
  const webPage: JsonLdNode = {
    "@type": page.schemaType,
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: page.absoluteTitle ? page.title : `${page.title}｜${site.name}`,
    description: page.description,
    inLanguage: site.language,
    isPartOf: { "@id": ids.website },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: absoluteUrl(page.ogImage),
      width: 1200,
      height: 630,
    },
    dateModified: page.updated,
    ...(page.path === "/" || page.path === "/about"
      ? { about: { "@id": ids.organization } }
      : {}),
    ...(service ? { mainEntity: { "@id": service["@id"] } } : {}),
    ...(breadcrumb ? { breadcrumb: { "@id": breadcrumb["@id"] } } : {}),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [webPage, breadcrumb, service].filter(Boolean),
  };
}
