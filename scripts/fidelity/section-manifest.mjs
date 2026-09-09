import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { normalizeObservation } from "./normalize-section-observation.mjs";

export const SECTION_MANIFEST_SCHEMA_VERSION = "full-page-section-manifest/v1";

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateSectionManifest(manifest) {
  const failures = [];
  const role = manifest?.role ?? "unknown";
  const fail = (code, path, message, details = {}) => {
    failures.push({ code, manifest: role, path, ...details, message });
  };

  if (!isRecord(manifest)) {
    fail("INVALID_MANIFEST", "$", "Manifest must be a JSON object.");
    return failures;
  }
  if (manifest?.schemaVersion !== SECTION_MANIFEST_SCHEMA_VERSION) {
    fail(
      "INVALID_SCHEMA_VERSION",
      "schemaVersion",
      `schemaVersion must be ${SECTION_MANIFEST_SCHEMA_VERSION}; received ${manifest?.schemaVersion ?? "missing"}.`,
    );
  }
  if (!isNonEmptyString(manifest.manifestId)) {
    fail("MISSING_MANIFEST_ID", "manifestId", "manifestId must be non-empty.");
  }
  if (!new Set(["reference", "implementation"]).has(manifest.role)) {
    fail("INVALID_MANIFEST_ROLE", "role", "role must be reference or implementation.");
  }
  if (
    !isRecord(manifest.scope) ||
    !new Set(["route-content", "global-shell"]).has(manifest.scope.kind) ||
    !isNonEmptyString(manifest.scope.id)
  ) {
    fail(
      "INVALID_MANIFEST_SCOPE",
      "scope",
      "scope requires kind route-content/global-shell and a non-empty id.",
    );
  }
  if (manifest.scope?.kind === "route-content" && !isNonEmptyString(manifest.route)) {
    fail("MISSING_ROUTE", "route", "Route-content manifests require a route.");
  }
  if (!isNonEmptyString(manifest.family)) {
    fail("MISSING_FAMILY", "family", "family must be non-empty.");
  }

  const requiredViewports = Array.isArray(manifest.requiredViewports)
    ? manifest.requiredViewports
    : [];
  if (
    requiredViewports.length === 0 ||
    requiredViewports.some((viewport) => !isNonEmptyString(viewport)) ||
    new Set(requiredViewports).size !== requiredViewports.length
  ) {
    fail(
      "INVALID_REQUIRED_VIEWPORTS",
      "requiredViewports",
      "requiredViewports must contain unique non-empty names.",
    );
  }
  for (const field of ["boundsPx", "scrollHeightPx"]) {
    const value = manifest.tolerances?.[field];
    if (!Number.isFinite(value) || value < 0) {
      fail(
        "INVALID_TOLERANCE",
        `tolerances.${field}`,
        `${field} must be a predeclared non-negative number.`,
      );
    }
  }

  if (!Array.isArray(manifest.sections) || manifest.sections.length === 0) {
    fail("MISSING_SECTIONS", "sections", "sections must be a non-empty array.");
  }

  const sections = flattenSections(
    Array.isArray(manifest.sections) ? manifest.sections : [],
  );
  for (const section of sections) {
    if (!isNonEmptyString(section.id) || !isNonEmptyString(section.semantic)) {
      fail(
        "INVALID_SECTION_IDENTITY",
        "sections",
        "Every section requires non-empty id and semantic fields.",
        { sectionId: section.id ?? null },
      );
    }
    const nodeKind = section.nodeKind ?? "element";
    if (!new Set(["element", "virtual"]).has(nodeKind)) {
      fail(
        "INVALID_NODE_KIND",
        `sections.${section.id}.nodeKind`,
        "nodeKind must be element or virtual.",
        { sectionId: section.id },
      );
    }
    if (
      section.itemCount !== undefined &&
      (!Number.isInteger(section.itemCount) || section.itemCount < 0)
    ) {
      fail(
        "INVALID_ITEM_COUNT",
        `sections.${section.id}.itemCount`,
        "itemCount must be a non-negative integer.",
        { sectionId: section.id },
      );
    }
    if (nodeKind === "virtual") continue;
    for (const viewport of requiredViewports) {
      const bounds = section.bounds?.[viewport];
      if (!bounds) {
        fail(
          "MISSING_SECTION_BOUNDS",
          `sections.${section.id}.bounds.${viewport}`,
          `${section.id} is missing ${viewport} bounds.`,
          { sectionId: section.id, viewport },
        );
      } else if (
        !Number.isFinite(bounds.y) ||
        bounds.y < 0 ||
        !Number.isFinite(bounds.height) ||
        bounds.height <= 0 ||
        ((bounds.x !== undefined || bounds.width !== undefined) &&
          (!Number.isFinite(bounds.x) ||
            !Number.isFinite(bounds.width) ||
            bounds.width <= 0))
      ) {
        fail(
          "INVALID_SECTION_BOUNDS",
          `sections.${section.id}.bounds.${viewport}`,
          `${section.id} ${viewport} bounds require y >= 0, height > 0, and paired finite x/width when horizontal bounds are measured.`,
          { sectionId: section.id, viewport },
        );
      }
    }
  }

  if (manifest.scope?.kind === "route-content") {
    if (
      !isRecord(manifest.domTopology) ||
      !isNonEmptyString(manifest.domTopology.scope)
    ) {
      fail(
        "MISSING_DOM_ROOT_SCOPE",
        "domTopology.scope",
        "Route-content manifests require an explicit content-root scope.",
      );
    }
    if (
      !Array.isArray(manifest.domTopology?.directChildren) ||
      manifest.domTopology.directChildren.length === 0
    ) {
      fail(
        "MISSING_DOM_TOPOLOGY",
        "domTopology.directChildren",
        "Route-content manifests require an explicit direct-child sequence.",
      );
    }
  }
  const directChildren = Array.isArray(manifest.domTopology?.directChildren)
    ? manifest.domTopology.directChildren
    : [];
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const directCounts = new Map();
  for (const sectionId of directChildren) {
    directCounts.set(sectionId, (directCounts.get(sectionId) ?? 0) + 1);
    const section = sectionsById.get(sectionId);
    if (!section) {
      fail(
        "UNKNOWN_DIRECT_DOM_CHILD",
        "domTopology.directChildren",
        `${sectionId} is not declared in sections.`,
        { sectionId },
      );
    } else if (section.nodeKind === "virtual") {
      fail(
        "VIRTUAL_DIRECT_DOM_CHILD",
        "domTopology.directChildren",
        `${sectionId} is virtual and cannot be a direct DOM child.`,
        { sectionId },
      );
    }
  }
  for (const [sectionId, count] of directCounts) {
    if (count > 1) {
      fail(
        "DUPLICATE_DIRECT_DOM_CHILD",
        "domTopology.directChildren",
        `${sectionId} appears ${count} times in directChildren.`,
        { sectionId, count },
      );
    }
  }

  for (const viewport of requiredViewports) {
    const record = manifest.viewports?.[viewport];
    if (!isRecord(record)) {
      fail(
        "MISSING_VIEWPORT_RECORD",
        `viewports.${viewport}`,
        `${viewport} requires a viewport record.`,
        { viewport },
      );
      continue;
    }
    if (
      !Number.isFinite(record.width) ||
      record.width <= 0 ||
      !Number.isFinite(record.height) ||
      record.height <= 0 ||
      !Number.isFinite(record.scrollHeight) ||
      record.scrollHeight < record.height
    ) {
      fail(
        "INVALID_VIEWPORT_RECORD",
        `viewports.${viewport}`,
        `${viewport} requires positive width/height and scrollHeight >= height.`,
        { viewport },
      );
    }
    if (!isRecord(record.evidence)) {
      fail(
        "MISSING_EVIDENCE_RECORD",
        `viewports.${viewport}.evidence`,
        `${viewport} requires an evidence record.`,
        { viewport },
      );
    }
  }

  if (
    !isRecord(manifest.motion) ||
    !new Set(["complete", "incomplete"]).has(manifest.motion.status) ||
    !Array.isArray(manifest.motion.layers)
  ) {
    fail(
      "INVALID_MOTION_INVENTORY",
      "motion",
      "motion requires complete/incomplete status and a layers array.",
    );
  } else {
    const layerIds = new Set();
    for (const layer of manifest.motion.layers) {
      if (
        !isNonEmptyString(layer.id) ||
        !isNonEmptyString(layer.sectionId) ||
        !isNonEmptyString(layer.property)
      ) {
        fail(
          "INVALID_MOTION_LAYER",
          "motion.layers",
          "Every motion layer requires id, sectionId, and property.",
          { layerId: layer.id ?? null },
        );
        continue;
      }
      if (layerIds.has(layer.id)) {
        fail(
          "DUPLICATE_MOTION_LAYER",
          "motion.layers",
          `${layer.id} is declared more than once.`,
          { layerId: layer.id },
        );
      }
      layerIds.add(layer.id);
      if (!sectionsById.has(layer.sectionId)) {
        fail(
          "UNKNOWN_MOTION_SECTION",
          `motion.layers.${layer.id}.sectionId`,
          `${layer.id} references unknown section ${layer.sectionId}.`,
          { layerId: layer.id, sectionId: layer.sectionId },
        );
      }
      for (const field of [
        "trigger",
        "range",
        "easing",
        "interruption",
        "reducedMotion",
      ]) {
        if (!isNonEmptyString(layer[field]) && !isRecord(layer[field])) {
          fail(
            "MISSING_MOTION_FIELD",
            `motion.layers.${layer.id}.${field}`,
            `${layer.id} requires a measured ${field} description.`,
            { layerId: layer.id, field },
          );
        }
      }
      for (const viewport of requiredViewports) {
        const samples = layer.samples?.[viewport];
        if (
          !isRecord(samples) ||
          ["start", "mid", "end", "reverse"].some(
            (phase) => !Object.hasOwn(samples, phase),
          )
        ) {
          fail(
            "INCOMPLETE_MOTION_SAMPLES",
            `motion.layers.${layer.id}.samples.${viewport}`,
            `${layer.id} requires start/mid/end/reverse ${viewport} samples.`,
            { layerId: layer.id, viewport },
          );
        }
        if (layer.pinned) {
          const range = layer.pinRanges?.[viewport];
          const measuredVertical =
            Number.isFinite(range?.scrollStart) && Number.isFinite(range?.scrollEnd)
              ? range.scrollEnd - range.scrollStart
              : Number.NaN;
          if (
            !isRecord(range) ||
            !Number.isFinite(range.scrollStart) ||
            !Number.isFinite(range.scrollEnd) ||
            range.scrollEnd <= range.scrollStart ||
            !Number.isFinite(range.verticalDistance) ||
            range.verticalDistance <= 0 ||
            Math.abs(measuredVertical - range.verticalDistance) > 0.5 ||
            !Number.isFinite(range.horizontalDistance) ||
            range.horizontalDistance < 0
          ) {
            fail(
              "INVALID_PIN_RANGE",
              `motion.layers.${layer.id}.pinRanges.${viewport}`,
              `${layer.id} requires separate scrollStart/scrollEnd/verticalDistance/horizontalDistance measurements.`,
              { layerId: layer.id, viewport },
            );
          }
        }
      }
    }
  }
  return failures;
}

