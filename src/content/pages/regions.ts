import type { AssetId } from "@/content/assets";
import type { RoutePath } from "@/content/route-manifest";
import { planningCta, regionCards, regionTabs } from "@/content/shared";
import type { PageDocument } from "@/content/types";

interface RegionSpec {
  readonly path: RoutePath;
  readonly title: string;
  readonly description: string;
  readonly lede: string;
  readonly heroAssetId: AssetId;
  readonly statement: string;
  readonly body: readonly string[];
  readonly storyHeading: string;
  readonly storyBody: readonly string[];
  readonly storyAssetId: AssetId;
  readonly storyCaption: string;
  readonly character: readonly {
    readonly label: string;
    readonly value: string;
    readonly note: string;
  }[];
}

function buildRegion(spec: RegionSpec): PageDocument {
  return {
    path: spec.path,
    family: "region-detail",
    title: spec.title,
    description: spec.description,
    hero: {
      eyebrow: "Regions",
      eyebrowStyle: "serif",
      title: spec.title,
      titleStyle: "serif",
      align: "center",
      lede: spec.lede,
      ledeStyle: "serif",
      assetId: spec.heroAssetId,
      tabs: regionTabs,
    },
    sections: [
      {
        kind: "statement",
        id: "overview",
        tone: "ice",
        heading: spec.statement,
        body: spec.body,
      },
      {
        kind: "story",
        id: "field-note",
        tone: "navy",
        heading: spec.storyHeading,
        body: spec.storyBody,
        assetId: spec.storyAssetId,
        caption: spec.storyCaption,
      },
      {
        kind: "facts",
        id: "character",
        tone: "mushroom",
        heading: "Reading the ground",
        intro:
          "Editorial orientation only. Access, conditions and operating constraints require owner confirmation.",
        items: spec.character,
      },
      {
        kind: "ownerContent",
        id: "region-operations",
        tone: "mushroom",
        heading: "Access and conditions",
        description:
          "No access, safety, timing or availability claim is made without current owner-approved information.",
        rows: [
          {
            label: "Access",
            hint: "Owner-supplied content: approved route, limits and mobility considerations.",
          },
          {
            label: "Seasonal conditions",
            hint: "Owner-supplied content: current operating window and decision process.",
          },
          {
            label: "Environmental controls",
            hint: "Owner-supplied content: applicable permits, site rules and evidence.",
          },
        ],
      },
      {
        kind: "rail",
        id: "other-regions",
        tone: "ice",
        heading: "Other regions",
        cards: regionCards.filter((card) => card.href !== spec.path),
      },
    ],
    cta: planningCta,
  };
}

