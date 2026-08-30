import path from "node:path";

import { captureSite, parseCaptureOptions } from "./capture.mjs";
import { targetOrigin } from "./route-manifest.mjs";

const captureOptions = parseCaptureOptions(process.argv.slice(2), {
  defaultOutputRoot: path.resolve("artifacts/reference/target"),
});

await captureSite({
  baseUrl: targetOrigin,
  target: true,
  routes: captureOptions.routes,
  viewports: captureOptions.viewports,
  motion: captureOptions.motion,
  filters: captureOptions.filters,
  outputRoot: captureOptions.outputRoot,
});
