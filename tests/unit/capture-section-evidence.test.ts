// @vitest-environment node

import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

// @ts-expect-error The fidelity tooling is intentionally executable JavaScript.
import * as captureTool from "../../scripts/fidelity/capture-section-evidence.mjs";
// @ts-expect-error The route authority is intentionally executable JavaScript.
import { routeManifest } from "../../scripts/fidelity/route-manifest.mjs";
// @ts-expect-error The validator is intentionally executable JavaScript.
import { validateSectionManifest } from "../../scripts/fidelity/section-manifest.mjs";

const {
  captureModes,
  captureSectionEvidence,
  motionIdBase,
  motionIsComplete,
  motionPhasePlan,
  parseCaptureSectionArguments,
  sectionIdFromDescriptor,
  validateCaptureSectionOptions,
} = captureTool;

const root = process.cwd();
const planPath = path.join(
  root,
  "scripts/fidelity/manifests/full-page-gate-plan-v1.json",
);
const manifestDirectory = path.join(root, "scripts/fidelity/manifests/section-gate");

type Listener = (...args: unknown[]) => void;

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function createFakeBrowser({ emitDiagnostics = false } = {}) {
  const contextOptions: Record<string, unknown>[] = [];

  const createPage = () => {
    const listeners = new Map<string, Listener[]>();
    let currentUrl = "about:blank";
    const emit = (event: string, ...args: unknown[]) => {
      for (const listener of listeners.get(event) ?? []) listener(...args);
    };
    const childLocator = {
      evaluateAll: async (callback: unknown) => {
        void callback;
        return [];
      },
      elementHandles: async () => [],
    };
    const rootLocator = {
      first: () => rootLocator,
      count: async () => 1,
      elementHandle: async () => ({ dispose: async () => undefined }),
      locator: (selector: string) => {
        void selector;
        return childLocator;
      },
    };

    return {
      on(event: string, listener: Listener) {
        listeners.set(event, [...(listeners.get(event) ?? []), listener]);
      },
      async goto(url: string) {
        currentUrl = url;
        if (emitDiagnostics) {
          emit("console", {
            type: () => "error",
            text: () => "reference console diagnostic",
          });
          emit("pageerror", new Error("reference page diagnostic"));
        }
        return { status: () => 200 };
      },
      async waitForLoadState() {
        return undefined;
      },
      async waitForFunction() {
        return undefined;
      },
      async waitForTimeout() {
        return undefined;
      },
      async addStyleTag() {
        return undefined;
      },
      async evaluate(callback: unknown) {
        const source = String(callback);
        if (source.includes("mutationCount")) {
          return { ready: true, stable: true };
        }
        if (source.includes("Math.max(document.documentElement.scrollHeight")) {
          return 1200;
        }
        if (source.includes("const candidates = [")) return [];
        return undefined;
      },
      locator: (selector: string) => {
        void selector;
        return rootLocator;
      },
      async screenshot({ path: outputPath }: { path: string }) {
        await writeFile(outputPath, onePixelPng);
      },
      url: () => currentUrl,
      async close() {
        return undefined;
      },
    };
  };

  return {
    contextOptions,
    browser: {
      newContext: async (options: Record<string, unknown>) => {
        contextOptions.push(options);
        return {
          addCookies: async () => undefined,
          newPage: async () => createPage(),
          close: async () => undefined,
        };
      },
    },
  };
}

async function makeCaptureDirectories() {
  const directory = await mkdtemp(path.join(tmpdir(), "clonetest-section-evidence-"));
  return {
    directory,
    manifestDir: path.join(directory, "manifests"),
    artifactRoot: path.join(directory, "artifacts"),
  };
}

