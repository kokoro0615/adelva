import path from "node:path";

import { captureSite } from "./capture.mjs";
import { targetOrigin } from "./route-manifest.mjs";

await captureSite({
  baseUrl: targetOrigin,
  outputRoot: path.resolve("artifacts/reference/target"),
  target: true,
});
