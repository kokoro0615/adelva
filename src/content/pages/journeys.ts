import type { AssetId } from "@/content/assets";
import type { RouteFamily, RoutePath } from "@/content/route-manifest";
import { journeyCards, journeyTabs, planningCta } from "@/content/shared";
import type { PageDocument, Section } from "@/content/types";

interface JourneySpec {
  readonly path: RoutePath;
  readonly family: RouteFamily;
  readonly title: string;
  readonly description: string;
  readonly lede: string;
  readonly assetId: AssetId;
  readonly statement: { readonly heading: string; readonly body: readonly string[] };
  readonly steps: readonly {
    readonly label: string;
    readonly heading: string;
    readonly body: string;
  }[];
  readonly story: {
    readonly heading: string;
    readonly body: readonly string[];
    readonly assetId: AssetId;
    readonly caption: string;
  };
  readonly conditions: readonly {
    readonly label: string;
    readonly value: string;
    readonly note: string;
  }[];
  readonly bannerAssetId: AssetId;
  readonly bannerCaption: string;
}

const ownerRates = (title: string): Section => ({
  kind: "ownerContent",
  id: "commercial",
  tone: "mushroom",
  heading: "Dates and rates",
  description: `Commercial detail for ${title} is owner-supplied. Nothing on this page states a price, a departure date, availability or a booking term, because none of that has been provided for this adaptation.`,
  rows: [
    {
      label: "Departure dates",
      hint: "Owner-supplied. Replace with the confirmed date range for each departure.",
    },
    {
      label: "Rate per person",
      hint: "Owner-supplied. Replace with the published rate, currency and sharing basis.",
    },
    {
      label: "What the rate covers",
      hint: "Owner-supplied. Replace with the inclusions and exclusions the operator publishes.",
    },
    {
      label: "Booking terms",
      hint: "Owner-supplied. Link to the operator booking terms rather than restating them here.",
    },
  ],
});

function buildJourney(spec: JourneySpec): PageDocument {
  return {
    path: spec.path,
    family: spec.family,
    title: spec.title,
    description: spec.description,
    hero: {
      eyebrow: "Journeys",
      eyebrowStyle: "serif",
      title: spec.title,
      titleStyle: "serif-italic",
      align: "center",
      lede: spec.lede,
      meta: [
        { label: "Rate", value: "Owner-supplied" },
        { label: "Dates", value: "Owner-supplied" },
      ],
      assetId: spec.assetId,
      tabs: journeyTabs,
    },
    sections: [
      {
        kind: "statement",
        id: "overview",
        tone: "ice",
        heading: spec.statement.heading,
        body: spec.statement.body,
      },
      {
        kind: "sequence",
        id: "itinerary",
        tone: "ice",
        heading: "How the time is spent",
        intro:
          "A working outline rather than a timetable. Order and length shift with weather, surface and daylight.",
        steps: spec.steps,
      },
      {
        kind: "story",
        id: "field-note",
        tone: "navy",
        heading: spec.story.heading,
        body: spec.story.body,
        assetId: spec.story.assetId,
        caption: spec.story.caption,
      },
      {
        kind: "banner",
        id: "banner",
        assetId: spec.bannerAssetId,
        caption: spec.bannerCaption,
      },
      {
        kind: "facts",
        id: "conditions",
        tone: "mushroom",
        heading: "Field conditions",
        items: spec.conditions,
      },
      ownerRates(spec.title),
      {
        kind: "rail",
        id: "related",
        tone: "ice",
        heading: "Other journeys",
        cards: journeyCards.filter((card) => card.href !== spec.path),
      },
    ],
    cta: planningCta,
  };
}

