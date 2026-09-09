import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next-revision/**",
    ".next-morght-review/**",
    ".Codex/docs/research/design-extract/**",
    "artifacts/**",
    "references/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "tools/design-extract/**",
  ]),
]);
