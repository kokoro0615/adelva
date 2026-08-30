import type { CardRef, CallToAction, HeroTab } from "@/content/types";

/**
 * Identity for this visual adaptation.
 *
 * The target brand, wordmark, photography and copy have no recorded
 * redistribution permission, so production ships an unmistakably original
 * neutral identity instead.
 */
export const brand = {
  name: "Antarctic Field Notes",
  wordmark: "Antarctic Field Notes",
  shortName: "Field Notes",
  tagline: "A field record of ice, light and distance.",
} as const;

export const regionTabs: readonly HeroTab[] = [
  { href: "/antarctica/wolfs-fang-runway-mountains", label: "Runway & Mountains" },
  { href: "/antarctica/schirmacher-oasis", label: "Ice-Free Oasis" },
  { href: "/antarctica/polar-plateau", label: "Polar Plateau" },
  { href: "/antarctica/atka-penguin-colony", label: "Penguin Bay" },
  { href: "/antarctica/fuel-depot", label: "Fuel Depot" },
];

export const aboutTabs: readonly HeroTab[] = [
  { href: "/about/founders", label: "Our Story" },
  { href: "/about/foundation", label: "Field Science" },
  { href: "/about/sustainability", label: "Responsible Observation" },
];

export const campTabs: readonly HeroTab[] = [
  { href: "/camps/echo-base", label: "Echo Base" },
  { href: "/camps/explorer-camp", label: "Explorer Camp" },
  { href: "/camps/whichaway-camp", label: "Lakeside Camp" },
];

export const journeyTabs: readonly HeroTab[] = [
  { href: "/itineraries/discovery-week", label: "Discovery Week" },
  {
    href: "/itineraries/south-pole-emperor-penguins",
    label: "South Pole & Emperor Penguins",
  },
  { href: "/itineraries/south-pole-blue-rivers", label: "South Pole & Blue Rivers" },
  { href: "/itineraries/antarctica-in-a-day", label: "Antarctica in a Day" },
  { href: "/itineraries/early-emperor-penguins", label: "Early Emperor Penguins" },
  { href: "/itineraries/the-long-stay", label: "The Long Stay" },
];

export const journeyCards: readonly CardRef[] = [
  {
    href: "/itineraries/discovery-week",
    kicker: "Journey",
    title: "Discovery Week",
    body: "A week inside the mountain belt, working outward from camp on foot, ski and vehicle.",
    assetId: "aerial-blue-ice",
  },
  {
    href: "/itineraries/south-pole-emperor-penguins",
    kicker: "Journey",
    title: "South Pole & Emperor Penguins",
    body: "The two longest flights of the season, joined by a stay on the sea ice.",
    assetId: "emperor-colony",
  },
  {
    href: "/itineraries/south-pole-blue-rivers",
    kicker: "Journey",
    title: "South Pole & Blue Rivers",
    body: "Meltwater channels and wind-scoured blue ice, framed by a run to the geographic pole.",
    assetId: "blue-ice-cave",
  },
  {
    href: "/itineraries/antarctica-in-a-day",
    kicker: "Day journey",
    title: "Antarctica in a Day",
    body: "One flight south, a few hours on the ice, and the same runway again before dark.",
    assetId: "ice-runway-flight",
  },
  {
    href: "/itineraries/early-emperor-penguins",
    kicker: "Season opener",
    title: "Early Emperor Penguins",
    body: "The first window of the season, when the colony is still gathered and the light is low.",
    assetId: "emperor-colony",
  },
  {
    href: "/itineraries/the-long-stay",
    kicker: "Extended",
    title: "The Long Stay",
    body: "An unhurried stretch in the interior for people who would rather stop than sample.",
    assetId: "polar-plateau",
  },
];

export const campCards: readonly CardRef[] = [
  {
    href: "/camps/echo-base",
    kicker: "Camp",
    title: "Echo Base",
    body: "The working heart of the season: flight operations, weather, and the first hot meal.",
    assetId: "polar-camp-exterior",
  },
  {
    href: "/camps/explorer-camp",
    kicker: "Camp",
    title: "Explorer Camp",
    body: "A light, movable camp set close to the colony for the short sea-ice window.",
    assetId: "polar-plateau",
  },
  {
    href: "/camps/whichaway-camp",
    kicker: "Camp",
    title: "Lakeside Camp",
    body: "Sleeping pods on bare rock above freshwater lakes, out of the plateau wind.",
    assetId: "polar-camp-interior",
  },
];

export const regionCards: readonly CardRef[] = [
  {
    href: "/antarctica/wolfs-fang-runway-mountains",
    kicker: "Region",
    title: "Runway & Mountains",
    body: "Blue ice hard enough to land on, under a wall of granite and shadow.",
    assetId: "ice-runway-flight",
  },
  {
    href: "/antarctica/schirmacher-oasis",
    kicker: "Region",
    title: "Ice-Free Oasis",
    body: "A rare band of exposed rock, meltwater lakes and moss the size of a coin.",
    assetId: "polar-camp-exterior",
  },
  {
    href: "/antarctica/polar-plateau",
    kicker: "Region",
    title: "Polar Plateau",
    body: "Two thousand metres of ice and a horizon that does not resolve into anything.",
    assetId: "polar-plateau",
  },
  {
    href: "/antarctica/atka-penguin-colony",
    kicker: "Region",
    title: "Penguin Bay",
    body: "Fast ice below an ice shelf, and the loudest place on a silent continent.",
    assetId: "emperor-colony",
  },
  {
    href: "/antarctica/fuel-depot",
    kicker: "Region",
    title: "Fuel Depot",
    body: "A marked line of drums on the plateau that decides how far a season can reach.",
    assetId: "aerial-blue-ice",
  },
];

export const planningCta: CallToAction = {
  heading: "Start a conversation",
  body: "Tell us roughly when you would like to travel and what you want to see. We will work backwards from there.",
  href: "/enquire",
  label: "Open the enquiry form",
  tone: "navy",
};

export const readOnCta: CallToAction = {
  heading: "Read the field notes",
  body: "Every region, camp and journey page is written from the same field record. Start wherever the map interests you.",
  href: "/itineraries",
  label: "See the journeys",
  tone: "deep",
};
