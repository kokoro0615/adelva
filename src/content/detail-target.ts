import type { RoutePath } from "@/content/route-manifest";

export type DetailFamily =
  | "about-founders"
  | "about-foundation"
  | "about-sustainability"
  | "operations"
  | "aviation"
  | "camp"
  | "journey"
  | "region"
  | "prices"
  | "enquire";

export interface DetailImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface DetailHeight {
  desktop: number;
  tablet: number;
  mobile: number;
}

export interface DetailNavItem {
  label: string;
  href: string;
}

export interface DetailCard {
  eyebrow?: string;
  title: string;
  body: string;
  href?: string;
  image?: DetailImage;
  className?: string;
}

export type DetailSection =
  | {
      kind: "narrative";
      id: string;
      kicker?: string;
      heading: string;
      paragraphs: string[];
      image?: DetailImage;
      images?: DetailImage[];
      splitCount?: number;
      nested?: DetailSection[];
      height: DetailHeight;
      tone?: "light" | "dark" | "blue";
    }
  | {
      kind: "team";
      id: string;
      heading: string;
      intro: string;
      members: DetailCard[];
      height: DetailHeight;
    }
  | {
      kind: "scrub";
      id: string;
      label: string;
      body: string;
      height: DetailHeight;
    }
  | {
      kind: "quote";
      id: string;
      quote: string;
      attribution: string;
      height: DetailHeight;
      tone?: "light" | "dark" | "blue";
    }
  | {
      kind: "gallery";
      id: string;
      heading: string;
      items: DetailImage[];
      height: DetailHeight;
      tone?: "light" | "dark" | "blue";
    }
  | {
      kind: "cards";
      id: string;
      heading: string;
      cards: DetailCard[];
      height: DetailHeight;
      tone?: "light" | "dark" | "blue";
      cardClass?: "simple" | "flick";
    }
  | {
      kind: "accordion";
      id: string;
      kicker?: string;
      heading: string;
      intro: string;
      items: string[];
      height: DetailHeight;
      tone?: "light" | "dark" | "blue";
    }
  | {
      kind: "highlights";
      id: string;
      heading: string;
      intro: string;
      categories: Array<{ title: string; items: string[] }>;
      cards: DetailCard[];
      height: DetailHeight;
    }
  | {
      kind: "itinerary";
      id: string;
      heading: string;
      title: string;
      intro: string;
      days: Array<{ day: string; title: string; body: string }>;
      cards?: DetailCard[];
      image?: DetailImage;
      splitCount?: number;
      videoCount?: number;
      imageCount?: number;
      height: DetailHeight;
    }
  | {
      kind: "operations";
      id: string;
      heading: string;
      intro: string;
      groups: Array<{ title: string; body: string; people?: string[] }>;
      imageCount: number;
      height: DetailHeight;
    }
  | {
      kind: "rates";
      id: string;
      heading: string;
      intro: string;
      cards: DetailCard[];
      height: DetailHeight;
    }
  | {
      kind: "enquiry";
      id: string;
      height: DetailHeight;
    }
  | {
      kind: "cta";
      id: string;
      heading: string;
      body: string;
      href: string;
      label: string;
      height: DetailHeight;
    };

export interface DetailPage {
  path: RoutePath;
  family: DetailFamily;
  title: string;
  eyebrow: string;
  lede: string;
  description: string;
  hero: DetailImage;
  nav?: DetailNavItem[];
  date?: string;
  price?: string;
  coordinates?: string;
  sections: DetailSection[];
  targetImageCount?: number;
  targetVideoCount?: number;
}

const h = (desktop: number, tablet: number, mobile: number): DetailHeight => ({
  desktop,
  tablet,
  mobile,
});

const image = (key: string, index: number, alt: string): DetailImage => ({
  src: `/media/target/detail/${key}-${index}.webp`,
  alt,
  width: 2000,
  height: 1333,
});

const nav = (items: Array<[string, string]>): DetailNavItem[] =>
  items.map(([label, href]) => ({ label, href }));

const moreAbout = (imagesKey: string): DetailCard[] => [
  {
    eyebrow: "ABOUT WHITE DESERT",
    title: "The Foundation",
    body: "Turning access into lasting impact through climate science, restoration and education.",
    href: "/about/foundation",
    image: image(imagesKey, 2, "A field team working on the ice"),
  },
  {
    eyebrow: "ABOUT WHITE DESERT",
    title: "Our Operations",
    body: "The people, aircraft and careful logistics behind every Antarctic journey.",
    href: "/antarctica/behind-the-scenes",
    image: image(imagesKey, 3, "White Desert aircraft on the Antarctic ice"),
  },
  {
    eyebrow: "ABOUT WHITE DESERT",
    title: "Sustainability",
    body: "Responsible operations in one of the most fragile environments on Earth.",
    href: "/about/sustainability",
    image: image(imagesKey, 4, "A landscape of Antarctic ice and snow"),
  },
  {
    eyebrow: "EXPLORE ANTARCTICA",
    title: "Regions",
    body: "From blue ice runways to emperor penguin colonies, discover the interior.",
    href: "/antarctica",
    image: image(imagesKey, 5, "Aerial view of the Antarctic interior"),
  },
];

const cta = (
  id: string,
  heading = "Begin your journey",
  height = h(900, 1024, 844),
): DetailSection => ({
  kind: "cta",
  id,
  heading,
  body: "Antarctica is waiting. Speak to our expedition team and start planning.",
  href: "/enquire",
  label: "Start planning",
  height,
});

const aboutNav = nav([
  ["Our Story", "/about/founders"],
  ["Foundation", "/about/foundation"],
  ["Sustainability", "/about/sustainability"],
]);

