import { describe, expect, it } from "vitest";

// @ts-expect-error The fidelity tooling is intentionally executable JavaScript.
import { normalizeObservation } from "../../scripts/fidelity/normalize-section-observation.mjs";

const remoteHero = "https://cdn.example.test/hero.jpg";
const localHero = "/media/target/hero.webp";

type ContractSection = {
  id: string;
  semantic: string;
  nodeKind: "element" | "virtual";
  assets: string[];
  children?: ContractSection[];
};

type ContractMotionLayer = {
  id: string;
  sectionId: string;
  property: string;
  trigger: string;
  range: string;
  easing: string;
  interruption: string;
  reducedMotion: string;
};

type ReviewedContract = {
  schemaVersion: string;
  manifestId: string;
  route: string;
  family: string;
  scope: { kind: string; id: string };
  requiredViewports: string[];
  tolerances: { boundsPx: number; scrollHeightPx: number };
  domTopology: { directChildren: string[] };
  sections: ContractSection[];
  assets: Record<
    string,
    {
      acceptedSources: {
        target: string[];
        implementation: string[];
      };
    }
  >;
  motion: { layers: ContractMotionLayer[] };
};

type AliasDefinition = { rawIds: string[]; selectors: string[] };

type TargetAdapter = {
  kind: "target";
  scopeAliases: Record<string, AliasDefinition>;
  sectionAliases: Record<string, AliasDefinition>;
  motionAliases: Record<string, AliasDefinition>;
};

const reviewedContract: ReviewedContract = {
  schemaVersion: "full-page-section-manifest/v1",
  manifestId: "home-canonical-v1",
  route: "/",
  family: "home",
  scope: { kind: "route-content", id: "home-content" },
  requiredViewports: ["desktop"],
  tolerances: { boundsPx: 2, scrollHeightPx: 2 },
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
        target: [remoteHero],
        implementation: [localHero],
      },
    },
  },
  motion: { layers: [] },
};

const targetAdapter: TargetAdapter = {
  kind: "target",
  scopeAliases: {
    "home-content": {
      rawIds: ["target-home-content"],
      selectors: [".page-content"],
    },
  },
  sectionAliases: {
    hero: { rawIds: ["target-hero"], selectors: [".hero-banner"] },
  },
  motionAliases: {},
};

const implementationAdapter = { kind: "implementation" };

function observation({
  role,
  scopeId,
  rootScope,
  sectionId,
  sectionSelector,
  semantic,
  asset,
  motion = { status: "incomplete", layers: [] },
}: {
  role: "reference" | "implementation";
  scopeId: string;
  rootScope: string;
  sectionId: string;
  sectionSelector?: string;
  semantic: string;
  asset: string;
  motion?: { status: string; layers: Record<string, unknown>[] };
}) {
  return {
    schemaVersion: "full-page-section-manifest/v1",
    manifestId: `raw-${role}`,
    role,
    route: "/",
    family: "home",
    scope: { kind: "route-content", id: scopeId },
    source: {
      url: role === "reference" ? "https://target.example.test" : "http://local.test",
      contentRoot: rootScope,
      observedAt: "2026-08-31T00:00:00.000Z",
    },
    requiredViewports: ["desktop"],
    tolerances: { boundsPx: 999, scrollHeightPx: 999 },
    domTopology: { scope: rootScope, directChildren: [sectionId] },
    sections: [
      {
        id: sectionId,
        selector: sectionSelector,
        semantic,
        nodeKind: "element",
        assets: [asset],
        bounds: {
          desktop: { x: 0, y: 0, width: 1440, height: 900 },
        },
      },
    ],
    viewports: {
      desktop: {
        width: 1440,
        height: 900,
        scrollHeight: 1800,
        evidence: {
          top: { path: "raw-top.png" },
          fullPage: { path: "raw-full.png" },
          sectionCaptures: [],
          checkpoints: [],
          motionCaptures: [],
        },
      },
    },
    motion,
  };
}

