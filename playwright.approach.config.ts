import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/approach",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.APPROACH_TEST_URL ?? "http://127.0.0.1:4191",
    trace: "retain-on-failure",
  },
});
