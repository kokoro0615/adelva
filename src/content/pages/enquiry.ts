import type { PageDocument } from "@/content/types";

export const enquiryPage: PageDocument = {
  path: "/enquire",
  family: "enquiry-form",
  title: "Start an Enquiry",
  description:
    "A local-only enquiry demonstration that does not transmit or store personal information.",
  hero: {
    eyebrow: "Local demonstration",
    eyebrowStyle: "tracked",
    title: "Start an Enquiry",
    titleStyle: "serif",
    align: "center",
    lede: "Explore the questions locally; nothing is sent from this adaptation.",
    ledeStyle: "serif",
    assetId: "ice-runway-flight",
  },
  sections: [
    {
      kind: "statement",
      id: "privacy-note",
      tone: "ice",
      heading: "This form is an interface demonstration, not a booking channel.",
      body: [
        "Values remain in the browser for the current interaction and are not submitted to a server, emailed, tracked or used to promise a response.",
        "A production contact destination, privacy notice and retention policy must be supplied and approved by the site owner before transmission is enabled.",
      ],
    },
    {
      kind: "enquiry",
      id: "enquiry-form",
      tone: "ice",
    },
    {
      kind: "ownerContent",
      id: "contact-governance",
      tone: "mushroom",
      heading: "Before enquiries can be sent",
      description:
        "Submission remains disabled until the owner supplies an approved destination and data-handling record.",
      rows: [
        {
          label: "Contact destination",
          hint: "Owner-supplied content: responsible inbox or approved processing service.",
        },
        {
          label: "Privacy notice",
          hint: "Owner-supplied content: applicable notice, lawful basis and contact details.",
        },
        {
          label: "Retention and deletion",
          hint: "Owner-supplied content: approved retention period and deletion process.",
        },
        {
          label: "Response expectations",
          hint: "Owner-supplied content: verified service wording without an invented promise.",
        },
      ],
    },
  ],
  cta: null,
};
