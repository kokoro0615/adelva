/**
 * The two authorized White Desert index pages.
 *
 * These routes intentionally have their own model. The live index pages are
 * composed pages rather than instances of the editorial `PageDocument`
 * renderer used by the rest of the adaptation. Keeping the measured topology
 * here makes the order, counts, and target copy auditable without changing the
 * shared route data used by detail pages.
 */

export interface IndexImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
  readonly focal?: string;
}

export interface IndexTrip {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly price: string;
  readonly season?: string;
  readonly sideLabel?: string;
  readonly metaLabel?: string;
  readonly excerpt: string;
  readonly image: IndexImage;
}

export type IndexItinerary = IndexTrip;

export interface IndexCamp {
  readonly id: string;
  readonly title: string;
  readonly href: string;
  readonly coordinates: string;
  readonly body: string;
  readonly image: IndexImage;
}

export interface IndexHero {
  readonly eyebrow: string;
  readonly title: string;
  readonly image: IndexImage;
}

export interface IndexPageContent {
  readonly route: "itineraries" | "camps";
  readonly title: string;
  readonly description: string;
  readonly hero: IndexHero;
  readonly intro: {
    readonly label: string;
    readonly paragraphs: readonly string[];
  };
  readonly cta: {
    readonly title: string;
    readonly href: string;
    readonly image: IndexImage;
  };
}

const targetImage = (
  src: string,
  width: number,
  height: number,
  alt: string,
  focal = "50% 50%",
): IndexImage => ({ src, width, height, alt, focal });

const tripImage = (
  file: string,
  width: number,
  height: number,
  alt: string,
): IndexImage => targetImage(`/media/target/${file}`, width, height, alt);

export const indexClouds = {
  mist: targetImage("/media/target/cloud-gradient.webp", 1440, 900, "Mist transition"),
  near: targetImage("/media/target/cloud-1-cropped.webp", 1440, 550, "Clouds overlay"),
  far: targetImage("/media/target/cloud-2-full.webp", 1440, 900, "Clouds overlay 2"),
} as const;

const earlyEmperor = tripImage(
  "trip-early-emperor-penguins.webp",
  2000,
  1333,
  "Baby Penguins & Blue Tunnels",
);
const southPoleEmperor = tripImage(
  "trip-south-pole-emperor-penguins.webp",
  2000,
  1250,
  "South Pole & Penguins",
);
const southPoleRivers = tripImage(
  "trip-south-pole-blue-rivers.webp",
  2000,
  1499,
  "South Pole & Blue Rivers",
);
const longStay = tripImage("trip-the-long-stay.webp", 2000, 1333, "The Long Stay");
const antarcticaDay = tripImage(
  "trip-antarctica-in-a-day.webp",
  2000,
  1333,
  "Antarctica in a Day",
);

export const indexTrips: readonly IndexTrip[] = [
  {
    id: "early-emperor-penguins",
    title: "Baby Penguins & Blue Tunnels",
    href: "/itineraries/early-emperor-penguins",
    price: "US $75,250",
    season: "Early Season",
    sideLabel: "Early Season",
    excerpt:
      "Witness the Emperor chicks as they take their first steps and explore the ethereal Blue Ice Tunnels.",
    image: earlyEmperor,
  },
  {
    id: "south-pole-emperor-penguins",
    title: "South Pole & Penguins",
    href: "/itineraries/south-pole-emperor-penguins",
    price: "US $115,500",
    sideLabel: "High Season",
    excerpt:
      "Our most popular itinerary, which includes a journey to the South Pole — visited by fewer than 500 people each year —  and a visit to the Emperor Penguin colony.",
    image: southPoleEmperor,
  },
  {
    id: "south-pole-blue-rivers",
    title: "South Pole & Blue Rivers",
    href: "/itineraries/south-pole-blue-rivers",
    price: "US $115,500",
    season: "Late Season",
    sideLabel: "Late Season",
    excerpt:
      "Our newest itinerary. One that combines our signature journey to the South Pole — visited by fewer than 500 people each year — with a visit to Antarctica’s rarely seen Blue Rivers. ",
    image: southPoleRivers,
  },
  {
    id: "the-long-stay",
    title: "The Long Stay",
    href: "/itineraries/the-long-stay",
    price: "US $110,500",
    season: "Late Season",
    sideLabel: "Late Season",
    excerpt:
      "Experience both of our main camps — Whichaway and Echo — on our longest itinerary, which includes the South Pole and the incredible Blue Rivers.",
    image: longStay,
  },
  {
    id: "antarctica-in-a-day",
    title: "Antarctica in a Day",
    href: "/itineraries/antarctica-in-a-day",
    price: "US $16,500",
    season: "Entire Season",
    sideLabel: "Entire Season",
    excerpt:
      "Cape Town to Antarctica and back — descend into an ice cave, rappel down a glacier and toast with champagne in our ice bar during this extraordinary day trip.",
    image: antarcticaDay,
  },
];

