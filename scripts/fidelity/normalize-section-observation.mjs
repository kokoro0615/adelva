const manifestSchemaVersion = "full-page-section-manifest/v1";
const motionPreferences = new Set(["reduce", "no-preference"]);
const adapterKinds = new Set(["target", "implementation"]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function requireRecord(value, code, label) {
  if (!isRecord(value)) fail(code, `${label} must be an object.`);
  return value;
}

function requireString(value, code, label) {
  if (!isNonEmptyString(value)) fail(code, `${label} must be a non-empty string.`);
  return value;
}

function requireStringArray(value, code, label) {
  if (
    !Array.isArray(value) ||
    value.some((entry) => !isNonEmptyString(entry)) ||
    new Set(value).size !== value.length
  ) {
    fail(code, `${label} must contain unique non-empty strings.`);
  }
  return value;
}

function sameArray(left, right) {
  return (
    left.length === right.length && left.every((value, index) => value === right[index])
  );
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value);
}

function flattenSections(sections, parentId = null) {
  return sections.flatMap((section) => [
    { section, parentId },
    ...flattenSections(
      Array.isArray(section.children) ? section.children : [],
      section.id,
    ),
  ]);
}

function validateContract(reviewedContract) {
  requireRecord(reviewedContract, "INVALID_REVIEWED_CONTRACT", "reviewedContract");
  if (reviewedContract.schemaVersion !== manifestSchemaVersion) {
    fail(
      "INVALID_REVIEWED_CONTRACT",
      `reviewedContract.schemaVersion must be ${manifestSchemaVersion}.`,
    );
  }
  requireString(
    reviewedContract.manifestId,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.manifestId",
  );
  requireString(
    reviewedContract.family,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.family",
  );
  const scope = requireRecord(
    reviewedContract.scope,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.scope",
  );
  requireString(scope.kind, "INVALID_REVIEWED_CONTRACT", "reviewedContract.scope.kind");
  requireString(scope.id, "INVALID_REVIEWED_CONTRACT", "reviewedContract.scope.id");
  if (scope.kind === "route-content") {
    requireString(
      reviewedContract.route,
      "INVALID_REVIEWED_CONTRACT",
      "reviewedContract.route",
    );
  }

  const requiredViewports = requireStringArray(
    reviewedContract.requiredViewports,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.requiredViewports",
  );
  if (requiredViewports.length === 0) {
    fail("INVALID_REVIEWED_CONTRACT", "At least one viewport is required.");
  }
  for (const field of ["boundsPx", "scrollHeightPx"]) {
    const tolerance = reviewedContract.tolerances?.[field];
    if (!Number.isFinite(tolerance) || tolerance < 0) {
      fail(
        "INVALID_REVIEWED_CONTRACT",
        `reviewedContract.tolerances.${field} must be non-negative.`,
      );
    }
  }

  if (
    !Array.isArray(reviewedContract.sections) ||
    reviewedContract.sections.length === 0
  ) {
    fail("INVALID_REVIEWED_CONTRACT", "reviewedContract.sections must not be empty.");
  }
  const sectionEntries = flattenSections(reviewedContract.sections);
  const sectionIds = sectionEntries.map(({ section }) => section.id);
  for (const duplicate of duplicateValues(sectionIds)) {
    fail("DUPLICATE_CONTRACT_SECTION", `Section ${duplicate} is declared twice.`);
  }
  for (const { section } of sectionEntries) {
    requireString(section.id, "INVALID_REVIEWED_CONTRACT", "contract section id");
    requireString(
      section.semantic,
      "INVALID_REVIEWED_CONTRACT",
      `contract section ${section.id} semantic`,
    );
    if (!new Set(["element", "virtual"]).has(section.nodeKind ?? "element")) {
      fail(
        "INVALID_REVIEWED_CONTRACT",
        `Contract section ${section.id} has an invalid nodeKind.`,
      );
    }
  }

  const topology = requireRecord(
    reviewedContract.domTopology,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.domTopology",
  );
  const directChildren = requireStringArray(
    topology.directChildren,
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.domTopology.directChildren",
  );
  const sectionsById = new Map(
    sectionEntries.map(({ section, parentId }) => [section.id, { section, parentId }]),
  );
  for (const id of directChildren) {
    const entry = sectionsById.get(id);
    if (!entry) {
      fail("INVALID_REVIEWED_CONTRACT", `Direct child ${id} is not a section.`);
    }
    if ((entry.section.nodeKind ?? "element") === "virtual") {
      fail("INVALID_REVIEWED_CONTRACT", `Direct child ${id} cannot be virtual.`);
    }
  }

  const assets = requireRecord(
    reviewedContract.assets ?? {},
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.assets",
  );
  for (const { section } of sectionEntries) {
    const assetIds = requireStringArray(
      section.assets ?? [],
      "INVALID_REVIEWED_CONTRACT",
      `contract section ${section.id} assets`,
    );
    for (const assetId of assetIds) {
      if (!isRecord(assets[assetId])) {
        fail(
          "INVALID_REVIEWED_CONTRACT",
          `Contract section ${section.id} references unknown asset ${assetId}.`,
        );
      }
    }
  }

  const motion = requireRecord(
    reviewedContract.motion ?? { layers: [] },
    "INVALID_REVIEWED_CONTRACT",
    "reviewedContract.motion",
  );
  if (!Array.isArray(motion.layers)) {
    fail(
      "INVALID_REVIEWED_CONTRACT",
      "reviewedContract.motion.layers must be an array.",
    );
  }
  const motionIds = motion.layers.map(({ id }) => id);
  for (const duplicate of duplicateValues(motionIds)) {
    fail("DUPLICATE_CONTRACT_MOTION", `Motion layer ${duplicate} is declared twice.`);
  }
  for (const layer of motion.layers) {
    requireString(layer.id, "INVALID_REVIEWED_CONTRACT", "contract motion id");
    requireString(
      layer.sectionId,
      "INVALID_REVIEWED_CONTRACT",
      `contract motion ${layer.id} sectionId`,
    );
    if (!sectionsById.has(layer.sectionId)) {
      fail(
        "INVALID_REVIEWED_CONTRACT",
        `Motion layer ${layer.id} references unknown section ${layer.sectionId}.`,
      );
    }
  }

  return {
    requiredViewports,
    sectionEntries,
    sectionsById,
    directChildren,
    assets,
    motionLayers: motion.layers,
  };
}

