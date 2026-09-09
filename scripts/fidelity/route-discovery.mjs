import { readFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const ROUTE_DISCOVERY_SCHEMA_VERSION = "public-route-discovery/v1";

const requiredKinds = ["navigation", "footer", "sitemap"];
const validKinds = new Set(requiredKinds);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function duplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

export function normalizePublicRoute(href, origin) {
  if (!isNonEmptyString(href) || !isNonEmptyString(origin)) return null;
  try {
    const base = new URL(origin);
    const url = new URL(href, base);
    if (!new Set(["http:", "https:"]).has(url.protocol) || url.origin !== base.origin) {
      return null;
    }
    const pathname = url.pathname.replace(/\/{2,}/g, "/");
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  } catch {
    return null;
  }
}

export function validateRouteDiscoveryManifest(manifest) {
  const failures = [];
  const fail = (code, path, message, details = {}) => {
    failures.push({ code, path, ...details, message });
  };

  if (!isRecord(manifest)) {
    fail("INVALID_DISCOVERY_MANIFEST", "$", "Manifest must be a JSON object.");
    return failures;
  }
  if (manifest.schemaVersion !== ROUTE_DISCOVERY_SCHEMA_VERSION) {
    fail(
      "INVALID_DISCOVERY_SCHEMA_VERSION",
      "schemaVersion",
      `schemaVersion must be ${ROUTE_DISCOVERY_SCHEMA_VERSION}.`,
    );
  }
  if (!isNonEmptyString(manifest.manifestId)) {
    fail(
      "MISSING_DISCOVERY_MANIFEST_ID",
      "manifestId",
      "manifestId must be non-empty.",
    );
  }

  let origin = null;
  try {
    origin = new URL(manifest.origin);
    if (!new Set(["http:", "https:"]).has(origin.protocol)) throw new Error();
  } catch {
    fail(
      "INVALID_DISCOVERY_ORIGIN",
      "origin",
      "origin must be an absolute HTTP(S) URL.",
    );
  }
  if (manifest.hrefPolicy !== "all-same-origin-http-hrefs") {
    fail(
      "INVALID_HREF_POLICY",
      "hrefPolicy",
      "hrefPolicy must require all same-origin HTTP(S) hrefs from each capture.",
    );
  }

  const requiredSourceKinds = Array.isArray(manifest.requiredSourceKinds)
    ? manifest.requiredSourceKinds
    : [];
  for (const kind of requiredKinds) {
    if (!requiredSourceKinds.includes(kind)) {
      fail(
        "MISSING_REQUIRED_SOURCE_KIND",
        "requiredSourceKinds",
        `${kind} must be a required discovery source kind.`,
        { kind },
      );
    }
  }
  if (
    requiredSourceKinds.some((kind) => !validKinds.has(kind)) ||
    duplicateValues(requiredSourceKinds).length > 0
  ) {
    fail(
      "INVALID_REQUIRED_SOURCE_KINDS",
      "requiredSourceKinds",
      "requiredSourceKinds must contain unique navigation/footer/sitemap values.",
    );
  }

  const requiredSourceIds = Array.isArray(manifest.requiredSourceIds)
    ? manifest.requiredSourceIds
    : [];
  if (
    requiredSourceIds.length === 0 ||
    requiredSourceIds.some((sourceId) => !isNonEmptyString(sourceId)) ||
    duplicateValues(requiredSourceIds).length > 0
  ) {
    fail(
      "INVALID_REQUIRED_SOURCE_IDS",
      "requiredSourceIds",
      "requiredSourceIds must contain unique non-empty source IDs.",
    );
  }

  const sources = Array.isArray(manifest.sources) ? manifest.sources : [];
  if (sources.length === 0) {
    fail("MISSING_DISCOVERY_SOURCES", "sources", "sources must be non-empty.");
  }
  const sourceIds = sources.map((source) => source?.id);
  for (const duplicate of duplicateValues(sourceIds)) {
    fail(
      "DUPLICATE_DISCOVERY_SOURCE",
      "sources",
      `${duplicate.value} is declared ${duplicate.count} times.`,
      { sourceId: duplicate.value, count: duplicate.count },
    );
  }

  const sourcesById = new Map();
  for (const [sourceIndex, source] of sources.entries()) {
    const sourcePath = `sources[${sourceIndex}]`;
    if (!isRecord(source) || !isNonEmptyString(source.id)) {
      fail(
        "INVALID_DISCOVERY_SOURCE",
        sourcePath,
        "Every source requires a non-empty ID.",
      );
      continue;
    }
    sourcesById.set(source.id, source);
    if (!validKinds.has(source.kind)) {
      fail(
        "INVALID_DISCOVERY_SOURCE_KIND",
        `${sourcePath}.kind`,
        "Source kind must be navigation, footer, or sitemap.",
        { sourceId: source.id, kind: source.kind },
      );
    }
    if (
      (source.kind === "sitemap" && source.viewport !== null) ||
      (source.kind !== "sitemap" && !isNonEmptyString(source.viewport))
    ) {
      fail(
        "INVALID_DISCOVERY_SOURCE_VIEWPORT",
        `${sourcePath}.viewport`,
        "Navigation/footer sources require a viewport; sitemap requires null.",
        { sourceId: source.id },
      );
    }
    if (!new Set(["complete", "incomplete"]).has(source.status)) {
      fail(
        "INVALID_DISCOVERY_SOURCE_STATUS",
        `${sourcePath}.status`,
        "Source status must be complete or incomplete.",
        { sourceId: source.id },
      );
    }

    const requiredStateIds = Array.isArray(source.requiredStateIds)
      ? source.requiredStateIds
      : [];
    if (
      requiredStateIds.length === 0 ||
      requiredStateIds.some((stateId) => !isNonEmptyString(stateId)) ||
      duplicateValues(requiredStateIds).length > 0
    ) {
      fail(
        "INVALID_REQUIRED_DISCOVERY_STATES",
        `${sourcePath}.requiredStateIds`,
        "requiredStateIds must contain unique non-empty state IDs.",
        { sourceId: source.id },
      );
    }

    const captures = Array.isArray(source.captures) ? source.captures : [];
    if (captures.length === 0) {
      fail(
        "MISSING_DISCOVERY_CAPTURES",
        `${sourcePath}.captures`,
        "Every source requires at least one capture.",
        { sourceId: source.id },
      );
    }
    const captureIds = captures.map((capture) => capture?.stateId);
    for (const duplicate of duplicateValues(captureIds)) {
      fail(
        "DUPLICATE_DISCOVERY_STATE",
        `${sourcePath}.captures`,
        `${duplicate.value} is captured ${duplicate.count} times.`,
        {
          sourceId: source.id,
          stateId: duplicate.value,
          count: duplicate.count,
        },
      );
    }
    for (const stateId of requiredStateIds) {
      if (!captureIds.includes(stateId)) {
        fail(
          "MISSING_DISCOVERY_STATE",
          `${sourcePath}.captures`,
          `${source.id} is missing reviewed state ${stateId}.`,
          { sourceId: source.id, stateId },
        );
      }
    }

    for (const [captureIndex, capture] of captures.entries()) {
      const capturePath = `${sourcePath}.captures[${captureIndex}]`;
      if (!isRecord(capture) || !isNonEmptyString(capture.stateId)) {
        fail(
          "INVALID_DISCOVERY_CAPTURE",
          capturePath,
          "Every capture requires a non-empty stateId.",
          { sourceId: source.id },
        );
        continue;
      }
      if (!isNonEmptyString(capture.url)) {
        fail(
          "MISSING_DISCOVERY_CAPTURE_URL",
          `${capturePath}.url`,
          "Every capture requires its observed URL.",
          { sourceId: source.id, stateId: capture.stateId },
        );
      }
      if (
        !isNonEmptyString(capture.observedAt) ||
        !Number.isFinite(Date.parse(capture.observedAt))
      ) {
        fail(
          "INVALID_DISCOVERY_TIMESTAMP",
          `${capturePath}.observedAt`,
          "Every capture requires an ISO-compatible observation timestamp.",
          { sourceId: source.id, stateId: capture.stateId },
        );
      }
      if (
        !Number.isInteger(capture.statusCode) ||
        capture.statusCode < 200 ||
        capture.statusCode >= 400
      ) {
        fail(
          "INVALID_DISCOVERY_STATUS_CODE",
          `${capturePath}.statusCode`,
          "Every capture requires a successful or redirect HTTP status.",
          { sourceId: source.id, stateId: capture.stateId },
        );
      }
      if (!isNonEmptyString(capture.selector)) {
        fail(
          "MISSING_DISCOVERY_SELECTOR",
          `${capturePath}.selector`,
          "Every capture requires the selector or document field inspected.",
          { sourceId: source.id, stateId: capture.stateId },
        );
      }
      const hrefs = Array.isArray(capture.hrefs) ? capture.hrefs : [];
      if (hrefs.length === 0) {
        fail(
          "MISSING_DISCOVERED_HREFS",
          `${capturePath}.hrefs`,
          "Every capture requires its complete same-origin href set.",
          { sourceId: source.id, stateId: capture.stateId },
        );
      }
      const normalizedHrefs = [];
      for (const [hrefIndex, hrefRecord] of hrefs.entries()) {
        const hrefPath = `${capturePath}.hrefs[${hrefIndex}]`;
        const href = hrefRecord?.href;
        const normalized = normalizePublicRoute(href, manifest.origin);
        if (!isRecord(hrefRecord) || !isNonEmptyString(href) || !normalized) {
          fail(
            "INVALID_DISCOVERED_HREF",
            hrefPath,
            "Captured hrefs must be same-origin HTTP(S) links.",
            { sourceId: source.id, stateId: capture.stateId, href: href ?? null },
          );
        } else {
          normalizedHrefs.push(normalized);
        }
      }
      for (const duplicate of duplicateValues(normalizedHrefs)) {
        fail(
          "DUPLICATE_DISCOVERED_HREF",
          `${capturePath}.hrefs`,
          `${duplicate.value} appears ${duplicate.count} times in one capture.`,
          {
            sourceId: source.id,
            stateId: capture.stateId,
            route: duplicate.value,
            count: duplicate.count,
          },
        );
      }
    }
  }

  for (const kind of requiredSourceKinds) {
    const matchingSources = sources.filter((source) => source?.kind === kind);
    if (matchingSources.length === 0) {
      fail(
        "MISSING_DISCOVERY_SOURCE_KIND",
        "sources",
        `No ${kind} source was recorded.`,
        { kind },
      );
    } else if (!matchingSources.some((source) => source.status === "complete")) {
      fail(
        "INCOMPLETE_DISCOVERY_SOURCE_KIND",
        "sources",
        `No complete ${kind} source was recorded.`,
        { kind },
      );
    }
  }
  for (const sourceId of requiredSourceIds) {
    const source = sourcesById.get(sourceId);
    if (!source) {
      fail(
        "MISSING_DISCOVERY_SOURCE",
        "sources",
        `Required source ${sourceId} was not recorded.`,
        { sourceId },
      );
    } else if (source.status !== "complete") {
      fail(
        "INCOMPLETE_DISCOVERY_SOURCE",
        `sources.${sourceId}.status`,
        `Required source ${sourceId} is incomplete.`,
        { sourceId },
      );
    }
  }

  const exclusions = Array.isArray(manifest.exclusions) ? manifest.exclusions : [];
  if (!Array.isArray(manifest.exclusions)) {
    fail("INVALID_ROUTE_EXCLUSIONS", "exclusions", "exclusions must be an array.");
  }
  const exclusionPaths = [];
  for (const [index, exclusion] of exclusions.entries()) {
    const exclusionPath = normalizePublicRoute(exclusion?.path, manifest.origin);
    if (!isRecord(exclusion) || !exclusionPath) {
      fail(
        "INVALID_ROUTE_EXCLUSION",
        `exclusions[${index}]`,
        "Every exclusion requires a valid same-origin path.",
      );
      continue;
    }
    exclusionPaths.push(exclusionPath);
    if (
      !isNonEmptyString(exclusion.reason) ||
      !isNonEmptyString(exclusion.evidence) ||
      !isNonEmptyString(exclusion.approvedBy)
    ) {
      fail(
        "UNEXPLAINED_ROUTE_EXCLUSION",
        `exclusions[${index}]`,
        `${exclusionPath} requires reason, evidence, and a named approver.`,
        { path: exclusionPath },
      );
    }
  }
  for (const duplicate of duplicateValues(exclusionPaths)) {
    fail(
      "DUPLICATE_ROUTE_EXCLUSION",
      "exclusions",
      `${duplicate.value} is excluded ${duplicate.count} times.`,
      { path: duplicate.value, count: duplicate.count },
    );
  }

  return failures;
}

function collectDiscoveredRoutes(manifest) {
  const byPath = new Map();
  for (const source of manifest.sources ?? []) {
    for (const capture of source.captures ?? []) {
      for (const hrefRecord of capture.hrefs ?? []) {
        const normalized = normalizePublicRoute(hrefRecord?.href, manifest.origin);
        if (!normalized) continue;
        const details = byPath.get(normalized) ?? {
          sourceIds: new Set(),
          observations: [],
        };
        details.sourceIds.add(source.id);
        details.observations.push({
          sourceId: source.id,
          stateId: capture.stateId,
          href: hrefRecord.href,
          label: hrefRecord.label ?? null,
        });
        byPath.set(normalized, details);
      }
    }
  }
  return byPath;
}

export function compareRouteDiscovery(manifest, routeDeclarations) {
  const failures = validateRouteDiscoveryManifest(manifest);
  const discoveredByPath = collectDiscoveredRoutes(manifest ?? {});
  const discovered = [...discoveredByPath.keys()].sort();

  const declarations = Array.isArray(routeDeclarations) ? routeDeclarations : [];
  if (!Array.isArray(routeDeclarations)) {
    failures.push({
      code: "INVALID_ROUTE_DECLARATIONS",
      path: "routeDeclarations",
      message: "Route declarations must be an array.",
    });
  }
  const declaredPaths = [];
  for (const [index, declaration] of declarations.entries()) {
    const normalized = normalizePublicRoute(declaration?.path, manifest?.origin);
    if (
      !isRecord(declaration) ||
      !normalized ||
      !isNonEmptyString(declaration.family)
    ) {
      failures.push({
        code: "INVALID_ROUTE_DECLARATION",
        path: `routeDeclarations[${index}]`,
        message: "Every route declaration requires a valid path and family.",
      });
      continue;
    }
    declaredPaths.push(normalized);
  }
  const duplicateDeclarations = duplicateValues(declaredPaths).map(
    ({ value, count }) => ({ path: value, count }),
  );
  for (const duplicate of duplicateDeclarations) {
    failures.push({
      code: "DUPLICATE_ROUTE_DECLARATION",
      path: duplicate.path,
      count: duplicate.count,
      message: `${duplicate.path} is declared ${duplicate.count} times.`,
    });
  }

  const declaredSet = new Set(declaredPaths);
  const validExclusions = (manifest?.exclusions ?? [])
    .filter(
      (exclusion) =>
        isNonEmptyString(exclusion?.reason) &&
        isNonEmptyString(exclusion?.evidence) &&
        isNonEmptyString(exclusion?.approvedBy),
    )
    .map((exclusion) => normalizePublicRoute(exclusion.path, manifest.origin))
    .filter(Boolean);
  const exclusionSet = new Set(validExclusions);
  for (const excludedPath of exclusionSet) {
    if (!discoveredByPath.has(excludedPath)) {
      failures.push({
        code: "STALE_ROUTE_EXCLUSION",
        path: excludedPath,
        message: `${excludedPath} is excluded but was not discovered by any source.`,
      });
    }
  }

  const missingDeclarations = discovered.filter(
    (route) => !declaredSet.has(route) && !exclusionSet.has(route),
  );
  for (const route of missingDeclarations) {
    const details = discoveredByPath.get(route);
    failures.push({
      code: "UNDECLARED_DISCOVERED_ROUTE",
      path: route,
      sourceIds: [...details.sourceIds].sort(),
      observations: details.observations,
      message: `${route} was discovered but is absent from the route manifest.`,
    });
  }

  const declaredOnly = [...new Set(declaredPaths)]
    .filter((route) => !discoveredByPath.has(route))
    .sort();
  const excluded = discovered.filter((route) => exclusionSet.has(route));
  const accepted = failures.length === 0;

  return {
    schemaVersion: ROUTE_DISCOVERY_SCHEMA_VERSION,
    manifestId: manifest?.manifestId ?? null,
    status: accepted ? "accepted" : "rejected",
    accepted,
    discovered,
    declared: [...new Set(declaredPaths)].sort(),
    declaredOnly,
    excluded,
    missingDeclarations,
    duplicateDeclarations,
    failures,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

async function runCli() {
  const discoveryPath = option("discovery");
  if (!discoveryPath) {
    throw new Error("Usage: route-discovery.mjs --discovery=<json> [--routes=<json>]");
  }
  const discovery = await readJson(discoveryPath);
  const routesPath = option("routes");
  const routeData = routesPath
    ? await readJson(routesPath)
    : (await import("./route-manifest.mjs")).routeManifest;
  const routes = Array.isArray(routeData) ? routeData : routeData.routeManifest;
  const result = compareRouteDiscovery(discovery, routes);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.accepted ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