function flattenSections(sections) {
  return sections.flatMap((section) => [
    section,
    ...flattenSections(Array.isArray(section.children) ? section.children : []),
  ]);
}

function flattenSectionsWithParents(sections, parentId = null) {
  return sections.flatMap((section) => [
    { section, parentId },
    ...flattenSectionsWithParents(
      Array.isArray(section.children) ? section.children : [],
      section.id,
    ),
  ]);
}

function topOnlyFailures(manifest) {
  return Object.entries(manifest.viewports ?? {}).flatMap(([viewport, record]) => {
    const evidence = record?.evidence ?? {};
    const hasTop = Boolean(evidence.top?.path);
    const hasFullPage = Boolean(evidence.fullPage?.path);
    const hasSections = (evidence.sectionCaptures?.length ?? 0) > 0;
    const hasCheckpoints = (evidence.checkpoints?.length ?? 0) > 0;

    if (hasTop && !hasFullPage && !hasSections && !hasCheckpoints) {
      return [
        {
          code: "TOP_ONLY_EVIDENCE",
          manifest: manifest.role,
          viewport,
          message: `${manifest.role} ${viewport} evidence contains only a top-frame capture.`,
        },
      ];
    }
    return [];
  });
}

function coverageFailures(manifest) {
  const failures = [];
  const allSections = flattenSections(manifest.sections ?? []);
  const sectionsById = new Map(allSections.map((section) => [section.id, section]));
  const requiredSections = allSections.filter(
    (section) => section.nodeKind !== "virtual" && section.captureRequired !== false,
  );
  const motionLayersById = new Map(
    (manifest.motion?.layers ?? []).map((layer) => [layer.id, layer]),
  );

  for (const viewport of manifest.requiredViewports ?? []) {
    const evidence = manifest.viewports?.[viewport]?.evidence;
    if (!evidence) {
      failures.push({
        code: "MISSING_VIEWPORT_EVIDENCE",
        manifest: manifest.role,
        viewport,
        message: `${manifest.role} is missing ${viewport} evidence.`,
      });
      continue;
    }
    if (!evidence.top?.path) {
      failures.push({
        code: "MISSING_TOP_CAPTURE",
        manifest: manifest.role,
        viewport,
        message: `${manifest.role} ${viewport} is missing its top-state capture.`,
      });
    }
    if (!evidence.fullPage?.path) {
      failures.push({
        code: "MISSING_FULL_PAGE_CAPTURE",
        manifest: manifest.role,
        viewport,
        message: `${manifest.role} ${viewport} is missing a full-page capture.`,
      });
    }

    const capturedSections = new Set(
      (evidence.sectionCaptures ?? [])
        .filter(({ path }) => Boolean(path))
        .map(({ sectionId }) => sectionId),
    );
    const checkpoints = new Set(
      (evidence.checkpoints ?? [])
        .filter(({ path }) => Boolean(path))
        .map(({ sectionId, position }) => `${sectionId}:${position}`),
    );
    const motionCaptures = new Set(
      (evidence.motionCaptures ?? [])
        .filter(({ path }) => Boolean(path))
        .map(({ layerId, phase }) => `${layerId}:${phase}`),
    );

    const sectionCaptureRecords = (evidence.sectionCaptures ?? []).filter(({ path }) =>
      Boolean(path),
    );
    for (const duplicate of duplicateCounts(
      sectionCaptureRecords.map(({ sectionId }) => sectionId),
    )) {
      failures.push({
        code: "DUPLICATE_SECTION_CAPTURE",
        manifest: manifest.role,
        viewport,
        sectionId: duplicate.value,
        count: duplicate.count,
        message: `${manifest.role} ${viewport} has ${duplicate.count} captures for ${duplicate.value}.`,
      });
    }
    for (const capture of sectionCaptureRecords) {
      const section = sectionsById.get(capture.sectionId);
      if (!section) {
        failures.push({
          code: "UNKNOWN_SECTION_CAPTURE",
          manifest: manifest.role,
          viewport,
          sectionId: capture.sectionId,
          message: `${manifest.role} ${viewport} captures unknown section ${capture.sectionId}.`,
        });
      } else if (section.nodeKind === "virtual") {
        failures.push({
          code: "VIRTUAL_SECTION_CAPTURE",
          manifest: manifest.role,
          viewport,
          sectionId: capture.sectionId,
          message: `${manifest.role} ${viewport} cannot assign a crop to virtual section ${capture.sectionId}.`,
        });
      }
    }

    const checkpointRecords = (evidence.checkpoints ?? []).filter(({ path }) =>
      Boolean(path),
    );
    for (const duplicate of duplicateCounts(
      checkpointRecords.map(({ sectionId, position }) => `${sectionId}:${position}`),
    )) {
      const [sectionId, position] = duplicate.value.split(":");
      failures.push({
        code: "DUPLICATE_SCROLL_CHECKPOINT",
        manifest: manifest.role,
        viewport,
        sectionId,
        position,
        count: duplicate.count,
        message: `${manifest.role} ${viewport} duplicates ${duplicate.value}.`,
      });
    }
    for (const checkpoint of checkpointRecords) {
      const section = sectionsById.get(checkpoint.sectionId);
      if (!section || section.nodeKind === "virtual") {
        failures.push({
          code: "UNKNOWN_SCROLL_CHECKPOINT",
          manifest: manifest.role,
          viewport,
          sectionId: checkpoint.sectionId,
          position: checkpoint.position,
          message: `${manifest.role} ${viewport} checkpoints unknown element section ${checkpoint.sectionId}.`,
        });
        continue;
      }
      const allowed = new Set(["start", "center", "end"]);
      if (section.pinned) {
        for (const position of ["pin-start", "pin-mid", "pin-end"])
          allowed.add(position);
      }
      if (section.isFooter) allowed.add("footer");
      if (!allowed.has(checkpoint.position)) {
        failures.push({
          code: "UNEXPECTED_SCROLL_CHECKPOINT",
          manifest: manifest.role,
          viewport,
          sectionId: checkpoint.sectionId,
          position: checkpoint.position,
          message: `${manifest.role} ${viewport} has unexpected checkpoint ${checkpoint.sectionId}:${checkpoint.position}.`,
        });
      }
    }

    const motionCaptureRecords = (evidence.motionCaptures ?? []).filter(({ path }) =>
      Boolean(path),
    );
    for (const duplicate of duplicateCounts(
      motionCaptureRecords.map(({ layerId, phase }) => `${layerId}:${phase}`),
    )) {
      const [layerId, phase] = duplicate.value.split(":");
      failures.push({
        code: "DUPLICATE_MOTION_CHECKPOINT",
        manifest: manifest.role,
        viewport,
        layerId,
        phase,
        count: duplicate.count,
        message: `${manifest.role} ${viewport} duplicates ${duplicate.value}.`,
      });
    }
    for (const capture of motionCaptureRecords) {
      if (!motionLayersById.has(capture.layerId)) {
        failures.push({
          code: "UNKNOWN_MOTION_CHECKPOINT",
          manifest: manifest.role,
          viewport,
          layerId: capture.layerId,
          phase: capture.phase,
          message: `${manifest.role} ${viewport} captures unknown motion layer ${capture.layerId}.`,
        });
      } else if (!new Set(["start", "mid", "end", "reverse"]).has(capture.phase)) {
        failures.push({
          code: "UNEXPECTED_MOTION_PHASE",
          manifest: manifest.role,
          viewport,
          layerId: capture.layerId,
          phase: capture.phase,
          message: `${manifest.role} ${viewport} has unexpected ${capture.layerId}:${capture.phase}.`,
        });
      }
    }

    for (const section of requiredSections) {
      if (!capturedSections.has(section.id)) {
        failures.push({
          code: "MISSING_SECTION_CAPTURE",
          manifest: manifest.role,
          viewport,
          sectionId: section.id,
          message: `${manifest.role} ${viewport} is missing the ${section.id} section capture.`,
        });
      }
      const positions = ["start", "center", "end"];
      if (section.pinned) positions.push("pin-start", "pin-mid", "pin-end");
      if (section.isFooter) positions.push("footer");
      for (const position of positions) {
        if (!checkpoints.has(`${section.id}:${position}`)) {
          failures.push({
            code: "MISSING_SCROLL_CHECKPOINT",
            manifest: manifest.role,
            viewport,
            sectionId: section.id,
            position,
            message: `${manifest.role} ${viewport} is missing ${section.id}:${position}.`,
          });
        }
      }
    }
    for (const layer of manifest.motion?.layers ?? []) {
      for (const phase of ["start", "mid", "end", "reverse"]) {
        if (!motionCaptures.has(`${layer.id}:${phase}`)) {
          failures.push({
            code: "MISSING_MOTION_CHECKPOINT",
            manifest: manifest.role,
            viewport,
            layerId: layer.id,
            phase,
            message: `${manifest.role} ${viewport} is missing ${layer.id}:${phase} motion evidence.`,
          });
        }
      }
    }
  }
  return failures;
}