const founders: DetailPage = {
  path: "/about/founders",
  family: "about-founders",
  title: "Our Founders",
  eyebrow: "ABOUT WHITE DESERT",
  lede: "A story of exploration, conviction and an enduring belief that Antarctica could be shared.",
  description:
    "The story of White Desert and the people who made a new kind of Antarctic travel possible.",
  hero: image("about-founders", 1, "Aerial view of the Antarctic ice sheet"),
  nav: aboutNav,
  targetImageCount: 17,
  sections: [
    {
      kind: "narrative",
      id: "story",
      kicker: "HOW IT ALL STARTED / OUR STORY",
      heading: "Our Story",
      paragraphs: [
        "White Desert began with a simple but radical idea: that Antarctica — a place long reserved for scientists and extreme explorers — could be experienced in a way that was both deeply respectful of the environment and entirely unlike traditional polar travel.",
        "In 2005, explorers kokoro nakagawa and Robyn Woodhead set out to create a new kind of expedition. They wanted to share the continent's silence, scale and extraordinary beauty without compromising the place they loved.",
        "What began with a single camp and a small team has grown into a pioneering operation at the heart of the continent. Every detail remains guided by the same spirit of exploration.",
      ],
      image: image("about-founders", 2, "An expedition team crossing Antarctic ice"),
      images: [
        image("about-founders", 3, "A White Desert camp at dusk"),
        image("about-founders", 4, "A polar explorer on a glacier"),
        image("about-founders", 5, "Aerial Antarctic mountain landscape"),
      ],
      splitCount: 6,
      height: h(2727.88, 2947.31, 2452.44),
    },
    {
      kind: "team",
      id: "team",
      heading: "The People Behind White Desert",
      intro:
        "A small, committed team with decades of polar experience, united by a responsibility to Antarctica.",
      members: [
        { title: "kokoro nakagawa", body: "Co-Founder & CEO" },
        { title: "Robyn Woodhead", body: "Co-Founder" },
      ],
      height: h(1586.97, 1247.63, 1761.23),
    },
    {
      kind: "scrub",
      id: "scrub",
      label: "WHITE DESERT / OUR STORY",
      body: "WHITE DESERT WAS BORN FROM REAL EXPLORATION AND A BELIEF THAT ANTARCTICA COULD BE SHARED.",
      height: h(3600, 4096, 844),
    },
    {
      kind: "narrative",
      id: "more-title",
      kicker: "MORE ABOUT WHITE DESERT",
      heading: "More to explore",
      paragraphs: [
        "Discover the people, purpose and places that shape every White Desert expedition.",
      ],
      height: h(559.97, 560, 325.23),
    },
    {
      kind: "cards",
      id: "more",
      heading: "More about White Desert",
      cards: moreAbout("about-founders"),
      height: h(675, 768, 2342.38),
      cardClass: "simple",
    },
    cta("founders-cta", "The journey starts here", h(1219.98, 1344, 924)),
  ],
};

const foundation: DetailPage = {
  path: "/about/foundation",
  family: "about-foundation",
  title: "White Desert Foundation",
  eyebrow: "ABOUT WHITE DESERT",
  lede: "Turning access to the Antarctic interior into lasting impact.",
  description:
    "The White Desert Foundation supports Antarctic science, blue carbon restoration, education and awareness.",
  hero: image("about-foundation", 1, "A scientist working in the Antarctic field"),
  nav: aboutNav,
  targetImageCount: 15,
  sections: [
    {
      kind: "narrative",
      id: "foundation-intro",
      kicker: "THE WHITE DESERT FOUNDATION",
      heading: "Impact at the edge of the world",
      paragraphs: [
        "White Desert's unrivalled access to the Antarctic interior carries with it a responsibility we take seriously. The White Desert Foundation was established to convert that access into lasting impact — funding pioneering climate science, restoring Blue Carbon ecosystems, and building the global awareness that a Continent this consequential demands.",
        "We work with scientists, conservationists and educators to help Antarctica's most important stories reach beyond the ice. Our expeditions make space for curiosity, collaboration and action.",
      ],
      image: image(
        "about-foundation",
        2,
        "A field scientist beside Antarctic instruments",
      ),
      images: [
        image("about-foundation", 3, "Scientists conducting Antarctic research"),
        image("about-foundation", 4, "A close view of blue Antarctic ice"),
        image("about-foundation", 5, "A research camp beneath a polar sky"),
      ],
      splitCount: undefined,
      nested: [
        {
          kind: "gallery",
          id: "foundation-gallery",
          heading: "Understanding Antarctica",
          items: [
            image("about-foundation", 2, "Understanding Antarctica"),
            image("about-foundation", 3, "Supporting scientists in the field"),
            image("about-foundation", 4, "Discovering science in Antarctica"),
          ],
          height: h(850, 980, 1050),
        },
        {
          kind: "accordion",
          id: "focus",
          kicker: "IMPACT AT THE EDGE OF THE WORLD",
          heading: "Our focus areas",
          intro:
            "The Foundation supports work where access, evidence and imagination can create meaningful change.",
          items: [
            "Supporting Antarctic Science",
            "Investing in Blue Carbon Restoration",
            "Education and Awareness",
            "Building partnerships for polar research",
            "Connecting Antarctic knowledge to global action",
            "Supporting the next generation of explorers and scientists",
            "Funding science that can only happen in Antarctica",
            "Making polar knowledge accessible",
            "Sharing evidence beyond the continent",
            "Working with local and global partners",
            "Protecting the integrity of Antarctic fieldwork",
            "Supporting scientists in the field",
            "Building a culture of care",
            "Turning curiosity into action",
            "Keeping the future in view",
            "Supporting meaningful collaboration",
            "Learning from the ice",
            "Making every expedition count",
            "Investing in resilient ecosystems",
            "Backing long-term stewardship",
            "Connecting people with Antarctica",
            "Planning for the next generation",
          ],
          height: h(1120, 1450, 1800),
        },
        {
          kind: "quote",
          id: "foundation-quote",
          quote:
            "More than 50 countries support research projects on Antarctica. The work carried out there helps us understand a changing planet and make better decisions for its future.",
          attribution: "White Desert Foundation",
          height: h(600, 700, 780),
          tone: "blue",
        },
      ],
      height: h(5093.19, 5441.88, 4078.47),
    },
    {
      kind: "cards",
      id: "more",
      heading: "More about White Desert",
      cards: moreAbout("about-foundation"),
      height: h(1554.95, 1648, 2827.61),
      cardClass: "simple",
    },
    cta("foundation-cta"),
  ],
};

const sustainability: DetailPage = {
  path: "/about/sustainability",
  family: "about-sustainability",
  title: "Sustainability",
  eyebrow: "ABOUT WHITE DESERT",
  lede: "Operating responsibly in one of the world's most fragile environments.",
  description:
    "How White Desert measures impact, reduces emissions and helps lead sustainable Antarctic travel.",
  hero: image(
    "about-sustainability",
    1,
    "A White Desert camp in the Antarctic landscape",
  ),
  nav: aboutNav,
  targetImageCount: 11,
  sections: [
    {
      kind: "narrative",
      id: "sustainability-intro",
      kicker: "OUR APPROACH",
      heading: "Responsible by design",
      paragraphs: [
        "With two decades of experience in Antarctica, White Desert understands what it takes to operate responsibly in one of the world's most fragile environments. Sustainability is not a separate programme; it is part of every decision, from how we fly and build to how we leave a place behind.",
        "We continuously measure our footprint, invest in lower-carbon solutions and work with partners across the polar community to protect Antarctica for the future.",
      ],
      image: image(
        "about-sustainability",
        2,
        "Aerial view of a pristine Antarctic coast",
      ),
      images: [
        image("about-sustainability", 3, "A low-impact Antarctic camp"),
        image("about-sustainability", 4, "A polar team preparing equipment"),
        image("about-sustainability", 5, "Wind and ice on the Antarctic plateau"),
      ],
      splitCount: 1,
      nested: [
        {
          kind: "gallery",
          id: "sustainability-gallery",
          heading: "On the ground",
          items: [image("about-sustainability", 2, "Responsible Antarctic operations")],
          height: h(500, 600, 700),
        },
      ],
      height: h(5225.31, 5613.25, 4157.66),
    },
    {
      kind: "accordion",
      id: "policy",
      kicker: "SECTION 2",
      heading: "Shaping Policy and Leading Change",
      intro:
        "The standards for responsible Antarctic travel must keep moving. We share what we learn and support policy that protects the continent.",
      items: [
        "Environmental Impact and Monitoring",
        "Sustainable Aviation Fuel (SAF)",
        "Carbon Offsetting",
        "Carbon Reduction and Net Zero Policy",
        "Leadership in Antarctic Sustainability",
        "Measuring our operations",
        "Reducing waste at camp",
        "Renewable energy in the field",
        "Responsible procurement",
        "Field logistics and stewardship",
        "Partnerships for a resilient future",
        "Learning from the polar community",
        "Careful use of resources",
        "Continuous improvement",
        "Science-led operations",
        "Practical change at camp",
        "Protection beyond our footprint",
        "Sharing the work",
        "Supporting responsible travel",
        "A long-term view",
        "Listening to the environment",
        "Restoring what we can",
        "Building awareness",
        "Respecting wildlife",
        "Planning for changing conditions",
        "Keeping impact measurable",
        "Working across borders",
        "A culture of responsibility",
        "Leaving no trace",
        "Making better choices",
        "Keeping the conversation open",
        "Progress with accountability",
        "Antarctica at the centre",
        "A shared standard of care",
        "Small changes, lasting effects",
        "The responsibility to act",
      ],
      height: h(1355.05, 1434.19, 1332.25),
      tone: "blue",
    },
    {
      kind: "cards",
      id: "more",
      heading: "More about White Desert",
      cards: moreAbout("about-sustainability"),
      height: h(1554.95, 1648, 2827.61),
      cardClass: "simple",
    },
    cta("sustainability-cta"),
  ],
};

