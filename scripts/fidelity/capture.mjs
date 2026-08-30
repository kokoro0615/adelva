import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

import { routeManifest, routeSlug, viewports } from "./route-manifest.mjs";

const defaultMotion = "reduce";
const allowedOptions = new Set(["route", "viewport", "motion", "out"]);
const allowedMotions = new Set(["reduce", "no-preference"]);
const routePaths = new Set(routeManifest.map(({ path: routePath }) => routePath));
const viewportNames = new Set(viewports.map(({ name }) => name));

const blockedHosts = [
  "bat.bing.com",
  "clarity.ms",
  "connect.facebook.net",
  "googletagmanager.com",
  "hs-analytics.net",
  "hs-banner.com",
  "metricool.com",
];

export function parseArguments(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (typeof argument !== "string" || !argument.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${argument ?? ""}`);
    }

    const separator = argument.indexOf("=");
    const key = argument.slice(2, separator === -1 ? undefined : separator);
    let value = separator === -1 ? undefined : argument.slice(separator + 1);

    if (!allowedOptions.has(key)) {
      throw new Error(`Unknown capture option: --${key}`);
    }
    if (Object.hasOwn(args, key)) {
      throw new Error(`Capture option may only be supplied once: --${key}`);
    }

    if (value === undefined) {
      value = argv[index + 1];
      if (typeof value !== "string" || value.startsWith("--")) {
        throw new Error(`Capture option requires a value: --${key}`);
      }
      index += 1;
    }
    if (value.length === 0) {
      throw new Error(`Capture option requires a non-empty value: --${key}`);
    }

    args[key] = value;
  }

  return args;
}

function hasPathTraversal(value) {
  return value.split(/[\\/]+/u).some((segment) => segment === "..");
}

export function validateOutputRoot(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Capture output root must be a non-empty path.");
  }
  if (/[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error("Capture output root contains unsafe control characters.");
  }
  if (hasPathTraversal(value)) {
    throw new Error(`Capture output root must not contain path traversal: ${value}`);
  }

  const outputRoot = path.resolve(value);
  if (
    outputRoot === path.parse(outputRoot).root ||
    outputRoot === path.resolve(process.cwd())
  ) {
    throw new Error(`Refusing unsafe capture output root: ${value}`);
  }

  return outputRoot;
}

function selectRoute(routePath) {
  if (routePath === undefined) return routeManifest;
  if (!routePaths.has(routePath)) {
    throw new Error(`Unknown route: ${routePath}`);
  }
  return routeManifest.filter(({ path: manifestPath }) => manifestPath === routePath);
}

function selectViewport(viewportName) {
  if (viewportName === undefined) return viewports;
  if (!viewportNames.has(viewportName)) {
    throw new Error(`Unknown viewport: ${viewportName}`);
  }
  return viewports.filter(({ name }) => name === viewportName);
}

function selectMotion(motion) {
  const selectedMotion = motion ?? defaultMotion;
  if (!allowedMotions.has(selectedMotion)) {
    throw new Error(`Unknown motion preference: ${selectedMotion}`);
  }
  return selectedMotion;
}

export function parseCaptureOptions(
  argv = process.argv.slice(2),
  { defaultOutputRoot = "artifacts/reference/target" } = {},
) {
  const args = parseArguments(argv);
  const selectedMotion = selectMotion(args.motion);
  const outputRootWasExplicit = args.out !== undefined;

  if (selectedMotion === "no-preference" && !outputRootWasExplicit) {
    throw new Error(
      "--motion=no-preference requires an explicit --out path to preserve reduced-motion evidence.",
    );
  }

  return {
    routes: selectRoute(args.route),
    viewports: selectViewport(args.viewport),
    motion: selectedMotion,
    outputRoot: validateOutputRoot(
      outputRootWasExplicit ? args.out : defaultOutputRoot,
    ),
    outputRootWasExplicit,
    filters: {
      route: args.route ?? null,
      viewport: args.viewport ?? null,
    },
  };
}

async function waitForVisualReadiness(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.images].filter((image) => !image.complete);
    await Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 5000);
          }),
      ),
    );
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
      .cookie-banner { display: none !important; }
    `,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
}

export async function captureSite({
  baseUrl,
  outputRoot,
  target,
  routes: selectedRoutes = routeManifest,
  viewports: selectedViewports = viewports,
  motion = defaultMotion,
  filters = { route: null, viewport: null },
}) {
  if (!Array.isArray(selectedRoutes) || selectedRoutes.length === 0) {
    throw new Error("Capture requires at least one route.");
  }
  if (!Array.isArray(selectedViewports) || selectedViewports.length === 0) {
    throw new Error("Capture requires at least one viewport.");
  }
  const selectedMotion = selectMotion(motion);
  const captureOutputRoot = validateOutputRoot(outputRoot);
  const captureFilters = {
    route: filters.route ?? null,
    viewport: filters.viewport ?? null,
  };

  const { chromium } = await import("@playwright/test");
  await mkdir(captureOutputRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const evidence = [];

  try {
    for (const viewport of selectedViewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: selectedMotion,
      });

      if (target) {
        await context.addCookies([
          {
            name: "consentChoice",
            value: "rejected",
            domain: "white-desert.com",
            path: "/",
            secure: true,
            sameSite: "Lax",
          },
        ]);
      }

      const page = await context.newPage();
      await page.route("**/*", async (route) => {
        const hostname = new URL(route.request().url()).hostname;
        if (blockedHosts.some((blocked) => hostname.endsWith(blocked))) {
          await route.abort();
          return;
        }
        await route.continue();
      });

      for (const route of selectedRoutes) {
        const consoleErrors = [];
        const handleConsole = (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        };
        page.on("console", handleConsole);
        const requestedUrl = new URL(route.path, baseUrl).href;
        const response = await page.goto(requestedUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45_000,
        });
        await waitForVisualReadiness(page);

        const filename = `${routeSlug(route.path)}-${viewport.width}x${viewport.height}-top.png`;
        const outputPath = path.join(captureOutputRoot, filename);
        await page.screenshot({ path: outputPath, fullPage: false, scale: "css" });
        const metadata = await sharp(outputPath).metadata();

        evidence.push({
          requestedUrl,
          finalUrl: page.url(),
          route: route.path,
          family: route.family,
          status: response?.status() ?? null,
          viewport,
          file: outputPath,
          motion: selectedMotion,
          filters: captureFilters,
          naturalWidth: metadata.width,
          naturalHeight: metadata.height,
          scaleX: (metadata.width ?? viewport.width) / viewport.width,
          scaleY: (metadata.height ?? viewport.height) / viewport.height,
          title: await page.title(),
          consoleErrors,
        });

        page.off("console", handleConsole);
        await page.waitForTimeout(target ? 350 : 50);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  await writeFile(
    path.join(captureOutputRoot, "capture-manifest.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );

  return evidence;
}
