import type { AssetId } from "@/content/assets";
import type { RoutePath } from "@/content/route-manifest";
import { campCards, campTabs, planningCta } from "@/content/shared";
import type { PageDocument, Section } from "@/content/types";

interface CampSpec {
  readonly path: RoutePath;
  readonly title: string;
  readonly description: string;
  readonly lede: string;
  readonly heroAssetId: AssetId;
  readonly statement: string;
  readonly story: {
    readonly heading: string;
    readonly body: readonly string[];
    readonly assetId: AssetId;
    readonly caption: string;
  };
  readonly facts: readonly {
    readonly label: string;
    readonly value: string;
    readonly note: string;
  }[];
}

const ownerCampDetails = (title: string): Section => ({
  kind: "ownerContent",
  id: "owner-details",
  tone: "mushroom",
  heading: "Dates, rates and camp specifications",
  description: `Commercial and operational details for ${title} must be supplied and approved by the site owner before publication.`,
  rows: [
    {
      label: "Operating dates",
      hint: "Owner-supplied content: confirmed seasonal opening and closing dates.",
    },
    {
      label: "Rates and availability",
      hint: "Owner-supplied content: current currency, rate basis and availability.",
    },
    {
      label: "Capacity and facilities",
      hint: "Owner-supplied content: verified capacity, room configuration and facilities.",
    },
    {
      label: "Safety and access",
      hint: "Owner-supplied content: approved access, mobility and safety information.",
    },
  ],
});

function buildCamp(spec: CampSpec): PageDocument {
  return {
    path: spec.path,
    family: "camp-detail",
    title: spec.title,
    description: spec.description,
    hero: {
      eyebrow: "Field camps",
      eyebrowStyle: "serif",
      title: spec.title,
      titleStyle: "serif-italic",
      align: "center",
      lede: spec.lede,
      ledeStyle: "serif",
      assetId: spec.heroAssetId,
      tabs: campTabs,
    },
    sections: [
      {
        kind: "statement",
        id: "overview",
        tone: "ice",
        heading: spec.statement,
        body: [
          "A field camp is best understood through the work it supports: arriving, warming up, checking conditions and preparing to move again.",
          "This editorial description is intentionally non-commercial. Confirmed accommodation and operating details belong in the owner-supplied section below.",
        ],
      },
      {
        kind: "story",
        id: "field-note",
        tone: "navy",
        ...spec.story,
      },
      {
        kind: "facts",
        id: "character",
        tone: "mushroom",
        heading: "Character of the camp",
        items: spec.facts,
      },
      ownerCampDetails(spec.title),
      {
        kind: "rail",
        id: "other-camps",
        tone: "ice",
        heading: "Other field camps",
        cards: campCards.filter((card) => card.href !== spec.path),
      },
    ],
    cta: planningCta,
  };
}

export const campIndexPage: PageDocument = {
  path: "/camps",
  family: "camp-index",
  title: "Field Camps",
  description:
    "Three field-camp settings described through shelter, shared space and their relationship to the surrounding ice.",
  hero: {
    eyebrow: "Shelter on the ice",
    eyebrowStyle: "tracked",
    title: "Field Camps",
    titleStyle: "serif",
    align: "center",
    assetId: "polar-camp-exterior",
  },
  sections: [
    {
      kind: "statement",
      id: "opening",
      tone: "ice",
      heading:
        "Each camp begins with the same question: what must this place make possible?",
      body: [
        "One setting is shaped by flight operations, another by moving lightly, and another by the shelter of exposed rock. The differences are practical before they are visual.",
        "These pages describe atmosphere and purpose only. Capacity, facilities, availability and rates require owner-approved source material.",
      ],
    },
    {
      kind: "rail",
      id: "camp-list",
      tone: "ice",
      heading: "The camps",
      cards: campCards,
    },
    {
      kind: "story",
      id: "shared-space",
      tone: "navy",
      heading: "Warmth changes the pace",
      body: [
        "A shared room gathers wet layers, field notes and the quiet part of the day. Its value is not spectacle but the simple contrast between a protected interior and the open ground outside.",
        "That contrast gives every camp its rhythm: prepare inside, observe outside, then return and reset.",
      ],
      assetId: "polar-camp-interior",
      caption:
        "An original warm interior created for the Antarctic Field Notes visual world.",
    },
    {
      kind: "ownerContent",
      id: "index-commercial",
      tone: "mushroom",
      heading: "Plan with confirmed information",
      description:
        "The site owner must provide and approve all commercial and operational camp information.",
      rows: [
        {
          label: "Season and availability",
          hint: "Owner-supplied content: confirmed operating window and live availability.",
        },
        {
          label: "Accommodation",
          hint: "Owner-supplied content: verified room types, occupancy and accessibility.",
        },
        {
          label: "Rates",
          hint: "Owner-supplied content: current rate, currency and inclusions.",
        },
      ],
    },
  ],
  cta: planningCta,
};

