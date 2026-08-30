import path from "node:path";

import { captureSite, parseCaptureOptions } from "./capture.mjs";

const captureOptions = parseCaptureOptions(process.argv.slice(2), {
  defaultOutputRoot: path.resolve("artifacts/reference/actual"),
});

await captureSite({
  baseUrl: process.env.LOCAL_BASE_URL ?? "http://127.0.0.1:4173",
  target: false,
  routes: captureOptions.routes,
  viewports: captureOptions.viewports,
  motion: captureOptions.motion,
  filters: captureOptions.filters,
  outputRoot: captureOptions.outputRoot,
});