describe("normalizeObservation", () => {
  it("normalizes target aliases and implementation-authored IDs to equivalent canonical data", () => {
    const target = normalizeObservation({
      observation: observation({
        role: "reference",
        scopeId: "target-home-content",
        rootScope: ".page-content",
        sectionId: "target-hero",
        sectionSelector: ".hero-banner",
        semantic: "div | hero-banner | Antarctica",
        asset: remoteHero,
      }),
      reviewedContract,
      adapter: targetAdapter,
      motionPreference: "no-preference",
    });
    const implementation = normalizeObservation({
      observation: observation({
        role: "implementation",
        scopeId: "home-content",
        rootScope: "main#main-content > [data-page-content]",
        sectionId: "hero",
        semantic: "section | home-hero | Antarctica",
        asset: localHero,
      }),
      reviewedContract,
      adapter: implementationAdapter,
      motionPreference: "no-preference",
    });

    const parityData = (manifest: Record<string, unknown>) => ({
      scope: manifest.scope,
      requiredViewports: manifest.requiredViewports,
      tolerances: manifest.tolerances,
      domTopology: manifest.domTopology,
      sections: manifest.sections,
      viewports: manifest.viewports,
      motion: manifest.motion,
      motionPreference: manifest.motionPreference,
    });

    expect(parityData(target)).toEqual(parityData(implementation));
    expect(target.sections).toEqual([
      expect.objectContaining({ id: "hero", semantic: "hero", assets: ["hero-media"] }),
    ]);
    expect(target.provenance.rawObservation.sections[0]).toMatchObject({
      selector: ".hero-banner",
      semantic: "div | hero-banner | Antarctica",
      assets: [remoteHero],
    });
    expect(implementation.provenance.rawObservation.sections[0]).toMatchObject({
      semantic: "section | home-hero | Antarctica",
      assets: [localHero],
    });
  });

  it("fails closed when an observed asset is not accepted by the reviewed contract", () => {
    expect(() =>
      normalizeObservation({
        observation: observation({
          role: "reference",
          scopeId: "target-home-content",
          rootScope: ".page-content",
          sectionId: "target-hero",
          sectionSelector: ".hero-banner",
          semantic: "div | hero-banner | Antarctica",
          asset: "https://unreviewed.example.test/hero.jpg",
        }),
        reviewedContract,
        adapter: targetAdapter,
        motionPreference: "no-preference",
      }),
    ).toThrow(/UNMAPPED_ASSET/);
  });

  it("fails closed on missing and reordered canonical sections", () => {
    const twoSectionContract = structuredClone(reviewedContract);
    twoSectionContract.domTopology.directChildren.push("season");
    twoSectionContract.sections.push({
      id: "season",
      semantic: "season",
      nodeKind: "element",
      assets: [],
    });
    const twoSectionAdapter = structuredClone(targetAdapter);
    twoSectionAdapter.sectionAliases.season = {
      rawIds: ["target-season"],
      selectors: [".season"],
    };
    const base = observation({
      role: "reference",
      scopeId: "target-home-content",
      rootScope: ".page-content",
      sectionId: "target-hero",
      sectionSelector: ".hero-banner",
      semantic: "div | hero-banner | Antarctica",
      asset: remoteHero,
    });

    expect(() =>
      normalizeObservation({
        observation: base,
        reviewedContract: twoSectionContract,
        adapter: twoSectionAdapter,
        motionPreference: "no-preference",
      }),
    ).toThrow(/MISSING_SECTION.*season/);

    const season = {
      id: "target-season",
      selector: ".season",
      semantic: "div | wd-mnt | Our Season",
      nodeKind: "element",
      assets: [],
      bounds: { desktop: { x: 0, y: 900, width: 1440, height: 900 } },
    };
    const reordered = structuredClone(base);
    reordered.sections.unshift(season);
    reordered.domTopology.directChildren.unshift("target-season");

    expect(() =>
      normalizeObservation({
        observation: reordered,
        reviewedContract: twoSectionContract,
        adapter: twoSectionAdapter,
        motionPreference: "no-preference",
      }),
    ).toThrow(/SECTION_ORDER_MISMATCH/);
  });

  it("marks an explicitly observed static motion inventory complete and retains preference", () => {
    const normalized = normalizeObservation({
      observation: observation({
        role: "implementation",
        scopeId: "home-content",
        rootScope: "main#main-content > [data-page-content]",
        sectionId: "hero",
        semantic: "section | home-hero | Antarctica",
        asset: localHero,
      }),
      reviewedContract,
      adapter: implementationAdapter,
      motionPreference: "reduce",
    });

    expect(normalized.motion).toEqual({ status: "complete", layers: [] });
    expect(normalized.motionPreference).toBe("reduce");
    expect(normalized.source.motionPreference).toBe("reduce");
  });

  it("keeps raw motion samples in provenance while normalizing stable motion identity", () => {
    const motionContract = structuredClone(reviewedContract);
    motionContract.motion.layers.push({
      id: "hero-reveal",
      sectionId: "hero",
      property: "opacity",
      trigger: "scroll",
      range: "hero",
      easing: "linear",
      interruption: "reversible",
      reducedMotion: "static",
    });
    const motionTargetAdapter = structuredClone(targetAdapter);
    motionTargetAdapter.motionAliases["hero-reveal"] = {
      rawIds: ["target-hero-reveal"],
      selectors: [".hero-banner [data-reveal]"],
    };
    const targetMotion = {
      status: "complete",
      layers: [
        {
          id: "target-hero-reveal",
          selector: ".hero-banner [data-reveal]",
          sectionId: "target-hero",
          samples: { desktop: { start: { opacity: "0" } } },
        },
      ],
    };
    const implementationMotion = {
      status: "complete",
      layers: [
        {
          id: "hero-reveal",
          sectionId: "hero",
          samples: { desktop: { start: { opacity: "0.25" } } },
        },
      ],
    };

    const target = normalizeObservation({
      observation: observation({
        role: "reference",
        scopeId: "target-home-content",
        rootScope: ".page-content",
        sectionId: "target-hero",
        sectionSelector: ".hero-banner",
        semantic: "div | hero-banner | Antarctica",
        asset: remoteHero,
        motion: targetMotion,
      }),
      reviewedContract: motionContract,
      adapter: motionTargetAdapter,
      motionPreference: "no-preference",
    });
    const implementation = normalizeObservation({
      observation: observation({
        role: "implementation",
        scopeId: "home-content",
        rootScope: "main#main-content > [data-page-content]",
        sectionId: "hero",
        semantic: "section | home-hero | Antarctica",
        asset: localHero,
        motion: implementationMotion,
      }),
      reviewedContract: motionContract,
      adapter: implementationAdapter,
      motionPreference: "no-preference",
    });

    expect(target.motion).toEqual(implementation.motion);
    expect(target.motion.layers[0]).not.toHaveProperty("samples");
    expect(target.provenance.rawObservation.motion.layers[0].samples).toEqual(
      targetMotion.layers[0].samples,
    );
    expect(implementation.provenance.rawObservation.motion.layers[0].samples).toEqual(
      implementationMotion.layers[0].samples,
    );
  });

  it("rejects ambiguous duplicate target aliases", () => {
    const ambiguousContract = structuredClone(reviewedContract);
    ambiguousContract.domTopology.directChildren.push("season");
    ambiguousContract.sections.push({
      id: "season",
      semantic: "season",
      nodeKind: "element",
      assets: [],
    });
    const ambiguousAdapter = structuredClone(targetAdapter);
    ambiguousAdapter.sectionAliases.season = {
      rawIds: ["target-hero"],
      selectors: [".season"],
    };

    expect(() =>
      normalizeObservation({
        observation: observation({
          role: "reference",
          scopeId: "target-home-content",
          rootScope: ".page-content",
          sectionId: "target-hero",
          sectionSelector: ".hero-banner",
          semantic: "div | hero-banner | Antarctica",
          asset: remoteHero,
        }),
        reviewedContract: ambiguousContract,
        adapter: ambiguousAdapter,
        motionPreference: "no-preference",
      }),
    ).toThrow(/DUPLICATE_SECTION_ALIAS/);
  });
});
