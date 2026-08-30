import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/.cache/**",
      "**/artifacts/**",
      "**/.Codex/**",
      "**/tools/design-extract/**",
      "**/coverage/**",
      "**/dist/**",
      "**/build/**",
      "**/vendor/**",
    ],
    coverage: {
      reporter: ["text", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
