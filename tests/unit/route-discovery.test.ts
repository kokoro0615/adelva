import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error The fidelity tooling is intentionally executable JavaScript.
import * as routeDiscoveryTool from "../../scripts/fidelity/route-discovery.mjs";
// @ts-expect-error The fidelity route authority is executable JavaScript.
import { routeManifest } from "../../scripts/fidelity/route-manifest.mjs";

const { compareRouteDiscovery, validateRouteDiscoveryManifest } = routeDiscoveryTool;

type Capture = {
  stateId: string;
  hrefs: Array<{ href: string; label?: string }>;
};

function source(
  id: string,
  kind: "navigation" | "footer" | "sitemap",
  captures: Capture[],
) {
  return {
    id,
    kind,
    viewport: kind === "sitemap" ? null : "desktop",
    status: "complete",
    requiredStateIds: captures.map((capture) => capture.stateId),
    captures: captures.map((capture) => ({
      ...capture,
      url:
        kind === "sitemap"
          ? "https://example.test/sitemap.xml"
          : "https://example.test/",
      observedAt: "2026-08-31T00:00:00.000Z",
      statusCode: 200,
      selector: kind === "sitemap" ? "urlset loc" : `${kind} a[href]`,
    })),
  };
}

function discoveryManifest() {
  return {
    schemaVersion: "public-route-discovery/v1",
    manifestId: "example-public-routes",
    origin: "https://example.test",
    hrefPolicy: "all-same-origin-http-hrefs",
    requiredSourceKinds: ["navigation", "footer", "sitemap"],
    requiredSourceIds: ["desktop-navigation", "desktop-footer", "sitemap"],
    sources: [
      source("desktop-navigation", "navigation", [
        {
          stateId: "initial",
          hrefs: [{ href: "/", label: "Home" }],
        },
        {
          stateId: "operation-open",
          hrefs: [
            { href: "/", label: "Home" },
            { href: "/aviation", label: "Aviation" },
          ],
        },
      ]),
      source("desktop-footer", "footer", [
        {
          stateId: "default",
          hrefs: [
            { href: "/", label: "Home" },
            { href: "https://example.test/aviation/", label: "Aviation" },
          ],
        },
      ]),
      source("sitemap", "sitemap", [
        {
          stateId: "document",
          hrefs: [{ href: "https://example.test/" }],
        },
      ]),
    ],
    exclusions: [],
  };
}

