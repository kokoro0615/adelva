import { campCards, journeyCards, planningCta, regionCards } from "@/content/shared";
import type { PageDocument } from "@/content/types";

export const homePage: PageDocument = {
  path: "/",
  family: "home",
  title: "Antarctica",
  description:
    "A field record of Antarctic landscape, camp operations and responsible observation, written from the interior of the continent.",
  hero: {
    title: "Antarctica",
    titleStyle: "condensed",
    align: "anchor",
    lede: "A field record of ice, light and distance",
    ledeStyle: "serif",
    assetId: "hero-emperor-penguin",
  },
  sections: [
    {
      kind: "statement",
      id: "opening",
      tone: "ice",
      heading:
        "Vast, quiet and almost entirely without reference points — the interior asks you to recalibrate everything.",
      body: [
        "Nothing here is the size it looks. A ridge you take for an hour away is four hours away. A shadow on the plateau turns out to be a crevasse field the width of a city. The first day is mostly spent unlearning the scale you arrived with.",
        "These pages are the working notes behind that: what the ground is actually like, how a season is flown and fuelled, and what it takes to stand in a place without leaving much behind.",
      ],
    },
    {
      kind: "rail",
      id: "journeys",
      tone: "ice",
      heading: "Journeys",
      intro:
        "Six ways into the interior, from a single long day to a full season stay.",
      cards: journeyCards,
    },
    {
      kind: "banner",
      id: "banner-ice",
      assetId: "aerial-blue-ice",
      caption:
        "Wind-carved blue ice on the approach to the mountains. Original photography commissioned for this site.",
    },
    {
      kind: "story",
      id: "ground",
      tone: "navy",
      heading: "The ground decides the day",
      body: [
        "Blue ice is glass that will hold an aircraft. Sastrugi is the same water, cut by wind into ridges that can stop a vehicle. Between them sits soft, unconsolidated snow that swallows a boot to the knee. Reading which is which, at distance, in flat light, is most of the skill.",
        "Weather does the rest. A day is planned three ways and flown as whichever version the cloud base allows, and the decision is usually made by the people on the ground rather than by a schedule.",
      ],
      assetId: "polar-plateau",
      caption: "Sastrugi on the high plateau, late in the season.",
    },
    {
      kind: "story",
      id: "camps",
      tone: "navy",
      heading: "Camps are equipment, not architecture",
      body: [
        "Everything at a camp arrives by air or over the ice and everything eventually leaves the same way. That single constraint shapes the design: light shells, low profiles against the wind, heat kept where people actually sit.",
        "The comfort is real but it is not decorative. A warm room at the end of a cold day is an operational requirement, not a flourish.",
      ],
      assetId: "polar-camp-interior",
      caption: "A communal pod at the end of a working day.",
      flip: true,
    },
    {
      kind: "rail",
      id: "camps-rail",
      tone: "ice",
      heading: "Field camps",
      intro: "Three outposts, each built for a different part of the season.",
      cards: campCards,
    },
    {
      kind: "facts",
      id: "orientation",
      tone: "mushroom",
      heading: "Orientation",
      intro:
        "The numbers below describe the continent, not a commercial offer. Anything specific to a departure is supplied by the operator.",
      items: [
        {
          label: "Season",
          value: "Austral summer",
          note: "The operating window follows continuous daylight and workable surface conditions.",
        },
        {
          label: "Daylight",
          value: "24 hours",
          note: "There is no sunset in the interior during the season, only a long low circuit.",
        },
        {
          label: "Access",
          value: "By air",
          note: "There is no road and no port. Every arrival and departure is a flight.",
        },
        {
          label: "Residents",
          value: "None permanent",
          note: "Everyone on the continent is there temporarily, including you.",
        },
      ],
    },
    {
      kind: "rail",
      id: "regions",
      tone: "mushroom",
      heading: "Regions",
      intro: "Five distinct grounds within a single day of each other by air.",
      cards: regionCards,
    },
  ],
  cta: planningCta,
};