function motionEvidenceFailures(manifest) {
  if (manifest.motion?.status === "complete") return [];
  return [
    {
      code: "INCOMPLETE_MOTION_INVENTORY",
      manifest: manifest.role,
      message: `${manifest.role} motion inventory must be explicitly complete.`,
    },
  ];
}

function duplicateIds(manifest) {
  const counts = new Map();
  for (const { id } of flattenSections(manifest.sections ?? [])) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ manifest: manifest.role, id, count }));
}

function compareSiblingOrder(
  referenceSections,
  implementationSections,
  parentId = null,
) {
  const referenceOrder = referenceSections.map(({ id }) => id);
  const implementationOrder = implementationSections.map(({ id }) => id);
  const sameMembers =
    referenceOrder.length === implementationOrder.length &&
    referenceOrder.every((id) => implementationOrder.includes(id));
  const mismatches = [];
  if (
    sameMembers &&
    referenceOrder.some((id, index) => implementationOrder[index] !== id)
  ) {
    mismatches.push({
      parentId,
      reference: referenceOrder,
      implementation: implementationOrder,
    });
  }

  const implementationById = new Map(
    implementationSections.map((section) => [section.id, section]),
  );
  for (const section of referenceSections) {
    const actual = implementationById.get(section.id);
    if (!actual) continue;
    mismatches.push(
      ...compareSiblingOrder(
        Array.isArray(section.children) ? section.children : [],
        Array.isArray(actual.children) ? actual.children : [],
        section.id,
      ),
    );
  }
  return mismatches;
}

