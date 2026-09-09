import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const preview = process.env.FOOTER_BASE_URL;
export default defineConfig({
  ...base,
  testMatch: ["home-footer.spec.ts", "accessibility.spec.ts", "visual.spec.ts"],
  outputDir: "artifacts/adelva-home-footer/test-results",
  reporter: [["list"]],
  use: { ...base.use, ...(preview ? { baseURL: preview } : {}) },
  webServer: preview ? undefined : base.webServer,
});