export const regionDetailPages: readonly PageDocument[] = [
  buildRegion({
    path: "/antarctica/wolfs-fang-runway-mountains",
    title: "Runway & Mountains",
    description:
      "An editorial field note on the meeting of a broad ice landing ground and a dark mountain horizon.",
    lede: "A pale landing ground held beneath a wall of rock and weather.",
    heroAssetId: "ice-runway-flight",
    statement:
      "The runway makes arrival legible; the mountains immediately undo that sense of scale.",
    body: [
      "From the aircraft, the ice reads as a surface with direction. Beyond it, dark ridges interrupt the horizon and make the apparent distances unreliable again.",
      "The contrast gives this region its visual character: marked ground in the foreground, unresolved terrain beyond.",
    ],
    storyHeading: "A line through open ground",
    storyBody: [
      "A landing strip is a temporary graphic laid across a much older surface. Markers and tracks create order, but only within a narrow field of view.",
      "Turn away from that line and the landscape returns to light, shadow and very few useful reference points.",
    ],
    storyAssetId: "polar-plateau",
    storyCaption: "An original plateau view towards a dark Antarctic ridge.",
    character: [
      {
        label: "Foreground",
        value: "Marked ice",
        note: "Lines and tracks lend the open surface a temporary scale.",
      },
      {
        label: "Horizon",
        value: "Dark ridge",
        note: "Rock and shadow form the dominant visual boundary.",
      },
      {
        label: "Operational facts",
        value: "Owner-supplied",
        note: "Runway specifications and access details remain unstated.",
      },
    ],
  }),
  buildRegion({
    path: "/antarctica/schirmacher-oasis",
    title: "Ice-Free Oasis",
    description:
      "An editorial field note on dark exposed ground, pale water and the edge of the surrounding ice.",
    lede: "Where exposed ground gives the eye a scale again.",
    heroAssetId: "polar-camp-exterior",
    statement:
      "Rock interrupts the white field and changes how every distance is read.",
    body: [
      "Dark ground creates edges, pockets and routes that a uniform snow surface does not reveal. Small changes in elevation suddenly become visible.",
      "This page stays with that visual observation. Exact geography, ecology and access conditions require approved sources.",
    ],
    storyHeading: "The usefulness of an edge",
    storyBody: [
      "On open ice, one pale surface can merge into the next. Exposed ground restores foreground and background, making a shelter or traveller appear placed rather than floating.",
      "Water and rock also demand care in description: an image can record appearance without proving a scientific or environmental claim.",
    ],
    storyAssetId: "aerial-blue-ice",
    storyCaption:
      "An original aerial study used as editorial atmosphere, not geographic evidence.",
    character: [
      {
        label: "Contrast",
        value: "Rock and ice",
        note: "Dark ground breaks the visual continuity of the snow.",
      },
      {
        label: "Scale",
        value: "Closer reference points",
        note: "Edges make nearby terrain easier to read.",
      },
      {
        label: "Ecological facts",
        value: "Owner-supplied",
        note: "No habitat or species claim is made here.",
      },
    ],
  }),
  buildRegion({
    path: "/antarctica/polar-plateau",
    title: "High Polar Plateau",
    description:
      "An editorial field note on wind-shaped snow, long horizons and the difficulty of reading scale.",
    lede: "A horizon so continuous that movement becomes the only measure.",
    heroAssetId: "polar-plateau",
    statement: "The plateau appears simple until the surface begins to show its grain.",
    body: [
      "Wind leaves ridges, polished patches and soft accumulations across what first looks like a uniform field. The eye learns to read texture before distance.",
      "A person in the frame provides scale, but the horizon continues to resist it.",
    ],
    storyHeading: "Texture before distance",
    storyBody: [
      "Low light makes every ridge legible; flat light removes much of that information. The same ground can therefore feel intricate or almost blank without changing at all.",
      "A field note records the light and viewpoint alongside the observation so the image is not asked to explain more than it can.",
    ],
    storyAssetId: "aerial-blue-ice",
    storyCaption: "An original overhead view of wind-shaped blue ice.",
    character: [
      {
        label: "Surface",
        value: "Wind-shaped",
        note: "Texture gives the nearest ground its visual rhythm.",
      },
      {
        label: "Horizon",
        value: "Continuous",
        note: "Few fixed points make apparent distance unreliable.",
      },
      {
        label: "Conditions",
        value: "Owner-supplied",
        note: "Altitude, temperature and access are intentionally unstated.",
      },
    ],
  }),
  buildRegion({
    path: "/antarctica/atka-penguin-colony",
    title: "Penguin Bay",
    description:
      "An editorial field note on observing emperor penguins without turning an image into a wildlife promise.",
    lede: "A living point of focus within a broad field of sea ice.",
    heroAssetId: "emperor-colony",
    statement:
      "Wildlife observation begins with distance, stillness and a willingness to leave.",
    body: [
      "The photograph provides a close visual study, not a guarantee of access, timing or encounter. Animals move independently of a page or itinerary.",
      "Any published observation protocol, seasonal condition or site rule must come from the responsible owner and current authority.",
    ],
    storyHeading: "Let movement belong to the birds",
    storyBody: [
      "A patient frame allows posture, spacing and direction to carry the story. The observer does not need to become the centre of it.",
      "That restraint also keeps the editorial language honest: describe the image, avoid predicting the encounter.",
    ],
    storyAssetId: "emperor-colony",
    storyCaption:
      "An original emperor penguin study; no encounter or access is promised.",
    character: [
      {
        label: "Focus",
        value: "Wildlife at distance",
        note: "Observation is framed around patience rather than proximity.",
      },
      {
        label: "Setting",
        value: "Open sea ice",
        note: "A visual description of the commissioned image only.",
      },
      {
        label: "Access and protocol",
        value: "Owner-supplied",
        note: "No seasonal or wildlife-access claim is made here.",
      },
    ],
  }),
  buildRegion({
    path: "/antarctica/fuel-depot",
    title: "Plateau Waypoint",
    description:
      "An editorial field note on a marked operational waypoint within an otherwise continuous polar landscape.",
    lede: "A small set of markers that gives direction to an open horizon.",
    heroAssetId: "aerial-blue-ice",
    statement:
      "On the plateau, a waypoint is less a destination than a moment of orientation.",
    body: [
      "Tracks and markers create a local grammar on the ice: approach, pause, check and continue. Beyond them, the surface remains visually continuous.",
      "This adaptation does not state what is stored, who operates the site or what range it enables. Those are owner-controlled operational facts.",
    ],
    storyHeading: "The smallest landmark",
    storyBody: [
      "A few repeated shapes can become the most prominent feature in a vast field. Their visual importance comes from contrast rather than size.",
      "The field note treats them as a composition and leaves capability, logistics and environmental controls to verified documentation.",
    ],
    storyAssetId: "ice-runway-flight",
    storyCaption: "An original operational landscape used without a capability claim.",
    character: [
      {
        label: "Landmark",
        value: "Marked waypoint",
        note: "Repeated forms interrupt an otherwise open surface.",
      },
      {
        label: "Rhythm",
        value: "Pause and continue",
        note: "An editorial reading, not an operating instruction.",
      },
      {
        label: "Logistics",
        value: "Owner-supplied",
        note: "Storage, capacity, permits and controls remain unstated.",
      },
    ],
  }),
];