function compareNestedCounts(reference, implementation) {
  const implementationById = new Map(
    flattenSections(implementation.sections ?? []).map((section) => [
      section.id,
      section,
    ]),
  );
  const mismatches = [];
  for (const section of flattenSections(reference.sections ?? [])) {
    const actual = implementationById.get(section.id);
    if (!actual) continue;
    const expectedChildren = Array.isArray(section.children)
      ? section.children.length
      : 0;
    const actualChildren = Array.isArray(actual.children) ? actual.children.length : 0;
    if (expectedChildren !== actualChildren) {
      mismatches.push({
        id: section.id,
        field: "children",
        reference: expectedChildren,
        implementation: actualChildren,
      });
    }
    if (Number.isInteger(section.itemCount) && section.itemCount !== actual.itemCount) {
      mismatches.push({
        id: section.id,
        reference: section.itemCount,
        implementation: actual.itemCount,
      });
    }
  }
  return mismatches;
}

function compareDomTopology(reference, implementation) {
  const expected = reference.domTopology?.directChildren ?? [];
  const actual = implementation.domTopology?.directChildren ?? [];
  if (
    expected.length === actual.length &&
    expected.every((id, index) => actual[index] === id)
  ) {
    return [];
  }
  return [{ reference: expected, implementation: actual }];
}

function compareDomRoot(reference, implementation) {
  const expected = reference.domTopology?.scope ?? null;
  const actual = implementation.domTopology?.scope ?? null;
  return expected === actual ? [] : [{ reference: expected, implementation: actual }];
}

function compareBounds(reference, implementation) {
  const actualById = new Map(
    flattenSections(implementation.sections ?? []).map((section) => [
      section.id,
      section,
    ]),
  );
  const tolerance = reference.tolerances?.boundsPx ?? 0;
  const fields = ["x", "y", "width", "height"];
  const mismatches = [];

  for (const section of flattenSections(reference.sections ?? [])) {
    const actual = actualById.get(section.id);
    if (!actual || section.nodeKind === "virtual") continue;
    for (const viewport of reference.requiredViewports ?? []) {
      const expectedBounds = section.bounds?.[viewport];
      const actualBounds = actual.bounds?.[viewport];
      if (!expectedBounds) continue;
      for (const field of fields) {
        const expectedValue = expectedBounds[field];
        if (!Number.isFinite(expectedValue)) continue;
        const actualValue = actualBounds?.[field];
        if (
          !Number.isFinite(actualValue) ||
          Math.abs(expectedValue - actualValue) > tolerance
        ) {
          mismatches.push({
            id: section.id,
            viewport,
            field,
            reference: expectedValue,
            implementation: Number.isFinite(actualValue) ? actualValue : null,
            tolerance,
          });
        }
      }
    }
  }
  return mismatches;
}

function compareIdentity(reference, implementation) {
  const implementationById = new Map(
    flattenSectionsWithParents(implementation.sections ?? []).map((entry) => [
      entry.section.id,
      entry,
    ]),
  );
  const mismatches = [];
  for (const expected of flattenSectionsWithParents(reference.sections ?? [])) {
    const actual = implementationById.get(expected.section.id);
    if (!actual) continue;
    const fields = [
      ["semantic", expected.section.semantic, actual.section.semantic],
      [
        "nodeKind",
        expected.section.nodeKind ?? "element",
        actual.section.nodeKind ?? "element",
      ],
      ["parentId", expected.parentId, actual.parentId],
      [
        "headingPurpose",
        expected.section.headingPurpose,
        actual.section.headingPurpose,
      ],
      ["keyLinks", expected.section.keyLinks, actual.section.keyLinks],
      ["assets", expected.section.assets, actual.section.assets],
      ["visibleState", expected.section.visibleState, actual.section.visibleState],
      [
        "motionDisposition",
        expected.section.motionDisposition,
        actual.section.motionDisposition,
      ],
    ];
    for (const [field, expectedValue, actualValue] of fields) {
      if (!sameValue(expectedValue, actualValue)) {
        mismatches.push({
          id: expected.section.id,
          field,
          reference: expectedValue,
          implementation: actualValue,
        });
      }
    }
  }
  return mismatches;
}

