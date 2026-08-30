import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

// The extraction wrapper is executable JavaScript and intentionally has no
// TypeScript declaration file.
// @ts-expect-error The untyped .mjs authority has no declaration file by design.
import { parseArguments } from "../../scripts/extraction/run-design-extract.mjs";

const wrapperPath = path.resolve(
  process.cwd(),
  "scripts/extraction/run-design-extract.mjs",
);

function runWrapper(args: string[]) {
  return spawnSync(process.execPath, [wrapperPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 5_000,
  });
}

describe("design-extract wrapper CLI", () => {
  it("prints help through the separator forwarded by pnpm", () => {
    const result = spawnSync("pnpm", ["extract:design", "--", "--help"], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 5_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "Usage: node scripts/extraction/run-design-extract.mjs",
    );
    expect(result.stderr).not.toContain("Usage error:");
    expect(result.stderr).not.toContain("Extraction error:");
  });

  it("prints help through repeated forwarded separators", () => {
    const result = runWrapper(["--", "--", "--help"]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "Usage: node scripts/extraction/run-design-extract.mjs",
    );
    expect(result.stderr).toBe("");
  });

  it("parses a normal extraction request with separators between complete arguments", () => {
    expect(
      parseArguments([
        "--",
        "https://white-desert.com",
        "--",
        "--mode",
        "core",
        "--",
        "--slug",
        "smoke",
        "--",
      ]),
    ).toEqual({
      help: false,
      targetUrl: "https://white-desert.com/",
      mode: "core",
      slug: "smoke",
    });
  });

  it("still rejects an unknown option after a forwarded separator", () => {
    const result = runWrapper(["--", "--verbose"]);
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain("Unknown option --verbose");
    expect(output).not.toContain("Missing design-extract submodule");
  });
});
