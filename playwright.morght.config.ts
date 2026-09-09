import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/morght",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.MORGHT_URL || "http://127.0.0.1:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
