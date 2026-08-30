import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

import { routeManifest, routeSlug, viewports } from "./route-manifest.mjs";

const blockedHosts = [
  "bat.bing.com",
  "clarity.ms",
  "connect.facebook.net",
  "googletagmanager.com",
  "hs-analytics.net",
  "hs-banner.com",
  "metricool.com",
];

function parseArguments(argv) {
  return Object.fromEntries(
    argv.map((argument) => {
      const [key, ...value] = argument.replace(/^--/, "").split("=");
      return [key, value.join("=") || true];
    }),
  );
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

export async function captureSite({ baseUrl, outputRoot, target }) {
  const args = parseArguments(process.argv.slice(2));
  const selectedRoutes =
    typeof args.route === "string"
      ? routeManifest.filter(({ path: routePath }) => routePath === args.route)
      : args.family
        ? routeManifest.filter(({ family }) => family === args.family)
        : routeManifest;
  const selectedViewports =
    typeof args.viewport === "string"
      ? viewports.filter(({ name }) => name === args.viewport)
      : viewports;

  if (selectedRoutes.length === 0 || selectedViewports.length === 0) {
    throw new Error("No routes or viewports matched the supplied filters.");
  }

  await mkdir(outputRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const evidence = [];

  try {
    for (const viewport of selectedViewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        colorScheme: "light",
        reducedMotion: "reduce",
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
        const outputPath = path.join(outputRoot, filename);
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
    path.join(outputRoot, "capture-manifest.json"),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
}
