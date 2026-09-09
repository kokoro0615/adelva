import { planningCta } from "@/content/shared";
import type { PageDocument } from "@/content/types";

export const operationsPage: PageDocument = {
  path: "/antarctica/behind-the-scenes",
  family: "operations",
  title: "Behind the Fieldwork",
  description:
    "An editorial view of the planning, communication and restraint behind movement across Antarctic ground.",
  hero: {
    eyebrow: "Operations",
    eyebrowStyle: "tracked",
    title: "Behind the Fieldwork",
    titleStyle: "serif",
    align: "center",
    lede: "The quiet work that happens before anyone steps onto the ice.",
    ledeStyle: "serif",
    assetId: "ice-runway-flight",
  },
  sections: [
    {
      kind: "statement",
      id: "opening",
      tone: "ice",
      heading: "A field day begins as a set of conditions, not a fixed promise.",
      body: [
        "Weather, visibility, surface condition and the energy of the group all shape the next decision. A useful plan makes those decision points visible instead of hiding them behind a polished timetable.",
        "This page describes that planning mindset without claiming a particular operator’s fleet, procedures, certifications or safety record.",
      ],
    },
    {
      kind: "sequence",
      id: "working-sequence",
      tone: "ice",
      heading: "A working sequence",
      intro:
        "An editorial model of field preparation; it is not an operating procedure.",
      steps: [
        {
          label: "Read",
          heading: "Read the conditions",
          body: "Bring the available weather and surface observations together before choosing a direction.",
        },
        {
          label: "Brief",
          heading: "Make the limits clear",
          body: "Explain the intended route, the turning point and what would change the plan.",
        },
        {
          label: "Move",
          heading: "Keep checking",
          body: "Treat the plan as a live record and return when its assumptions no longer hold.",
        },
        {
          label: "Record",
          heading: "Leave a useful note",
          body: "Write down what changed so the next decision begins with better context.",
        },
      ],
    },
    {
      kind: "story",
      id: "runway-note",
      tone: "navy",
      heading: "The runway is a threshold",
      body: [
        "From the air, the landing ground reads as a pale line against a larger field. On arrival it becomes a place of markings, checks and deliberate movement.",
        "The contrast is useful: Antarctica may look empty, but safe access depends on work that is specific, local and continuously reviewed.",
      ],
      assetId: "ice-runway-flight",
      caption: "An original view aligned with a prepared ice landing ground.",
    },
    {
      kind: "ownerContent",
      id: "operator-facts",
      tone: "mushroom",
      heading: "Verified operator information",
      description:
        "The site owner must supply and approve any operational, safety or capability statement before it is published.",
      rows: [
        {
          label: "Aircraft and vehicles",
          hint: "Owner-supplied content: current fleet, ownership and operating roles.",
        },
        {
          label: "Safety systems",
          hint: "Owner-supplied content: approved procedures, oversight and limitations.",
        },
        {
          label: "Team credentials",
          hint: "Owner-supplied content: verified roles, qualifications and permission to publish.",
        },
        {
          label: "Contingencies",
          hint: "Owner-supplied content: approved delay, diversion and assistance information.",
        },
      ],
    },
  ],
  cta: planningCta,
};

/**
 * Newly discovered canonical route. The live navigation exposes this page even
 * though the target sitemap omitted it, so it must remain in route authority.
 * A bespoke exact template will replace this typed semantic document; keeping
 * the approved target copy here prevents the route from falling back to the
 * unrelated Behind the Scenes document in the interim.
 */