function createAliasIndex(aliasDefinitions, validIds, label, requiredIds) {
  const definitions = requireRecord(
    aliasDefinitions ?? {},
    `INVALID_${label}_ALIASES`,
    `${label.toLowerCase()} aliases`,
  );
  const rawIds = new Map();
  const selectors = new Map();
  for (const [canonicalId, definition] of Object.entries(definitions)) {
    if (!validIds.has(canonicalId)) {
      fail(
        `UNKNOWN_${label}_ALIAS_TARGET`,
        `${label.toLowerCase()} aliases reference unknown canonical id ${canonicalId}.`,
      );
    }
    requireRecord(
      definition,
      `INVALID_${label}_ALIASES`,
      `${label.toLowerCase()} alias ${canonicalId}`,
    );
    for (const [field, index] of [
      ["rawIds", rawIds],
      ["selectors", selectors],
    ]) {
      const values = requireStringArray(
        definition[field] ?? [],
        `INVALID_${label}_ALIASES`,
        `${label.toLowerCase()} alias ${canonicalId}.${field}`,
      );
      for (const value of values) {
        const previous = index.get(value);
        if (previous && previous !== canonicalId) {
          fail(
            `DUPLICATE_${label}_ALIAS`,
            `${value} maps to both ${previous} and ${canonicalId}.`,
          );
        }
        index.set(value, canonicalId);
      }
    }
  }
  for (const id of requiredIds) {
    const definition = definitions[id];
    if (!isRecord(definition) || (definition.rawIds?.length ?? 0) === 0) {
      fail(
        `MISSING_${label}_ALIAS`,
        `${label.toLowerCase()} ${id} requires at least one reviewed raw id.`,
      );
    }
  }
  return { rawIds, selectors };
}

