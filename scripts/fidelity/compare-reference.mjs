import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { routeManifest, routeSlug, viewports } from "./route-manifest.mjs";

export const DEFAULT_REFERENCE_ROOT = "artifacts/reference/target";
export const DEFAULT_ACTUAL_ROOT = "artifacts/reference/actual";
export const DEFAULT_OUTPUT_ROOT = "artifacts/fidelity";
export const DIAGNOSTIC_METRICS_NOTE =
  "Acceptance is decided by the predeclared measured-spec landmarks and discrepancy ledger; global photo-heavy pixel metrics are diagnostic.";

const allowedOptions = new Set([
  "actual",
  "batch",
  "help",
  "label",
  "out",
  "reference",
]);
const safeLabelPattern = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

export function parseArguments(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    }
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const token = argument.slice(2);
    const separator = token.indexOf("=");
    const key = separator === -1 ? token : token.slice(0, separator);
    if (!allowedOptions.has(key)) {
      throw new Error(`Unknown option: --${key}.`);
    }
    if (Object.hasOwn(args, key)) {
      throw new Error(`Duplicate option: --${key}.`);
    }

    if (separator !== -1) {
      args[key] = token.slice(separator + 1);
      continue;
    }

    const nextArgument = argv[index + 1];
    if (nextArgument && !nextArgument.startsWith("--")) {
      args[key] = nextArgument;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function requireString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Missing --${name}=<value>.`);
  }
  return value;
}

function resolvePath(value, name, cwd = process.cwd()) {
  return path.resolve(cwd, requireString(value, name));
}

export function assertSafeLabel(label) {
  if (typeof label !== "string" || !safeLabelPattern.test(label)) {
    throw new Error(
      "Invalid --label: use a filename-safe label containing letters, numbers, dots, hyphens, or underscores.",
    );
  }
  return label;
}

function resolveWithin(root, filename) {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, filename);
  const relative = path.relative(resolvedRoot, candidate);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Refusing a path outside the configured root: ${filename}.`);
  }
  return candidate;
}

export function buildBatchPairs({
  referenceRoot = DEFAULT_REFERENCE_ROOT,
  actualRoot = DEFAULT_ACTUAL_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  cwd = process.cwd(),
} = {}) {
  const resolvedReferenceRoot = resolvePath(referenceRoot, "reference", cwd);
  const resolvedActualRoot = resolvePath(actualRoot, "actual", cwd);
  const resolvedOutputRoot = resolvePath(outputRoot, "out", cwd);

  return routeManifest.flatMap((route) =>
    viewports.map((viewport) => {
      const stem = routeSlug(route.path);
      const captureFilename = `${stem}-${viewport.width}x${viewport.height}-top.png`;
      const label = `${stem}--default--${viewport.name}`;
      assertSafeLabel(label);

      return {
        route: route.path,
        family: route.family,
        viewport,
        filename: captureFilename,
        label,
        referencePath: resolveWithin(resolvedReferenceRoot, captureFilename),
        actualPath: resolveWithin(resolvedActualRoot, captureFilename),
        outputRoot: resolvedOutputRoot,
      };
    }),
  );
}

async function isRegularFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function inspectInputRoot(root, filenames) {
  let rootIssue = null;
  try {
    if (!(await stat(root)).isDirectory()) {
      rootIssue = "not a directory";
    }
  } catch {
    rootIssue = "not found";
  }

  if (rootIssue) {
    return { rootIssue, missing: filenames };
  }

  const missing = (
    await Promise.all(
      filenames.map(async (filename) =>
        (await isRegularFile(path.join(root, filename))) ? null : filename,
      ),
    )
  ).filter(Boolean);

  return { rootIssue: null, missing };
}

function formatMissingNames(names) {
  const shown = names.slice(0, 3);
  const suffix =
    names.length > shown.length ? `; ${names.length - shown.length} more` : "";
  return `${shown.join(", ")}${suffix}`;
}

