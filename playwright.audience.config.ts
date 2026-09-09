import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const preview = process.env.PLAYWRIGHT_TEST_BASE_URL;
export default defineConfig({
  ...base,
  testDir: "./tests/audience",
  outputDir: "artifacts/adelva-audience-v4/test-results",
  reporter: [["list"]],
  use: { ...base.use, ...(preview ? { baseURL: preview } : {}) },
  webServer: preview ? undefined : base.webServer,
});
