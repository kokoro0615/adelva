import { defineConfig } from "@playwright/test";
const externalBaseURL = process.env.NOSIGNER_TEST_BASE_URL;
export default defineConfig({
  testDir: "./tests/nosigner",
  outputDir: "./artifacts/nosigner/playwright",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: [["list"]],
  use: {
    baseURL: externalBaseURL || "http://127.0.0.1:4182",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: "pnpm start --port 4182",
        url: "http://127.0.0.1:4182/challenges",
        reuseExistingServer: false,
        timeout: 60000,
      },
});
