import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

// The fidelity scripts are executable JavaScript authorities rather than
// application source and intentionally do not ship TypeScript declarations.
// @ts-expect-error The untyped .mjs authority has no declaration file by design.
import { parseCaptureOptions } from "../../scripts/fidelity/capture.mjs";
// @ts-expect-error The untyped .mjs authority has no declaration file by design.
import { routeManifest, viewports } from "../../scripts/fidelity/route-manifest.mjs";

const defaultOutputRoot = "/tmp/clonetest-capture-options";

describe("fidelity capture CLI options", () => {
  it("preserves the default route, viewport, motion, and target output selection", () => {
    expect(parseCaptureOptions([], { defaultOutputRoot })).toMatchObject({
      routes: routeManifest,
      viewports,
      motion: "reduce",
      outputRoot: defaultOutputRoot,
      outputRootWasExplicit: false,
      filters: { route: null, viewport: null },
    });
  });

  it("selects an exact route and named viewport", () => {
    const options = parseCaptureOptions(
      ["--route=/camps/echo-base", "--viewport=desktop"],
      { defaultOutputRoot },
    );

    expect(options.routes).toEqual([
      { path: "/camps/echo-base", family: "camp-detail" },
    ]);
    expect(options.viewports).toEqual([{ name: "desktop", width: 1440, height: 900 }]);
    expect(options.filters).toEqual({
      route: "/camps/echo-base",
      viewport: "desktop",
    });
  });

  it("accepts the standalone option separator forwarded by package scripts", () => {
    const options = parseCaptureOptions(
      ["--", "--route=/camps/echo-base", "--viewport=mobile"],
      { defaultOutputRoot },
    );

    expect(options.routes).toEqual([
      { path: "/camps/echo-base", family: "camp-detail" },
    ]);
    expect(options.viewports).toEqual([{ name: "mobile", width: 390, height: 844 }]);
  });

  it("preserves validation errors through the pnpm option separator", () => {
    const result = spawnSync(
      "pnpm",
      ["capture:reference", "--", "--route=/not-in-the-manifest", "--viewport=mobile"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("Unknown route: /not-in-the-manifest");
    expect(output).not.toContain("Unknown capture option: --");
  });

  it.each([
    ["positional input", ["--", "garbage"], /Unexpected positional argument/],
    [
      "duplicate options",
      ["--", "--route=/", "--route=/camps/echo-base"],
      /may only be supplied once/,
    ],
    ["unknown options", ["--", "--family=camp-detail"], /Unknown capture option/],
    ["empty values", ["--", "--route="], /requires a non-empty value/],
  ])("still rejects %s after a separator", (_label, argv, message) => {
    expect(() => parseCaptureOptions(argv, { defaultOutputRoot })).toThrow(message);
  });

  it.each([
    ["route", "--route=/not-in-the-manifest", /Unknown route/],
    ["viewport", "--viewport=wide", /Unknown viewport/],
    ["motion", "--motion=auto", /Unknown motion preference/],
    ["output traversal", "--out=../outside", /path traversal/],
    ["output root", "--out=/", /unsafe capture output root/],
  ])("rejects an unsafe or unknown %s", (_label, argument, message) => {
    expect(() => parseCaptureOptions([argument], { defaultOutputRoot })).toThrow(
      message,
    );
  });

  it("requires a dedicated output root for no-preference captures", () => {
    expect(() =>
      parseCaptureOptions(["--motion=no-preference"], {
        defaultOutputRoot,
      }),
    ).toThrow(/requires an explicit --out/);

    expect(
      parseCaptureOptions(
        ["--motion=no-preference", "--out=/tmp/clonetest-capture-options-motion"],
        { defaultOutputRoot },
      ),
    ).toMatchObject({
      motion: "no-preference",
      outputRoot: "/tmp/clonetest-capture-options-motion",
      outputRootWasExplicit: true,
    });
  });
});
