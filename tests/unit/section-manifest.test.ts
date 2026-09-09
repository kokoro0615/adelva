import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error The fidelity tooling is intentionally executable JavaScript.
import * as sectionManifestTool from "../../scripts/fidelity/section-manifest.mjs";

const {
  compareSectionManifests,
  validateSectionComparisonIdentity,
  validateSectionGatePlanCoverage,
  validateSectionManifest,
} = sectionManifestTool;

type Section = {
  id: string;
  semantic: string;
  nodeKind?: "element" | "virtual";
  itemCount?: number;
  pinned?: boolean;
  isFooter?: boolean;
  keyLinks?: string[];
  assets?: string[];
  visibleState?: Record<string, string>;
  motionDisposition?: string;
  bounds: Record<string, { x?: number; y: number; width?: number; height: number }>;
  children?: Section[];
};

type Evidence = {
  top: { path: string; sha256?: string } | null;
  fullPage: { path: string } | null;
  sectionCaptures: Array<{ sectionId: string; path: string }>;
  checkpoints: Array<{ sectionId: string; position: string; path: string }>;
  motionCaptures?: Array<{ layerId: string; phase: string; path: string }>;
};

type ManifestFixture = {
  schemaVersion: string;
  manifestId: string;
  role: "reference" | "implementation";
  route: string;
  family: string;
  scope: { kind: string; id: string };
  requiredViewports: string[];
  tolerances: { boundsPx: number; scrollHeightPx: number };
  sections: Section[];
  domTopology?: { scope: string; directChildren: string[] };
  viewports: Record<
    string,
    {
      width: number;
      height: number;
      scrollHeight: number;
      evidence: Evidence;
    }
  >;
  motion: { status: "complete" | "incomplete"; layers: Record<string, unknown>[] };
};

function section(id: string, y: number): Section {
  return {
    id,
    semantic: id,
    bounds: { desktop: { y, height: 900 } },
  };
}

function manifest(
  role: "reference" | "implementation",
  sections: Section[],
): ManifestFixture {
  return {
    schemaVersion: "full-page-section-manifest/v1",
    manifestId: `home-${role}`,
    role,
    route: "/",
    family: "home",
    scope: { kind: "route-content", id: "home-content" },
    requiredViewports: ["desktop"],
    tolerances: { boundsPx: 1, scrollHeightPx: 1 },
    sections,
    viewports: {
      desktop: {
        width: 1440,
        height: 900,
        scrollHeight: 1800,
        evidence: {
          top: { path: "same-top.png", sha256: "same-pixels" },
          fullPage: null,
          sectionCaptures: [],
          checkpoints: [],
        },
      },
    },
    motion: { status: "complete", layers: [] },
  };
}

const canonicalHeroContract = {
  schemaVersion: "full-page-section-manifest/v1",
  manifestId: "home-canonical-v1",
  route: "/",
  family: "home",
  scope: { kind: "route-content", id: "home-content" },
  requiredViewports: ["desktop"],
  tolerances: { boundsPx: 1, scrollHeightPx: 1 },
  domTopology: { directChildren: ["hero"] },
  sections: [
    {
      id: "hero",
      semantic: "hero",
      nodeKind: "element",
      assets: ["hero-media"],
    },
  ],
  assets: {
    "hero-media": {
      acceptedSources: {
        target: ["https://cdn.example.test/hero.jpg"],
        implementation: ["/media/target/hero.webp"],
      },
    },
  },
  motion: { layers: [] },
};

const targetHeroAdapter = {
  kind: "target",
  scopeAliases: {
    "home-content": {
      rawIds: ["target-home-content"],
      selectors: [".page-content"],
    },
  },
  sectionAliases: {
    hero: { rawIds: ["target-hero"], selectors: [".hero-banner"] },
  } as Record<string, { rawIds: string[]; selectors: string[] }>,
  motionAliases: {},
};

const implementationAdapter = { kind: "implementation" };

function canonicalObservation(
  role: "reference" | "implementation",
  { completeEvidence = true }: { completeEvidence?: boolean } = {},
) {
  const rawSectionId = role === "reference" ? "target-hero" : "hero";
  const value = manifest(role, [
    {
      ...section(rawSectionId, 0),
      semantic:
        role === "reference"
          ? "div | hero-banner | Antarctica"
          : "section | home-hero | Antarctica",
      assets: [
        role === "reference"
          ? "https://cdn.example.test/hero.jpg"
          : "/media/target/hero.webp",
      ],
    },
  ]);
  const rootScope =
    role === "reference" ? ".page-content" : "main#main-content > [data-page-content]";
  value.scope.id = role === "reference" ? "target-home-content" : "home-content";
  value.domTopology = { scope: rootScope, directChildren: [rawSectionId] };
  value.viewports.desktop.evidence = completeEvidence
    ? {
        top: { path: `${role}-top.png` },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [
          { sectionId: rawSectionId, path: `${role}-${rawSectionId}.png` },
        ],
        checkpoints: [
          ...["start", "center", "end"].map((position) => ({
            sectionId: rawSectionId,
            position,
            path: `${role}-${rawSectionId}-${position}.png`,
          })),
        ],
        motionCaptures: [],
      }
    : {
        top: { path: `${role}-top.png` },
        fullPage: null,
        sectionCaptures: [],
        checkpoints: [],
        motionCaptures: [],
      };
  return value;
}

function addCanonicalSeason(
  value: ManifestFixture,
  { prepend = false }: { prepend?: boolean } = {},
) {
  const rawSectionId = value.role === "reference" ? "target-season" : "season";
  const season = {
    ...section(rawSectionId, 900),
    semantic:
      value.role === "reference"
        ? "div | season | Our Season"
        : "section | season | Our Season",
    assets: [],
  };
  if (prepend) {
    value.sections.unshift(season);
    value.domTopology!.directChildren.unshift(rawSectionId);
  } else {
    value.sections.push(season);
    value.domTopology!.directChildren.push(rawSectionId);
  }
  value.viewports.desktop.evidence.sectionCaptures.push({
    sectionId: rawSectionId,
    path: `${value.role}-${rawSectionId}.png`,
  });
  value.viewports.desktop.evidence.checkpoints.push(
    ...["start", "center", "end"].map((position) => ({
      sectionId: rawSectionId,
      position,
      path: `${value.role}-${rawSectionId}-${position}.png`,
    })),
  );
}

