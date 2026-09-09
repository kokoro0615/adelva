import { defineConfig } from "@playwright/test";

import base from "./playwright.config";

/** Explicit local preview override; the default still uses the production server. */
const preview = process.env.PLAYWRIGHT_TEST_BASE_URL;

export default defineConfig({
  ...base,
  testMatch: "who-we-support.spec.ts",
  outputDir: "artifacts/adelva-who-we-support/test-results",
  reporter: [["list"]],
  use: { ...base.use, ...(preview ? { baseURL: preview } : {}) },
  webServer: preview ? undefined : base.webServer,
});
