#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SUBMODULE_DIR = resolve(PROJECT_ROOT, "tools/design-extract");
const CLI_PATH = resolve(SUBMODULE_DIR, "bin/design-extract.js");
const OUTPUT_ROOT = resolve(PROJECT_ROOT, ".Codex/docs/research/design-extract");

export const PINNED_SHA = "f7c2bec6631bca0da6e8f1a0162d1917bbd46c0c";
export const EXPECTED_VERSION = "13.1.0";
export const ALLOWED_HOSTNAME = "white-desert.com";

const MODES = Object.freeze({
  core: Object.freeze({ timeoutMs: 90_000 }),
  responsive: Object.freeze({ timeoutMs: 150_000 }),
});

const CONFIG_FILES = Object.freeze([
  ".designlangrc",
  "designlang.config.json",
  ".designlangrc.json",
]);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9_-]{0,62})$/;
const DIAGNOSTIC_LIMIT = 4_000;

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

function usage() {
  return [
    "Usage: node scripts/extraction/run-design-extract.mjs <https://white-desert.com/...> [options]",
    "",
    "Options:",
    "  --slug <slug>       output slug (default: home-core/home-responsive)",
    "  --mode <mode>       core (90s) or responsive (150s; includes --responsive)",
    "  -h, --help          show this help",
    "",
    "The wrapper always enables --system-chrome --ignore-widgets --no-history --motion-runtime.",
  ].join("\n");
}

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new UsageError(`${option} requires a value.`);
  }
  return value;
}

function normalizeMode(mode) {
  const normalized = String(mode ?? "core")
    .trim()
    .toLowerCase();
  if (!Object.hasOwn(MODES, normalized)) {
    throw new UsageError(`Unsupported mode "${mode}". Choose core or responsive.`);
  }
  return normalized;
}

export function validateSlug(slug) {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!SLUG_RE.test(normalized)) {
    throw new UsageError(
      "Invalid output slug. Use 1-63 lowercase ASCII letters, numbers, hyphens, or underscores; the first character must be alphanumeric.",
    );
  }
  return normalized;
}

export function validateTargetUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
    throw new UsageError(
      "A target URL is required. Use a full https://white-desert.com URL.",
    );
  }

  let target;
  try {
    target = new URL(rawUrl.trim());
  } catch {
    throw new UsageError(
      `Invalid target URL ${JSON.stringify(rawUrl)}. Use a full https://white-desert.com URL.`,
    );
  }

  if (
    target.protocol !== "https:" ||
    target.hostname !== ALLOWED_HOSTNAME ||
    target.port !== "" ||
    target.username !== "" ||
    target.password !== ""
  ) {
    throw new UsageError(
      `Target URL rejected. Only https://${ALLOWED_HOSTNAME} (and paths on that exact hostname) are allowed; HTTP, file URLs, localhost/private hosts, non-default ports, and credentials are not permitted.`,
    );
  }

  return target.toString();
}

export function parseArguments(args) {
  const positionals = [];
  let slug;
  let mode;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "-h" || argument === "--help") {
      help = true;
      continue;
    }

    if (argument === "--") {
      continue;
    }

    if (argument === "--slug" || argument === "-s") {
      if (slug !== undefined) throw new UsageError("Specify --slug only once.");
      slug = optionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (argument.startsWith("--slug=")) {
      if (slug !== undefined) throw new UsageError("Specify --slug only once.");
      slug = argument.slice("--slug=".length);
      if (slug === "") throw new UsageError("--slug requires a value.");
      continue;
    }

    if (argument === "--mode" || argument === "-m") {
      if (mode !== undefined) throw new UsageError("Specify --mode only once.");
      mode = optionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (argument.startsWith("--mode=")) {
      if (mode !== undefined) throw new UsageError("Specify --mode only once.");
      mode = argument.slice("--mode=".length);
      if (mode === "") throw new UsageError("--mode requires a value.");
      continue;
    }

    if (argument.startsWith("-")) {
      throw new UsageError(
        `Unknown option ${argument}. Only --slug, --mode, and --help are accepted.`,
      );
    }

    positionals.push(argument);
  }

  if (help) return { help: true };
  if (positionals.length === 0) throw new UsageError("A target URL is required.");
  if (positionals.length > 3) throw new UsageError("Too many positional arguments.");

  const targetUrl = positionals[0];
  for (const positional of positionals.slice(1)) {
    const positionalMode = positional.trim().toLowerCase();
    if (mode === undefined && Object.hasOwn(MODES, positionalMode)) {
      mode = positionalMode;
    } else if (slug === undefined) {
      slug = positional;
    } else {
      throw new UsageError("Specify the optional slug and mode only once.");
    }
  }

  const normalizedMode = normalizeMode(mode);
  const normalizedSlug = validateSlug(
    slug ?? (normalizedMode === "responsive" ? "home-responsive" : "home-core"),
  );
  return {
    help: false,
    targetUrl: validateTargetUrl(targetUrl),
    mode: normalizedMode,
    slug: normalizedSlug,
  };
}

function gitCommand(args, timeoutMs = 5_000) {
  return spawnSync("git", ["-C", SUBMODULE_DIR, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    maxBuffer: 64 * 1024,
    windowsHide: true,
  });
}

