/**
 * Application-side mirror of the fidelity route authority.
 *
 * `scripts/fidelity/route-manifest.mjs` remains the single source of truth for
 * the captured target route set. That file is untyped ESM outside the
 * TypeScript program, so this module restates it for the application and
 * `tests/unit/route-manifest.test.ts` asserts the two stay byte-equivalent in
 * path order and exact family value.
 */

export const routeManifest = [
  { path: "/", family: "home" },
  { path: "/itineraries", family: "itinerary-index" },
  { path: "/camps", family: "camp-index" },
  { path: "/about/founders", family: "about-story" },
  { path: "/about/foundation", family: "about-foundation" },
  { path: "/about/sustainability", family: "about-sustainability" },
  { path: "/antarctica/behind-the-scenes", family: "operations" },
  { path: "/antarctica/direct-flights-to-antarctica", family: "aviation" },
  { path: "/antarctica", family: "region-index-redirect" },
  { path: "/prices", family: "rates" },
  { path: "/enquire", family: "enquiry-form" },
  { path: "/legal/website-terms", family: "legal" },
  { path: "/legal/booking-terms", family: "legal" },
  { path: "/legal/privacy-policy", family: "legal" },
  { path: "/legal/cookies", family: "legal" },
  { path: "/legal/medical-disclaimer", family: "legal" },
  { path: "/camps/echo-base", family: "camp-detail" },
  { path: "/camps/explorer-camp", family: "camp-detail" },
  { path: "/camps/whichaway-camp", family: "camp-detail" },
  { path: "/itineraries/discovery-week", family: "itinerary-detail" },
  {
    path: "/itineraries/south-pole-emperor-penguins",
    family: "itinerary-detail",
  },
  { path: "/itineraries/south-pole-blue-rivers", family: "itinerary-detail" },
  { path: "/itineraries/antarctica-in-a-day", family: "itinerary-day" },
  { path: "/itineraries/early-emperor-penguins", family: "itinerary-detail" },
  { path: "/itineraries/the-long-stay", family: "itinerary-detail" },
  { path: "/antarctica/wolfs-fang-runway-mountains", family: "region-detail" },
  { path: "/antarctica/schirmacher-oasis", family: "region-detail" },
  { path: "/antarctica/polar-plateau", family: "region-detail" },
  { path: "/antarctica/atka-penguin-colony", family: "region-detail" },
  { path: "/antarctica/fuel-depot", family: "region-detail" },
] as const;

export type RoutePath = (typeof routeManifest)[number]["path"];
export type RouteFamily = (typeof routeManifest)[number]["family"];

/**
 * Observed target behaviour: `/antarctica` resolves to the first region detail.
 * Implemented as an HTTP redirect in `next.config.ts`; restated here so route
 * data, navigation and tests read the destination from one place.
 */
export const routeRedirects = [
  {
    from: "/antarctica",
    to: "/antarctica/wolfs-fang-runway-mountains",
  },
] as const satisfies ReadonlyArray<{ from: RoutePath; to: RoutePath }>;

export const renderedRoutes = routeManifest.filter(
  (route) => route.family !== "region-index-redirect",
);

export function familyOf(path: RoutePath): RouteFamily {
  const record = routeManifest.find((route) => route.path === path);
  if (!record) {
    throw new Error(`Unknown route path: ${path}`);
  }
  return record.family;
}

export function pathsInFamily(family: RouteFamily): RoutePath[] {
  return routeManifest
    .filter((route) => route.family === family)
    .map((route) => route.path);
}