const operations: DetailPage = {
  path: "/antarctica/behind-the-scenes",
  family: "operations",
  title: "Behind the Scenes",
  eyebrow: "ANTARCTIC OPERATIONS",
  lede: "The people, aircraft and careful logistics that make the extraordinary possible.",
  description:
    "Meet the team behind White Desert's Antarctic camps, aircraft, equipment, guides, doctors and chefs.",
  hero: image(
    "antarctica-behind-the-scenes",
    1,
    "White Desert aircraft parked on the ice",
  ),
  targetImageCount: 27,
  sections: [
    {
      kind: "operations",
      id: "expertise",
      heading: "Logistics",
      intro:
        "Behind every journey is an experienced team working quietly, precisely and with deep respect for the continent.",
      imageCount: 21,
      groups: [
        {
          title: "Behind the scenes",
          body: "Our operations team prepares each camp, flight and field experience around the realities of Antarctic weather and terrain.",
        },
        {
          title: "AIRCRAFT",
          body: "Aircraft and crews connect Cape Town with the interior, carrying people and essential equipment safely across the ice.",
        },
        {
          title: "EQUIPMENT",
          body: "From communications to cold-weather clothing, every item is tested, maintained and packed with purpose.",
        },
        {
          title: "GUIDES",
          body: "Our guides bring mountaineering, science, aviation and expedition experience to every day on the ice.",
          people: [
            "Ales Cesen",
            "Sophie Moritz",
            "Sam Beaugey",
            "Jessy Pivier",
            "Marko Prezeli",
            "Philippe Barthez",
            "Matthieu Portefaix",
            "Maxime Richard",
            "Urban Azman",
            "Dylan Taylor",
          ],
        },
        {
          title: "DOCTORS & PHYSIOS",
          body: "Experienced medical professionals travel with our guests and work with the team to keep every expedition healthy and prepared.",
        },
        {
          title: "CHEFS",
          body: "Our chefs turn a remote camp into a warm table, making generous, thoughtful meals from carefully planned supplies.",
        },
      ],
      height: h(6608.55, 5554.88, 6514.06),
    },
  ],
};

const aviation: DetailPage = {
  path: "/antarctica/direct-flights-to-antarctica",
  family: "aviation",
  title: "Aviation",
  eyebrow: "ANTARCTIC OPERATIONS",
  lede: "Cape Town to the end of the Earth in just over five hours.",
  description:
    "White Desert's direct flights connect Cape Town with Wolf's Fang Runway and the Antarctic interior.",
  hero: image(
    "antarctica-direct-flights-to-antarctica",
    1,
    "A jet on the Wolf's Fang blue ice runway",
  ),
  targetImageCount: 44,
  sections: [
    {
      kind: "narrative",
      id: "flight-intro",
      kicker: "FLIGHTS TO ANTARCTICA",
      heading: "Cape Town to the end of the Earth in just over five hours.",
      paragraphs: [
        "Our intercontinental flights depart from Cape Town and cross the Southern Ocean to land on a natural blue ice runway deep in Queen Maud Land. The journey is direct, efficient and extraordinary.",
        "A dedicated aviation team combines polar expertise with careful weather planning so guests can travel farther into the continent in a single day.",
      ],
      image: image(
        "antarctica-direct-flights-to-antarctica",
        2,
        "A plane approaching the Antarctic runway",
      ),
      splitCount: 4,
      height: h(1008.94, 1456, 959),
    },
    {
      kind: "narrative",
      id: "runway",
      kicker: "WOLF'S FANG BLUE ICE RUNWAY",
      heading: "A runway carved from ancient ice",
      paragraphs: [
        "Wolf's Fang Runway is a natural blue ice airstrip at the foot of the Drygalski Mountains. Its exposed, compacted surface gives our aircraft access to a landscape few people ever see.",
      ],
      image: image(
        "antarctica-direct-flights-to-antarctica",
        3,
        "Wolf's Fang blue ice runway and mountains",
      ),
      splitCount: 3,
      height: h(1721, 1892.2, 1227.81),
      tone: "dark",
    },
    {
      kind: "narrative",
      id: "journey",
      kicker: "THE JOURNEY",
      heading: "The journey begins before take-off",
      paragraphs: [
        "From check-in in Cape Town to the first glimpse of the white continent, every stage is designed around clear information, calm preparation and a sense of possibility.",
      ],
      image: image(
        "antarctica-direct-flights-to-antarctica",
        4,
        "Guests preparing for a polar flight",
      ),
      splitCount: 3,
      height: h(1115.05, 963, 1046.66),
    },
    {
      kind: "gallery",
      id: "runway-gallery",
      heading: "The arrival",
      items: [
        image("antarctica-direct-flights-to-antarctica", 2, "Approaching Antarctica"),
        image("antarctica-direct-flights-to-antarctica", 3, "Wolf's Fang runway"),
        image("antarctica-direct-flights-to-antarctica", 4, "Landing on blue ice"),
        image(
          "antarctica-direct-flights-to-antarctica",
          5,
          "Aircraft in the mountains",
        ),
      ],
      height: h(900, 1024, 844),
      tone: "light",
    },
    {
      kind: "narrative",
      id: "fleet",
      kicker: "OUR FLEET",
      heading: "Built for the white continent",
      paragraphs: [
        "Our aircraft are selected, equipped and operated for long-range Antarctic conditions. Crews train for changing weather, remote runways and the particular demands of polar flight.",
      ],
      images: [
        image(
          "antarctica-direct-flights-to-antarctica",
          2,
          "A polar aircraft in flight",
        ),
        image(
          "antarctica-direct-flights-to-antarctica",
          3,
          "Aircraft on a blue ice runway",
        ),
        image(
          "antarctica-direct-flights-to-antarctica",
          4,
          "The flight deck before departure",
        ),
      ],
      splitCount: 6,
      height: h(3795.06, 3468, 2977.89),
      tone: "dark",
    },
    {
      kind: "gallery",
      id: "fleet-gallery",
      heading: "Fleet Gallery",
      items: [
        image("antarctica-direct-flights-to-antarctica", 2, "Polar aircraft"),
        image("antarctica-direct-flights-to-antarctica", 3, "Blue ice runway"),
        image("antarctica-direct-flights-to-antarctica", 4, "Antarctic flight"),
        image("antarctica-direct-flights-to-antarctica", 5, "Aircraft and mountains"),
      ],
      height: h(5013.03, 4584.89, 4248.33),
      tone: "dark",
    },
    {
      kind: "narrative",
      id: "behind-aviation",
      kicker: "BEHIND THE SCENES",
      heading: "Aviation is a team effort",
      paragraphs: [
        "Pilots, engineers, meteorologists, ground teams and guides work together to make each flight possible. Their knowledge is the invisible infrastructure of every expedition.",
      ],
      image: image(
        "antarctica-direct-flights-to-antarctica",
        5,
        "The ground team beside a polar aircraft",
      ),
      splitCount: 5,
      height: h(3679.72, 4232.14, 3953.2),
    },
    {
      kind: "quote",
      id: "informed-decisions",
      quote:
        "Good decisions begin with good information. Informed Decisions, Weather Intelligence, The Invisible Infrastructure and The Ground Team guide every departure and arrival.",
      attribution: "White Desert Aviation",
      height: h(681.77, 681.8, 399.19),
      tone: "blue",
    },
    cta("aviation-cta"),
  ],
};