export function verifyPinnedSubmodule() {
  if (!existsSync(SUBMODULE_DIR) || !existsSync(CLI_PATH)) {
    throw new Error(
      `Missing design-extract submodule or CLI at ${SUBMODULE_DIR}. Initialize the pinned submodule first.`,
    );
  }

  const headResult = gitCommand(["rev-parse", "HEAD"]);
  if (headResult.error) {
    throw new Error(
      `Could not read design-extract submodule HEAD: ${headResult.error.message}`,
    );
  }
  if (headResult.status !== 0) {
    throw new Error(
      `Could not read design-extract submodule HEAD: ${(headResult.stderr || "").trim() || "git failed"}`,
    );
  }

  const actualSha = headResult.stdout.trim();
  if (actualSha !== PINNED_SHA) {
    throw new Error(
      `design-extract submodule SHA mismatch: expected ${PINNED_SHA}, found ${actualSha || "(empty)"}. Check out the pinned commit before running.`,
    );
  }

  const statusResult = gitCommand([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  if (statusResult.error || statusResult.status !== 0) {
    throw new Error(
      `Could not verify a clean design-extract submodule: ${statusResult.error?.message || (statusResult.stderr || "").trim() || "git failed"}`,
    );
  }
  const dirtyLines = (statusResult.stdout || "").split("\n").filter(Boolean);
  if (dirtyLines.length > 0) {
    throw new Error(
      `design-extract submodule has local changes; refusing to run:\n${dirtyLines.slice(0, 10).join("\n")}`,
    );
  }

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(join(SUBMODULE_DIR, "package.json"), "utf8"));
  } catch (error) {
    throw new Error(
      `Could not read the pinned design-extract package metadata: ${error.message}`,
    );
  }
  if (packageJson.version !== EXPECTED_VERSION) {
    throw new Error(
      `Pinned design-extract package version mismatch: expected ${EXPECTED_VERSION}, found ${packageJson.version || "(missing)"}.`,
    );
  }

  for (const configFile of CONFIG_FILES) {
    if (existsSync(join(SUBMODULE_DIR, configFile))) {
      throw new Error(
        `Refusing to run with submodule config ${configFile}; remove it so the wrapper can enforce its safe flags.`,
      );
    }
  }

  if (!existsSync(join(SUBMODULE_DIR, "node_modules", "playwright", "package.json"))) {
    throw new Error(
      `design-extract dependencies are missing. Run: (cd tools/design-extract && npm ci --ignore-scripts)`,
    );
  }

  return { sha: actualSha, version: packageJson.version };
}

function outputDirectory(slug) {
  const candidate = resolve(OUTPUT_ROOT, slug);
  const relativePath = relative(OUTPUT_ROOT, candidate);
  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new UsageError("Output slug resolves outside the research output directory.");
  }
  return candidate;
}

export function buildCliArgs({ targetUrl, mode = "core", slug }) {
  const normalizedMode = normalizeMode(mode);
  const normalizedTarget = validateTargetUrl(targetUrl);
  const normalizedSlug = validateSlug(
    slug ?? (normalizedMode === "responsive" ? "home-responsive" : "home-core"),
  );
  const outDir = outputDirectory(normalizedSlug);

  const args = [
    CLI_PATH,
    normalizedTarget,
    "--out",
    outDir,
    "--name",
    `white-desert-${normalizedSlug}`,
    "--system-chrome",
    "--ignore-widgets",
    "--no-history",
    "--motion-runtime",
  ];
  if (normalizedMode === "responsive") args.push("--responsive");
  return args;
}

function diagnostics(result) {
  const output = [result?.stderr, result?.stdout]
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .join("\n");
  if (output.length <= DIAGNOSTIC_LIMIT) return output;
  return `…${output.slice(-DIAGNOSTIC_LIMIT)}`;
}

export function runExtraction({ targetUrl, mode, slug }) {
  const normalizedMode = normalizeMode(mode);
  const normalizedSlug = validateSlug(
    slug ?? (normalizedMode === "responsive" ? "home-responsive" : "home-core"),
  );
  const args = buildCliArgs({ targetUrl, mode: normalizedMode, slug: normalizedSlug });
  const { timeoutMs } = MODES[normalizedMode];

  verifyPinnedSubmodule();

  const result = spawnSync(process.execPath, args, {
    cwd: SUBMODULE_DIR,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: timeoutMs,
    killSignal: "SIGTERM",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });

  if (result.error?.code === "ETIMEDOUT") {
    throw new Error(
      `design-extract ${normalizedMode} run exceeded its ${timeoutMs / 1000}s timeout and was terminated.`,
    );
  }
  if (result.error) {
    throw new Error(
      `Could not start design-extract: ${result.error.message}${diagnostics(result) ? `\n${diagnostics(result)}` : ""}`,
    );
  }
  if (result.status !== 0) {
    const detail = diagnostics(result);
    throw new Error(
      `design-extract ${normalizedMode} failed with exit status ${result.status ?? "unknown"}${result.signal ? ` (${result.signal})` : ""}.${detail ? `\n${detail}` : ""}`,
    );
  }

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const outDir = outputDirectory(normalizedSlug);
  if (!existsSync(outDir)) {
    throw new Error(`design-extract exited successfully but did not create ${outDir}.`);
  }
  return { mode: normalizedMode, slug: normalizedSlug, outDir, timeoutMs };
}

function main(args = process.argv.slice(2)) {
  const parsed = parseArguments(args);
  if (parsed.help) {
    console.log(usage());
    return;
  }

  const result = runExtraction(parsed);
  console.log(`design-extract ${result.mode} output: ${result.outDir}`);
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (error) {
    const prefix = error instanceof UsageError ? "Usage error" : "Extraction error";
    console.error(`${prefix}: ${error.message}`);
    if (error instanceof UsageError) console.error(`\n${usage()}`);
    process.exitCode = 1;
  }
}
