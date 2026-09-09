import { describe, expect, it } from "vitest";

import { assets } from "../../src/content/assets";
import {
  getPageDocument,
  pageDocumentRegistry,
  pageDocuments,
} from "../../src/content/pages";
import { renderedRoutes } from "../../src/content/route-manifest";
import type { PageDocument, Section } from "../../src/content/types";

function collectAssetIds(value: unknown, result: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectAssetIds(item, result);
    return result;
  }

  if (value === null || typeof value !== "object") return result;

  for (const [key, child] of Object.entries(value)) {
    if (key === "assetId" && typeof child === "string") result.push(child);
    collectAssetIds(child, result);
  }

  return result;
}

function ownerSections(
  document: PageDocument,
): Extract<Section, { kind: "ownerContent" }>[] {
  return document.sections.filter(
    (section): section is Extract<Section, { kind: "ownerContent" }> =>
      section.kind === "ownerContent",
  );
}

describe("page document registry", () => {
  it("covers every rendered manifest route exactly once", () => {
    const expectedPaths = renderedRoutes.map(({ path }) => path).sort();
    const registryPaths = Object.keys(pageDocumentRegistry).sort();
    const documentPaths = pageDocuments.map(({ path }) => path).sort();

    expect(registryPaths).toEqual(expectedPaths);
    expect(documentPaths).toEqual(expectedPaths);
    expect(new Set(documentPaths)).toHaveLength(documentPaths.length);
    expect(pageDocuments).toHaveLength(renderedRoutes.length);
    expect(() => getPageDocument("/antarctica")).toThrow(/redirect/i);
  });

  it("keeps registry keys, canonical route identity, metadata titles and H1s unique", () => {
    const titles = new Set<string>();
    const headings = new Set<string>();

    for (const [canonicalPath, document] of Object.entries(pageDocumentRegistry)) {
      expect(document.path).toBe(canonicalPath);
      expect(document.family).toBe(
        renderedRoutes.find(({ path }) => path === canonicalPath)?.family,
      );
      expect(document.title.trim()).not.toBe("");
      expect(document.hero.title.trim()).not.toBe("");
      expect(titles.has(document.title)).toBe(false);
      expect(headings.has(document.hero.title)).toBe(false);
      titles.add(document.title);
      headings.add(document.hero.title);
    }
  });

  it("uses only registered local assets for the authorized clone content", () => {
    const approvedAssetIds = new Set(Object.keys(assets));
    const serialized = JSON.stringify(pageDocuments);

    expect(collectAssetIds(pageDocuments).length).toBeGreaterThan(0);
    for (const assetId of collectAssetIds(pageDocuments)) {
      expect(approvedAssetIds.has(assetId), assetId).toBe(true);
    }

    for (const asset of Object.values(assets)) {
      expect(asset.src, asset.id).toMatch(/^\/(?!\/)/);
      expect(asset.src, asset.id).not.toMatch(
        /(?:white-desert\.com|cdn\.sanity\.io|cloudflarestream\.com)/i,
      );
    }

    expect(serialized).not.toMatch(/https?:\/\//i);
  });

  it("does not state numeric prices or calendar dates in rates and journey content", () => {
    const commercialDocuments = pageDocuments.filter(
      ({ family }) =>
        family === "rates" ||
        family === "itinerary-index" ||
        family === "itinerary-detail" ||
        family === "itinerary-day",
    );
    const serialized = JSON.stringify(commercialDocuments);

    expect(serialized).not.toMatch(/(?:[$£€¥]\s*\d|\d\s*(?:USD|GBP|EUR|JPY))/i);
    expect(serialized).not.toMatch(/\b\d{1,4}[/-]\d{1,2}(?:[/-]\d{1,4})?\b/);
    expect(serialized).not.toMatch(
      /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d/i,
    );
  });

  it("keeps rates, legal and other unverified claims visibly owner-supplied", () => {
    const rates = getPageDocument("/prices");
    const legal = pageDocuments.filter(({ family }) => family === "legal");
    const commercialAndClaims = pageDocuments.filter(({ family }) =>
      [
        "camp-index",
        "camp-detail",
        "about-story",
        "about-foundation",
        "about-sustainability",
        "operations",
        "region-detail",
      ].includes(family),
    );

    expect(ownerSections(rates)).not.toHaveLength(0);
    expect(JSON.stringify(rates)).toMatch(/owner-supplied/i);
    expect(legal).toHaveLength(5);
    for (const document of legal) {
      expect(ownerSections(document)).not.toHaveLength(0);
      expect(JSON.stringify(document)).toMatch(/owner-supplied legal/i);
    }
    for (const document of commercialAndClaims) {
      expect(ownerSections(document)).not.toHaveLength(0);
      expect(JSON.stringify(document)).toMatch(/owner-supplied/i);
    }
  });
});