describe("public route discovery completeness gate", () => {
  it("unions nav, footer, and sitemap discoveries so one incomplete snapshot cannot hide a public route", () => {
    const result = compareRouteDiscovery(discoveryManifest(), [
      { path: "/", family: "home" },
    ]);

    expect(result.discovered).toEqual(["/", "/aviation"]);
    expect(result.missingDeclarations).toEqual(["/aviation"]);
    expect(result.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "UNDECLARED_DISCOVERED_ROUTE",
          path: "/aviation",
          sourceIds: ["desktop-footer", "desktop-navigation"],
        }),
      ]),
    );
    expect(result.accepted).toBe(false);
  });

  it("fails when a mandatory nav/footer/sitemap source kind is absent", () => {
    const manifest = discoveryManifest();
    manifest.sources = manifest.sources.filter((entry) => entry.kind !== "footer");

    const failures = validateRouteDiscoveryManifest(manifest);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_DISCOVERY_SOURCE_KIND",
          kind: "footer",
        }),
        expect.objectContaining({
          code: "MISSING_DISCOVERY_SOURCE",
          sourceId: "desktop-footer",
        }),
      ]),
    );
  });

  it("fails a multi-state navigation source when a reviewed state was not captured", () => {
    const manifest = discoveryManifest();
    const navigation = manifest.sources.find(
      (entry) => entry.id === "desktop-navigation",
    );
    navigation!.requiredStateIds.push("about-open");

    const failures = validateRouteDiscoveryManifest(manifest);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_DISCOVERY_STATE",
          sourceId: "desktop-navigation",
          stateId: "about-open",
        }),
      ]),
    );
  });

  it("rejects an incomplete required source even if its partial hrefs look plausible", () => {
    const manifest = discoveryManifest();
    const navigation = manifest.sources.find(
      (entry) => entry.id === "desktop-navigation",
    );
    navigation!.status = "incomplete";

    const failures = validateRouteDiscoveryManifest(manifest);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "INCOMPLETE_DISCOVERY_SOURCE_KIND",
          kind: "navigation",
        }),
        expect.objectContaining({
          code: "INCOMPLETE_DISCOVERY_SOURCE",
          sourceId: "desktop-navigation",
        }),
      ]),
    );
  });

  it("rejects unexplained exclusions instead of silently dropping a discovered route", () => {
    const manifest = discoveryManifest();
    manifest.exclusions = [{ path: "/aviation" }] as never[];

    const failures = validateRouteDiscoveryManifest(manifest);

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "UNEXPLAINED_ROUTE_EXCLUSION",
          path: "/aviation",
        }),
      ]),
    );
  });

  it("honors only an explicit, evidenced, approved exclusion", () => {
    const manifest = discoveryManifest();
    manifest.exclusions = [
      {
        path: "/aviation",
        reason: "The human-approved clone scope explicitly excludes this route.",
        evidence: "scope-record#aviation-exclusion",
        approvedBy: "named-human-approver",
      },
    ] as never[];

    const result = compareRouteDiscovery(manifest, [{ path: "/", family: "home" }]);

    expect(result.excluded).toEqual(["/aviation"]);
    expect(result.missingDeclarations).toEqual([]);
    expect(result.accepted).toBe(true);
  });

  it("reports duplicate declared paths instead of collapsing the route authority", () => {
    const result = compareRouteDiscovery(discoveryManifest(), [
      { path: "/", family: "home" },
      { path: "/", family: "duplicate-home" },
      { path: "/aviation", family: "aviation" },
    ]);

    expect(result.duplicateDeclarations).toEqual([{ path: "/", count: 2 }]);
    expect(result.accepted).toBe(false);
  });

  it("locks the reviewed White Desert source union and the Aviation regression", async () => {
    const targetDiscovery = JSON.parse(
      await readFile(
        path.join(
          process.cwd(),
          "scripts/fidelity/manifests/white-desert-route-discovery-v1.json",
        ),
        "utf8",
      ),
    );
    const legacySitemapSizedAuthority = routeManifest.filter(
      (route: { path: string }) =>
        route.path !== "/antarctica/direct-flights-to-antarctica",
    );

    const legacyResult = compareRouteDiscovery(
      targetDiscovery,
      legacySitemapSizedAuthority,
    );
    const currentResult = compareRouteDiscovery(targetDiscovery, routeManifest);

    expect(validateRouteDiscoveryManifest(targetDiscovery)).toEqual([]);
    expect(legacyResult.missingDeclarations).toEqual([
      "/antarctica/direct-flights-to-antarctica",
    ]);
    expect(legacyResult.failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "UNDECLARED_DISCOVERED_ROUTE",
          sourceIds: ["desktop-footer", "desktop-navigation"],
        }),
      ]),
    );
    expect(currentResult).toEqual(
      expect.objectContaining({
        accepted: true,
        missingDeclarations: [],
      }),
    );
  });

  it("exits nonzero when the CLI finds a discovered route missing from the declaration", async () => {
    const temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "route-discovery-gate-"),
    );
    try {
      const discoveryPath = path.join(temporaryDirectory, "discovery.json");
      const routesPath = path.join(temporaryDirectory, "routes.json");
      await writeFile(
        discoveryPath,
        `${JSON.stringify(discoveryManifest(), null, 2)}\n`,
      );
      await writeFile(
        routesPath,
        `${JSON.stringify([{ path: "/", family: "home" }], null, 2)}\n`,
      );

      const result = spawnSync(
        process.execPath,
        [
          "scripts/fidelity/route-discovery.mjs",
          `--discovery=${discoveryPath}`,
          `--routes=${routesPath}`,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      );

      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toEqual(
        expect.objectContaining({
          accepted: false,
          missingDeclarations: ["/aviation"],
        }),
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