function resolveTargetIdentity(rawId, selector, index, label) {
  const fromId = index.rawIds.get(rawId);
  if (!fromId) fail(`UNMAPPED_${label}`, `No reviewed mapping exists for ${rawId}.`);
  if (isNonEmptyString(selector)) {
    const fromSelector = index.selectors.get(selector);
    if (!fromSelector) {
      fail(
        `UNMAPPED_${label}_SELECTOR`,
        `No reviewed mapping exists for selector ${selector}.`,
      );
    }
    if (fromSelector !== fromId) {
      fail(
        `AMBIGUOUS_${label}_MAPPING`,
        `${rawId} and ${selector} resolve to different canonical ids.`,
      );
    }
  }
  return fromId;
}

function createAssetSourceIndex(assets, adapterKind) {
  const index = new Map();
  for (const [logicalId, asset] of Object.entries(assets)) {
    const acceptedSources = requireRecord(
      asset.acceptedSources,
      "INVALID_ASSET_MAPPING",
      `asset ${logicalId}.acceptedSources`,
    );
    const sources = requireStringArray(
      acceptedSources[adapterKind] ?? [],
      "INVALID_ASSET_MAPPING",
      `asset ${logicalId}.acceptedSources.${adapterKind}`,
    );
    for (const source of sources) {
      const previous = index.get(source);
      if (previous && previous !== logicalId) {
        fail(
          "DUPLICATE_ASSET_MAPPING",
          `${source} maps to both ${previous} and ${logicalId}.`,
        );
      }
      index.set(source, logicalId);
    }
  }
  return index;
}

function validateViewportObservation(observation, requiredViewports) {
  const observedViewports = requireStringArray(
    observation.requiredViewports,
    "INVALID_OBSERVATION_VIEWPORTS",
    "observation.requiredViewports",
  );
  if (!sameArray(observedViewports, requiredViewports)) {
    fail(
      "VIEWPORT_ORDER_MISMATCH",
      `Expected ${requiredViewports.join(", ")}; received ${observedViewports.join(", ")}.`,
    );
  }
  requireRecord(observation.viewports, "INVALID_OBSERVATION", "observation.viewports");
  for (const viewport of requiredViewports) {
    if (!isRecord(observation.viewports[viewport])) {
      fail("MISSING_VIEWPORT", `Observation is missing viewport ${viewport}.`);
    }
  }
}

function canonicalManifestId(reviewedContract, role, motionPreference) {
  return `${reviewedContract.manifestId}-${role}-${motionPreference}`;
}

/**
 * Normalize one live observation through a reviewed contract.
 *
 * The target adapter maps reviewed raw IDs/selectors. The implementation adapter
 * accepts only authored IDs that already exist in the reviewed contract. All raw
 * browser details remain under `provenance`; comparator-facing identity is
 * canonical and asset paths are replaced by reviewed logical IDs.
 */
