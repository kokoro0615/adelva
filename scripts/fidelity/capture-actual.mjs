import path from "node:path";

import { captureSite } from "./capture.mjs";

await captureSite({
  baseUrl: process.env.LOCAL_BASE_URL ?? "http://127.0.0.1:4173",
  outputRoot: path.resolve("artifacts/reference/actual"),
  target: false,
});