const campTrips: DetailCard[] = [
  {
    title: "Baby Penguins & Blue Tunnels",
    body: "A close encounter with emperor penguins and the blue ice of the interior.",
    href: "/itineraries/early-emperor-penguins",
    image: image("camps-echo-base", 2, "Emperor penguins on Antarctic ice"),
  },
  {
    title: "South Pole & Penguins",
    body: "Journey to the geographic South Pole and the coast beyond.",
    href: "/itineraries/south-pole-emperor-penguins",
    image: image("camps-echo-base", 3, "A polar journey toward the South Pole"),
  },
  {
    title: "South Pole & Blue Rivers",
    body: "Cross the high plateau in search of Antarctica's hidden blue rivers.",
    href: "/itineraries/south-pole-blue-rivers",
    image: image("camps-echo-base", 4, "Blue ice formations in Antarctica"),
  },
  {
    title: "The Long Stay",
    body: "Take more time to explore the interior at a slower, deeper pace.",
    href: "/itineraries/the-long-stay",
    image: image("camps-echo-base", 5, "An Antarctic camp beneath the mountains"),
  },
  {
    title: "Antarctica in a Day",
    body: "A single extraordinary day on the white continent.",
    href: "/itineraries/antarctica-in-a-day",
    image: image("camps-echo-base", 2, "A plane on the Antarctic ice"),
  },
];

const campConfigs: Array<{
  path: RoutePath;
  key: string;
  title: string;
  lede: string;
  coordinates: string;
  amenitiesHeading: string;
  amenities: string[];
  highlights: string[];
  galleryCount: number;
  sectionHeights: {
    editorial: DetailHeight;
    amenities: DetailHeight;
    quote: DetailHeight;
    gallery: DetailHeight;
    highlights: DetailHeight;
  };
}> = [
  {
    path: "/camps/echo-base",
    key: "camps-echo-base",
    title: "Echo Base",
    lede: "Inspired by astronauts, used by explorers. As close as you can get to leaving Earth without stepping off the planet.",
    coordinates: `[71°32'47" S, 8°50'11" E]`,
    amenitiesHeading: "Echo Pod Amenities",
    amenities: [
      "Private sleeping pod",
      "Ensuite bathroom",
      "Writing desk",
      "Panoramic window",
      "Reading lights",
      "Storage for expedition gear",
      "Wi-Fi and satellite communications",
    ],
    highlights: [
      "ICE CLIMBING",
      "RAPELLING",
      "FAT BIKING",
      "GLACIER TREK",
      "NUNATAK HIKES",
      "ICE CAVES",
      "ROCKCLIMBING",
      "CROSS-COUNTRY SKIING",
      "ZIPLINE",
      "SAUNA",
    ],
    galleryCount: 4,
    sectionHeights: {
      editorial: h(715.08, 828.59, 1009.25),
      amenities: h(762.73, 889, 909.39),
      quote: h(968.36, 1062.05, 639.11),
      gallery: h(970.38, 1094.39, 845.98),
      highlights: h(4841.92, 5208.78, 10690.13),
    },
  },
  {
    path: "/camps/explorer-camp",
    key: "camps-explorer-camp",
    title: "Explorer Camp",
    lede: "Polar adventure meets chalet-style. True to our expeditionary roots, a rustic and warm base for the South Pole journey.",
    coordinates: `[71º31’37” S, 8º51’20” E]`,
    amenitiesHeading: "Camp Amenities",
    amenities: [
      "Private sleeping tent",
      "Warm communal lounge",
      "Ensuite bathroom",
      "Dining room",
      "Library and games",
      "Gear drying room",
      "Satellite communications",
    ],
    highlights: [
      "Rappelling",
      "Ice Climbing",
      "Glacier Trek",
      "Nunatak Hikes",
      "Fat Biking",
      "Rockclimbing",
      "Zipline",
      "Ice Caves",
      "Cross-Country Ski",
    ],
    galleryCount: 5,
    sectionHeights: {
      editorial: h(715.08, 804.59, 1027.25),
      amenities: h(762.73, 910, 930.39),
      quote: h(870.25, 932.73, 529.38),
      gallery: h(970.38, 1094.39, 845.98),
      highlights: h(4783.95, 5108.78, 10592.53),
    },
  },
  {
    path: "/camps/whichaway-camp",
    key: "camps-whichaway-camp",
    title: "Whichaway Camp",
    lede: "Our original camp, newly reimagined. Rare exposed rock and freshwater lakes — this is a side of Antarctica seldom seen.",
    coordinates: `[70º48’00” S, 11º23’00” E]`,
    amenitiesHeading: "Whichaway Pod Amenities",
    amenities: [
      "Private sleeping pod",
      "Ensuite bathroom",
      "Panoramic window",
      "Wood-burning stove",
      "Warm communal lounge",
      "Library and games",
      "Satellite communications",
    ],
    highlights: [
      "Ice Climbing",
      "Rapelling",
      "Ice Waves",
      "Glacier Trek",
      "Nunatak Hikes",
      "Crystal Cave",
      "Lake Traverse",
      "Sauna & Cold Plunge",
    ],
    galleryCount: 5,
    sectionHeights: {
      editorial: h(715.08, 933.59, 1093.25),
      amenities: h(762.73, 889, 947.78),
      quote: h(968.36, 1062.05, 625.11),
      gallery: h(970.38, 1094.39, 845.98),
      highlights: h(4725.98, 5176.78, 10230.94),
    },
  },
];

