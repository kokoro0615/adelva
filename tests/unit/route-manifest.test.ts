import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import {
  renderedRoutes,
  routeManifest,
  routeRedirects,
} from "../../src/content/route-manifest";

// The fidelity manifest is intentionally JavaScript: it is the executable
// authority used by the browser capture scripts, not application source.
// @ts-expect-error The untyped .mjs authority has no declaration file by design.
import { routeManifest as fidelityRouteManifest } from "../../scripts/fidelity/route-manifest.mjs";

type FidelityRoute = Readonly<{ path: string; family: string }>;

const fidelityRoutes = fidelityRouteManifest as readonly FidelityRoute[];

describe("route manifest authority", () => {
  it("keeps application paths and families aligned with the fidelity manifest", () => {
    expect(routeManifest).toEqual(fidelityRoutes);
  });

  it("keeps the observed Antarctica redirect and rendered-route count", async () => {
    const nonRedirectRoutes = fidelityRoutes.filter(
      (route) => route.family !== "region-index-redirect",
    );

    expect(routeRedirects).toEqual([
      {
        from: "/antarctica",
        to: "/antarctica/wolfs-fang-runway-mountains",
      },
    ]);
    await expect(nextConfig.redirects?.()).resolves.toEqual([
      {
        source: routeRedirects[0].from,
        destination: routeRedirects[0].to,
        permanent: false,
      },
    ]);
    expect(renderedRoutes).toEqual(nonRedirectRoutes);
    expect(renderedRoutes).toHaveLength(nonRedirectRoutes.length);
    expect(nonRedirectRoutes).not.toContainEqual(
      expect.objectContaining({ family: "region-index-redirect" }),
    );
  });
});