export async function validateBatchInputs(pairs) {
  const filenames = pairs.map(({ filename }) => filename);
  const referenceRoot = path.dirname(pairs[0]?.referencePath ?? "");
  const actualRoot = path.dirname(pairs[0]?.actualPath ?? "");
  const [references, actuals] = await Promise.all([
    inspectInputRoot(referenceRoot, filenames),
    inspectInputRoot(actualRoot, filenames),
  ]);

  if (references.missing.length === 0 && actuals.missing.length === 0) {
    return;
  }

  const lines = ["Missing fidelity inputs; no comparisons were started."];
  if (references.rootIssue) {
    lines.push(
      `- references: ${referenceRoot} (${references.rootIssue}; ${filenames.length} expected files)`,
    );
  } else if (references.missing.length > 0) {
    lines.push(
      `- references: ${references.missing.length}/${filenames.length} missing (${formatMissingNames(references.missing)})`,
    );
  }
  if (actuals.rootIssue) {
    lines.push(
      `- actuals: ${actualRoot} (${actuals.rootIssue}; ${filenames.length} expected files)`,
    );
  } else if (actuals.missing.length > 0) {
    lines.push(
      `- actuals: ${actuals.missing.length}/${filenames.length} missing (${formatMissingNames(actuals.missing)})`,
    );
  }

  throw new Error(lines.join("\n"));
}

export async function validateSingleInputs({ referencePath, actualPath }) {
  const missing = [];
  if (!(await isRegularFile(referencePath)))
    missing.push(`reference: ${referencePath}`);
  if (!(await isRegularFile(actualPath))) missing.push(`actual: ${actualPath}`);
  if (missing.length > 0) {
    throw new Error(
      `Missing fidelity input(s); comparison was not started.\n- ${missing.join("\n- ")}`,
    );
  }
}