function compareViewports(reference, implementation) {
  const actualRequired = new Set(implementation.requiredViewports ?? []);
  const scrollTolerance = reference.tolerances?.scrollHeightPx ?? 0;
  const mismatches = (reference.requiredViewports ?? []).flatMap((viewport) => {
    const expected = reference.viewports?.[viewport];
    const actual = implementation.viewports?.[viewport];
    if (!actualRequired.has(viewport) || !actual) {
      return [
        {
          code: "MISSING_REQUIRED_VIEWPORT",
          viewport,
          reference: expected
            ? { width: expected.width, height: expected.height }
            : null,
          implementation: null,
        },
      ];
    }
    const mismatches = [];
    for (const field of ["width", "height"]) {
      if (expected?.[field] !== actual[field]) {
        mismatches.push({
          code: "VIEWPORT_DIMENSION_MISMATCH",
          viewport,
          field,
          reference: expected?.[field] ?? null,
          implementation: actual[field] ?? null,
        });
      }
    }
    if (
      !Number.isFinite(actual.scrollHeight) ||
      !Number.isFinite(expected?.scrollHeight) ||
      Math.abs(expected.scrollHeight - actual.scrollHeight) > scrollTolerance
    ) {
      mismatches.push({
        code: "SCROLL_HEIGHT_MISMATCH",
        viewport,
        field: "scrollHeight",
        reference: expected?.scrollHeight ?? null,
        implementation: Number.isFinite(actual.scrollHeight)
          ? actual.scrollHeight
          : null,
        tolerance: scrollTolerance,
      });
    }
    return mismatches;
  });
  const expectedRequired = new Set(reference.requiredViewports ?? []);
  for (const viewport of actualRequired) {
    if (!expectedRequired.has(viewport)) {
      mismatches.push({
        code: "EXTRA_REQUIRED_VIEWPORT",
        viewport,
        reference: null,
        implementation: implementation.viewports?.[viewport]
          ? {
              width: implementation.viewports[viewport].width,
              height: implementation.viewports[viewport].height,
            }
          : null,
      });
    }
  }
  return mismatches;
}