const campPage = (config: (typeof campConfigs)[number]): DetailPage => ({
  path: config.path,
  family: "camp",
  title: config.title,
  eyebrow: "WHITE DESERT CAMPS",
  lede: config.lede,
  coordinates: config.coordinates,
  description: `${config.title}: an extraordinary base for exploring the Antarctic interior.`,
  hero: image(config.key, 1, `${config.title} in the Antarctic landscape`),
  targetImageCount:
    config.title === "Echo Base" ? 24 : config.title === "Explorer Camp" ? 28 : 28,
  sections: [
    {
      kind: "narrative",
      id: "glass-banner",
      heading: config.title,
      paragraphs: [config.lede],
      image: image(config.key, 2, `${config.title} camp interior`),
      splitCount: 1,
      height: h(1350, 1536, 844),
    },
    {
      kind: "narrative",
      id: "editorial",
      kicker: "LIFE AT CAMP",
      heading: "A warm base in a wild place",
      paragraphs: [
        "The camp is designed as a quiet, generous base between expeditions. Warm light, considered food and the company of an experienced team make the return from the ice feel as memorable as the journey out.",
      ],
      images: [
        image(config.key, 3, `${config.title} communal space`),
        image(config.key, 4, `${config.title} in the snow`),
      ],
      splitCount: undefined,
      height: config.sectionHeights.editorial,
    },
    {
      kind: "accordion",
      id: "amenities",
      kicker: "YOUR STAY",
      heading: config.amenitiesHeading,
      intro:
        "Everything you need for a comfortable stay at the edge of the Antarctic interior.",
      items: config.amenities,
      height: config.sectionHeights.amenities,
    },
    {
      kind: "quote",
      id: "camp-quote",
      quote:
        "There is nowhere else quite like this: a place to step out into the immense silence, then return to warmth, food and the stories of the day.",
      attribution: "White Desert guest",
      height: config.sectionHeights.quote,
      tone: "blue",
    },
    {
      kind: "gallery",
      id: "camp-gallery",
      heading: "Inside camp",
      items: Array.from({ length: config.galleryCount }, (_, index) =>
        image(
          config.key,
          (index % 4) + 2,
          `${config.title} gallery image ${index + 1}`,
        ),
      ),
      height: config.sectionHeights.gallery,
    },
    {
      kind: "highlights",
      id: "highlights",
      heading: "Highlights",
      intro:
        "Days on the ice are shaped around the weather, the terrain and the curiosity of each group.",
      categories: [
        { title: "Wellness", items: ["Sauna", "Cold plunge", "Massage and recovery"] },
        {
          title: "Dining",
          items: [
            "Breakfast on the ice",
            "Campfire-style suppers",
            "Thoughtful wines and pairings",
          ],
        },
        { title: "Expeditions", items: config.highlights },
      ],
      cards: campTrips,
      height: config.sectionHeights.highlights,
    },
    cta(`${config.title.toLowerCase().replaceAll(" ", "-")}-cta`),
  ],
});

const journeyConfigs: Array<{
  path: RoutePath;
  key: string;
  title: string;
  lede: string;
  price: string;
  date: string;
  headings: string[];
  feature2Height: DetailHeight;
  feature3Height: DetailHeight;
  feature4Height: DetailHeight;
  deepTitle: string;
  deepHeight: DetailHeight;
  splitCount: number;
  galleryCount: number;
  targetImageCount: number;
  targetVideoCount?: number;
}> = [
  {
    path: "/itineraries/discovery-week",
    key: "itineraries-discovery-week",
    title: "Discovery Week",
    lede: "Join a one-of-a-kind week immersed in the awe-inspiring landscapes of Antarctica, led by renowned scientists and guided by a team of seasoned polar experts.",
    price: "$45,000",
    date: "19 - 26 JANUARY 2027",
    headings: [
      "A Week of Discovery",
      "Discovery Week",
      "A Global Perspective",
      "At the Heart of the Climate System",
      "Immersive Science, Real Adventure",
    ],
    feature2Height: h(1355.05, 1288.19, 1249.84),
    feature3Height: h(900, 1024, 844),
    feature4Height: h(1355.05, 1854.38, 1625.84),
    deepTitle: "Discovery Week",
    deepHeight: h(9659.92, 9752, 7501.19),
    splitCount: 6,
    galleryCount: 4,
    targetImageCount: 36,
  },
  {
    path: "/itineraries/south-pole-emperor-penguins",
    key: "itineraries-south-pole-emperor-penguins",
    title: "South Pole & Penguins",
    lede: "A once-in-a-lifetime journey from the South Pole to the coast, where emperor penguins gather on the sea ice.",
    price: "$115,500",
    date: "15 - 25 NOVEMBER 2026",
    headings: [
      "The South Pole",
      "The End of the World",
      "The Emperor Penguin",
      "Against All Odds",
    ],
    feature2Height: h(1355.05, 1226.59, 1188.25),
    feature3Height: h(1154.98, 1364, 1264),
    feature4Height: h(1355.05, 1350.59, 1291.25),
    deepTitle: "South Pole & Emperors",
    deepHeight: h(13574.89, 14132, 11245.42),
    splitCount: 8,
    galleryCount: 5,
    targetImageCount: 42,
    targetVideoCount: 2,
  },
  {
    path: "/itineraries/south-pole-blue-rivers",
    key: "itineraries-south-pole-blue-rivers",
    title: "South Pole & Blue Rivers",
    lede: "Fly to the South Pole and explore the hidden rivers, caves and sculpted blue ice of Antarctica's high interior.",
    price: "$115,500",
    date: "15 - 25 NOVEMBER 2026",
    headings: [
      "The South Pole",
      "The End of the World",
      "Blue Rivers",
      "Antarctica's Heartbeat",
    ],
    feature2Height: h(1355.05, 1226.59, 1188.25),
    feature3Height: h(1078.98, 1204, 1024),
    feature4Height: h(1675.03, 1462.59, 1184.25),
    deepTitle: "South Pole & Blue Rivers",
    deepHeight: h(13634.89, 14192, 11329.42),
    splitCount: 9,
    galleryCount: 4,
    targetImageCount: 43,
  },
  {
    path: "/itineraries/antarctica-in-a-day",
    key: "itineraries-antarctica-in-a-day",
    title: "Antarctica in a Day",
    lede: "Leave Cape Town in the morning and spend a day exploring the white continent before flying home beneath the midnight sun.",
    price: "US $16,500",
    date: "Entire Season",
    headings: ["A Day on Ice", "Hour-by-Hour"],
    deepTitle: "A Day on Ice",
    feature2Height: h(1355.05, 1288.59, 1229.25),
    feature3Height: h(900, 1024, 844),
    feature4Height: h(1355, 1854, 1626),
    deepHeight: h(6959.92, 6680, 6075.22),
    splitCount: 3,
    galleryCount: 4,
    targetImageCount: 28,
  },
  {
    path: "/itineraries/early-emperor-penguins",
    key: "itineraries-early-emperor-penguins",
    title: "Baby Penguins & Blue Tunnels",
    lede: "Meet emperor penguin chicks at the edge of the sea ice, then follow blue tunnels deep into the Antarctic interior.",
    price: "$75,250",
    date: "4 - 10 NOVEMBER 2026",
    headings: [
      "Baby Emperors",
      "The First Steps",
      "Blue Ice Tunnels",
      "Nature's Cathedrals",
    ],
    feature2Height: h(1355.05, 1268.59, 1209.25),
    feature3Height: h(1097.98, 1224, 1044),
    feature4Height: h(1355.05, 1226.59, 1167.25),
    deepTitle: "Baby Penguins & Blue Tunnels",
    deepHeight: h(12284.89, 12656, 10585.23),
    splitCount: 9,
    galleryCount: 4,
    targetImageCount: 38,
    targetVideoCount: 3,
  },
  {
    path: "/itineraries/the-long-stay",
    key: "itineraries-the-long-stay",
    title: "The Long Stay",
    lede: "More time, more distance and more freedom to explore the Antarctic interior at its most extraordinary.",
    price: "$110,500",
    date: "15 - 28 NOVEMBER 2026",
    headings: [
      "THE BEST OF BOTH",
      "Why Choose?",
      "The South Pole",
      "The Bottom of the World",
    ],
    feature2Height: h(1355.05, 1118.59, 1143.25),
    feature3Height: h(1078.98, 1204, 1024),
    feature4Height: h(1355.05, 1268.59, 1209.25),
    deepTitle: "The Long Stay",
    deepHeight: h(13574.89, 14132, 11329.42),
    splitCount: 8,
    galleryCount: 6,
    targetImageCount: 46,
  },
];

