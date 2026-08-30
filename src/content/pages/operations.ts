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
    titleStyle: "serif-italic",
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