export function normalizeObservation({
  observation,
  reviewedContract,
  adapter,
  motionPreference,
}) {
  requireRecord(observation, "INVALID_OBSERVATION", "observation");
  requireRecord(adapter, "INVALID_ADAPTER", "adapter");
  if (!adapterKinds.has(adapter.kind)) {
    fail("INVALID_ADAPTER", "adapter.kind must be target or implementation.");
  }
  if (!motionPreferences.has(motionPreference)) {
    fail(
      "INVALID_MOTION_PREFERENCE",
      "motionPreference must be reduce or no-preference.",
    );
  }
  const expectedRole = adapter.kind === "target" ? "reference" : "implementation";
  if (observation.role !== expectedRole) {
    fail(
      "ADAPTER_ROLE_MISMATCH",
      `${adapter.kind} observations must use role ${expectedRole}.`,
    );
  }

  const contract = validateContract(reviewedContract);
  if (observation.schemaVersion !== manifestSchemaVersion) {
    fail("INVALID_OBSERVATION", `Observation must use ${manifestSchemaVersion}.`);
  }
  if (observation.family !== reviewedContract.family) {
    fail(
      "FAMILY_MISMATCH",
      `Expected ${reviewedContract.family}; received ${observation.family ?? "missing"}.`,
    );
  }
  if (
    reviewedContract.scope.kind === "route-content" &&
    observation.route !== reviewedContract.route
  ) {
    fail(
      "ROUTE_MISMATCH",
      `Expected ${reviewedContract.route}; received ${observation.route ?? "missing"}.`,
    );
  }
  if (observation.scope?.kind !== reviewedContract.scope.kind) {
    fail("SCOPE_KIND_MISMATCH", "Observation and reviewed scope kinds differ.");
  }
  validateViewportObservation(observation, contract.requiredViewports);

  const contractSectionIds = new Set(
    contract.sectionEntries.map(({ section }) => section.id),
  );
  const requiredElementIds = contract.sectionEntries
    .filter(({ section }) => (section.nodeKind ?? "element") !== "virtual")
    .map(({ section }) => section.id);
  const contractMotionIds = new Set(contract.motionLayers.map(({ id }) => id));
  let sectionAliasIndex = null;
  let motionAliasIndex = null;
  if (adapter.kind === "target") {
    sectionAliasIndex = createAliasIndex(
      adapter.sectionAliases,
      contractSectionIds,
      "SECTION",
      requiredElementIds,
    );
    motionAliasIndex = createAliasIndex(
      adapter.motionAliases,
      contractMotionIds,
      "MOTION",
      [...contractMotionIds],
    );
    const scopeAliasIndex = createAliasIndex(
      adapter.scopeAliases,
      new Set([reviewedContract.scope.id]),
      "SCOPE",
      [reviewedContract.scope.id],
    );
    const rawScopeId = requireString(
      observation.scope?.id,
      "INVALID_OBSERVATION",
      "observation.scope.id",
    );
    const canonicalScope = resolveTargetIdentity(
      rawScopeId,
      observation.domTopology?.scope,
      scopeAliasIndex,
      "SCOPE",
    );
    if (canonicalScope !== reviewedContract.scope.id) {
      fail("SCOPE_ID_MISMATCH", "Target scope resolved to an unexpected id.");
    }
  } else if (observation.scope?.id !== reviewedContract.scope.id) {
    fail(
      "SCOPE_ID_MISMATCH",
      `Expected authored scope ${reviewedContract.scope.id}; received ${observation.scope?.id ?? "missing"}.`,
    );
  }

  const mapSectionId = (rawId, selector = null) => {
    requireString(rawId, "INVALID_OBSERVATION_SECTION", "observed section id");
    if (adapter.kind === "target") {
      return resolveTargetIdentity(rawId, selector, sectionAliasIndex, "SECTION");
    }
    if (!contractSectionIds.has(rawId)) {
      fail("UNMAPPED_SECTION", `Authored section ${rawId} is not reviewed.`);
    }
    return rawId;
  };
  const mapMotionId = (rawId, selector = null) => {
    requireString(rawId, "INVALID_OBSERVATION_MOTION", "observed motion id");
    if (adapter.kind === "target") {
      return resolveTargetIdentity(rawId, selector, motionAliasIndex, "MOTION");
    }
    if (!contractMotionIds.has(rawId)) {
      fail("UNMAPPED_MOTION", `Authored motion layer ${rawId} is not reviewed.`);
    }
    return rawId;
  };

  if (!Array.isArray(observation.sections)) {
    fail("INVALID_OBSERVATION", "observation.sections must be an array.");
  }
  const rawSectionEntries = flattenSections(observation.sections);
  const observedSections = new Map();
  const observedOrder = [];
  for (const { section, parentId } of rawSectionEntries) {
    const canonicalId = mapSectionId(section.id, section.selector);
    const expected = contract.sectionsById.get(canonicalId);
    if ((expected.section.nodeKind ?? "element") === "virtual") {
      fail(
        "VIRTUAL_SECTION_OBSERVED",
        `Virtual section ${canonicalId} cannot be backed by an observed element.`,
      );
    }
    if (observedSections.has(canonicalId)) {
      fail(
        "DUPLICATE_SECTION_MAPPING",
        `Multiple observed sections resolve to ${canonicalId}.`,
      );
    }
    if (parentId !== null || isNonEmptyString(section.parentId)) {
      const rawParent = section.parentId ?? parentId;
      const canonicalParent = mapSectionId(rawParent);
      if (canonicalParent !== expected.parentId) {
        fail(
          "SECTION_PARENT_MISMATCH",
          `${canonicalId} expected parent ${expected.parentId ?? "root"}; received ${canonicalParent}.`,
        );
      }
    }
    observedSections.set(canonicalId, section);
    observedOrder.push(canonicalId);
  }
  for (const id of requiredElementIds) {
    if (!observedSections.has(id))
      fail("MISSING_SECTION", `Missing canonical section ${id}.`);
  }
  const expectedOrder = contract.sectionEntries
    .filter(({ section }) => (section.nodeKind ?? "element") !== "virtual")
    .map(({ section }) => section.id);
  if (!sameArray(observedOrder, expectedOrder)) {
    fail(
      "SECTION_ORDER_MISMATCH",
      `Expected ${expectedOrder.join(", ")}; received ${observedOrder.join(", ")}.`,
    );
  }

  const observedTopology = requireStringArray(
    observation.domTopology?.directChildren,
    "INVALID_OBSERVATION_TOPOLOGY",
    "observation.domTopology.directChildren",
  ).map((rawId) => mapSectionId(rawId));
  if (!sameArray(observedTopology, contract.directChildren)) {
    fail(
      "DOM_TOPOLOGY_MISMATCH",
      `Expected ${contract.directChildren.join(", ")}; received ${observedTopology.join(", ")}.`,
    );
  }

  const assetSourceIndex = createAssetSourceIndex(contract.assets, adapter.kind);
  const buildCanonicalSection = (expectedSection) => {
    if ((expectedSection.nodeKind ?? "element") === "virtual") {
      return {
        ...structuredClone(expectedSection),
        children: (expectedSection.children ?? []).map(buildCanonicalSection),
      };
    }
    const observed = observedSections.get(expectedSection.id);
    const rawAssets = requireStringArray(
      observed.assets ?? [],
      "INVALID_OBSERVATION_ASSETS",
      `observed section ${observed.id} assets`,
    );
    const logicalAssets = rawAssets.map((source) => {
      const logicalId = assetSourceIndex.get(source);
      if (!logicalId) {
        fail(
          "UNMAPPED_ASSET",
          `Observed asset ${source} has no reviewed ${adapter.kind} mapping.`,
        );
      }
      return logicalId;
    });
    for (const duplicate of duplicateValues(logicalAssets)) {
      fail(
        "DUPLICATE_ASSET_MAPPING",
        `Section ${expectedSection.id} maps more than one source to ${duplicate}.`,
      );
    }
    const expectedAssets = expectedSection.assets ?? [];
    if (!sameArray(logicalAssets, expectedAssets)) {
      const missing = expectedAssets.filter((id) => !logicalAssets.includes(id));
      const unexpected = logicalAssets.filter((id) => !expectedAssets.includes(id));
      if (missing.length > 0) {
        fail(
          "MISSING_ASSET",
          `Section ${expectedSection.id} is missing ${missing.join(", ")}.`,
        );
      }
      if (unexpected.length > 0) {
        fail(
          "UNEXPECTED_ASSET",
          `Section ${expectedSection.id} includes ${unexpected.join(", ")}.`,
        );
      }
      fail(
        "ASSET_ORDER_MISMATCH",
        `Section ${expectedSection.id} has reordered logical assets.`,
      );
    }
    for (const viewport of contract.requiredViewports) {
      if (!isRecord(observed.bounds?.[viewport])) {
        fail(
          "MISSING_SECTION_BOUNDS",
          `Section ${expectedSection.id} is missing ${viewport} bounds.`,
        );
      }
    }
    const canonical = structuredClone(expectedSection);
    canonical.bounds = structuredClone(observed.bounds);
    canonical.assets = logicalAssets;
    canonical.children = (expectedSection.children ?? []).map(buildCanonicalSection);
    if (canonical.children.length === 0) delete canonical.children;
    return canonical;
  };
  const sections = reviewedContract.sections.map(buildCanonicalSection);

  const observedMotion = requireRecord(
    observation.motion,
    "INVALID_OBSERVATION_MOTION",
    "observation.motion",
  );
  if (!Array.isArray(observedMotion.layers)) {
    fail("INVALID_OBSERVATION_MOTION", "observation.motion.layers must be an array.");
  }
  const observedMotionById = new Map();
  const observedMotionOrder = [];
  for (const rawLayer of observedMotion.layers) {
    const canonicalId = mapMotionId(rawLayer.id, rawLayer.selector);
    if (observedMotionById.has(canonicalId)) {
      fail(
        "DUPLICATE_MOTION_MAPPING",
        `Multiple observed motion layers resolve to ${canonicalId}.`,
      );
    }
    const expected = contract.motionLayers.find(({ id }) => id === canonicalId);
    const sectionId = mapSectionId(rawLayer.sectionId);
    if (sectionId !== expected.sectionId) {
      fail(
        "MOTION_SECTION_MISMATCH",
        `${canonicalId} expected section ${expected.sectionId}; received ${sectionId}.`,
      );
    }
    observedMotionById.set(canonicalId, rawLayer);
    observedMotionOrder.push(canonicalId);
  }
  const expectedMotionOrder = contract.motionLayers.map(({ id }) => id);
  for (const id of expectedMotionOrder) {
    if (!observedMotionById.has(id)) {
      fail("MISSING_MOTION", `Missing canonical motion layer ${id}.`);
    }
  }
  if (!sameArray(observedMotionOrder, expectedMotionOrder)) {
    fail(
      "MOTION_ORDER_MISMATCH",
      `Expected ${expectedMotionOrder.join(", ")}; received ${observedMotionOrder.join(", ")}.`,
    );
  }
  if (expectedMotionOrder.length > 0 && observedMotion.status !== "complete") {
    fail(
      "INCOMPLETE_MOTION_OBSERVATION",
      "A non-static motion inventory must be explicitly complete.",
    );
  }
  const motionLayers = contract.motionLayers.map((expected) => {
    const canonical = structuredClone(expected);
    delete canonical.samples;
    delete canonical.pinRanges;
    return canonical;
  });

  const rawObservation = structuredClone(observation);
  return {
    schemaVersion: manifestSchemaVersion,
    manifestId: canonicalManifestId(
      reviewedContract,
      observation.role,
      motionPreference,
    ),
    role: observation.role,
    ...(reviewedContract.scope.kind === "route-content"
      ? { route: reviewedContract.route }
      : { route: observation.route ?? "*" }),
    family: reviewedContract.family,
    scope: structuredClone(reviewedContract.scope),
    motionPreference,
    source: {
      contractId: reviewedContract.manifestId,
      observedAt: observation.source?.observedAt ?? null,
      motionPreference,
      normalizationAdapter: adapter.kind,
    },
    requiredViewports: structuredClone(contract.requiredViewports),
    tolerances: structuredClone(reviewedContract.tolerances),
    domTopology: {
      scope: reviewedContract.scope.id,
      directChildren: structuredClone(contract.directChildren),
    },
    sections,
    viewports: structuredClone(observation.viewports),
    motion: { status: "complete", layers: motionLayers },
    provenance: {
      adapterKind: adapter.kind,
      rawObservation,
    },
  };
}