export const aviationPage: PageDocument = {
  path: "/antarctica/direct-flights-to-antarctica",
  family: "aviation",
  title: "Flights to Antarctica",
  description:
    "A direct private flight from Cape Town to Wolf’s Fang Runway in Antarctica.",
  hero: {
    eyebrow: "Aviation",
    eyebrowStyle: "tracked",
    title: "Flights to Antarctica",
    titleStyle: "serif",
    align: "center",
    lede: "Cape Town to the end of the Earth in just over five hours.",
    ledeStyle: "serif",
    assetId: "ice-runway-flight",
  },
  sections: [
    {
      kind: "statement",
      id: "flights-intro",
      tone: "ice",
      heading: "Cape Town to the end of the Earth in just over five hours.",
      body: [
        "Antarctica is the most remote Continent on Earth. Elevated, glaciated, and separated from the rest of the world by thousands of kilometres of the world’s most ferocious oceans.",
        "Most people who make it south do so over many days, by ship, often at the mercy of the infamous Drake Passage. White Desert offers something fundamentally different: a direct, private flight from Cape Town deep into Antarctica’s interior. Guests depart Cape Town on a private Airbus, cross the Southern Ocean non-stop, and land in just over five hours in the heart of the Continent itself.",
      ],
    },
    {
      kind: "facts",
      id: "flight-path",
      tone: "deep",
      heading: "Cape Town to Wolf’s Fang Runway",
      items: [
        {
          label: "Flying time",
          value: "05:30 hrs",
          note: "Departure: Cape Town, South Africa",
        },
        {
          label: "Distance",
          value: "4,220 km / 2,610 mi",
          note: "Destination: Wolf’s Fang Runway, Antarctica",
        },
        {
          label: "Average temp on ice",
          value: "-5ºC / 23ºF",
          note: "Season: November – February",
        },
      ],
    },
    {
      kind: "story",
      id: "journey-south",
      tone: "ice",
      heading: "The Journey South",
      body: [
        "You depart Cape Town aboard an Airbus A330/340 — the same class of aircraft that connects the world’s great cities. This time, there are no great cities you are headed to.",
        "For the first few hours, open water. Then, quietly, the icebergs begin as you cross the Antarctic Circle. The continental shelf spreads solidly across the window — the ocean becoming ice, blue becoming white, daylight becoming the endless polar sun that will stay with you for the duration of your stay.",
        "As the aircraft touches down with quiet precision on the runway at Wolf’s Fang and the door opens, you step out into something for which no prior travel has prepared you. A wilderness that is infinite, silent, and utterly different to everything you have seen before it.",
        "There is no other arrival like it on Earth.",
      ],
      assetId: "ice-runway-flight",
      caption: "The direct journey south from Cape Town.",
    },
    {
      kind: "banner",
      id: "wolfs-fang-runway",
      assetId: "ice-runway-flight",
      caption: "Wolf’s Fang Blue Ice Runway",
    },
    {
      kind: "story",
      id: "the-dream",
      tone: "deep",
      heading: "The Dream",
      body: [
        "The dream began with a question: could a private operator fly guests directly from Cape Town into the Antarctic interior, on their own runway and their own terms? In 2014, White Desert founder kokoro nakagawa met Stuart McFadzean, the engineer behind the world’s first certified blue ice airstrip. Together, they followed rumours of an abandoned Norwegian strip known only as Blue 1, deep in Dronning Maud Land. What they found was ancient, wind-scoured glacial ice, stripped bare over hundreds of thousands of years by katabatic winds. Dense enough to receive an intercontinental jet, and stretching far enough to land one.",
        "After three years and €1.5 million, White Desert opened its runway, Wolf’s Fang. It was an expedition in its own right. A full season was spent mapping a safe traverse for grooming machinery 600 km across a crevasse-riddled glacier from the supply ship Agulhas II. By 2017, the runway was live, and at three kilometres long, Wolf’s Fang remains one of the only runways on the continent capable of receiving an intercontinental aircraft, and the only one in private hands. Before every arrival, PistenBully machines groom the pale surface for twenty-two continuous hours to tolerances precise enough for an A340. What greets you as the door opens is the work of a small army labouring through the polar night. The elegance of arrival conceals the effort behind it entirely.",
      ],
      assetId: "polar-plateau",
      caption: "Wolf’s Fang runway in the Antarctic interior.",
    },
    {
      kind: "story",
      id: "our-fleet",
      tone: "ice",
      heading: "Our Fleet",
      body: [
        "White Desert operates a carefully chosen fleet, selected for what each aircraft uniquely makes possible, because reaching Antarctica’s most extraordinary places requires extraordinary aircraft.",
        "Airbus A330 & A340: Long-range wide-body aircraft that carry guests, scientists, and crew non-stop from Cape Town to Wolf’s Fang Runway: a 5.5-hour crossing of some of the most remote ocean on the planet. They are the largest passenger aircraft ever to land on the Continent. Onboard, guests travel in business-class comfort, with lie-flat seats, fine dining, and a curated wine and champagne selection. Nothing, however, quite prepares them for what greets them on the other side.",
        "Basler BT-67: A modern evolution of the legendary Douglas C-47, the aircraft that flew the Normandy landings, the Berlin Airlift, and the first civilian air routes across post-war Europe. A $10 million transformation by Basler Turbo Conversions fitted it with Pratt & Whitney turboprops and advanced avionics, creating a deep-field aircraft that reaches what the A330 cannot: the South Pole, Emperor penguin colonies, and beyond. The cabin is warm and purposeful, with wide windows set low enough to read the ice below. At the controls, Antarctic veterans led by a chief pilot with more than ten seasons on the ice.",
        "Twin Otter: A twin-engine turboprop renowned for short take-off and landing, the Twin Otter reaches ice runways and remote skiways unreachable by any other fixed-wing aircraft in commercial service. It is the aircraft of choice for polar search and rescue, known for going exactly where it is needed, exactly when. Flying low and slow over the ice sheet, it turns the transfer into an event itself. Pressure ridges, melt ponds, and wind-carved sastrugi become legible at a few hundred feet. Access has always been the Twin Otter’s gift, and in White Desert’s hands, the approach is part of the experience.",
      ],
      assetId: "ice-runway-flight",
      caption: "Aircraft selected for intercontinental and deep-field travel.",
    },
    {
      kind: "sequence",
      id: "behind-the-scenes",
      tone: "ice",
      heading: "Behind the Scenes",
      intro:
        "Every decision is guided by real-time data, deep polar experience, and an uncompromising commitment to safety.",
      steps: [
        {
          label: "01",
          heading: "Informed decisions",
          body: "Every decision is guided by real-time data, deep polar experience, and an uncompromising commitment to safety. The impression on arrival is of seamlessness: a groomed runway, a waiting aircraft, a team in position. What underlies it is closer to the erection of a small, fully functional airport at the bottom of the world, assembled and maintained in one of the most operationally hostile environments on Earth.",
        },
        {
          label: "02",
          heading: "Weather intelligence",
          body: "Antarctica has no permanent commercial meteorological infrastructure. White Desert operates its own dedicated forecasting capability, a team with deep Antarctic expertise monitoring conditions across the Continent and the Southern Ocean simultaneously. Every flight decision draws on real-time runway data, assessed in minutes rather than hours during the critical pre-flight window. Conditions here can shift faster than almost anywhere else on Earth, and the forecasting team monitors them continuously throughout each operational window, advising the flight deck on whether to hold or proceed.",
        },
        {
          label: "03",
          heading: "The invisible infrastructure",
          body: "Wolf’s Fang has no permanent terminal, no fixed refuelling depot, no year-round passenger facilities. Every element of the arrival experience is positioned, maintained, and in some cases flown in ahead of each operational cycle. Between seasons, the Continent reclaims the site entirely. Each year, it is reconstituted from the ground up. What greets you on arrival has been assembled, in effect, just for you.",
        },
        {
          label: "04",
          heading: "The ground team",
          body: "More than 100 people work across White Desert’s Antarctic operations at any one time. Pilots with ten or more Antarctic seasons. Engineers trained to maintain aircraft in conditions for which standard protocols were never designed. Guides with deep field experience in crevasse navigation, emergency sheltering, and wilderness medicine. Guests see a fraction of this team; most of the work happens before the door opens. The impression of effortlessness is the product of precision, every role rehearsed for the conditions the continent routinely presents.",
        },
      ],
    },
    {
      kind: "statement",
      id: "arrival-quote",
      tone: "ice",
      heading: "There is no other arrival like it on Earth.",
      body: [],
    },
  ],
  cta: {
    heading: "Start planning your Antarctica experience",
    body: "",
    href: "/enquire",
    label: "Get in touch",
    tone: "navy",
  },
};