export const campDetailPages: readonly PageDocument[] = [
  buildCamp({
    path: "/camps/echo-base",
    title: "Runway Camp",
    description:
      "A field note on a compact Antarctic base where arrivals, weather checks and shared meals meet.",
    lede: "A working base close to the movement of a field season.",
    heroAssetId: "polar-camp-exterior",
    statement: "A camp near the runway carries the pulse of arrivals and departures.",
    story: {
      heading: "The first threshold",
      body: [
        "The defining moment is the move from the exposed landing ground into a protected room. Sound softens, layers come off and distance becomes easier to read from a window.",
        "From there the camp works as a threshold: part shelter, part briefing room, always facing back towards the weather.",
      ],
      assetId: "polar-camp-interior",
      caption: "A shared field interior looking onto the snow.",
    },
    facts: [
      {
        label: "Setting",
        value: "Open ice",
        note: "An editorial description of the visual setting, not a location guarantee.",
      },
      {
        label: "Rhythm",
        value: "Arrive and reset",
        note: "A place imagined around preparation, observation and return.",
      },
      {
        label: "Published detail",
        value: "Owner-supplied",
        note: "Facilities and access remain intentionally unstated.",
      },
    ],
  }),
  buildCamp({
    path: "/camps/explorer-camp",
    title: "Traverse Camp",
    description:
      "A field note on a light camp whose identity comes from proximity to the next stretch of ground.",
    lede: "A lighter footprint for a landscape read one move at a time.",
    heroAssetId: "polar-plateau",
    statement:
      "A movable camp makes the route, rather than the building, the centre of attention.",
    story: {
      heading: "Only what the day needs",
      body: [
        "A light camp narrows the routine to essentials: a protected place to sleep, a shared place to plan and a clear understanding of where the next move begins.",
        "Its character comes from that restraint. The landscape remains present instead of becoming a view framed by permanent architecture.",
      ],
      assetId: "polar-camp-exterior",
      caption: "Low shelters against an open field of ice.",
    },
    facts: [
      {
        label: "Setting",
        value: "Open horizon",
        note: "A broad visual field with few reference points.",
      },
      {
        label: "Rhythm",
        value: "Move and observe",
        note: "An editorial theme rather than a promised itinerary.",
      },
      {
        label: "Published detail",
        value: "Owner-supplied",
        note: "Placement, facilities and operating window require approval.",
      },
    ],
  }),
  buildCamp({
    path: "/camps/whichaway-camp",
    title: "Lakeside Camp",
    description:
      "A field note on shelter set against exposed rock, pale water and the edge of the ice.",
    lede: "A sheltered pause where rock and ice interrupt one another.",
    heroAssetId: "polar-camp-interior",
    statement:
      "Exposed rock changes the scale of a camp by giving the eye something fixed.",
    story: {
      heading: "A different edge",
      body: [
        "Where dark ground breaks through the snow, distance becomes legible again. A low shelter feels placed rather than simply surrounded.",
        "Inside, the same relationship continues through framed views and spaces intended for returning from the cold, not escaping the landscape altogether.",
      ],
      assetId: "polar-camp-exterior",
      caption: "A low camp at blue hour in an original Antarctic landscape.",
    },
    facts: [
      {
        label: "Setting",
        value: "Ice and exposed ground",
        note: "A visual description only; exact geography is owner-supplied.",
      },
      {
        label: "Rhythm",
        value: "Shelter and return",
        note: "Shared space anchors the editorial story of the camp.",
      },
      {
        label: "Published detail",
        value: "Owner-supplied",
        note: "Accommodation, access and seasonal facts remain unstated.",
      },
    ],
  }),
];
