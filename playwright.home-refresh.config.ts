import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/home-refresh",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.HOME_TEST_URL ?? "http://127.0.0.1:3002",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
});
