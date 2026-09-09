import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/revision",
  outputDir: "artifacts/site-revision/test-results",
  fullyParallel: false,
  workers: 2,
  timeout: 60000,
  reporter: [["list"]],
  webServer: process.env.REVISION_URL
    ? undefined
    : {
        command: "pnpm start --hostname 127.0.0.1 --port 4196",
        url: "http://127.0.0.1:4196",
        reuseExistingServer: false,
      },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.REVISION_URL ?? "http://127.0.0.1:4196",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
});