export async function compareImagePair({
  referencePath,
  actualPath,
  label = "comparison",
  outputRoot = DEFAULT_OUTPUT_ROOT,
  cwd = process.cwd(),
}) {
  const safeLabel = assertSafeLabel(label);
  const resolvedReferencePath = resolvePath(referencePath, "reference", cwd);
  const resolvedActualPath = resolvePath(actualPath, "actual", cwd);
  const resolvedOutputRoot = resolvePath(outputRoot, "out", cwd);

  const reference = await sharp(resolvedReferencePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const actual = await sharp(resolvedActualPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (
    reference.info.width !== actual.info.width ||
    reference.info.height !== actual.info.height
  ) {
    throw new Error(
      `Reference and implementation capture dimensions differ: ${reference.info.width}x${reference.info.height} vs ${actual.info.width}x${actual.info.height}.`,
    );
  }

  const pixelCount = reference.info.width * reference.info.height;
  const channelCount = 3;
  const difference = Buffer.alloc(pixelCount * 4);
  let absoluteTotal = 0;
  let squaredTotal = 0;
  let changedPixels = 0;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    let pixelChanged = false;
    for (let channel = 0; channel < channelCount; channel += 1) {
      const offset = pixel * 4 + channel;
      const delta = Math.abs(reference.data[offset] - actual.data[offset]);
      absoluteTotal += delta;
      squaredTotal += delta * delta;
      pixelChanged ||= delta > 8;
      difference[offset] = Math.min(255, delta * 4);
    }
    difference[pixel * 4 + 3] = 255;
    if (pixelChanged) changedPixels += 1;
  }

  const metrics = {
    label: safeLabel,
    referencePath: resolvedReferencePath,
    actualPath: resolvedActualPath,
    width: reference.info.width,
    height: reference.info.height,
    normalizedRgbMae: absoluteTotal / (pixelCount * channelCount * 255),
    normalizedRgbRmse: Math.sqrt(squaredTotal / (pixelCount * channelCount)) / 255,
    changedPixelRatio: changedPixels / pixelCount,
    status: "diagnostic",
    note: DIAGNOSTIC_METRICS_NOTE,
  };

  const outputPaths = {
    overlay: resolveWithin(resolvedOutputRoot, `${safeLabel}-overlay.png`),
    difference: resolveWithin(resolvedOutputRoot, `${safeLabel}-difference.png`),
    sideBySide: resolveWithin(resolvedOutputRoot, `${safeLabel}-side-by-side.png`),
    metrics: resolveWithin(resolvedOutputRoot, `${safeLabel}-metrics.json`),
  };

  await mkdir(resolvedOutputRoot, { recursive: true });
  const referencePng = await sharp(resolvedReferencePath).png().toBuffer();
  const actualPng = await sharp(resolvedActualPath).png().toBuffer();
  await sharp(referencePng)
    .composite([{ input: actualPng, blend: "over", opacity: 0.5 }])
    .png()
    .toFile(outputPaths.overlay);
  await sharp(difference, {
    raw: {
      width: reference.info.width,
      height: reference.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outputPaths.difference);
  await sharp({
    create: {
      width: reference.info.width * 2,
      height: reference.info.height,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      { input: referencePng, left: 0, top: 0 },
      { input: actualPng, left: reference.info.width, top: 0 },
    ])
    .png()
    .toFile(outputPaths.sideBySide);
  await writeFile(outputPaths.metrics, `${JSON.stringify(metrics, null, 2)}\n`);

  return metrics;
}

export async function runBatch({
  referenceRoot = DEFAULT_REFERENCE_ROOT,
  actualRoot = DEFAULT_ACTUAL_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  cwd = process.cwd(),
} = {}) {
  const pairs = buildBatchPairs({
    referenceRoot,
    actualRoot,
    outputRoot,
    cwd,
  });
  await validateBatchInputs(pairs);

  const metrics = [];
  for (const pair of pairs) {
    try {
      metrics.push(await compareImagePair({ ...pair, cwd }));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Comparison failed for ${pair.label}: ${reason}`);
    }
  }
  return metrics;
}

function isTrueFlag(value, name) {
  if (value === undefined) return false;
  if (value === true || value === "true") return true;
  throw new Error(`--${name} does not accept a value.`);
}

function usage() {
  return `Usage:
  node scripts/fidelity/compare-reference.mjs
  node scripts/fidelity/compare-reference.mjs --batch [--out=<path>]
  node scripts/fidelity/compare-reference.mjs --reference=<path> --actual=<path> [--label=<safe-label>] [--out=<path>]

With no pair paths, all route-manifest entries and named viewports are compared from the default reference/actual roots.`;
}

export async function runCli(
  argv = process.argv.slice(2),
  { cwd = process.cwd(), stdout = process.stdout } = {},
) {
  const args = parseArguments(argv);
  if (args.help !== undefined) {
    if (args.help !== true) throw new Error("--help does not accept a value.");
    stdout.write(`${usage()}\n`);
    return { mode: "help" };
  }

  const referenceProvided = args.reference !== undefined;
  const actualProvided = args.actual !== undefined;
  isTrueFlag(args.batch, "batch");

  if (referenceProvided || actualProvided) {
    if (!referenceProvided || !actualProvided) {
      throw new Error(
        "Single-pair mode requires both --reference=<path> and --actual=<path>.",
      );
    }

    const referencePath = resolvePath(args.reference, "reference", cwd);
    const actualPath = resolvePath(args.actual, "actual", cwd);
    await validateSingleInputs({ referencePath, actualPath });
    const metrics = await compareImagePair({
      referencePath,
      actualPath,
      label: args.label === undefined ? "comparison" : args.label,
      outputRoot: args.out === undefined ? DEFAULT_OUTPUT_ROOT : args.out,
      cwd,
    });
    stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
    return metrics;
  }

  if (args.label !== undefined) {
    throw new Error("--label requires --reference and --actual.");
  }

  const metrics = await runBatch({
    outputRoot: args.out === undefined ? DEFAULT_OUTPUT_ROOT : args.out,
    cwd,
  });
  stdout.write(
    `${JSON.stringify(
      {
        mode: "batch",
        pairCount: metrics.length,
        outputRoot: resolvePath(
          args.out === undefined ? DEFAULT_OUTPUT_ROOT : args.out,
          "out",
          cwd,
        ),
      },
      null,
      2,
    )}\n`,
  );
  return metrics;
}

const modulePath = fileURLToPath(import.meta.url);
const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === modulePath) {
  runCli().catch((error) => {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${reason}\n`);
    process.exitCode = 1;
  });
}
