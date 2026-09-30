/**
 * Cuts the photographic regions of the adopted /approach mocks into edit inputs
 * for the text-free plates (Codex built-in image_gen edit, prompts by Opus 5.5).
 *
 * Desktop regions are measured on `A-full.png` (1024 px = a 1440 px page) and
 * upscaled with lanczos3 to 1536 px wide so the edit renders at plate
 * resolution. Mobile regions are cut from the native generated segments
 * (`A-mobile/segments`), which are already wider than 2× the 390 px page.
 * Rectangles sit 2 px inside each detected photograph so no page ink enters.
 *
 * Usage: node scripts/adelva/prepare-approach-edit-inputs.mjs
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const mock = "references/adelva/mockups/approach-page-2026-09-25";
const out = "assets/source/generated/adelva/approach-page-2026-09-26/inputs";

/** [id, source, left, top, width, height, upscale-to-width | null] */
const regions = [
  ["D-hero", `${mock}/A-full.png`, 0, 0, 1024, 660, 1536],
  ["D-01", `${mock}/A-full.png`, 39, 703, 946, 335, 1536],
  ["D-02", `${mock}/A-full.png`, 39, 1086, 946, 345, 1536],
  ["D-03", `${mock}/A-full.png`, 34, 1586, 956, 437, 1536],
  ["D-04", `${mock}/A-full.png`, 34, 2080, 956, 437, 1536],
  ["D-05", `${mock}/A-full.png`, 34, 2573, 956, 437, 1536],
  ["D-06", `${mock}/A-full.png`, 39, 3127, 946, 507, 1536],
  ["D-ridge", `${mock}/A-full.png`, 0, 3640, 1024, 880, 1536],
  ["D-integrated", `${mock}/A-full.png`, 0, 4560, 1024, 860, 1536],
  ["M-hero", `${mock}/A-mobile/segments/S01-hero.png`, 0, 0, 853, 1638, null],
  ["M-01", `${mock}/A-mobile/segments/S02-stage01.png`, 56, 78, 936, 1346, null],
  ["M-02", `${mock}/A-mobile/segments/S03-stage02.png`, 55, 82, 935, 1331, null],
  ["M-03", `${mock}/A-mobile/segments/S04-stage03.png`, 59, 84, 930, 1329, null],
  ["M-04", `${mock}/A-mobile/segments/S05-stage04.png`, 58, 91, 931, 1313, null],
  ["M-05", `${mock}/A-mobile/segments/S06-stage05.png`, 54, 86, 939, 1326, null],
  ["M-06", `${mock}/A-mobile/segments/S07-stage06.png`, 38, 76, 741, 1226, null],
  [
    "M-integrated",
    `${mock}/A-mobile/segments/S09-integrated.png`,
    0,
    0,
    845,
    1000,
    null,
  ],
];

const sha = async (file) =>
  createHash("sha256")
    .update(await readFile(file))
    .digest("hex");

const manifest = [];
for (const [id, source, left, top, width, height, upscale] of regions) {
  let image = sharp(source).extract({ left, top, width, height });
  if (upscale) image = image.resize({ width: upscale, kernel: "lanczos3" });
  const file = path.join(out, `${id}-input.png`);
  const info = await image.png().toFile(file);
  manifest.push({
    id,
    source,
    sourceSha256: await sha(source),
    rect: { left, top, width, height },
    upscaledTo: upscale ? [info.width, info.height] : null,
    output: file,
    sha256: await sha(file),
  });
}
await writeFile(
  path.join(out, "inputs.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  manifest
    .map((m) => `${m.id} ${m.upscaledTo ?? [m.rect.width, m.rect.height]}`)
    .join("\n"),
);
