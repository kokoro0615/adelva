import { planningCta } from "@/content/shared";
import type { PageDocument } from "@/content/types";

export const ratesPage: PageDocument = {
  path: "/prices",
  family: "rates",
  title: "Rates & Planning",
  description:
    "A planning shell for owner-approved rates, dates, inclusions and booking information.",
  hero: {
    eyebrow: "Plan with confirmed details",
    eyebrowStyle: "tracked",
    title: "Rates & Planning",
    titleStyle: "serif",
    align: "center",
    lede: "Commercial information belongs to the owner and must be current at publication.",
    ledeStyle: "serif",
    assetId: "aerial-blue-ice",
  },
  sections: [
    {
      kind: "statement",
      id: "opening",
      tone: "ice",
      heading:
        "No rate, date or availability is stated until the site owner approves it.",
      body: [
        "This page preserves the intended planning structure without presenting invented commercial facts. Every value below is an explicit owner-supplied placeholder.",
        "A future update must identify currency, basis, inclusions, exclusions and the booking terms that govern the offer.",
      ],
    },
    {
      kind: "rates",
      id: "rate-layout",
      tone: "ice",
    },
    {
      kind: "ownerContent",
      id: "commercial-record",
      tone: "mushroom",
      heading: "Owner-supplied commercial record",
      description:
        "The following fields are intentionally blank of commercial claims until approved source material is provided.",
      rows: [
        {
          label: "Journey rates",
          hint: "Owner-supplied content: rate, currency, tax treatment and occupancy basis.",
        },
        {
          label: "Departure dates",
          hint: "Owner-supplied content: confirmed date range and availability status.",
        },
        {
          label: "Inclusions and exclusions",
          hint: "Owner-supplied content: exact services, transport, equipment and exclusions.",
        },
        {
          label: "Payment and cancellation",
          hint: "Owner-supplied content: link to approved booking terms; do not summarize unverified terms.",
        },
      ],
    },
  ],
  cta: planningCta,
};
