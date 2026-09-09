import type { AssetId } from "@/content/assets";
import type { RouteFamily, RoutePath } from "@/content/route-manifest";
import { aboutTabs, readOnCta } from "@/content/shared";
import type { OwnerRow, PageDocument } from "@/content/types";

interface AboutSpec {
  readonly path: RoutePath;
  readonly family: RouteFamily;
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
  readonly ownerHeading: string;
  readonly ownerDescription: string;
  readonly ownerRows: readonly OwnerRow[];
}

function buildAboutPage(spec: AboutSpec): PageDocument {
  return {
    path: spec.path,
    family: spec.family,
    title: spec.title,
    description: spec.description,
    hero: {
      eyebrow: "About the field notes",
      eyebrowStyle: "serif",
      title: spec.title,
      titleStyle: "serif",
      align: "center",
      lede: spec.lede,
      ledeStyle: "serif",
      assetId: spec.heroAssetId,
      tabs: aboutTabs,
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
        id: "editorial-note",
        tone: "navy",
        heading: spec.storyHeading,
        body: spec.storyBody,
        assetId: spec.storyAssetId,
        caption: spec.storyCaption,
      },
      {
        kind: "ownerContent",
        id: "owner-record",
        tone: "mushroom",
        heading: spec.ownerHeading,
        description: spec.ownerDescription,
        rows: spec.ownerRows,
      },
    ],
    cta: readOnCta,
  };
}

export const aboutPages: readonly PageDocument[] = [
  buildAboutPage({
    path: "/about/founders",
    family: "about-story",
    title: "How the Notes Began",
    description:
      "The editorial idea behind Antarctic Field Notes, with organization history reserved for owner-approved content.",
    lede: "An editorial project built around careful looking and plain language.",
    heroAssetId: "expedition-leaders",
    statement: "The clearest stories begin by admitting what is known and what is not.",
    body: [
      "Antarctic Field Notes is the provisional identity for this visual adaptation. It offers a place to describe landscape and field routine without borrowing another organization’s history.",
      "Names, biographies and milestones are therefore absent until the site owner provides approved source material.",
    ],
    storyHeading: "A portrait without a borrowed identity",
    storyBody: [
      "The people pictured here are fictional figures created for this project. They establish a human scale beside the aircraft without representing founders, employees or customers.",
      "That boundary is part of the design: atmosphere can be original while organizational claims remain visibly unfilled.",
    ],
    storyAssetId: "expedition-leaders",
    storyCaption:
      "Original fictional field leaders; this image does not depict a named founder or operator.",
    ownerHeading: "Organization history",
    ownerDescription:
      "Owner-supplied content is required before any founder, history, milestone or leadership claim is published.",
    ownerRows: [
      {
        label: "Founders and leadership",
        hint: "Owner-supplied content: approved names, roles and biographies.",
      },
      {
        label: "History and milestones",
        hint: "Owner-supplied content: verified chronology and supporting sources.",
      },
      {
        label: "Purpose",
        hint: "Owner-supplied content: approved organization statement.",
      },
    ],
  }),
  buildAboutPage({
    path: "/about/foundation",
    family: "about-foundation",
    title: "Field Science",
    description:
      "An editorial introduction to observation in Antarctica, with programs and partnerships left for owner approval.",
    lede: "Good observation keeps a record of method, uncertainty and context.",
    heroAssetId: "blue-ice-cave",
    statement:
      "A field note becomes useful when someone else can understand how it was made.",
    body: [
      "Photography, sketches and written observations can preserve context without pretending to be scientific findings. The distinction matters: description records what was seen; research explains what evidence supports.",
      "This page provides the editorial frame only. It makes no claim about a foundation, program, partner or result.",
    ],
    storyHeading: "Leave room for uncertainty",
    storyBody: [
      "Ice changes with light, weather and viewpoint. A careful note records those conditions instead of turning one impression into a universal statement.",
      "The same discipline applies to publishing institutional work: programs and outcomes need an approved source and a responsible owner.",
    ],
    storyAssetId: "aerial-blue-ice",
    storyCaption: "An original aerial study of travellers crossing blue ice.",
    ownerHeading: "Programs and partnerships",
    ownerDescription:
      "No foundation, research partnership, donation or outcome claim has been approved for this adaptation.",
    ownerRows: [
      {
        label: "Programs",
        hint: "Owner-supplied content: current program scope and responsible contact.",
      },
      {
        label: "Research partners",
        hint: "Owner-supplied content: approved names, roles and permission to publish.",
      },
      {
        label: "Funding and outcomes",
        hint: "Owner-supplied content: verified amounts, reporting period and evidence.",
      },
    ],
  }),
  buildAboutPage({
    path: "/about/sustainability",
    family: "about-sustainability",
    title: "Responsible Observation",
    description:
      "A restrained editorial framework for observation, with environmental policies and performance left owner-supplied.",
    lede: "Responsibility begins with specific choices that can be checked.",
    heroAssetId: "polar-plateau",
    statement:
      "Broad promises are less useful than a record of decisions, limits and evidence.",
    body: [
      "This adaptation does not claim that an operator, camp or journey is sustainable. It describes a publishing principle: state the boundary, identify the evidence and leave unsupported performance claims out.",
      "Any environmental policy, measurement or certification shown here later must be current, attributable and approved by its owner.",
    ],
    storyHeading: "Observe before making a claim",
    storyBody: [
      "A landscape image can show scale and fragility, but it cannot prove operational performance. The page keeps those two roles separate.",
      "Editorial atmosphere belongs beside the photograph; policies, measurements and assurance belong in a dated owner record.",
    ],
    storyAssetId: "aerial-blue-ice",
    storyCaption:
      "An original landscape image, presented without an environmental performance claim.",
    ownerHeading: "Environmental record",
    ownerDescription:
      "All policies, measurements, certifications and performance statements are owner-supplied content and require evidence.",
    ownerRows: [
      {
        label: "Policy and scope",
        hint: "Owner-supplied content: current policy, responsible entity and scope.",
      },
      {
        label: "Measurements",
        hint: "Owner-supplied content: methodology, reporting period and reviewed figures.",
      },
      {
        label: "Standards and assurance",
        hint: "Owner-supplied content: verified standard, status and issuing body.",
      },
    ],
  }),
];
