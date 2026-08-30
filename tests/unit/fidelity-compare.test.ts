import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import sharp from "sharp";

// @ts-expect-error The fidelity tooling is intentionally JavaScript.
import * as comparator from "../../scripts/fidelity/compare-reference.mjs";

const { buildBatchPairs, compareImagePair, DIAGNOSTIC_METRICS_NOTE } = comparator;

describe("reference fidelity comparator", () => {
  it("builds the complete route and viewport matrix", () => {
    const pairs = buildBatchPairs();

    expect(pairs).toHaveLength(87);
    expect(pairs[0]).toMatchObject({
      filename: "home-1440x900-top.png",
      label: "home--default--desktop",
    });
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
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