function sameValue(left, right) {
  const canonicalize = (value) => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (!isRecord(value)) return value;
    return Object.fromEntries(
      Object.entries(value)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  };
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function compareMotion(reference, implementation) {
  const referenceLayers = reference.motion?.layers ?? [];
  const implementationLayers = implementation.motion?.layers ?? [];
  const actualById = new Map(implementationLayers.map((layer) => [layer.id, layer]));
  const referenceIds = new Set(referenceLayers.map(({ id }) => id));
  const mismatches = [];
  const fields = [
    "sectionId",
    "property",
    "trigger",
    "range",
    "easing",
    "interruption",
    "reducedMotion",
    "samples",
    "pinned",
    "pinRanges",
  ];

  for (const expected of referenceLayers) {
    const actual = actualById.get(expected.id);
    if (!actual) {
      mismatches.push({ code: "MISSING_MOTION_LAYER", id: expected.id });
      continue;
    }
    for (const field of fields) {
      if (!sameValue(expected[field], actual[field])) {
        mismatches.push({
          code: "MOTION_LAYER_FIELD_MISMATCH",
          id: expected.id,
          field,
          reference: expected[field],
          implementation: actual[field],
        });
      }
    }
  }
  for (const actual of implementationLayers) {
    if (!referenceIds.has(actual.id)) {
      mismatches.push({ code: "EXTRA_MOTION_LAYER", id: actual.id });
    }
  }
  return mismatches;
}

function compareScope(reference, implementation) {
  const fields = ["kind", "id"];
  const mismatches = [];
  for (const field of fields) {
    if (reference.scope?.[field] !== implementation.scope?.[field]) {
      mismatches.push({
        field,
        reference: reference.scope?.[field] ?? null,
        implementation: implementation.scope?.[field] ?? null,
      });
    }
  }
  if (
    reference.scope?.kind === "route-content" &&
    reference.route !== implementation.route
  ) {
    mismatches.push({
      field: "route",
      reference: reference.route ?? null,
      implementation: implementation.route ?? null,
    });
  }
  if (reference.family !== implementation.family) {
    mismatches.push({
      field: "family",
      reference: reference.family ?? null,
      implementation: implementation.family ?? null,
    });
  }
  return mismatches;
}

function normalizationFailure(manifest, error) {
  const message = error instanceof Error ? error.message : String(error);
  const separator = message.indexOf(":");
  return {
    code: separator === -1 ? "NORMALIZATION_FAILED" : message.slice(0, separator),
    manifest,
    message,
  };
}

function normalizeComparisonManifests(reference, implementation, normalization) {
  if (normalization === undefined) {
    return {
      reference,
      implementation,
      failures: [],
      applied: false,
      canonicalCompared: false,
    };
  }
  if (!isRecord(normalization)) {
    return {
      reference,
      implementation,
      failures: [
        {
          code: "INVALID_NORMALIZATION_CONFIG",
          manifest: "comparison",
          message: "Normalization configuration must be an object.",
        },
      ],
      applied: true,
      canonicalCompared: false,
    };
  }

  const failures = [];
  const normalized = {};
  for (const [position, observation, adapter] of [
    ["reference", reference, normalization.referenceAdapter],
    ["implementation", implementation, normalization.implementationAdapter],
  ]) {
    try {
      normalized[position] = normalizeObservation({
        observation,
        reviewedContract: normalization.reviewedContract,
        adapter,
        motionPreference: normalization.motionPreference,
      });
    } catch (error) {
      failures.push(normalizationFailure(position, error));
    }
  }

  if (failures.length > 0) {
    return {
      reference,
      implementation,
      failures,
      applied: true,
      canonicalCompared: false,
    };
  }
  return {
    reference: normalized.reference,
    implementation: normalized.implementation,
    failures,
    applied: true,
    canonicalCompared: true,
  };
}

export function compareSectionManifests(
  rawReference,
  rawImplementation,
  normalization,
) {
  const schemaFailures = [
    ...validateSectionManifest(rawReference),
    ...validateSectionManifest(rawImplementation),
  ];
  const normalized = normalizeComparisonManifests(
    rawReference,
    rawImplementation,
    normalization,
  );
  const { reference, implementation } = normalized;
  const referenceIds = new Set(
    flattenSections(reference.sections ?? []).map(({ id }) => id),
  );
  const implementationIds = new Set(
    flattenSections(implementation.sections ?? []).map(({ id }) => id),
  );
  const missing = flattenSections(reference.sections ?? [])
    .map(({ id }) => id)
    .filter((id) => !implementationIds.has(id));
  const extra = flattenSections(implementation.sections ?? [])
    .map(({ id }) => id)
    .filter((id) => !referenceIds.has(id));
  const evidenceFailures = [
    ...topOnlyFailures(rawReference),
    ...coverageFailures(rawReference),
    ...motionEvidenceFailures(rawReference),
    ...topOnlyFailures(rawImplementation),
    ...coverageFailures(rawImplementation),
    ...motionEvidenceFailures(rawImplementation),
  ];
  const duplicates = [...duplicateIds(reference), ...duplicateIds(implementation)];
  const reordered = compareSiblingOrder(
    reference.sections ?? [],
    implementation.sections ?? [],
  );
  const nestedCountMismatches = compareNestedCounts(reference, implementation);
  const domTopologyMismatches = compareDomTopology(reference, implementation);
  const domRootMismatches = compareDomRoot(reference, implementation);
  const boundsMismatches = compareBounds(reference, implementation);
  const identityMismatches = compareIdentity(reference, implementation);
  const viewportMismatches = compareViewports(reference, implementation);
  const motionMismatches = compareMotion(reference, implementation);
  const scopeMismatches = compareScope(reference, implementation);
  const roleMismatches = [];
  if (rawReference.role !== "reference") {
    roleMismatches.push({
      position: "reference",
      expected: "reference",
      received: rawReference.role ?? null,
    });
  }
  if (rawImplementation.role !== "implementation") {
    roleMismatches.push({
      position: "implementation",
      expected: "implementation",
      received: rawImplementation.role ?? null,
    });
  }
  const accepted =
    schemaFailures.length === 0 &&
    normalized.failures.length === 0 &&
    missing.length === 0 &&
    extra.length === 0 &&
    duplicates.length === 0 &&
    reordered.length === 0 &&
    nestedCountMismatches.length === 0 &&
    domTopologyMismatches.length === 0 &&
    domRootMismatches.length === 0 &&
    boundsMismatches.length === 0 &&
    identityMismatches.length === 0 &&
    viewportMismatches.length === 0 &&
    motionMismatches.length === 0 &&
    scopeMismatches.length === 0 &&
    roleMismatches.length === 0 &&
    evidenceFailures.length === 0;

  return {
    accepted,
    status: accepted ? "accepted" : "rejected",
    acceptance: { missing, extra },
    missing,
    extra,
    schemaFailures,
    normalization: {
      applied: normalized.applied,
      canonicalCompared: normalized.canonicalCompared,
    },
    normalizationFailures: normalized.failures,
    duplicates,
    reordered,
    nestedCountMismatches,
    domTopologyMismatches,
    domRootMismatches,
    boundsMismatches,
    identityMismatches,
    viewportMismatches,
    motionMismatches,
    scopeMismatches,
    roleMismatches,
    evidenceFailures,
  };
}

function normalizeRoutePath(value) {
  if (!isNonEmptyString(value) || !value.startsWith("/")) return null;
  try {
    const url = new URL(value, "https://route-authority.invalid");
    if (url.origin !== "https://route-authority.invalid") return null;
    const pathname = url.pathname.replace(/\/{2,}/g, "/");
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  } catch {
    return null;
  }
}

function duplicateCounts(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

export function validateSectionGatePlanCoverage(plan, routeDeclarations) {
  const failures = [];
  const fail = (code, message, details = {}) => {
    failures.push({ code, ...details, message });
  };

  if (!isRecord(plan)) {
    fail("INVALID_SECTION_GATE_PLAN", "Gate plan must be a JSON object.");
    return failures;
  }
  if (plan.schemaVersion !== "full-page-section-gate-plan/v1") {
    fail(
      "INVALID_SECTION_GATE_PLAN_VERSION",
      "Gate plan must use full-page-section-gate-plan/v1.",
    );
  }
  if (!isNonEmptyString(plan.routeAuthority)) {
    fail(
      "MISSING_ROUTE_AUTHORITY",
      "Gate plan must reference the route authority used for release coverage.",
    );
  }
  const comparisons = Array.isArray(plan.comparisons) ? plan.comparisons : [];
  if (comparisons.length === 0) {
    fail(
      "MISSING_SECTION_COMPARISONS",
      "Gate plan must declare at least one comparison.",
    );
  }

  const declarations = Array.isArray(routeDeclarations) ? routeDeclarations : [];
  if (!Array.isArray(routeDeclarations)) {
    fail("INVALID_ROUTE_AUTHORITY", "Route authority must export an array.");
  }
  const declaredRoutes = [];
  for (const [index, declaration] of declarations.entries()) {
    const route = normalizeRoutePath(declaration?.path);
    if (!route || !isNonEmptyString(declaration?.family)) {
      fail(
        "INVALID_ROUTE_AUTHORITY_ENTRY",
        `Route authority entry ${index} requires a canonical path and family.`,
        { index },
      );
    } else {
      declaredRoutes.push(route);
    }
  }
  for (const duplicate of duplicateCounts(declaredRoutes)) {
    fail(
      "DUPLICATE_ROUTE_AUTHORITY_ENTRY",
      `${duplicate.value} appears ${duplicate.count} times in route authority.`,
      { route: duplicate.value, count: duplicate.count },
    );
  }

  const comparisonIds = [];
  const comparedRoutes = [];
  let shellCount = 0;
  for (const [index, comparison] of comparisons.entries()) {
    if (
      !isRecord(comparison) ||
      !isNonEmptyString(comparison.id) ||
      !isNonEmptyString(comparison.reference) ||
      !isNonEmptyString(comparison.implementation) ||
      !new Set(["route-content", "global-shell"]).has(comparison.scopeKind)
    ) {
      fail(
        "INVALID_SECTION_COMPARISON",
        `Comparison ${index} requires id, scopeKind, reference, and implementation.`,
        { index },
      );
      continue;
    }
    comparisonIds.push(comparison.id);
    if (comparison.scopeKind === "route-content") {
      const route = normalizeRoutePath(comparison.route);
      if (!route) {
        fail(
          "MISSING_COMPARISON_ROUTE",
          `${comparison.id} is route-content but lacks a canonical route.`,
          { comparisonId: comparison.id },
        );
      } else {
        comparedRoutes.push(route);
      }
    } else {
      shellCount += 1;
    }
  }
  for (const duplicate of duplicateCounts(comparisonIds)) {
    fail(
      "DUPLICATE_SECTION_COMPARISON_ID",
      `${duplicate.value} appears ${duplicate.count} times in the gate plan.`,
      { comparisonId: duplicate.value, count: duplicate.count },
    );
  }
  for (const duplicate of duplicateCounts(comparedRoutes)) {
    fail(
      "DUPLICATE_ROUTE_COMPARISON",
      `${duplicate.value} has ${duplicate.count} route-content comparisons.`,
      { route: duplicate.value, count: duplicate.count },
    );
  }
  if (shellCount === 0) {
    fail(
      "MISSING_GLOBAL_SHELL_COMPARISON",
      "Gate plan requires one global-shell comparison.",
    );
  } else if (shellCount > 1) {
    fail(
      "DUPLICATE_GLOBAL_SHELL_COMPARISON",
      `Gate plan contains ${shellCount} global-shell comparisons.`,
      { count: shellCount },
    );
  }

  const declaredSet = new Set(declaredRoutes);
  const comparedSet = new Set(comparedRoutes);
  for (const route of declaredSet) {
    if (!comparedSet.has(route)) {
      fail("MISSING_ROUTE_COMPARISON", `${route} has no section-manifest comparison.`, {
        route,
      });
    }
  }
  for (const route of comparedSet) {
    if (!declaredSet.has(route)) {
      fail(
        "EXTRA_ROUTE_COMPARISON",
        `${route} is compared but absent from route authority.`,
        { route },
      );
    }
  }

  return failures;
}

export function validateSectionComparisonIdentity(
  comparison,
  reference,
  implementation,
) {
  const failures = [];
  for (const [position, manifest] of [
    ["reference", reference],
    ["implementation", implementation],
  ]) {
    if (manifest?.scope?.kind !== comparison?.scopeKind) {
      failures.push({
        code: "PLAN_MANIFEST_SCOPE_MISMATCH",
        comparisonId: comparison?.id ?? null,
        manifest: position,
        expected: comparison?.scopeKind ?? null,
        received: manifest?.scope?.kind ?? null,
        message: `${position} scope does not match comparison ${comparison?.id ?? "unknown"}.`,
      });
    }
    if (comparison?.scopeKind === "route-content") {
      const expectedRoute = normalizeRoutePath(comparison.route);
      const receivedRoute = normalizeRoutePath(manifest?.route);
      if (expectedRoute !== receivedRoute) {
        failures.push({
          code: "PLAN_MANIFEST_ROUTE_MISMATCH",
          comparisonId: comparison?.id ?? null,
          manifest: position,
          expected: expectedRoute,
          received: receivedRoute,
          message: `${position} route does not match comparison ${comparison?.id ?? "unknown"}.`,
        });
      }
    }
  }
  return failures;
}

const cliOptions = new Set(["help", "implementation", "out", "plan", "reference"]);

export function parseSectionManifestArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (typeof argument !== "string" || !argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument ?? ""}`);
    }
    const separator = argument.indexOf("=");
    const key = argument.slice(2, separator === -1 ? undefined : separator);
    if (!cliOptions.has(key)) throw new Error(`Unknown option: --${key}.`);
    if (Object.hasOwn(args, key)) throw new Error(`Duplicate option: --${key}.`);

    if (key === "help" && separator === -1) {
      args[key] = true;
      continue;
    }
    let value = separator === -1 ? argv[index + 1] : argument.slice(separator + 1);
    if (separator === -1) index += 1;
    if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
      throw new Error(`Option --${key} requires a value.`);
    }
    args[key] = value;
  }
  return args;
}

function usage() {
  return `Usage:
  node scripts/fidelity/section-manifest.mjs --plan=<gate-plan.json> [--out=<result.json>]
  node scripts/fidelity/section-manifest.mjs --reference=<manifest.json> --implementation=<manifest.json> [--out=<result.json>]`;
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read ${label} manifest ${filePath}: ${reason}`);
  }
}

