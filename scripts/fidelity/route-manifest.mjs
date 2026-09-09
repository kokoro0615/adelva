export const targetOrigin = "https://white-desert.com";

export const routeManifest = [
  { path: "/", family: "home" },
  { path: "/itineraries", family: "itinerary-index" },
  { path: "/camps", family: "camp-index" },
  { path: "/about/founders", family: "about-story" },
  { path: "/about/foundation", family: "about-foundation" },
  { path: "/about/sustainability", family: "about-sustainability" },
  { path: "/antarctica/behind-the-scenes", family: "operations" },
  {
    path: "/antarctica/direct-flights-to-antarctica",
    family: "aviation",
  },
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
  {
    path: "/antarctica/wolfs-fang-runway-mountains",
    family: "region-detail",
  },
  { path: "/antarctica/schirmacher-oasis", family: "region-detail" },
  { path: "/antarctica/polar-plateau", family: "region-detail" },
  { path: "/antarctica/atka-penguin-colony", family: "region-detail" },
  { path: "/antarctica/fuel-depot", family: "region-detail" },
];

export const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

export function routeSlug(path) {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "--");
}