function canonicalComparisonOptions(reviewedContract = canonicalHeroContract) {
  return {
    reviewedContract,
    referenceAdapter: targetHeroAdapter,
    implementationAdapter,
    motionPreference: "no-preference",
  };
}

describe("full-page section manifest comparator", () => {
  it("compares reviewed target aliases and local assets through canonical semantic identities", () => {
    const result = compareSectionManifests(
      canonicalObservation("reference"),
      canonicalObservation("implementation"),
      canonicalComparisonOptions(),
    );

    expect(result.accepted).toBe(true);
    expect(result.normalizationFailures).toEqual([]);
    expect(result.identityMismatches).toEqual([]);
    expect(result.domRootMismatches).toEqual([]);
  });

  it.each([
    {
      name: "an unmapped target section",
      twoSectionContract: false,
      mutate: (reference: ManifestFixture, implementation: ManifestFixture) => {
        void implementation;
        reference.sections[0].id = "unreviewed-hero";
        reference.domTopology!.directChildren = ["unreviewed-hero"];
        reference.viewports.desktop.evidence.sectionCaptures[0].sectionId =
          "unreviewed-hero";
        for (const checkpoint of reference.viewports.desktop.evidence.checkpoints) {
          checkpoint.sectionId = "unreviewed-hero";
        }
      },
      code: "UNMAPPED_SECTION",
    },
    {
      name: "reordered canonical sections",
      twoSectionContract: true,
      mutate: (reference: ManifestFixture, implementation: ManifestFixture) => {
        addCanonicalSeason(reference, { prepend: true });
        addCanonicalSeason(implementation);
      },
      code: "SECTION_ORDER_MISMATCH",
    },
    {
      name: "a missing canonical section",
      twoSectionContract: true,
      mutate: (_reference: ManifestFixture, implementation: ManifestFixture) => {
        addCanonicalSeason(implementation);
      },
      code: "MISSING_SECTION",
    },
  ])("fails closed on $name", ({ twoSectionContract, mutate, code }) => {
    const contract = structuredClone(canonicalHeroContract);
    const referenceAdapter = structuredClone(targetHeroAdapter);
    if (twoSectionContract) {
      contract.domTopology.directChildren.push("season");
      contract.sections.push({
        id: "season",
        semantic: "season",
        nodeKind: "element",
        assets: [],
      });
      referenceAdapter.sectionAliases.season = {
        rawIds: ["target-season"],
        selectors: [".season"],
      };
    }
    const reference = canonicalObservation("reference");
    const implementation = canonicalObservation("implementation");
    mutate(reference, implementation);

    const result = compareSectionManifests(reference, implementation, {
      ...canonicalComparisonOptions(contract),
      referenceAdapter,
    });

    expect(result.accepted).toBe(false);
    expect(result.normalizationFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ manifest: "reference", code }),
      ]),
    );
  });

  it("keeps manifest-only raw evidence blocking after canonical normalization", () => {
    const result = compareSectionManifests(
      canonicalObservation("reference", { completeEvidence: false }),
      canonicalObservation("implementation"),
      canonicalComparisonOptions(),
    );

    expect(result.normalizationFailures).toEqual([]);
    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "TOP_ONLY_EVIDENCE",
          manifest: "reference",
        }),
        expect.objectContaining({
          code: "MISSING_FULL_PAGE_CAPTURE",
          manifest: "reference",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("rejects a missing below-fold section even when the top-frame evidence is identical", () => {
    const reference = manifest("reference", [
      section("hero", 0),
      section("our-season", 900),
    ]);
    const implementation = manifest("implementation", [section("hero", 0)]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.accepted).toBe(false);
    expect(result.missing).toEqual(["our-season"]);
    expect(result.extra).toEqual([]);
    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "TOP_ONLY_EVIDENCE", manifest: "reference" }),
        expect.objectContaining({
          code: "TOP_ONLY_EVIDENCE",
          manifest: "implementation",
        }),
      ]),
    );
  });

  it("reports implementation-only sections as extra", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [
      section("hero", 0),
      section("invented-section", 900),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.extra).toEqual(["invented-section"]);
    expect(result.accepted).toBe(false);
  });

  it("rejects duplicate semantic IDs instead of collapsing them into a set", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [
      section("hero", 0),
      section("hero", 900),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.duplicates).toEqual([
      { manifest: "implementation", id: "hero", count: 2 },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("rejects reordered siblings even when the section sets match", () => {
    const reference = manifest("reference", [
      section("hero", 0),
      section("our-season", 900),
    ]);
    const implementation = manifest("implementation", [
      section("our-season", 900),
      section("hero", 0),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(result.reordered).toEqual([
      {
        parentId: null,
        reference: ["hero", "our-season"],
        implementation: ["our-season", "hero"],
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("supports a sibling-backed virtual group and rejects its nested item-count gap", () => {
    const trips = (itemCount: number): Section => ({
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children: [
        section("our-trips-title", 900),
        {
          ...section("our-trips-cards", 1200),
          itemCount,
        },
      ],
    });
    const reference = manifest("reference", [section("hero", 0), trips(5)]);
    const implementation = manifest("implementation", [section("hero", 0), trips(4)]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(result.nestedCountMismatches).toEqual([
      { id: "our-trips-cards", reference: 5, implementation: 4 },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("compares direct DOM topology separately from virtual semantic parents", () => {
    const groupedSections: Section[] = [
      section("hero", 0),
      {
        id: "our-trips",
        semantic: "our-trips",
        nodeKind: "virtual",
        bounds: {},
        children: [section("our-trips-title", 900), section("our-trips-cards", 1200)],
      },
    ];
    const reference = {
      ...manifest("reference", groupedSections),
      domTopology: {
        scope: ".page-content",
        directChildren: ["hero", "our-trips-title", "our-trips-cards"],
      },
    };
    const implementation = {
      ...manifest("implementation", groupedSections),
      domTopology: {
        scope: "main",
        directChildren: ["hero", "our-trips", "our-trips-cards"],
      },
    };

    const result = compareSectionManifests(reference, implementation);

    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
    expect(result.domTopologyMismatches).toEqual([
      {
        reference: ["hero", "our-trips-title", "our-trips-cards"],
        implementation: ["hero", "our-trips", "our-trips-cards"],
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("rejects section bounds outside the predeclared reference tolerance", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const shiftedHero = section("hero", 3);
    const implementation = manifest("implementation", [shiftedHero]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.boundsMismatches).toEqual([
      {
        id: "hero",
        viewport: "desktop",
        field: "y",
        reference: 0,
        implementation: 3,
        tolerance: 1,
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("compares measured horizontal bounds when the reviewed manifest provides them", () => {
    const referenceHero = section("hero", 0);
    referenceHero.bounds.desktop = { x: 12, y: 0, width: 1416, height: 900 };
    const implementationHero = section("hero", 0);
    implementationHero.bounds.desktop = {
      x: 12,
      y: 0,
      width: 1400,
      height: 900,
    };

    const result = compareSectionManifests(
      manifest("reference", [referenceHero]),
      manifest("implementation", [implementationHero]),
    );

    expect(result.boundsMismatches).toEqual(
      expect.arrayContaining([
        {
          id: "hero",
          viewport: "desktop",
          field: "width",
          reference: 1416,
          implementation: 1400,
          tolerance: 1,
        },
      ]),
    );
  });

  it("requires full-page, per-section, and start/center/end checkpoint evidence", () => {
    const sections = [section("hero", 0), section("our-season", 900)];
    const withIncompleteCoverage = (role: "reference" | "implementation") => {
      const value = manifest(role, sections);
      value.viewports.desktop.evidence = {
        top: { path: `${role}-top.png`, sha256: `${role}-top` },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [{ sectionId: "hero", path: `${role}-hero.png` }],
        checkpoints: [
          { sectionId: "hero", position: "start", path: `${role}-hero-start.png` },
          { sectionId: "hero", position: "center", path: `${role}-hero-center.png` },
          { sectionId: "hero", position: "end", path: `${role}-hero-end.png` },
          {
            sectionId: "our-season",
            position: "start",
            path: `${role}-season-start.png`,
          },
        ],
      };
      return value;
    };

    const result = compareSectionManifests(
      withIncompleteCoverage("reference"),
      withIncompleteCoverage("implementation"),
    );

    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_SECTION_CAPTURE",
          manifest: "reference",
          sectionId: "our-season",
        }),
        expect.objectContaining({
          code: "MISSING_SCROLL_CHECKPOINT",
          manifest: "implementation",
          sectionId: "our-season",
          position: "center",
        }),
        expect.objectContaining({
          code: "MISSING_SCROLL_CHECKPOINT",
          manifest: "implementation",
          sectionId: "our-season",
          position: "end",
        }),
      ]),
    );
    expect(result.evidenceFailures).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "TOP_ONLY_EVIDENCE" })]),
    );
    expect(result.accepted).toBe(false);
  });

  it("rejects reordered siblings at nested semantic levels", () => {
    const group = (children: Section[]): Section => ({
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children,
    });
    const title = section("our-trips-title", 900);
    const cards = section("our-trips-cards", 1200);
    const reference = manifest("reference", [
      section("hero", 0),
      group([title, cards]),
    ]);
    const implementation = manifest("implementation", [
      section("hero", 0),
      group([cards, title]),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.reordered).toEqual([
      {
        parentId: "our-trips",
        reference: ["our-trips-title", "our-trips-cards"],
        implementation: ["our-trips-cards", "our-trips-title"],
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("rejects semantic, node-kind, and parent-identity drift", () => {
    const referenceGroup: Section = {
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children: [section("our-trips-cards", 900)],
    };
    const changedHero = { ...section("hero", 0), semantic: "generic-banner" };
    const changedGroup: Section = {
      ...referenceGroup,
      nodeKind: "element",
      children: [],
    };
    const reference = manifest("reference", [section("hero", 0), referenceGroup]);
    const implementation = manifest("implementation", [
      changedHero,
      changedGroup,
      section("our-trips-cards", 900),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.identityMismatches).toEqual([
      {
        id: "hero",
        field: "semantic",
        reference: "hero",
        implementation: "generic-banner",
      },
      {
        id: "our-trips",
        field: "nodeKind",
        reference: "virtual",
        implementation: "element",
      },
      {
        id: "our-trips-cards",
        field: "parentId",
        reference: "our-trips",
        implementation: null,
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("rejects a required viewport omitted by the implementation", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [section("hero", 0)]);
    implementation.requiredViewports = [];
    implementation.viewports = {} as typeof implementation.viewports;

    const result = compareSectionManifests(reference, implementation);

    expect(result.viewportMismatches).toEqual([
      {
        code: "MISSING_REQUIRED_VIEWPORT",
        viewport: "desktop",
        reference: { width: 1440, height: 900 },
        implementation: null,
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("rejects viewport dimensions and scroll height outside reference tolerances", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [section("hero", 0)]);
    implementation.viewports.desktop.width = 1438;
    implementation.viewports.desktop.height = 902;
    implementation.viewports.desktop.scrollHeight = 1803;

    const result = compareSectionManifests(reference, implementation);

    expect(result.viewportMismatches).toEqual([
      {
        code: "VIEWPORT_DIMENSION_MISMATCH",
        viewport: "desktop",
        field: "width",
        reference: 1440,
        implementation: 1438,
      },
      {
        code: "VIEWPORT_DIMENSION_MISMATCH",
        viewport: "desktop",
        field: "height",
        reference: 900,
        implementation: 902,
      },
      {
        code: "SCROLL_HEIGHT_MISMATCH",
        viewport: "desktop",
        field: "scrollHeight",
        reference: 1800,
        implementation: 1803,
        tolerance: 1,
      },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("requires declared pin and footer checkpoints", () => {
    const camps = { ...section("our-camps", 0), pinned: true };
    const footer = { ...section("site-footer", 900), isFooter: true };
    const withEvidence = (role: "reference" | "implementation") => {
      const value = manifest(role, [camps, footer]);
      value.viewports.desktop.evidence = {
        top: { path: `${role}-top.png`, sha256: role },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [
          { sectionId: "our-camps", path: `${role}-camps.png` },
          { sectionId: "site-footer", path: `${role}-footer.png` },
        ],
        checkpoints: [
          ...["start", "center", "end", "pin-start", "pin-end"].map((position) => ({
            sectionId: "our-camps",
            position,
            path: `${role}-camps-${position}.png`,
          })),
          ...["start", "center", "end"].map((position) => ({
            sectionId: "site-footer",
            position,
            path: `${role}-footer-${position}.png`,
          })),
        ],
      };
      return value;
    };

    const result = compareSectionManifests(
      withEvidence("reference"),
      withEvidence("implementation"),
    );

    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_SCROLL_CHECKPOINT",
          manifest: "reference",
          sectionId: "our-camps",
          position: "pin-mid",
        }),
        expect.objectContaining({
          code: "MISSING_SCROLL_CHECKPOINT",
          manifest: "implementation",
          sectionId: "site-footer",
          position: "footer",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("requires a complete, matching motion-layer inventory", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    reference.motion = {
      status: "complete",
      layers: [
        { id: "hero-mist", sectionId: "hero", property: "rotateX" },
        { id: "hero-cloud-near", sectionId: "hero", property: "translateY" },
      ],
    };
    const implementation = manifest("implementation", [section("hero", 0)]);
    implementation.motion = {
      status: "incomplete",
      layers: [
        { id: "hero-mist", sectionId: "hero", property: "opacity" },
        { id: "invented-layer", sectionId: "hero", property: "translateY" },
      ],
    };

    const result = compareSectionManifests(reference, implementation);

    expect(result.motionMismatches).toEqual([
      {
        code: "MOTION_LAYER_FIELD_MISMATCH",
        id: "hero-mist",
        field: "property",
        reference: "rotateX",
        implementation: "opacity",
      },
      { code: "MISSING_MOTION_LAYER", id: "hero-cloud-near" },
      { code: "EXTRA_MOTION_LAYER", id: "invented-layer" },
    ]);
    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "INCOMPLETE_MOTION_INVENTORY",
          manifest: "implementation",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("keeps global flyouts in a shell manifest instead of route content", () => {
    const contentReference = manifest("reference", [section("hero", 0)]);
    const contentImplementation = manifest("implementation", [section("hero", 0)]);
    const shellReference = manifest("reference", [
      section("global-navigation", 0),
      section("how-it-works-flyout", 0),
    ]);
    const shellImplementation = manifest("implementation", [
      section("global-navigation", 0),
    ]);
    shellReference.scope = { kind: "global-shell", id: "site-shell" };
    shellImplementation.scope = { kind: "global-shell", id: "site-shell" };

    const contentResult = compareSectionManifests(
      contentReference,
      contentImplementation,
    );
    const shellResult = compareSectionManifests(shellReference, shellImplementation);

    expect(contentResult.scopeMismatches).toEqual([]);
    expect(contentResult.missing).toEqual([]);
    expect(contentResult.extra).toEqual([]);
    expect(shellResult.scopeMismatches).toEqual([]);
    expect(shellResult.missing).toEqual(["how-it-works-flyout"]);
  });

  it("rejects an unknown schema version before structural acceptance", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    reference.schemaVersion = "invented/v9";

    const failures = validateSectionManifest(reference);

    expect(failures).toEqual(
      expect.arrayContaining([
        {
          code: "INVALID_SCHEMA_VERSION",
          manifest: "reference",
          path: "schemaVersion",
          message:
            "schemaVersion must be full-page-section-manifest/v1; received invented/v9.",
        },
      ]),
    );
  });

  it("allows boundless virtual groups but requires element bounds per viewport", () => {
    const title = section("our-trips-title", 900);
    const group: Section = {
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children: [title],
    };
    const reference = manifest("reference", [section("hero", 0), group]);
    const validFailures = validateSectionManifest(reference);

    title.bounds = {};
    const invalidFailures = validateSectionManifest(reference);

    expect(validFailures).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_SECTION_BOUNDS",
          sectionId: "our-trips",
        }),
      ]),
    );
    expect(invalidFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_SECTION_BOUNDS",
          manifest: "reference",
          sectionId: "our-trips-title",
          viewport: "desktop",
        }),
      ]),
    );
  });

  it("accepts only complete parity and records explicit empty missing/extra arrays", () => {
    const complete = (role: "reference" | "implementation") => {
      const value = manifest(role, [section("hero", 0)]);
      value.viewports.desktop.evidence = {
        top: { path: `${role}-top.png`, sha256: `${role}-top` },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [{ sectionId: "hero", path: `${role}-hero.png` }],
        checkpoints: ["start", "center", "end"].map((position) => ({
          sectionId: "hero",
          position,
          path: `${role}-hero-${position}.png`,
        })),
      };
      return {
        ...value,
        domTopology: { scope: ".page-content", directChildren: ["hero"] },
      };
    };

    const result = compareSectionManifests(
      complete("reference"),
      complete("implementation"),
    );

    expect(result).toMatchObject({
      accepted: true,
      status: "accepted",
      acceptance: { missing: [], extra: [] },
    });
  });

  it("rejects a content-root scope mismatch even when direct children match", () => {
    const reference = {
      ...manifest("reference", [section("hero", 0)]),
      domTopology: { scope: ".page-content", directChildren: ["hero"] },
    };
    const implementation = {
      ...manifest("implementation", [section("hero", 0)]),
      domTopology: { scope: "main", directChildren: ["hero"] },
    };

    const result = compareSectionManifests(reference, implementation);

    expect(result.domRootMismatches).toEqual([
      { reference: ".page-content", implementation: "main" },
    ]);
    expect(result.accepted).toBe(false);
  });

  it("requires a top-state artifact in addition to full-page evidence", () => {
    const value = manifest("reference", [section("hero", 0)]);
    value.viewports.desktop.evidence = {
      top: null,
      fullPage: { path: "reference-full.png" },
      sectionCaptures: [{ sectionId: "hero", path: "reference-hero.png" }],
      checkpoints: ["start", "center", "end"].map((position) => ({
        sectionId: "hero",
        position,
        path: `reference-hero-${position}.png`,
      })),
    };

    const result = compareSectionManifests(
      { ...value, domTopology: { scope: "main", directChildren: ["hero"] } },
      {
        ...structuredClone(value),
        role: "implementation",
        manifestId: "home-implementation",
        domTopology: { scope: "main", directChildren: ["hero"] },
      },
    );

    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_TOP_CAPTURE",
          manifest: "reference",
          viewport: "desktop",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("rejects duplicate and unknown section evidence records", () => {
    const withEvidence = (role: "reference" | "implementation") => {
      const value = manifest(role, [section("hero", 0)]);
      value.viewports.desktop.evidence = {
        top: { path: `${role}-top.png` },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [
          { sectionId: "hero", path: `${role}-hero-a.png` },
          { sectionId: "hero", path: `${role}-hero-b.png` },
          { sectionId: "invented", path: `${role}-invented.png` },
        ],
        checkpoints: ["start", "center", "end"].map((position) => ({
          sectionId: "hero",
          position,
          path: `${role}-hero-${position}.png`,
        })),
      };
      return {
        ...value,
        domTopology: { scope: "main", directChildren: ["hero"] },
      };
    };

    const result = compareSectionManifests(
      withEvidence("reference"),
      withEvidence("implementation"),
    );

    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_SECTION_CAPTURE",
          manifest: "reference",
          sectionId: "hero",
        }),
        expect.objectContaining({
          code: "UNKNOWN_SECTION_CAPTURE",
          manifest: "implementation",
          sectionId: "invented",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("compares reviewed section links, assets, visible state, and motion disposition", () => {
    const detailedHero = {
      ...section("hero", 0),
      keyLinks: ["/enquire"],
      assets: ["asset://hero-video"],
      visibleState: { desktop: "rendered" },
      motionDisposition: "scroll-driven",
    };
    const reference = manifest("reference", [detailedHero]);
    const implementation = manifest("implementation", [
      {
        ...detailedHero,
        keyLinks: ["/prices"],
        assets: ["asset://invented-video"],
        visibleState: { desktop: "hidden" },
        motionDisposition: "static",
      },
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(
      result.identityMismatches.map(({ field }: { field: string }) => field),
    ).toEqual(
      expect.arrayContaining([
        "keyLinks",
        "assets",
        "visibleState",
        "motionDisposition",
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("rejects swapped manifest roles and template-family drift", () => {
    const reference = {
      ...manifest("implementation", [section("hero", 0)]),
      family: "home",
    };
    const implementation = {
      ...manifest("reference", [section("hero", 0)]),
      family: "invented-home",
    };

    const result = compareSectionManifests(reference, implementation);

    expect(result.roleMismatches).toEqual([
      { position: "reference", expected: "reference", received: "implementation" },
      {
        position: "implementation",
        expected: "implementation",
        received: "reference",
      },
    ]);
    expect(result.scopeMismatches).toEqual(
      expect.arrayContaining([
        {
          field: "family",
          reference: "home",
          implementation: "invented-home",
        },
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("rejects implementation-only required viewports", () => {
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [
      {
        ...section("hero", 0),
        bounds: {
          desktop: { y: 0, height: 900 },
          mobile: { y: 0, height: 844 },
        },
      },
    ]);
    implementation.requiredViewports.push("mobile");
    implementation.viewports.mobile = {
      width: 390,
      height: 844,
      scrollHeight: 1688,
      evidence: {
        top: { path: "mobile-top.png" },
        fullPage: null,
        sectionCaptures: [],
        checkpoints: [],
      },
    };

    const result = compareSectionManifests(reference, implementation);

    expect(result.viewportMismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "EXTRA_REQUIRED_VIEWPORT",
          viewport: "mobile",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("exits nonzero and emits diagnostics for a rejected CLI comparison", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "section-manifest-"));
    try {
      const referencePath = path.join(workspace, "reference.json");
      const implementationPath = path.join(workspace, "implementation.json");
      await writeFile(
        referencePath,
        JSON.stringify(
          manifest("reference", [section("hero", 0), section("our-season", 900)]),
        ),
      );
      await writeFile(
        implementationPath,
        JSON.stringify(manifest("implementation", [section("hero", 0)])),
      );

      const result = spawnSync(
        process.execPath,
        [
          "scripts/fidelity/section-manifest.mjs",
          `--reference=${referencePath}`,
          `--implementation=${implementationPath}`,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('"status": "rejected"');
      expect(result.stdout).toContain('"our-season"');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("rejects manifest evidence paths that do not resolve to files", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "section-artifacts-"));
    try {
      const complete = (role: "reference" | "implementation") => {
        const value = manifest(role, [section("hero", 0)]);
        value.viewports.desktop.evidence = {
          top: { path: `${role}-top.png`, sha256: role },
          fullPage: { path: `${role}-full.png` },
          sectionCaptures: [{ sectionId: "hero", path: `${role}-hero.png` }],
          checkpoints: ["start", "center", "end"].map((position) => ({
            sectionId: "hero",
            position,
            path: `${role}-hero-${position}.png`,
          })),
        };
        return {
          ...value,
          domTopology: { scope: "main", directChildren: ["hero"] },
        };
      };
      const referencePath = path.join(workspace, "reference.json");
      const implementationPath = path.join(workspace, "implementation.json");
      await writeFile(referencePath, JSON.stringify(complete("reference")));
      await writeFile(implementationPath, JSON.stringify(complete("implementation")));

      const result = spawnSync(
        process.execPath,
        [
          "scripts/fidelity/section-manifest.mjs",
          `--reference=${referencePath}`,
          `--implementation=${implementationPath}`,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('"code": "MISSING_EVIDENCE_ARTIFACT"');
      expect(result.stdout).toContain('"path": "reference-full.png"');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("forbids a virtual semantic group from masquerading as a direct DOM child", () => {
    const group: Section = {
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children: [section("our-trips-title", 900)],
    };
    const reference = {
      ...manifest("reference", [section("hero", 0), group]),
      domTopology: {
        scope: ".page-content",
        directChildren: ["hero", "our-trips"],
      },
    };

    expect(validateSectionManifest(reference)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VIRTUAL_DIRECT_DOM_CHILD",
          manifest: "reference",
          sectionId: "our-trips",
        }),
      ]),
    );
  });

  it("reports nested child-count drift in addition to the missing child identity", () => {
    const group = (children: Section[]): Section => ({
      id: "our-trips",
      semantic: "our-trips",
      nodeKind: "virtual",
      bounds: {},
      children,
    });
    const reference = manifest("reference", [
      group([section("our-trips-title", 0), section("our-trips-cards", 900)]),
    ]);
    const implementation = manifest("implementation", [
      group([section("our-trips-title", 0)]),
    ]);

    const result = compareSectionManifests(reference, implementation);

    expect(result.missing).toEqual(["our-trips-cards"]);
    expect(result.nestedCountMismatches).toEqual([
      {
        id: "our-trips",
        field: "children",
        reference: 2,
        implementation: 1,
      },
    ]);
  });

  it("runs route-content and global-shell comparisons from one gate plan", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "section-plan-"));
    try {
      const pairs: Array<{
        id: string;
        scope: "route-content" | "global-shell";
        route?: string;
      }> = [
        { id: "home-content", scope: "route-content", route: "/" },
        { id: "site-shell", scope: "global-shell" },
      ];
      const comparisons = [];
      for (const pair of pairs) {
        const reference = manifest("reference", [section("hero", 0)]);
        const implementation = manifest("implementation", [section("hero", 0)]);
        reference.scope = { kind: pair.scope, id: pair.id };
        implementation.scope = { kind: pair.scope, id: pair.id };
        const referenceFile = `${pair.id}-reference.json`;
        const implementationFile = `${pair.id}-implementation.json`;
        await writeFile(path.join(workspace, referenceFile), JSON.stringify(reference));
        await writeFile(
          path.join(workspace, implementationFile),
          JSON.stringify(implementation),
        );
        comparisons.push({
          id: pair.id,
          scopeKind: pair.scope,
          ...(pair.route ? { route: pair.route } : {}),
          reference: referenceFile,
          implementation: implementationFile,
        });
      }
      await writeFile(
        path.join(workspace, "routes.json"),
        JSON.stringify([{ path: "/", family: "home" }]),
      );
      const planPath = path.join(workspace, "plan.json");
      await writeFile(
        planPath,
        JSON.stringify({
          schemaVersion: "full-page-section-gate-plan/v1",
          routeAuthority: "routes.json",
          comparisons,
        }),
      );

      const result = spawnSync(
        process.execPath,
        ["scripts/fidelity/section-manifest.mjs", `--plan=${planPath}`],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('"comparisonCount": 2');
      expect(result.stdout).toContain('"id": "home-content"');
      expect(result.stdout).toContain('"id": "site-shell"');
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("accepts a fully covered route plan only when route and shell artifacts exist", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "section-plan-green-"));
    try {
      const comparisons = [];
      for (const scopeKind of ["route-content", "global-shell"] as const) {
        const id = scopeKind === "route-content" ? "home-content" : "site-shell";
        const sectionId = scopeKind === "route-content" ? "hero" : "site-footer";
        const makeComplete = (role: "reference" | "implementation") => {
          const value = manifest(role, [
            {
              ...section(sectionId, 0),
              ...(scopeKind === "global-shell" ? { isFooter: true } : {}),
            },
          ]);
          value.scope = { kind: scopeKind, id };
          if (scopeKind === "route-content") {
            value.domTopology = {
              scope: ".page-content",
              directChildren: [sectionId],
            };
          }
          const prefix = `${id}-${role}`;
          value.viewports.desktop.evidence = {
            top: { path: `${prefix}-top.png` },
            fullPage: { path: `${prefix}-full.png` },
            sectionCaptures: [{ sectionId, path: `${prefix}-${sectionId}.png` }],
            checkpoints: [
              ...["start", "center", "end"].map((position) => ({
                sectionId,
                position,
                path: `${prefix}-${sectionId}-${position}.png`,
              })),
              ...(scopeKind === "global-shell"
                ? [
                    {
                      sectionId,
                      position: "footer",
                      path: `${prefix}-${sectionId}-footer.png`,
                    },
                  ]
                : []),
            ],
          };
          return value;
        };

        for (const role of ["reference", "implementation"] as const) {
          const manifestValue = makeComplete(role);
          const manifestFile = `${id}-${role}.json`;
          await writeFile(
            path.join(workspace, manifestFile),
            JSON.stringify(manifestValue),
          );
          const evidence = manifestValue.viewports.desktop.evidence;
          const artifactPaths = [
            evidence.top?.path,
            evidence.fullPage?.path,
            ...evidence.sectionCaptures.map(({ path: artifact }) => artifact),
            ...evidence.checkpoints.map(({ path: artifact }) => artifact),
          ].filter((artifact): artifact is string => Boolean(artifact));
          await Promise.all(
            artifactPaths.map((artifact) =>
              writeFile(path.join(workspace, artifact), "fixture"),
            ),
          );
        }

        comparisons.push({
          id,
          scopeKind,
          ...(scopeKind === "route-content" ? { route: "/" } : {}),
          reference: `${id}-reference.json`,
          implementation: `${id}-implementation.json`,
        });
      }
      await writeFile(
        path.join(workspace, "routes.json"),
        JSON.stringify([{ path: "/", family: "home" }]),
      );
      const planPath = path.join(workspace, "plan.json");
      await writeFile(
        planPath,
        JSON.stringify({
          schemaVersion: "full-page-section-gate-plan/v1",
          routeAuthority: "routes.json",
          comparisons,
        }),
      );

      const result = spawnSync(
        process.execPath,
        ["scripts/fidelity/section-manifest.mjs", `--plan=${planPath}`],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(
        expect.objectContaining({
          accepted: true,
          routeAuthorityCount: 1,
          planFailures: [],
        }),
      );
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("loads a reviewed normalization seam from the structural gate plan", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "section-plan-canonical-"));
    try {
      const reference = canonicalObservation("reference");
      const implementation = canonicalObservation("implementation");
      const shell = (role: "reference" | "implementation") => {
        const value = manifest(role, [
          { ...section("site-footer", 0), isFooter: true },
        ]);
        value.scope = { kind: "global-shell", id: "site-shell" };
        value.viewports.desktop.evidence = {
          top: { path: `shell-${role}-top.png` },
          fullPage: { path: `shell-${role}-full.png` },
          sectionCaptures: [
            { sectionId: "site-footer", path: `shell-${role}-footer.png` },
          ],
          checkpoints: [
            ...["start", "center", "end", "footer"].map((position) => ({
              sectionId: "site-footer",
              position,
              path: `shell-${role}-footer-${position}.png`,
            })),
          ],
          motionCaptures: [],
        };
        return value;
      };
      const shellReference = shell("reference");
      const shellImplementation = shell("implementation");
      const files = {
        "home-reference.json": reference,
        "home-implementation.json": implementation,
        "shell-reference.json": shellReference,
        "shell-implementation.json": shellImplementation,
        "contract.json": canonicalHeroContract,
        "reference-adapter.json": targetHeroAdapter,
        "implementation-adapter.json": implementationAdapter,
        "routes.json": [{ path: "/", family: "home" }],
      };
      for (const [filename, value] of Object.entries(files)) {
        await writeFile(path.join(workspace, filename), JSON.stringify(value));
      }
      for (const manifestValue of [
        reference,
        implementation,
        shellReference,
        shellImplementation,
      ]) {
        const evidence = manifestValue.viewports.desktop.evidence;
        const artifactPaths = [
          evidence.top?.path,
          evidence.fullPage?.path,
          ...evidence.sectionCaptures.map(({ path: artifact }) => artifact),
          ...evidence.checkpoints.map(({ path: artifact }) => artifact),
        ].filter((artifact): artifact is string => Boolean(artifact));
        await Promise.all(
          artifactPaths.map((artifact) =>
            writeFile(path.join(workspace, artifact), "fixture"),
          ),
        );
      }
      const planPath = path.join(workspace, "plan.json");
      await writeFile(
        planPath,
        JSON.stringify({
          schemaVersion: "full-page-section-gate-plan/v1",
          routeAuthority: "routes.json",
          comparisons: [
            {
              id: "home-content",
              scopeKind: "route-content",
              route: "/",
              reference: "home-reference.json",
              implementation: "home-implementation.json",
              normalization: {
                reviewedContract: "contract.json",
                referenceAdapter: "reference-adapter.json",
                implementationAdapter: "implementation-adapter.json",
                motionPreference: "no-preference",
              },
            },
            {
              id: "site-shell",
              scopeKind: "global-shell",
              reference: "shell-reference.json",
              implementation: "shell-implementation.json",
            },
          ],
        }),
      );

      const result = spawnSync(
        process.execPath,
        ["scripts/fidelity/section-manifest.mjs", `--plan=${planPath}`],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.comparisons[0].result).toEqual(
        expect.objectContaining({
          accepted: true,
          normalization: { applied: true, canonicalCompared: true },
          normalizationFailures: [],
        }),
      );
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("rejects a HOME-only section plan when the route authority also contains Aviation", () => {
    const plan = {
      schemaVersion: "full-page-section-gate-plan/v1",
      routeAuthority: "route-manifest.mjs",
      comparisons: [
        {
          id: "home-content",
          scopeKind: "route-content",
          route: "/",
          reference: "home-reference.json",
          implementation: "home-implementation.json",
        },
        {
          id: "global-shell",
          scopeKind: "global-shell",
          reference: "shell-reference.json",
          implementation: "shell-implementation.json",
        },
      ],
    };

    const failures = validateSectionGatePlanCoverage(plan, [
      { path: "/", family: "home" },
      {
        path: "/antarctica/direct-flights-to-antarctica",
        family: "aviation",
      },
    ]);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_ROUTE_COMPARISON",
          route: "/antarctica/direct-flights-to-antarctica",
        }),
      ]),
    );
  });

  it("requires exactly one global-shell comparison and one comparison per declared route", () => {
    const plan = {
      schemaVersion: "full-page-section-gate-plan/v1",
      routeAuthority: "route-manifest.mjs",
      comparisons: [
        {
          id: "home-a",
          scopeKind: "route-content",
          route: "/",
          reference: "a.json",
          implementation: "b.json",
        },
        {
          id: "home-b",
          scopeKind: "route-content",
          route: "/",
          reference: "c.json",
          implementation: "d.json",
        },
      ],
    };

    const failures = validateSectionGatePlanCoverage(plan, [
      { path: "/", family: "home" },
    ]);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_ROUTE_COMPARISON",
          route: "/",
        }),
        expect.objectContaining({ code: "MISSING_GLOBAL_SHELL_COMPARISON" }),
      ]),
    );
  });

  it("rejects reusing a HOME manifest pair for another route-plan entry", () => {
    const comparison = {
      id: "aviation-content",
      scopeKind: "route-content",
      route: "/antarctica/direct-flights-to-antarctica",
    };
    const reference = manifest("reference", [section("hero", 0)]);
    const implementation = manifest("implementation", [section("hero", 0)]);

    const failures = validateSectionComparisonIdentity(
      comparison,
      reference,
      implementation,
    );

    expect(failures).toEqual([
      expect.objectContaining({
        code: "PLAN_MANIFEST_ROUTE_MISMATCH",
        manifest: "reference",
        expected: "/antarctica/direct-flights-to-antarctica",
        received: "/",
      }),
      expect.objectContaining({
        code: "PLAN_MANIFEST_ROUTE_MISMATCH",
        manifest: "implementation",
        expected: "/antarctica/direct-flights-to-antarctica",
        received: "/",
      }),
    ]);
  });

  it("requires an explicit direct-child topology for route-content manifests", () => {
    const reference = manifest("reference", [section("hero", 0)]);

    expect(validateSectionManifest(reference)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_DOM_TOPOLOGY",
          manifest: "reference",
          path: "domTopology.directChildren",
        }),
      ]),
    );
  });

  it("requires start, mid, end, and reverse evidence for every motion layer", () => {
    const withMotion = (role: "reference" | "implementation") => {
      const value = manifest(role, [section("hero", 0)]);
      value.motion = {
        status: "complete",
        layers: [
          {
            id: "hero-mist",
            sectionId: "hero",
            property: "rotateX",
            samples: {
              desktop: {
                start: "90deg",
                mid: "64.2857deg",
                end: "0deg",
                reverse: "90deg",
              },
            },
          },
        ],
      };
      value.viewports.desktop.evidence = {
        top: { path: `${role}-top.png`, sha256: role },
        fullPage: { path: `${role}-full.png` },
        sectionCaptures: [{ sectionId: "hero", path: `${role}-hero.png` }],
        checkpoints: ["start", "center", "end"].map((position) => ({
          sectionId: "hero",
          position,
          path: `${role}-hero-${position}.png`,
        })),
        motionCaptures: ["start", "mid", "end"].map((phase) => ({
          layerId: "hero-mist",
          phase,
          path: `${role}-mist-${phase}.png`,
        })),
      };
      return {
        ...value,
        domTopology: { scope: "main", directChildren: ["hero"] },
      };
    };

    const result = compareSectionManifests(
      withMotion("reference"),
      withMotion("implementation"),
    );

    expect(result.evidenceFailures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_MOTION_CHECKPOINT",
          manifest: "reference",
          layerId: "hero-mist",
          phase: "reverse",
        }),
        expect.objectContaining({
          code: "MISSING_MOTION_CHECKPOINT",
          manifest: "implementation",
          layerId: "hero-mist",
          phase: "reverse",
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("validates motion samples and keeps pin scroll range separate from horizontal distance", () => {
    const reference = {
      ...manifest("reference", [section("our-camps", 0)]),
      domTopology: { scope: ".page-content", directChildren: ["our-camps"] },
    };
    reference.motion = {
      status: "complete",
      layers: [
        {
          id: "our-camps-track",
          sectionId: "our-camps",
          property: "translateX",
          pinned: true,
          samples: {
            desktop: { start: 0, mid: -2100, end: -4200 },
          },
          pinRanges: {
            desktop: {
              scrollStart: 6196.42,
              scrollEnd: 14746.42,
              verticalDistance: 8550,
            },
          },
        },
      ],
    };

    expect(validateSectionManifest(reference)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_MOTION_FIELD",
          layerId: "our-camps-track",
          field: "trigger",
        }),
        expect.objectContaining({
          code: "INCOMPLETE_MOTION_SAMPLES",
          layerId: "our-camps-track",
          viewport: "desktop",
        }),
        expect.objectContaining({
          code: "INVALID_PIN_RANGE",
          layerId: "our-camps-track",
          viewport: "desktop",
        }),
      ]),
    );
  });

  it("locks reviewed HOME content and global-shell identities into separate manifests", async () => {
    const [home, shell] = await Promise.all(
      ["home-target-v1.json", "global-shell-target-v1.json"].map(async (name) =>
        JSON.parse(
          await readFile(
            path.join(process.cwd(), "scripts/fidelity/manifests", name),
            "utf8",
          ),
        ),
      ),
    );
    const flatten = (sections: Section[]): Section[] =>
      sections.flatMap((entry) => [entry, ...flatten(entry.children ?? [])]);
    const homeSections = flatten(home.sections);
    const shellSections = flatten(shell.sections);

    expect(validateSectionManifest(home)).toEqual([]);
    expect(home.domTopology.directChildren).toEqual([
      "hero",
      "last-continent",
      "our-season",
      "our-trips-title",
      "our-trips-cards",
      "founder-quote",
      "long-form-composite",
    ]);
    expect(homeSections.find(({ id }) => id === "our-trips")?.nodeKind).toBe("virtual");
    expect(homeSections.find(({ id }) => id === "our-trips-cards")).toMatchObject({
      itemCount: 5,
      children: expect.arrayContaining([
        expect.objectContaining({ id: "trip-early-emperor-penguins" }),
        expect.objectContaining({ id: "trip-antarctica-in-a-day" }),
      ]),
    });
    expect(
      homeSections
        .filter(({ id }) => id.startsWith("trip-"))
        .map(({ semantic, keyLinks, assets }) => ({
          semantic,
          keyLinks,
          assets,
        })),
    ).toEqual([
      {
        semantic: "Baby Penguins & Blue Tunnels|/itineraries/early-emperor-penguins",
        keyLinks: ["/itineraries/early-emperor-penguins"],
        assets: [
          "https://cdn.sanity.io/images/kq9qn5zn/production/16add1ee0bdc16862dc37b826abb1600887e7fbb-2000x1333.jpg",
        ],
      },
      {
        semantic: "South Pole & Penguins|/itineraries/south-pole-emperor-penguins",
        keyLinks: ["/itineraries/south-pole-emperor-penguins"],
        assets: [
          "https://cdn.sanity.io/images/kq9qn5zn/production/fc3d4887c37b05526119edbc5db9d18a0b034c6b-2000x1250.jpg",
        ],
      },
      {
        semantic: "South Pole & Blue Rivers|/itineraries/south-pole-blue-rivers",
        keyLinks: ["/itineraries/south-pole-blue-rivers"],
        assets: [
          "https://cdn.sanity.io/images/kq9qn5zn/production/545ecd31bdf0cdd5605316894111fb0f197e0129-2668x2000.jpg",
        ],
      },
      {
        semantic: "The Long Stay|/itineraries/the-long-stay",
        keyLinks: ["/itineraries/the-long-stay"],
        assets: [
          "https://cdn.sanity.io/images/kq9qn5zn/production/0554de84a6e2cfa68bff6d38a7d7e1c975653f91-2000x1333.jpg",
        ],
      },
      {
        semantic: "Antarctica in a Day|/itineraries/antarctica-in-a-day",
        keyLinks: ["/itineraries/antarctica-in-a-day"],
        assets: [
          "https://cdn.sanity.io/images/kq9qn5zn/production/a1e7092001e46b8511e5d9386f43ccfce30122d2-2000x1333.jpg",
        ],
      },
    ]);
    expect(homeSections.map(({ id }) => id)).not.toContain("how-it-works-flyout");
    expect(homeSections.map(({ id }) => id)).not.toContain("site-footer");
    expect(shellSections.map(({ id }) => id)).toEqual(
      expect.arrayContaining([
        "global-navigation",
        "how-it-works-trigger",
        "how-it-works-flyout",
        "site-footer",
      ]),
    );
  });
});