export const journeyIndexPage: PageDocument = {
  path: "/itineraries",
  family: "itinerary-index",
  title: "Journeys",
  description:
    "Six ways into the Antarctic interior, from a single long day on the ice to an extended stay in the mountains.",
  hero: {
    eyebrow: "Six ways south",
    eyebrowStyle: "tracked",
    title: "Journeys",
    titleStyle: "serif",
    align: "center",
    assetId: "aerial-blue-ice",
  },
  sections: [
    {
      kind: "statement",
      id: "opening",
      tone: "ice",
      heading: "Every journey below is the same continent read at a different speed.",
      body: [
        "The short ones are about arrival: the flight, the first step onto blue ice, the shock of the light. The long ones are about staying long enough for the place to stop being an event and start being a landscape.",
        "None of them is a tour in the usual sense. Weather sets the order, the ground sets the pace, and the plan is rewritten most mornings.",
      ],
    },
    {
      kind: "rail",
      id: "journeys",
      tone: "ice",
      heading: "The journeys",
      cards: journeyCards,
    },
    {
      kind: "story",
      id: "how-to-choose",
      tone: "navy",
      heading: "Choosing between them",
      body: [
        "The honest sorting question is not which is most impressive but how much unstructured time you want. A day journey gives you one clean, complete memory. A week gives you weather, which is where the continent actually shows itself.",
        "If wildlife is the reason you are going, the season window matters more than the itinerary name: the colony is only reachable while the sea ice holds.",
      ],
      assetId: "emperor-colony",
      caption: "An emperor colony on fast ice, early in the season.",
    },
    {
      kind: "facts",
      id: "shared",
      tone: "mushroom",
      heading: "Shared across every journey",
      items: [
        {
          label: "Access",
          value: "Long-haul flight",
          note: "Every journey begins and ends with a flight to and from a prepared ice runway.",
        },
        {
          label: "Movement",
          value: "Foot, ski, vehicle",
          note: "Ground movement is short-range and weather-dependent, never guaranteed in advance.",
        },
        {
          label: "Light",
          value: "Continuous",
          note: "There is no night during the season, which changes how long a day can usefully be.",
        },
        {
          label: "Group size",
          value: "Owner-supplied",
          note: "Party size and guiding ratios are set by the operator and are not stated here.",
        },
      ],
    },
  ],
  cta: planningCta,
};