async function readRouteAuthority(filePath) {
  if (path.extname(filePath) === ".json") {
    const value = await readJson(filePath, "route authority");
    return Array.isArray(value) ? value : value.routeManifest;
  }
  const routeAuthorityModule = await import(pathToFileURL(filePath).href);
  return routeAuthorityModule.routeManifest;
}

function evidenceArtifacts(manifest) {
  const artifacts = [];
  for (const viewport of manifest.requiredViewports ?? []) {
    const evidence = manifest.viewports?.[viewport]?.evidence;
    if (!evidence) continue;
    if (evidence.top?.path) {
      artifacts.push({ viewport, kind: "top", path: evidence.top.path });
    }
    if (evidence.fullPage?.path) {
      artifacts.push({ viewport, kind: "fullPage", path: evidence.fullPage.path });
    }
    for (const capture of evidence.sectionCaptures ?? []) {
      if (capture.path) {
        artifacts.push({
          viewport,
          kind: "section",
          sectionId: capture.sectionId,
          path: capture.path,
        });
      }
    }
    for (const checkpoint of evidence.checkpoints ?? []) {
      if (checkpoint.path) {
        artifacts.push({
          viewport,
          kind: "checkpoint",
          sectionId: checkpoint.sectionId,
          position: checkpoint.position,
          path: checkpoint.path,
        });
      }
    }
    for (const capture of evidence.motionCaptures ?? []) {
      if (capture.path) {
        artifacts.push({
          viewport,
          kind: "motion",
          layerId: capture.layerId,
          phase: capture.phase,
          path: capture.path,
        });
      }
    }
  }
  return artifacts;
}

async function missingArtifactFailures(manifest, manifestPath) {
  const base = path.dirname(manifestPath);
  return (
    await Promise.all(
      evidenceArtifacts(manifest).map(async (artifact) => {
        const resolved = path.resolve(base, artifact.path);
        try {
          if ((await stat(resolved)).isFile()) return null;
        } catch {
          // The structured failure below is more useful than the filesystem error.
        }
        return {
          code: "MISSING_EVIDENCE_ARTIFACT",
          manifest: manifest.role,
          ...artifact,
          message: `${manifest.role} evidence artifact does not exist: ${artifact.path}`,
        };
      }),
    )
  ).filter(Boolean);
}