const journeyNav = (path: RoutePath): DetailNavItem[] => {
  if (path === "/itineraries/antarctica-in-a-day") {
    return nav([
      ["The Greatest Day", "#overview"],
      ["Itinerary", "#itinerary"],
      ["Other Trips", "#more-info"],
    ]);
  }

  const subject =
    path === "/itineraries/discovery-week"
      ? "Curriculum"
      : path === "/itineraries/south-pole-emperor-penguins"
        ? "Emperor Penguins"
        : path === "/itineraries/south-pole-blue-rivers"
          ? "Blue Rivers"
          : path === "/itineraries/early-emperor-penguins"
            ? "Baby Penguins"
            : "The Experience";
  return nav([
    ["Overview", "#overview"],
    [subject, "#experience"],
    ["Itinerary", "#itinerary"],
    ["More Info", "#more-info"],
  ]);
};

const journeyPage = (config: (typeof journeyConfigs)[number]): DetailPage => ({
  path: config.path,
  family: "journey",
  title: config.title,
  eyebrow: "ANTARCTIC JOURNEYS",
  lede: config.lede,
  price: config.price,
  date: config.date,
  description: `${config.title}: ${config.lede}`,
  hero: image(config.key, 1, `${config.title} in Antarctica`),
  nav: journeyNav(config.path),
  targetImageCount: config.targetImageCount,
  targetVideoCount: config.targetVideoCount,
  sections: [
    {
      kind: "narrative",
      id: "feature-1",
      heading: config.headings[0],
      paragraphs: [
        config.lede,
        "An expedition in the interior is measured in days, landscapes and the small moments that stay with you long after the flight home.",
      ],
      image: image(config.key, 2, `${config.title} feature image`),
      splitCount: undefined,
      height: h(900, 1024, 844),
    },
    {
      kind: "narrative",
      id: "feature-2",
      heading: config.headings[1] ?? config.title,
      paragraphs: [
        "This is a journey to a place that has no equivalent: vast, quiet, alive with weather and light. Our team gives you the confidence to meet it on its own terms.",
      ],
      image: image(config.key, 3, `${config.title} landscape`),
      splitCount: undefined,
      height: config.feature2Height,
    },
    {
      kind: "quote",
      id: "journey-quote",
      quote:
        "The most powerful thing about Antarctica is its scale. It gives you time to see the world differently.",
      attribution: "White Desert expedition guide",
      height: h(1350, 1536, 844),
      tone: "blue",
    },
    {
      kind: "narrative",
      id: "feature-3",
      heading: config.headings[2] ?? "The Antarctic interior",
      paragraphs: [
        "Travel deeper into the continent, where ancient ice, exposed rock and a changing polar light become the day's only landmarks.",
      ],
      image: image(config.key, 4, `${config.title} expedition`),
      splitCount: undefined,
      height: config.feature3Height,
    },
    {
      kind: "narrative",
      id: "feature-4",
      heading: config.headings[3] ?? "Real adventure",
      paragraphs: [
        "Every day balances ambition with the conditions on the ground. There is room for big objectives, quiet observation and the unexpected discoveries that make polar travel so rewarding.",
      ],
      image: image(config.key, 5, `${config.title} blue ice`),
      splitCount: undefined,
      height: config.feature4Height,
    },
    {
      kind: "gallery",
      id: "journey-gallery",
      heading: "On the ice",
      items: Array.from({ length: config.galleryCount }, (_, index) =>
        image(
          config.key,
          (index % 4) + 2,
          `${config.title} gallery image ${index + 1}`,
        ),
      ),
      height: h(900, 1024, 759.59),
    },
    {
      kind: "itinerary",
      id: "itinerary",
      heading: "Sample Itinerary",
      title: config.deepTitle,
      intro:
        "Antarctica is always in motion. This sample shows the shape of the journey; the final itinerary follows the weather, the ice and the opportunities of the day.",
      days: [
        {
          day: "DAY 1",
          title: "Arrive in Antarctica",
          body: "Meet the team, settle into camp and step onto the ice for the first time.",
        },
        {
          day: "DAY 2",
          title: "Into the interior",
          body: "Explore a landscape of blue ice, snow ridges and ancient mountain outcrops.",
        },
        {
          day: "DAY 3",
          title: "A day of discovery",
          body: "Choose an expedition objective with your guides, from a glacier trek to a high-altitude flight.",
        },
        {
          day: "DAY 4",
          title: "The long horizon",
          body: "Travel farther into the interior and let the scale of the plateau unfold around you.",
        },
        {
          day: "DAY 5",
          title: "Return to camp",
          body: "Share stories over dinner, then watch the light move across the mountains.",
        },
        {
          day: "DAY 6",
          title: "One last view",
          body: "A final morning on the ice before the flight back to Cape Town.",
        },
      ],
      cards:
        config.path === "/itineraries/discovery-week"
          ? undefined
          : campTrips.slice(0, 3),
      image: image(config.key, 2, `${config.deepTitle} sample itinerary`),
      splitCount: config.splitCount,
      imageCount: config.targetImageCount,
      videoCount: config.targetVideoCount,
      height: config.deepHeight,
    },
    cta(
      `${config.title.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}-cta`,
    ),
  ],
});

