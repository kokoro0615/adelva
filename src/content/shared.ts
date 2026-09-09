import type { CardRef, CallToAction, HeroTab } from "@/content/types";

/** Authorized client identity for the production reconstruction. */
export const brand = {
  name: "White Desert",
  wordmark: "White Desert",
  shortName: "White Desert",
  tagline: "Luxury and adventure in the most remote place on Earth",
} as const;

export const regionTabs: readonly HeroTab[] = [
  { href: "/antarctica/polar-plateau", label: "The High Polar Plateau" },
  { href: "/antarctica/fuel-depot", label: "Ice Shelf Coast" },
  {
    href: "/antarctica/atka-penguin-colony",
    label: "Emperor Penguin Ice Fields",
  },
  { href: "/antarctica/wolfs-fang-runway-mountains", label: "The Mountains" },
  { href: "/antarctica/schirmacher-oasis", label: "The Rock Oasis" },
];

export const aboutTabs: readonly HeroTab[] = [
  { href: "/about/founders", label: "Founders" },
  { href: "/about/foundation", label: "Foundation" },
  { href: "/about/sustainability", label: "Sustainability" },
];

export const campTabs: readonly HeroTab[] = [
  { href: "/camps/whichaway-camp", label: "Whichaway Camp" },
  { href: "/camps/echo-base", label: "Echo Base" },
  { href: "/camps/explorer-camp", label: "Explorer Camp" },
];

export const journeyTabs: readonly HeroTab[] = [
  {
    href: "/itineraries/early-emperor-penguins",
    label: "Baby Penguins & Blue Tunnels",
  },
  {
    href: "/itineraries/south-pole-emperor-penguins",
    label: "South Pole & Penguins",
  },
  { href: "/itineraries/south-pole-blue-rivers", label: "South Pole & Blue Rivers" },
  { href: "/itineraries/the-long-stay", label: "The Long Stay" },
  { href: "/itineraries/antarctica-in-a-day", label: "Antarctica in a Day" },
  { href: "/itineraries/discovery-week", label: "Discovery Week" },
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
