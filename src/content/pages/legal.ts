import type { RoutePath } from "@/content/route-manifest";
import type { PageDocument } from "@/content/types";

interface LegalSpec {
  readonly path: RoutePath;
  readonly title: string;
  readonly description: string;
  readonly requiredSections: readonly string[];
}

function buildLegalPage(spec: LegalSpec): PageDocument {
  return {
    path: spec.path,
    family: "legal",
    title: spec.title,
    description: spec.description,
    hero: {
      eyebrow: "Owner-supplied legal content",
      eyebrowStyle: "tracked",
      title: spec.title,
      titleStyle: "serif",
      align: "center",
      lede: "This page is a publication structure, not legal advice or an operative policy.",
      ledeStyle: "serif",
      assetId: "polar-plateau",
    },
    sections: [
      {
        kind: "document",
        id: "legal-placeholder",
        tone: "ice",
        heading: "Content awaiting owner and legal review",
        blocks: [
          {
            kind: "paragraph",
            text: "No legal text has been approved for this visual adaptation. Nothing on this page creates rights, obligations, consent, warranties or booking conditions.",
          },
          {
            kind: "heading",
            text: "Required owner-supplied sections",
          },
          {
            kind: "list",
            items: spec.requiredSections,
          },
          {
            kind: "paragraph",
            text: "Before publication, the site owner must supply the responsible legal entity, jurisdiction, effective date, contact route and counsel-approved text where applicable.",
          },
        ],
      },
      {
        kind: "ownerContent",
        id: "legal-record",
        tone: "mushroom",
        heading: "Owner-supplied legal record",
        description:
          "Publication is blocked until each field is completed from an approved legal source.",
        rows: [
          {
            label: "Responsible entity",
            hint: "Owner-supplied content: full legal name, registration and contact details.",
          },
          {
            label: "Jurisdiction and version",
            hint: "Owner-supplied content: governing jurisdiction, effective date and revision history.",
          },
          {
            label: "Approved document",
            hint: "Owner-supplied content: counsel-reviewed text with an accountable owner.",
          },
        ],
      },
    ],
    cta: null,
  };
}

export const legalPages: readonly PageDocument[] = [
  buildLegalPage({
    path: "/legal/website-terms",
    title: "Website Terms Placeholder",
    description: "A non-operative structure for owner-approved website terms.",
    requiredSections: [
      "Owner-supplied content: site ownership and permitted use.",
      "Owner-supplied content: intellectual-property and third-party material terms.",
      "Owner-supplied content: limitations, contact and dispute provisions.",
    ],
  }),
  buildLegalPage({
    path: "/legal/booking-terms",
    title: "Booking Terms Placeholder",
    description: "A non-operative structure for owner-approved booking terms.",
    requiredSections: [
      "Owner-supplied content: contracting parties and booking process.",
      "Owner-supplied content: payment, change and cancellation conditions.",
      "Owner-supplied content: responsibilities, risk information and assistance.",
    ],
  }),
  buildLegalPage({
    path: "/legal/privacy-policy",
    title: "Privacy Policy Placeholder",
    description: "A non-operative structure for an owner-approved privacy notice.",
    requiredSections: [
      "Owner-supplied content: controller identity and contact route.",
      "Owner-supplied content: data categories, purposes and lawful bases.",
      "Owner-supplied content: recipients, retention, rights and complaints.",
    ],
  }),
  buildLegalPage({
    path: "/legal/cookies",
    title: "Cookie Notice Placeholder",
    description: "A non-operative structure for an owner-approved cookie notice.",
    requiredSections: [
      "Owner-supplied content: technologies in use and their purposes.",
      "Owner-supplied content: duration, providers and consent requirements.",
      "Owner-supplied content: preference controls and withdrawal route.",
    ],
  }),
  buildLegalPage({
    path: "/legal/medical-disclaimer",
    title: "Medical Disclaimer Placeholder",
    description: "A non-operative structure for owner-approved health information.",
    requiredSections: [
      "Owner-supplied content: scope and intended audience.",
      "Owner-supplied content: professional advice and assessment requirements.",
      "Owner-supplied content: emergency, disclosure and assistance information.",
    ],
  }),
];