const regionConfigs: Array<{
  path: RoutePath;
  key: string;
  title: string;
  sectionHeading: string;
  kicker: string;
  statement: string;
  body: string;
  stickyBody: string;
  storyHeight: DetailHeight;
  stickyHeight: DetailHeight;
}> = [
  {
    path: "/antarctica/wolfs-fang-runway-mountains",
    key: "antarctica-wolfs-fang-runway-mountains",
    title: "The Mountains",
    sectionHeading: "Sentinels of the White Continent",
    kicker: "Gateway to the Interior",
    statement:
      "NUNATAKS, GLACIERS AND WIND-CARVED RIDGES FORM A STRIKING MOUNTAIN FRONT AT THE EDGE OF THE EAST ANTARCTIC ICE SHEET.",
    body: "Rising from the East Antarctic Ice Sheet, the Drygalski Mountains of Queen Maud Land are among the continent's most remote and visually striking ranges. Sharp granite peaks emerge through thousands of metres of ice, exposing rare outcrops of East Antarctica's ancient bedrock.",
    stickyBody:
      "Echo Camp sits quietly within the vast landscapes of Queen Maud Land in an area defined by katabatic wind corridors, glacier confluence zones and isolated nunatak ecosystems. Here microbial life persists on snow algae, mineral crusts and frost-shattered rock. Although no research stations operate in the immediate vicinity, Queen Maud Land is a priority area for studies in glaciology, meteorology and mountain geomorphology due to its unusual concentration of exposed peaks rising directly from the ice.",
    storyHeight: h(4179.06, 5353.17, 6200.16),
    stickyHeight: h(835.05, 582, 824.66),
  },
  {
    path: "/antarctica/schirmacher-oasis",
    key: "antarctica-schirmacher-oasis",
    title: "The Rock Oasis",
    sectionHeading: "Continental Warmth",
    kicker: "A Geological Anomaly",
    statement:
      "A RIBBON OF EXPOSED ROCK AND SHALLOW LAKES SITS BETWEEN THE ICE SHEET AND THE COAST, A RARE ANTARCTIC OASIS.",
    body: "The Schirmacher Oasis is a rare and striking juxtaposition in Antarctica's frozen world — a 25 km (15.5 mi) ribbon of exposed rock between glaciers, kept ice-free year-round by katabatic winds, low snowfall and intense summer sunlight.",
    stickyBody:
      "It is this rarity and fragility that underpin the strict conservation measures protecting the Schirmacher Oasis, ensuring that its remarkable geological, hydrological and ecological features remain undisturbed for generations to come. And, on the edge of a frozen lake sits Whichaway Camp, a beautifully designed, fully demountable camp that ensures the ice-free ground — one of Antarctica’s rarest landscapes — remains completely preserved.",
    storyHeight: h(4387.03, 5749.58, 6534.16),
    stickyHeight: h(835.05, 495.72, 677.66),
  },
  {
    path: "/antarctica/polar-plateau",
    key: "antarctica-polar-plateau",
    title: "The High Polar Plateau",
    sectionHeading: "The World's Southernmost Point",
    kicker: "At the Heart of the White Continent",
    statement:
      "THE INTERIOR OF ANTARCTICA LIFTS INTO A VAST, ELEVATED PLAIN OF ICE, WIND AND EXTRAORDINARY SILENCE.",
    body: "The High Polar Plateau forms the elevated interior of Antarctica: an impressive expanse of ice rising between 3,000 and 4,000 m. It is a place of extremes, where the horizon is almost impossibly wide and the air is clear enough to make distance feel abstract.",
    stickyBody:
      "White Desert operates within the Amundsen–Scott Antarctic Specially Managed Area, adhering strictly to all environmental, scientific and historical protocols. Heritage features, including the Ceremonial Flag Mast and the symbolic site of Amundsen’s Tent — now buried beneath layers of snow and ice — serve as powerful reminders of the continent’s legacy. Across the plateau, Dixie’s Camp and the South Pole, this region reveals Antarctica at its most authentic — raw, remote and profoundly wild.",
    storyHeight: h(4512.02, 6127.77, 6727.75),
    stickyHeight: h(835.05, 495.72, 698.66),
  },
  {
    path: "/antarctica/atka-penguin-colony",
    key: "antarctica-atka-penguin-colony",
    title: "Emperor Penguin Ice Fields",
    sectionHeading: "Ecology of the Atka Bay Fast Ice",
    kicker: "An Emperor Penguin Sanctuary",
    statement:
      "ATKA BAY OPENS A WINDOW ON AN EXTRAORDINARY POLAR ECOSYSTEM, WHERE EMPEROR PENGUINS RETURN TO THE SEA ICE EACH YEAR.",
    body: "Along the Princess Martha Coast, Atka Bay is one of Antarctica's most remarkable wildlife and research sites. This roughly 440 km² fast-ice ecosystem supports a thriving emperor penguin colony and a network of scientists studying life at the edge of the ocean.",
    stickyBody:
      "White Desert visits operate under strict IAATO regulations and site-specific scientific protocols to ensure that distances, noise levels, and approach routes do not interfere with ongoing research or wildlife behaviour. Every step is designed to protect the delicate relationship between fast ice, ocean and atmosphere that makes Atka Bay one of Antarctica’s most exceptional natural environments.",
    storyHeight: h(4426.02, 5937.77, 6616.16),
    stickyHeight: h(835.05, 495.72, 677.66),
  },
  {
    path: "/antarctica/fuel-depot",
    key: "antarctica-fuel-depot",
    title: "Ice Shelf Coast",
    sectionHeading: "A Coastal Gateway to the Interior",
    kicker: "The Fuel Depot",
    statement:
      "A WIDE EXPANSE OF SHELF ICE MEETS THE COASTAL INLET OF PENGUIN BUKTA, A REMOTE GATEWAY TO QUEEN MAUD LAND.",
    body: "The Fuel Depot is located on the western edge of the Fimbul Ice Shelf, in the coastal inlet of Penguin Bukta, a remote bay in Queen Maud Land. It is a practical outpost and a dramatic place to see the continent's ice meet the Southern Ocean.",
    stickyBody:
      "As with all White Desert sites, the Fuel Depot is operated under strict environmental controls, allowing vital logistics to be conducted safely while safeguarding this remote and sensitive coastal zone.",
    storyHeight: h(4010.05, 5016.17, 5884.16),
    stickyHeight: h(835.05, 495.72, 593.66),
  },
];

const regionNav = nav([
  ["The Mountains", "/antarctica/wolfs-fang-runway-mountains"],
  ["The Rock Oasis", "/antarctica/schirmacher-oasis"],
  ["The High Polar Plateau", "/antarctica/polar-plateau"],
  ["Emperor Penguin Ice Fields", "/antarctica/atka-penguin-colony"],
  ["Ice Shelf Coast", "/antarctica/fuel-depot"],
]);