async function compareManifestFiles(referencePath, implementationPath, normalization) {
  const [reference, implementation] = await Promise.all([
    readJson(referencePath, "reference"),
    readJson(implementationPath, "implementation"),
  ]);
  const result = compareSectionManifests(reference, implementation, normalization);
  const artifactFailures = (
    await Promise.all([
      missingArtifactFailures(reference, referencePath),
      missingArtifactFailures(implementation, implementationPath),
    ])
  ).flat();
  if (artifactFailures.length > 0) {
    result.evidenceFailures.push(...artifactFailures);
    result.accepted = false;
    result.status = "rejected";
  }
  result.manifestIdentities = {
    reference: {
      role: reference.role ?? null,
      scope: reference.scope ?? null,
      route: reference.route ?? null,
      family: reference.family ?? null,
    },
    implementation: {
      role: implementation.role ?? null,
      scope: implementation.scope ?? null,
      route: implementation.route ?? null,
      family: implementation.family ?? null,
    },
  };
  return result;
}

async function readComparisonNormalization(normalization, planRoot) {
  if (!isRecord(normalization)) {
    throw new Error("Comparison normalization must be an object.");
  }
  for (const field of [
    "reviewedContract",
    "referenceAdapter",
    "implementationAdapter",
  ]) {
    if (!isNonEmptyString(normalization[field])) {
      throw new Error(`Comparison normalization requires ${field}.`);
    }
  }
  if (!isNonEmptyString(normalization.motionPreference)) {
    throw new Error("Comparison normalization requires motionPreference.");
  }
  const [reviewedContract, referenceAdapter, implementationAdapter] = await Promise.all(
    [
      readJson(
        path.resolve(planRoot, normalization.reviewedContract),
        "reviewed contract",
      ),
      readJson(
        path.resolve(planRoot, normalization.referenceAdapter),
        "reference normalization adapter",
      ),
      readJson(
        path.resolve(planRoot, normalization.implementationAdapter),
        "implementation normalization adapter",
      ),
    ],
  );
  return {
    reviewedContract,
    referenceAdapter,
    implementationAdapter,
    motionPreference: normalization.motionPreference,
  };
}

export async function runSectionManifestCli(
  argv = process.argv.slice(2),
  { cwd = process.cwd(), stdout = process.stdout } = {},
) {
  const args = parseSectionManifestArguments(argv);
  if (args.help === true) {
    stdout.write(`${usage()}\n`);
    return { accepted: true, status: "help" };
  }
  const hasPlan = typeof args.plan === "string";
  const hasPair =
    typeof args.reference === "string" || typeof args.implementation === "string";
  if (hasPlan && hasPair) {
    throw new Error("--plan cannot be combined with --reference or --implementation.");
  }

  let result;
  if (hasPlan) {
    const planPath = path.resolve(cwd, args.plan);
    const plan = await readJson(planPath, "gate plan");
    if (
      plan.schemaVersion !== "full-page-section-gate-plan/v1" ||
      !Array.isArray(plan.comparisons) ||
      plan.comparisons.length === 0 ||
      typeof plan.routeAuthority !== "string"
    ) {
      throw new Error(
        "Gate plan must use full-page-section-gate-plan/v1 and declare routeAuthority plus at least one comparison.",
      );
    }
    const planRoot = path.dirname(planPath);
    const routeDeclarations = await readRouteAuthority(
      path.resolve(planRoot, plan.routeAuthority),
    );
    const planFailures = validateSectionGatePlanCoverage(plan, routeDeclarations);
    const comparisons = await Promise.all(
      plan.comparisons.map(async (comparison) => {
        if (
          typeof comparison.id !== "string" ||
          typeof comparison.reference !== "string" ||
          typeof comparison.implementation !== "string"
        ) {
          throw new Error(
            "Every gate-plan comparison requires id, reference, and implementation strings.",
          );
        }
        try {
          const normalization = Object.hasOwn(comparison, "normalization")
            ? await readComparisonNormalization(comparison.normalization, planRoot)
            : undefined;
          const comparisonResult = await compareManifestFiles(
            path.resolve(planRoot, comparison.reference),
            path.resolve(planRoot, comparison.implementation),
            normalization,
          );
          const planIdentityFailures = validateSectionComparisonIdentity(
            comparison,
            comparisonResult.manifestIdentities.reference,
            comparisonResult.manifestIdentities.implementation,
          );
          if (planIdentityFailures.length > 0) {
            comparisonResult.planIdentityFailures = planIdentityFailures;
            comparisonResult.accepted = false;
            comparisonResult.status = "rejected";
          }
          return {
            id: comparison.id,
            scopeKind: comparison.scopeKind,
            route: comparison.route ?? null,
            result: comparisonResult,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return {
            id: comparison.id,
            scopeKind: comparison.scopeKind,
            route: comparison.route ?? null,
            result: {
              accepted: false,
              status: "rejected",
              gateError: { code: "COMPARISON_UNREADABLE", message },
            },
          };
        }
      }),
    );
    const accepted =
      planFailures.length === 0 &&
      comparisons.every(({ result: comparison }) => comparison.accepted);
    result = {
      accepted,
      status: accepted ? "accepted" : "rejected",
      comparisonCount: comparisons.length,
      routeAuthorityCount: Array.isArray(routeDeclarations)
        ? routeDeclarations.length
        : 0,
      planFailures,
      comparisons,
    };
  } else {
    if (typeof args.reference !== "string" || typeof args.implementation !== "string") {
      throw new Error(
        `Both --reference and --implementation are required.\n${usage()}`,
      );
    }
    result = await compareManifestFiles(
      path.resolve(cwd, args.reference),
      path.resolve(cwd, args.implementation),
    );
  }
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (typeof args.out === "string") {
    await writeFile(path.resolve(cwd, args.out), serialized);
  }
  stdout.write(serialized);
  return result;
}

const modulePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === modulePath) {
  runSectionManifestCli()
    .then((result) => {
      if (!result.accepted) process.exitCode = 1;
    })
    .catch((error) => {
      const reason = error instanceof Error ? error.message : String(error);
      process.stderr.write(`${reason}\n`);
      process.exitCode = 1;
    });
}