describe("full-page section evidence capture contract", () => {
  it("accepts only the declared capture modes and validates route options", () => {
    expect([...captureModes]).toEqual(["capture", "manifest-only"]);
    expect(
      parseCaptureSectionArguments([
        "--role=implementation",
        "--base-url",
        "http://127.0.0.1:4517",
        "--mode=manifest-only",
        "--route=/prices",
        "--viewport=mobile",
      ]),
    ).toEqual({
      role: "implementation",
      "base-url": "http://127.0.0.1:4517",
      mode: "manifest-only",
      route: "/prices",
      viewport: "mobile",
    });

    expect(
      validateCaptureSectionOptions({
        role: "reference",
        baseUrl: "https://white-desert.com",
        mode: "manifest-only",
        route: "/",
        viewport: "desktop",
      }),
    ).toMatchObject({
      role: "reference",
      mode: "manifest-only",
      motion: "reduce",
      route: "/",
      viewport: "desktop",
    });
    expect(
      validateCaptureSectionOptions({
        role: "reference",
        baseUrl: "https://white-desert.com",
        mode: "manifest-only",
        motion: "no-preference",
        route: "/",
        viewport: "desktop",
      }),
    ).toMatchObject({ motion: "no-preference" });
    expect(() =>
      validateCaptureSectionOptions({
        role: "reference",
        baseUrl: "https://white-desert.com",
        route: "/unknown",
      }),
    ).toThrow("Unknown route");
    expect(() =>
      validateCaptureSectionOptions({
        role: "reference",
        baseUrl: "https://white-desert.com",
        mode: "not-a-mode",
      }),
    ).toThrow("--mode");
  });

  it("keeps semantic section IDs stable and disambiguates repeated descriptors", () => {
    const used = new Set<string>();
    expect(
      sectionIdFromDescriptor(
        { fidelitySection: "Our Trips", className: "ignored", tagName: "section" },
        0,
        used,
      ),
    ).toBe("our-trips");
    expect(
      sectionIdFromDescriptor(
        { fidelitySection: "Our Trips", className: "ignored", tagName: "section" },
        1,
        used,
      ),
    ).toBe("our-trips-2");
    expect(
      sectionIdFromDescriptor({ className: "gallery-slider", tagName: "div" }, 2, used),
    ).toBe("gallery");
  });

  it("treats an empty captured motion inventory as complete", () => {
    const evidenceByViewport = [
      {
        viewport: "desktop",
        evidence: { fullPage: { path: "actual/full-page.png" } },
      },
    ];

    expect(motionIsComplete("capture", [], evidenceByViewport)).toBe(true);
    expect(motionIsComplete("manifest-only", [], evidenceByViewport)).toBe(false);
  });

  it("normalizes the target and implementation founder signatures to one motion layer", () => {
    expect(
      motionIdBase({
        explicitId: null,
        speed: null,
        className: "scribble-el home-quote_svg",
        index: 4,
      }),
    ).toBe("founder-signature");
    expect(
      motionIdBase({
        explicitId: "founder-signature",
        speed: null,
        className: "founder__signature",
        index: 4,
      }),
    ).toBe("founder-signature");
  });

  it("samples the founder signature around its own top-75-percent trigger", () => {
    expect(
      motionPhasePlan({
        layer: {
          id: "founder-signature",
          captureProfile: "discrete-draw",
          triggerDocumentY: 5560.5,
        },
        section: { bounds: { desktop: { y: 5240.5, height: 955.9 } } },
        viewport: { name: "desktop", width: 1440, height: 900 },
        maxScroll: 19_882,
      }),
    ).toEqual([
      { phase: "start", scrollY: 4883.5, waitMs: 80 },
      { phase: "mid", scrollY: 4887.5, waitMs: 600 },
      { phase: "end", scrollY: 4887.5, waitMs: 700 },
      { phase: "reverse", scrollY: 4883.5, waitMs: 1_300 },
    ]);
  });

  it("propagates motion preference, isolates artifacts, and records reference diagnostics", async () => {
    const directories = await makeCaptureDirectories();
    try {
      const reference = createFakeBrowser({ emitDiagnostics: true });
      const result = await captureSectionEvidence({
        role: "reference",
        baseUrl: "https://white-desert.com",
        mode: "manifest-only",
        motion: "no-preference",
        route: "/",
        viewport: "mobile",
        manifestDir: directories.manifestDir,
        artifactRoot: directories.artifactRoot,
        includeShell: false,
        browser: reference.browser,
      });

      expect(reference.contextOptions).toHaveLength(1);
      expect(reference.contextOptions[0]).toMatchObject({
        reducedMotion: "no-preference",
      });
      expect(result.routes[0].manifest.source).toMatchObject({
        motionPreference: "no-preference",
        diagnostics: [
          "console: reference console diagnostic",
          "pageerror: reference page diagnostic",
        ],
      });
      expect(result.routes[0].manifest.motion.status).toBe("incomplete");
    } finally {
      await rm(directories.directory, { recursive: true, force: true });
    }
  });

  it("keeps captured static evidence complete and separates both motion artifact trees", async () => {
    const directories = await makeCaptureDirectories();
    try {
      const reduce = await captureSectionEvidence({
        role: "implementation",
        baseUrl: "http://127.0.0.1:4517",
        mode: "capture",
        motion: "reduce",
        route: "/",
        viewport: "mobile",
        manifestDir: directories.manifestDir,
        artifactRoot: directories.artifactRoot,
        includeShell: false,
        browser: createFakeBrowser().browser,
      });
      const noPreference = await captureSectionEvidence({
        role: "implementation",
        baseUrl: "http://127.0.0.1:4517",
        mode: "capture",
        motion: "no-preference",
        route: "/",
        viewport: "mobile",
        manifestDir: directories.manifestDir,
        artifactRoot: directories.artifactRoot,
        includeShell: false,
        browser: createFakeBrowser().browser,
      });

      const reduceEvidence = reduce.routes[0].manifest.viewports.mobile.evidence;
      const noPreferenceEvidence =
        noPreference.routes[0].manifest.viewports.mobile.evidence;
      expect(reduce.routes[0].manifest.motion.status).toBe("complete");
      expect(noPreference.routes[0].manifest.motion.status).toBe("complete");
      expect(reduce.routes[0].manifest.source.motionPreference).toBe("reduce");
      expect(noPreference.routes[0].manifest.source.motionPreference).toBe(
        "no-preference",
      );
      expect(reduceEvidence.fullPage.path).not.toBe(noPreferenceEvidence.fullPage.path);
      expect(reduceEvidence.fullPage.path).toContain("/reduce/");
      expect(noPreferenceEvidence.fullPage.path).toContain("/no-preference/");
      expect(
        existsSync(path.resolve(directories.manifestDir, reduceEvidence.fullPage.path)),
      ).toBe(true);
      expect(
        existsSync(
          path.resolve(directories.manifestDir, noPreferenceEvidence.fullPage.path),
        ),
      ).toBe(true);
    } finally {
      await rm(directories.directory, { recursive: true, force: true });
    }
  });

  it("fails implementation capture when the browser emits diagnostics", async () => {
    const directories = await makeCaptureDirectories();
    try {
      await expect(
        captureSectionEvidence({
          role: "implementation",
          baseUrl: "http://127.0.0.1:4517",
          mode: "manifest-only",
          motion: "reduce",
          route: "/",
          viewport: "mobile",
          manifestDir: directories.manifestDir,
          artifactRoot: directories.artifactRoot,
          includeShell: false,
          browser: createFakeBrowser({ emitDiagnostics: true }).browser,
        }),
      ).rejects.toThrow("implementation / emitted browser errors");
    } finally {
      await rm(directories.directory, { recursive: true, force: true });
    }
  });

  it("declares exactly one comparison for every route authority path plus one shell", async () => {
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    const routeComparisons = plan.comparisons.filter(
      (comparison: { scopeKind: string }) => comparison.scopeKind === "route-content",
    );
    const shellComparisons = plan.comparisons.filter(
      (comparison: { scopeKind: string }) => comparison.scopeKind === "global-shell",
    );

    expect(routeComparisons).toHaveLength(routeManifest.length);
    expect(routeManifest).toHaveLength(30);
    expect(
      routeComparisons.map((comparison: { route: string }) => comparison.route),
    ).toEqual(routeManifest.map((route: { path: string }) => route.path));
    expect(shellComparisons).toHaveLength(1);
    expect(plan.comparisons).toHaveLength(31);

    for (const comparison of plan.comparisons) {
      expect(
        existsSync(path.resolve(path.dirname(planPath), comparison.reference)),
      ).toBe(true);
      expect(
        existsSync(path.resolve(path.dirname(planPath), comparison.implementation)),
      ).toBe(true);
    }
  });

  it("keeps generated manifests structurally valid and makes pending evidence explicit", async () => {
    const files = (await readdir(manifestDirectory))
      .filter((file) => file.endsWith(".json"))
      .sort();
    const manifests = await Promise.all(
      files.map(async (file) => ({
        file,
        value: JSON.parse(await readFile(path.join(manifestDirectory, file), "utf8")),
      })),
    );

    expect(manifests).toHaveLength(62);
    expect(manifests.filter(({ value }) => value.role === "reference")).toHaveLength(
      31,
    );
    expect(
      manifests.filter(({ value }) => value.role === "implementation"),
    ).toHaveLength(31);

    for (const { file, value } of manifests) {
      expect(validateSectionManifest(value), file).toEqual([]);
      expect(value.requiredViewports).toEqual(["desktop", "tablet", "mobile"]);
      expect(value.motion.status).toMatch(/^(complete|incomplete)$/);
      for (const viewport of value.requiredViewports) {
        const evidence = value.viewports[viewport].evidence;
        expect(evidence.top === null || typeof evidence.top.path).toBeTruthy();
        if (value.source.captureMode === "manifest-only") {
          // Measurement mode cannot claim pixels that were not written.
          expect(evidence.fullPage).toBeNull();
          expect(evidence.sectionCaptures).toEqual([]);
          expect(evidence.checkpoints).toEqual([]);
          expect(evidence.motionCaptures).toEqual([]);
          expect(value.motion.status).toBe("incomplete");
        } else {
          expect(evidence.fullPage?.path).toEqual(expect.any(String));
          expect(evidence.sectionCaptures.length).toBeGreaterThan(0);
          expect(evidence.checkpoints.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("makes the gate fail on missing full-page evidence instead of treating top captures as passing", () => {
    const result = spawnSync(
      process.execPath,
      [
        "scripts/fidelity/section-manifest.mjs",
        `--plan=${path.relative(root, planPath)}`,
      ],
      {
        cwd: root,
        encoding: "utf8",
        // The 31-comparison diagnostic is intentionally detailed and is
        // currently about 2.9 MB. Node's 1 MiB spawnSync default truncates the
        // otherwise valid JSON and turns this contract test into a parser
        // failure before it can inspect the gate result.
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    const output = JSON.parse(result.stdout);
    expect(result.status).not.toBe(0);
    expect(output.comparisonCount).toBe(31);
    expect(output.routeAuthorityCount).toBe(30);
    expect(output.planFailures).toEqual([]);
    expect(
      output.comparisons.some(
        (comparison: { result: { evidenceFailures?: { code: string }[] } }) =>
          comparison.result.evidenceFailures?.some(
            ({ code }) => code === "MISSING_FULL_PAGE_CAPTURE",
          ),
      ),
    ).toBe(true);
  });
});
