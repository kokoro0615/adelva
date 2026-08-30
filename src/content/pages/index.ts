import { aboutPages } from "@/content/pages/about";
import { campDetailPages, campIndexPage } from "@/content/pages/camps";
import { enquiryPage } from "@/content/pages/enquiry";
import { homePage } from "@/content/pages/home";
import { journeyDetailPages, journeyIndexPage } from "@/content/pages/journeys";
import { legalPages } from "@/content/pages/legal";
import { operationsPage } from "@/content/pages/operations";
import { ratesPage } from "@/content/pages/rates";
import { regionDetailPages } from "@/content/pages/regions";
import type { RoutePath } from "@/content/route-manifest";
import type { PageDocument } from "@/content/types";

export type RenderedRoutePath = Exclude<RoutePath, "/antarctica">;

/**
 * One explicit, compile-time-exhaustive content registry for rendered routes.
 * The redirect path deliberately has no page document.
 */
export const pageDocumentRegistry = {
  "/": homePage,
  "/itineraries": journeyIndexPage,
  "/camps": campIndexPage,
  "/about/founders": aboutPages[0],
  "/about/foundation": aboutPages[1],
  "/about/sustainability": aboutPages[2],
  "/antarctica/behind-the-scenes": operationsPage,
  "/prices": ratesPage,
  "/enquire": enquiryPage,
  "/legal/website-terms": legalPages[0],
  "/legal/booking-terms": legalPages[1],
  "/legal/privacy-policy": legalPages[2],
  "/legal/cookies": legalPages[3],
  "/legal/medical-disclaimer": legalPages[4],
  "/camps/echo-base": campDetailPages[0],
  "/camps/explorer-camp": campDetailPages[1],
  "/camps/whichaway-camp": campDetailPages[2],
  "/itineraries/discovery-week": journeyDetailPages[0],
  "/itineraries/south-pole-emperor-penguins": journeyDetailPages[1],
  "/itineraries/south-pole-blue-rivers": journeyDetailPages[2],
  "/itineraries/antarctica-in-a-day": journeyDetailPages[3],
  "/itineraries/early-emperor-penguins": journeyDetailPages[4],
  "/itineraries/the-long-stay": journeyDetailPages[5],
  "/antarctica/wolfs-fang-runway-mountains": regionDetailPages[0],
  "/antarctica/schirmacher-oasis": regionDetailPages[1],
  "/antarctica/polar-plateau": regionDetailPages[2],
  "/antarctica/atka-penguin-colony": regionDetailPages[3],
  "/antarctica/fuel-depot": regionDetailPages[4],
} as const satisfies Record<RenderedRoutePath, PageDocument>;

export const pageDocuments: readonly PageDocument[] =
  Object.values(pageDocumentRegistry);

export function getPageDocument(path: RoutePath): PageDocument {
  if (path === "/antarctica") {
    throw new Error("The Antarctica index is a redirect and has no page document.");
  }

  return pageDocumentRegistry[path];
}