export const discoveryWeek: IndexItinerary = {
  id: "discovery-week",
  title: "Discovery Week",
  href: "/itineraries/discovery-week",
  price: "$45,000",
  metaLabel: "19 - 26 JANUARY 2027",
  excerpt:
    "Join a one-of-a-kind week immersed in the awe-inspiring landscapes of Antarctica, led by renowned scientists and guided by a team of seasoned polar experts.",
  image: targetImage(
    "/media/target/index/discovery-week.webp",
    2000,
    1080,
    "Discovery Week",
  ),
};

export const indexItineraries: readonly IndexItinerary[] = [
  ...indexTrips.map((trip) => ({ ...trip })),
  discoveryWeek,
];

export const indexCamps: readonly IndexCamp[] = [
  {
    id: "whichaway",
    title: "Whichaway Camp",
    href: "/camps/whichaway-camp",
    coordinates: "70º 48’ 00” S, 11º 23’ 00” E",
    body: "Our original camp, newly reimagined. Rare exposed rock and freshwater lakes — this is a side of Antarctica seldom seen.",
    image: targetImage(
      "/media/target/index/camp-whichaway.webp",
      2000,
      1332,
      "Whichaway Camp",
    ),
  },
  {
    id: "echo",
    title: "Echo Base",
    href: "/camps/echo-base",
    coordinates: "71°32'47\" S, 8°50'11\" E",
    body: "Inspired by astronauts, used by explorers. As close as you can get to leaving Earth without stepping off the planet.",
    image: targetImage("/media/target/index/camp-echo.webp", 1750, 1080, "Echo Base"),
  },
  {
    id: "explorer",
    title: "Explorer Camp",
    href: "/camps/explorer-camp",
    coordinates: "71º 31’ 37” S, 8º 51’ 20” E",
    body: "Polar adventure meets chalet-style. True to our expeditionary roots, a rustic and warm base for the South Pole journey.",
    image: targetImage(
      "/media/target/index/camp-explorer.webp",
      2200,
      1467,
      "Explorer Camp",
    ),
  },
];

export const indexPages: {
  readonly itineraries: IndexPageContent;
  readonly camps: IndexPageContent;
} = {
  itineraries: {
    route: "itineraries",
    title: "Our Antarctic Trips & Expeditions",
    description:
      "Explore White Desert’s signature Antarctic trips, from the South Pole to Emperor Penguins. Compare curated luxury expeditions and experiences.",
    hero: {
      eyebrow: "Our Core Journeys",
      title: "OUR TRIPS",
      image: targetImage(
        "/media/target/index/itineraries-hero.webp",
        2000,
        1250,
        "Blue ice tunnels in Antarctica",
      ),
    },
    intro: {
      label: "Choose Your Adventure",
      paragraphs: [
        "Discover Antarctica like few ever will with White Desert’s four signature experiences: witness Emperor Penguin chicks taking their first steps, journey to the southernmost point on Earth at the South Pole, or embark on a once-in-a-lifetime adventure in just 24 hours. For those seeking the ultimate immersion, combine Echo and Whichaway Camps — two distinct landscapes and two remarkable camp styles, culminating in one unforgettable journey.",
        "Each experience blends refined comfort, expert guidance and the unparalleled access to the continent.",
      ],
    },
    cta: {
      title: "Start planning your adventure",
      href: "/enquire",
      image: targetImage(
        "/media/target/index/itineraries-cta.webp",
        2100,
        1400,
        "A White Desert aircraft above the Antarctic ice",
      ),
    },
  },
  camps: {
    route: "camps",
    title: "Our Antarctic Luxury Camps",
    description:
      "Experience exceptional comfort in Antarctica’s remote interior with White Desert’s luxury camps and beautifully engineered, heated pods.",
    hero: {
      eyebrow: "THREE UNIQUE OUTPOSTS",
      title: "OUR Camps",
      image: targetImage(
        "/media/target/index/camps-hero.webp",
        2000,
        1250,
        "White Desert camp in the Antarctic landscape",
      ),
    },
    intro: {
      label: "Polar Comfort",
      paragraphs: [
        "In one of the most remote landscapes, White Desert’s luxury camps offer an extraordinary contrast: beautifully engineered, heated pods that deliver exceptional comfort and considered detail in the heart of Antarctica’s wilderness. Built to have a minimal impact on the Continent, each camp operates to the highest environmental standards.",
      ],
    },
    cta: {
      title: "Start planning your adventure",
      href: "/enquire",
      image: targetImage(
        "/media/target/index/camps-cta.webp",
        2100,
        1400,
        "White Desert camp below Antarctic peaks",
      ),
    },
  },
};
