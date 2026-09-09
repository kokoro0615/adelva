import type { RouteFamily } from "@/content/route-manifest";

/**
 * Presentation contract per exact manifest family.
 *
 * The route-to-template boundary is the exact `family` value, never a pathname
 * substring. `region-index-redirect` is deliberately absent: it is an HTTP
 * redirect configured in `next.config.ts` and has no page template.
 */
export interface TemplateConfig {
  /** Human label used in copy-free UI affordances and tests. */
  readonly label: string;
  /**
   * `full` matches the measured near-full-viewport photographic hero.
   * `short` matches the measured shallower hero on the rates, enquiry and
   * legal routes, where a content panel overlaps the image.
   */
  readonly hero: "full" | "short";
  /** The first content band lifts over the hero on a rounded panel. */
  readonly overlapPanel: boolean;
}

export type RenderedRouteFamily = Exclude<RouteFamily, "region-index-redirect">;

export const templateConfigs = {
  home: { label: "Home", hero: "full", overlapPanel: false },
  "itinerary-index": { label: "Journey index", hero: "full", overlapPanel: false },
  "camp-index": { label: "Camp index", hero: "full", overlapPanel: false },
  "about-story": { label: "Story", hero: "full", overlapPanel: false },
  "about-foundation": { label: "Foundation", hero: "full", overlapPanel: false },
  "about-sustainability": {
    label: "Sustainability",
    hero: "full",
    overlapPanel: false,
  },
  operations: { label: "Operations", hero: "full", overlapPanel: false },
  aviation: { label: "Aviation", hero: "full", overlapPanel: false },
  rates: { label: "Rates", hero: "short", overlapPanel: true },
  "enquiry-form": { label: "Enquiry", hero: "short", overlapPanel: true },
  legal: { label: "Legal document", hero: "short", overlapPanel: true },
  "camp-detail": { label: "Camp detail", hero: "full", overlapPanel: false },
  "itinerary-detail": { label: "Journey detail", hero: "full", overlapPanel: false },
  "itinerary-day": { label: "Day journey", hero: "full", overlapPanel: false },
  "region-detail": { label: "Region detail", hero: "full", overlapPanel: false },
} as const satisfies Record<RenderedRouteFamily, TemplateConfig>;

export function templateFor(family: RouteFamily): TemplateConfig {
  if (family === "region-index-redirect") {
    throw new Error("The Antarctica index is a redirect and has no page template.");
  }

  return templateConfigs[family];
}