export const journeyDetailPages: readonly PageDocument[] = [
  buildJourney({
    path: "/itineraries/discovery-week",
    family: "itinerary-detail",
    title: "Discovery Week",
    description:
      "A week worked outward from camp in the mountain belt, on foot, ski and vehicle.",
    lede: "A week inside the mountain belt, working outward from camp each day and returning to the same horizon.",
    assetId: "aerial-blue-ice",
    statement: {
      heading:
        "Seven days is roughly the point at which the interior stops being a spectacle.",
      body: [
        "The first two days are noise: the flight, the light, the cold that behaves differently from any cold you know. By the third, the routine takes over and you start noticing smaller things — the sound the surface makes underfoot, how the wind changes at a ridge line, where the meltwater goes.",
        "The week is built around that shift. Nothing is scheduled so tightly that the weather cannot rewrite it, and nothing important happens so early that a bad first day loses it.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "Arrival and acclimatisation",
        body: "Landing on blue ice, a short transfer, and a deliberately slow first afternoon. Altitude, dehydration and glare all arrive before you notice them.",
      },
      {
        label: "Stage 02",
        heading: "The nearest ground",
        body: "Short walks from camp to establish scale, practise layering and learn what the surface does under different loads.",
      },
      {
        label: "Stage 03",
        heading: "Into the mountain belt",
        body: "Longer days towards the granite walls, moving between wind-scoured ice and drift, with turning points set by conditions rather than distance.",
      },
      {
        label: "Stage 04",
        heading: "A weather day",
        body: "There is almost always one. It is planned for rather than resented: maintenance, notes, reading, and the best conversations of the week.",
      },
      {
        label: "Stage 05",
        heading: "The long look",
        body: "A final full day chosen from whatever the forecast offers, then packing down and the flight north.",
      },
    ],
    story: {
      heading: "What a normal morning looks like",
      body: [
        "Breakfast is early and unhurried, because the light will not change and there is no reason to chase it. The day is decided over the second cup: cloud base, wind, surface temperature, and what everyone has left in the tank.",
        "Then it is layers, radios, water, and a walk that starts flat and stays flat for longer than seems reasonable.",
      ],
      assetId: "polar-camp-interior",
      caption: "The communal pod, mid-morning.",
    },
    conditions: [
      {
        label: "Terrain",
        value: "Ice and rock",
        note: "Blue ice, drift snow and exposed granite, often within the same hour of walking.",
      },
      {
        label: "Movement",
        value: "Mostly on foot",
        note: "Vehicle support for longer transits; skis where the surface rewards them.",
      },
      {
        label: "Weather",
        value: "Plan for delay",
        note: "At least one non-moving day per week is normal and is built into the outline.",
      },
      {
        label: "Effort",
        value: "Moderate",
        note: "Long, flat days rather than technical ground. Cold, not gradient, is the limiting factor.",
      },
    ],
    bannerAssetId: "polar-plateau",
    bannerCaption:
      "Late-week light across the sastrugi field east of camp. Original photography commissioned for this site.",
  }),
  buildJourney({
    path: "/itineraries/south-pole-emperor-penguins",
    family: "itinerary-detail",
    title: "South Pole & Emperor Penguins",
    description:
      "The two longest flights of the season joined by a stay on the sea ice beside an emperor colony.",
    lede: "The two longest flights of the season, joined by time on the sea ice beside a colony.",
    assetId: "emperor-colony",
    statement: {
      heading:
        "Two very different silences: the pole, which is empty, and the colony, which is not.",
      body: [
        "The geographic pole is an administrative point on a featureless plain. Its power is entirely conceptual — you are standing where every direction is north — and the landscape does nothing to help. It is the flattest, quietest place on the journey.",
        "The colony is the opposite. It is loud, warm-smelling, constantly moving, and close enough to the ice edge that the weather turns fast. Doing both in one journey is the point.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "South to the interior",
        body: "Arrival on blue ice, kit check, and a first night at altitude before any long flying.",
      },
      {
        label: "Stage 02",
        heading: "The pole flight",
        body: "A refuelling leg across the plateau and a short window on the ground at the geographic pole, entirely weather-dependent.",
      },
      {
        label: "Stage 03",
        heading: "Down to the sea ice",
        body: "Repositioning towards the coast and a camp set at a distance from the colony that keeps disturbance low.",
      },
      {
        label: "Stage 04",
        heading: "Time at the colony",
        body: "Long, slow observation sessions on foot. Approach distances are fixed and enforced, and the birds decide how close the encounter becomes.",
      },
      {
        label: "Stage 05",
        heading: "Return north",
        body: "Back to the interior camp and out on the next available runway window.",
      },
    ],
    story: {
      heading: "Watching without interfering",
      body: [
        "The rule at the colony is that movement belongs to the birds. You approach to a set line, sit down, stop moving, and wait. Adults walking to and from the ice edge will often pass much closer than the line you were not allowed to cross.",
        "It is slower and colder than it sounds, and it is the only version of the encounter worth having.",
      ],
      assetId: "emperor-colony",
      caption: "An adult and chick at the edge of the colony.",
    },
    conditions: [
      {
        label: "Terrain",
        value: "Sea ice and plateau",
        note: "Flat throughout. The hazard is cold and wind exposure, not difficulty underfoot.",
      },
      {
        label: "Altitude",
        value: "High interior",
        note: "The plateau legs sit well above sea level; the first days are deliberately slow.",
      },
      {
        label: "Wildlife distance",
        value: "Fixed approach line",
        note: "Approach limits are set before departure and are not adjusted on the day.",
      },
      {
        label: "Flying",
        value: "Weather-led",
        note: "Both long legs are subject to cancellation and re-scheduling without notice.",
      },
    ],
    bannerAssetId: "aerial-blue-ice",
    bannerCaption:
      "The plateau on the return leg. Original photography commissioned for this site.",
  }),
  buildJourney({
    path: "/itineraries/south-pole-blue-rivers",
    family: "itinerary-detail",
    title: "South Pole & Blue Rivers",
    description:
      "Meltwater channels and wind-scoured blue ice, framed by a flight to the geographic pole.",
    lede: "Meltwater channels and wind-scoured blue ice, framed by a run to the geographic pole.",
    assetId: "blue-ice-cave",
    statement: {
      heading:
        "For a few weeks each summer, parts of the ice sheet behave like a river system.",
      body: [
        "Surface melt collects in shallow channels, cuts down into older ice, and disappears into it. What is left when the flow stops is a set of blue passages, chambers and overhangs that are structural rather than decorative — the shape of where water went.",
        "They are also unstable, seasonal and easy to damage, which is why access is short, guided and deliberately limited.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "Arrival",
        body: "Blue ice landing, transfer and an easy first day while the body catches up.",
      },
      {
        label: "Stage 02",
        heading: "Reading the ice",
        body: "A walk-out to the margin of the blue-ice field to learn how the surface is drained and where it is safe.",
      },
      {
        label: "Stage 03",
        heading: "The channels",
        body: "Guided time in and around the meltwater features, with route and duration decided that morning.",
      },
      {
        label: "Stage 04",
        heading: "The pole flight",
        body: "A long plateau transit and a short window on the ground, subject to weather at both ends.",
      },
      {
        label: "Stage 05",
        heading: "Out",
        body: "A last day held in reserve, then the return flight north.",
      },
    ],
    story: {
      heading: "Blue is a thickness, not a colour",
      body: [
        "Ice looks blue when it is old, dense and free of trapped air, and when there is enough of it between you and the light. The colour deepens the further the light has to travel, which is why a chamber reads pale at the entrance and almost navy at the back.",
        "It also means the colour is a reliable signal of how much mass is above you, which is a more practical thing to notice than a beautiful one.",
      ],
      assetId: "blue-ice-cave",
      caption: "Layered ice inside a drained meltwater chamber.",
    },
    conditions: [
      {
        label: "Terrain",
        value: "Hard ice",
        note: "Traction devices throughout. Surfaces are polished and unforgiving of a casual step.",
      },
      {
        label: "Access",
        value: "Guided only",
        note: "Meltwater features are entered with a guide, on a route checked the same day.",
      },
      {
        label: "Season",
        value: "Narrow window",
        note: "The features exist only while summer melt and refreeze have both happened.",
      },
      {
        label: "Impact",
        value: "Minimised",
        note: "Small parties, fixed routes, nothing left behind and nothing broken off.",
      },
    ],
    bannerAssetId: "aerial-blue-ice",
    bannerCaption:
      "The blue-ice field from the air. Original photography commissioned for this site.",
  }),
  buildJourney({
    path: "/itineraries/antarctica-in-a-day",
    family: "itinerary-day",
    title: "Antarctica in a Day",
    description:
      "One flight south, a few hours on the ice, and the same runway again before the day ends.",
    lede: "One flight south, a few hours on the ice, and the same runway again before the day is out.",
    assetId: "ice-runway-flight",
    statement: {
      heading:
        "A single day is not a compromise version of a week. It is a different experience with a different shape.",
      body: [
        "There is no acclimatisation, no routine and no weather day. What there is instead is compression: you step out of an aircraft into a landscape with no reference points and you have a fixed number of hours to take it in.",
        "People who do this often describe the flight home as the part they remember, which is worth knowing before you book anything.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "Departure window",
        body: "The whole day hinges on a runway forecast at the far end. Departure is confirmed only hours before it happens.",
      },
      {
        label: "Stage 02",
        heading: "The flight south",
        body: "Several hours over open water and then over ice, with the transition from one to the other clearly visible.",
      },
      {
        label: "Stage 03",
        heading: "On the ice",
        body: "A short, structured time on the ground near the runway: walking, looking, and a hot drink out of the wind.",
      },
      {
        label: "Stage 04",
        heading: "Turnaround",
        body: "Aircraft servicing on the ice is time-critical in cold conditions, so the ground window is firm.",
      },
      {
        label: "Stage 05",
        heading: "North again",
        body: "The same route reversed, usually much quieter on board than the outbound leg.",
      },
    ],
    story: {
      heading: "Why the runway is the whole story",
      body: [
        "A blue-ice runway is not built so much as found and maintained: a stretch of old, dense, wind-cleared ice hard enough to take a wheeled aircraft. Keeping it usable is a season-long job of sweeping, surveying and marking.",
        "Because there is no alternate airfield within useful range, a day journey only launches when the forecast at the ice end is good for the full return window. That single fact explains most cancellations.",
      ],
      assetId: "ice-runway-flight",
      caption: "Final approach to a prepared ice runway.",
    },
    conditions: [
      {
        label: "Ground time",
        value: "A few hours",
        note: "Fixed by aircraft turnaround requirements rather than by the itinerary.",
      },
      {
        label: "Effort",
        value: "Low",
        note: "Short, flat walking close to the runway. Suitable for most reasonable mobility levels.",
      },
      {
        label: "Cancellation",
        value: "Common",
        note: "Weather at the ice end cancels days regularly. Build slack into surrounding travel.",
      },
      {
        label: "Overnight",
        value: "None planned",
        note: "There is no scheduled night on the continent, but contingency arrangements exist.",
      },
    ],
    bannerAssetId: "polar-plateau",
    bannerCaption:
      "The plateau beyond the runway apron. Original photography commissioned for this site.",
  }),
  buildJourney({
    path: "/itineraries/early-emperor-penguins",
    family: "itinerary-detail",
    title: "Early Emperor Penguins",
    description:
      "The opening window of the season, when the sea ice is at its most reliable and the light is lowest.",
    lede: "The opening window of the season, when the sea ice is still thick and the light stays low.",
    assetId: "emperor-colony",
    statement: {
      heading:
        "Early season is colder, darker at the edges of the day, and by some distance the better light.",
      body: [
        "The sun sits lower for longer, which gives the ice texture and the birds an outline. It is also when the fast ice is at its most dependable, which is the practical reason the window exists at all.",
        "The trade is comfort. Wind chill is harsher, gear matters more, and standing still to watch is genuinely hard work.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "Season opening",
        body: "Arrival with the first flights of the season, into camps that have just been reopened.",
      },
      {
        label: "Stage 02",
        heading: "Sea ice assessment",
        body: "Route and camp placement are set by ice thickness surveys carried out before anyone walks out.",
      },
      {
        label: "Stage 03",
        heading: "Observation days",
        body: "Repeated sessions at a fixed distance, at different points in the low-light cycle.",
      },
      {
        label: "Stage 04",
        heading: "Weather hold",
        body: "Early season wind events are frequent. Holding days at camp are the normal case, not the exception.",
      },
      {
        label: "Stage 05",
        heading: "Departure",
        body: "Out on the first available window, with a flexible return leg.",
      },
    ],
    story: {
      heading: "Cold as a working constraint",
      body: [
        "Standing still in a strong wind at low temperature is the single most demanding thing on this journey. Everything else — the flying, the walking, the camp — is easier than the act of watching patiently.",
        "The practical answer is layering discipline, short rotations, and a shelter within reach. The unhelpful answer is enthusiasm, which does not keep hands warm.",
      ],
      assetId: "polar-camp-exterior",
      caption: "Camp reopened for the first flights of the season.",
    },
    conditions: [
      {
        label: "Temperature",
        value: "Season minimum",
        note: "The coldest window of the operating season, with meaningful wind chill.",
      },
      {
        label: "Light",
        value: "Low and long",
        note: "Extended low-angle light rather than the flat overhead light of midsummer.",
      },
      {
        label: "Sea ice",
        value: "At its thickest",
        note: "The reason the early window exists; still surveyed before every movement.",
      },
      {
        label: "Flexibility",
        value: "Essential",
        note: "Early-season schedules move. Treat published outlines as intent, not commitment.",
      },
    ],
    bannerAssetId: "emperor-colony",
    bannerCaption:
      "The colony in low early-season light. Original photography commissioned for this site.",
  }),
  buildJourney({
    path: "/itineraries/the-long-stay",
    family: "itinerary-detail",
    title: "The Long Stay",
    description:
      "An extended, unhurried stretch in the interior for people who would rather stop than sample.",
    lede: "An unhurried stretch in the interior for people who would rather stop than sample.",
    assetId: "polar-plateau",
    statement: {
      heading:
        "Given enough time, the interior stops being extreme and starts being ordinary. That is the point.",
      body: [
        "The first week is arrival. The second is when the landscape flattens into routine and you begin to notice the parts that are actually interesting: how the surface changes with a two-degree temperature shift, where the drift accumulates, what the light does at what most people would call three in the morning.",
        "It is the least dramatic way to spend time here and the one people talk about longest afterwards.",
      ],
    },
    steps: [
      {
        label: "Stage 01",
        heading: "Settling in",
        body: "A slow first week: short days, long sleeps, and learning the camp rather than the region.",
      },
      {
        label: "Stage 02",
        heading: "Working outward",
        body: "Progressively longer traverses as fitness, acclimatisation and confidence allow.",
      },
      {
        label: "Stage 03",
        heading: "A project of your own",
        body: "Most long-stay guests end up with something they are tracking: a route, a set of photographs, a log. It is encouraged.",
      },
      {
        label: "Stage 04",
        heading: "The quiet middle",
        body: "The stretch with no milestones in it, which is where the stay does its actual work.",
      },
      {
        label: "Stage 05",
        heading: "Leaving well",
        body: "Camp break-down participation, a final traverse, and out on a flexible window.",
      },
    ],
    story: {
      heading: "Time is the only luxury here",
      body: [
        "Nothing on this continent can be bought faster. Fuel is finite, aircraft are weather-bound, and the surface does what it does. The only variable a guest genuinely controls is how long they are willing to stay.",
        "Long stays are also the least resource-intensive way to spend a given number of days here, because the flying is the expensive and impactful part, not the sitting still.",
      ],
      assetId: "polar-plateau",
      caption: "A traverse east of camp in the second week.",
    },
    conditions: [
      {
        label: "Duration",
        value: "Extended",
        note: "Exact length is agreed with the operator around aircraft windows; not stated here.",
      },
      {
        label: "Pace",
        value: "Self-directed",
        note: "Days are shaped around what you want to do, within camp safety limits.",
      },
      {
        label: "Isolation",
        value: "Real",
        note: "Communication is limited and evacuation is weather-dependent. This matters.",
      },
      {
        label: "Suitability",
        value: "Considered",
        note: "Discuss medical and psychological suitability with the operator before committing.",
      },
    ],
    bannerAssetId: "polar-camp-exterior",
    bannerCaption:
      "Camp under a low midnight sun. Original photography commissioned for this site.",
  }),
];