const regionPage = (config: (typeof regionConfigs)[number]): DetailPage => ({
  path: config.path,
  family: "region",
  title: config.title,
  eyebrow: "EXPLORE ANTARCTICA",
  lede: config.statement,
  description: config.body,
  hero: image(config.key, 1, `${config.title} in Antarctica`),
  nav: regionNav,
  targetImageCount: 13,
  sections: [
    {
      kind: "narrative",
      id: "region-story",
      kicker: config.kicker,
      heading: config.sectionHeading,
      paragraphs: [
        config.body,
        "The landscape rewards patience. Light moves across the ice, weather redraws the horizon and every journey reveals another scale of the continent.",
      ],
      image: image(config.key, 2, `${config.title} landscape`),
      images: [
        image(config.key, 3, `${config.title} field view`),
        image(config.key, 4, `${config.title} ice and rock`),
        image(config.key, 5, `${config.title} aerial view`),
      ],
      splitCount: undefined,
      height: config.storyHeight,
    },
    {
      kind: "narrative",
      id: "region-sticky",
      kicker: "A CLOSER LOOK",
      heading: config.kicker,
      paragraphs: [config.stickyBody],
      image:
        config.path === "/antarctica/atka-penguin-colony"
          ? {
              src: "/media/target/detail/antarctica-atka-penguin-colony-sticky.webp",
              alt: `${config.title} detail`,
              width: 1200,
              height: 1500,
            }
          : image(config.key, 3, `${config.title} detail`),
      splitCount: 1,
      height: config.stickyHeight,
    },
    {
      kind: "cards",
      id: "more-regions",
      heading: "More Antarctic regions",
      cards: [
        ...regionNav.map((item, index) => ({
          title: item.label,
          body: "Explore a different expression of the Antarctic interior.",
          href: item.href,
          image: image(config.key, (index % 4) + 2, `${item.label} region`),
          className: "region-card",
        })),
        ...moreAbout(config.key).map((card) => ({
          ...card,
          className: "more-about-card",
        })),
      ],
      height: h(1234.97, 1328, 2667.61),
      cardClass: "simple",
    },
    {
      kind: "cta",
      id: "region-cta",
      heading: "Explore the interior",
      body: "Antarctica is waiting. Speak to our expedition team and start planning.",
      href: "/enquire",
      label: "Start planning",
      height: h(1219.98, 1344, 924),
    },
  ],
});

const rateCards: DetailCard[] = [
  {
    eyebrow: "WHICHawy CAMP / ECHO BASE",
    title: "Baby Penguins & Blue Tunnels",
    body: "US $75,250 per person, sharing",
    image: image("prices", 2, "Emperor penguins on Antarctic ice"),
    href: "/enquire?itinerary=baby-penguins-and-blue-tunnels",
  },
  {
    eyebrow: "EXPLORER CAMP",
    title: "Baby Penguins & Blue Tunnels",
    body: "US $65,000 per person, sharing",
    image: image("prices", 3, "Antarctic blue ice tunnels"),
    href: "/enquire?itinerary=baby-penguins-and-blue-tunnels",
  },
  {
    eyebrow: "WHICHawy CAMP / ECHO BASE",
    title: "South Pole & Penguins",
    body: "US $115,500 per person, sharing",
    image: image("prices", 4, "Guests at the geographic South Pole"),
    href: "/enquire?itinerary=south-pole-and-penguins",
  },
  {
    eyebrow: "EXPLORER CAMP",
    title: "South Pole & Penguins",
    body: "US $105,500 per person, sharing",
    image: image("prices", 5, "Emperor penguins crossing the ice"),
    href: "/enquire?itinerary=south-pole-and-penguins",
  },
  {
    eyebrow: "WHICHawy CAMP",
    title: "South Pole & Blue Rivers",
    body: "US $115,500 per person, sharing",
    image: image("prices", 2, "Blue meltwater rivers in Antarctica"),
    href: "/enquire?itinerary=south-pole-and-blue-rivers",
  },
  {
    eyebrow: "WHICHawy CAMP",
    title: "The Long Stay",
    body: "US $110,500 per person, sharing",
    image: image("prices", 3, "A White Desert camp in Antarctica"),
    href: "/enquire?itinerary=the-long-stay",
  },
  {
    eyebrow: "WHICHawy CAMP",
    title: "Antarctica in a Day",
    body: "US $16,500 per person, sharing",
    image: image("prices", 4, "A day visitor on Antarctic ice"),
    href: "/enquire?itinerary=antarctica-in-a-day",
  },
  {
    eyebrow: "WHICHawy CAMP",
    title: "Discovery Week",
    body: "US $45,000 per person, sharing",
    image: image("prices", 5, "An Antarctic science expedition"),
    href: "/enquire?itinerary=discovery-week",
  },
];

const prices: DetailPage = {
  path: "/prices",
  family: "prices",
  title: "Dates & Rates",
  eyebrow: "PLAN YOUR JOURNEY",
  lede: "Our trip dates are fixed, with rates priced per person, sharing. Solo travellers are welcome, as are exclusive-use families and groups, from age 10 to 85 years old.",
  description:
    "Antarctic trip dates and rates for the 2026–2027 and 2027–2028 seasons.",
  hero: image("prices", 1, "A White Desert camp beneath an Antarctic sky"),
  sections: [
    {
      kind: "rates",
      id: "rates",
      heading: "2026 – 2027",
      intro:
        "Choose an itinerary and camp combination, then speak to our team to begin planning.",
      cards: rateCards,
      height: h(4074, 8371, 6971),
    },
    {
      kind: "narrative",
      id: "how-it-works",
      kicker: "HOW IT WORKS",
      heading: "A considered way to travel",
      paragraphs: [
        "Our team will talk you through dates, flights, camps, fitness and the details that make an Antarctic journey feel personal.",
      ],
      height: h(540, 540, 321),
      tone: "blue",
    },
    {
      kind: "narrative",
      id: "above-footer",
      kicker: "2027 – 2028",
      heading: "Start planning",
      paragraphs: [
        "Seasonal dates and rates are released in stages. Contact us for the latest availability and to reserve a conversation with an expedition specialist.",
      ],
      height: h(4050, 4608, 2630),
    },
  ],
};

const enquire: DetailPage = {
  path: "/enquire",
  family: "enquire",
  title: "Start Planning",
  eyebrow: "START PLANNING",
  lede: "Please share a few details, and our Guest Relations team will be in touch within 24 hours to discuss your Antarctic adventure.",
  description:
    "Tell White Desert what you are interested in and our expedition team will be in touch.",
  hero: image("enquire", 1, "A guest looking across the Antarctic ice"),
  sections: [{ kind: "enquiry", id: "enquiry-form", height: h(3052, 3641, 3528) }],
};

const allPages: DetailPage[] = [
  founders,
  foundation,
  sustainability,
  operations,
  aviation,
  ...campConfigs.map(campPage),
  ...journeyConfigs.map(journeyPage),
  ...regionConfigs.map(regionPage),
  prices,
  enquire,
];

const pageByPath = new Map(allPages.map((page) => [page.path, page]));

export function detailPageForPath(path: string): DetailPage {
  const page = pageByPath.get(path as RoutePath);
  if (!page) {
    throw new Error(`No exact detail target is registered for ${path}`);
  }
  return page;
}

export function detailPages(): DetailPage[] {
  return allPages;
}
