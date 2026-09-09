import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import sharp from "sharp";

// @ts-expect-error The fidelity tooling is intentionally JavaScript.
import * as comparator from "../../scripts/fidelity/compare-reference.mjs";
// @ts-expect-error The executable route authority intentionally has no declaration.
import { routeManifest, viewports } from "../../scripts/fidelity/route-manifest.mjs";

const { buildBatchPairs, compareImagePair, DIAGNOSTIC_METRICS_NOTE } = comparator;

describe("reference fidelity comparator", () => {
  it("builds the top-state diagnostic matrix without treating it as full-page evidence", () => {
    const pairs = buildBatchPairs();

    expect(pairs).toHaveLength(routeManifest.length * viewports.length);
    expect(pairs).toHaveLength(90);
    expect(
      pairs.every(({ filename }: { filename: string }) =>
        filename.endsWith("-top.png"),
      ),
    ).toBe(true);
    expect(pairs[0]).toMatchObject({
      filename: "home-1440x900-top.png",
      label: "home--default--desktop",
    });
    expect(pairs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: "antarctica--direct-flights-to-antarctica-1440x900-top.png",
          label: "antarctica--direct-flights-to-antarctica--default--desktop",
        }),
        expect.objectContaining({
          filename: "antarctica--direct-flights-to-antarctica-390x844-top.png",
          label: "antarctica--direct-flights-to-antarctica--default--mobile",
        }),
      ]),
    );
    expect(pairs.at(-1)).toMatchObject({
      filename: "antarctica--fuel-depot-390x844-top.png",
      label: "antarctica--fuel-depot--default--mobile",
    });
  });

  it("writes all single-pair artifacts and preserves diagnostic status", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "fidelity-compare-"));
    try {
      const referencePath = path.join(workspace, "reference.png");
      const actualPath = path.join(workspace, "actual.png");
      const outputRoot = path.join(workspace, "fidelity");

      await sharp({
        create: {
          width: 2,
          height: 2,
          channels: 4,
          background: "#102030",
        },
      })
        .png()
        .toFile(referencePath);
      await sharp({
        create: {
          width: 2,
          height: 2,
          channels: 4,
          background: "#203040",
        },
      })
        .png()
        .toFile(actualPath);

      const metrics = await compareImagePair({
        referencePath,
        actualPath,
        label: "synthetic--desktop",
        outputRoot,
      });

      expect(metrics).toMatchObject({
        label: "synthetic--desktop",
        status: "diagnostic",
        note: DIAGNOSTIC_METRICS_NOTE,
        width: 2,
        height: 2,
      });
      await expect(readdir(outputRoot)).resolves.toEqual(
        expect.arrayContaining([
          "synthetic--desktop-overlay.png",
          "synthetic--desktop-difference.png",
          "synthetic--desktop-side-by-side.png",
          "synthetic--desktop-metrics.json",
        ]),
      );
      await expect(
        readFile(path.join(outputRoot, "synthetic--desktop-metrics.json"), "utf8"),
      ).resolves.toContain('"status": "diagnostic"');
      const overlay = await sharp(
        path.join(outputRoot, "synthetic--desktop-overlay.png"),
      )
        .removeAlpha()
        .raw()
        .toBuffer();
      // A real overlay must show both sources, rather than replacing reference.
      expect([...overlay.subarray(0, 3)]).toEqual([24, 40, 56]);
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
