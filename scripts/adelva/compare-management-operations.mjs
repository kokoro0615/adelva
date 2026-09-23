/**
 * Reference-vs-implementation comparison for /services/management-operations.
 *
 *   node scripts/adelva/compare-management-operations.mjs <captures-dir> [out-dir]
 *
 * One detector measures both rasters: it lists the row bands that contain
 * text-like pixels inside a named column of a frame (bright ink on the dark
 * scenes, dark ink on paper), then pairs every reference band with the
 * nearest implementation band. The thresholds are the ones declared in
 * docs/specs/adelva-management-operations-spec.md §14 before implementation.
 * Pixel metrics, overlays and differences come from the image-to-code
 * visual-fidelity tool and are diagnostic only: the photographs were redrawn.
 */
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import sharp from "sharp";

const captures = process.argv[2] ?? "artifacts/adelva-management-operations/actual";
const out = process.argv[3] ?? "artifacts/adelva-management-operations/fidelity";
const mock = "references/adelva/mockups/management-operations-2026-09-23";
const fidelityTool = `${homedir()}/.claude/skills/image-to-code/scripts/visual-fidelity.mjs`;
await mkdir(`${out}/frames`, { recursive: true });

const png = (pipeline, path) =>
  pipeline
    .removeAlpha()
    .png()
    .toFile(path)
    .then(() => path);

/* ------------------------------------------------------------- frames */

// Desktop process: the stage scales the 1536×1024 plate by p and bottom-aligns
// it under the header clearance (spec §9). Map the capture back to plate px.
const stageP = Math.min((960 - 84) / 968, 1440 / 1480);
const plateBox = {
  left: Math.round(720 - 768 * stageP),
  top: Math.round(960 - 1024 * stageP),
  width: Math.round(1536 * stageP),
  height: Math.round(1024 * stageP),
};

const frames = [
  {
    id: "desktop-viewport",
    reference: sharp(`${mock}/A2/band1.png`)
      .extract({ left: 0, top: 0, width: 1024, height: 640 })
      .resize(1440, 900),
    actual: sharp(`${captures}/desktop-full.png`).extract({
      left: 0,
      top: 0,
      width: 1440,
      height: 900,
    }),
    columns: [
      { name: "hero text", x: [80, 600], y: [120, 700], ink: "bright", tolerance: 8 },
    ],
  },
  {
    id: "desktop-map",
    reference: sharp(`${mock}/A2/band1.png`).resize(1440, 2160),
    actual: sharp(`${captures}/desktop-full.png`).extract({
      left: 0,
      top: 0,
      width: 1440,
      height: 2160,
    }),
    columns: [
      { name: "chapters", x: [80, 400], y: [700, 2000], ink: "bright", tolerance: 12 },
    ],
  },
  {
    id: "desktop-boundaries",
    reference: sharp(`${mock}/A2/band2.png`)
      .extract({ left: 0, top: 0, width: 1024, height: 492 })
      .resize(1440, 692),
    actual: sharp(`${captures}/desktop-full.png`).extract({
      left: 0,
      top: 2160,
      width: 1440,
      height: 692,
    }),
    columns: [
      { name: "left column", x: [490, 930], y: [40, 660], ink: "dark", tolerance: 8 },
      { name: "right column", x: [960, 1420], y: [40, 600], ink: "dark", tolerance: 8 },
    ],
  },
  ...[
    ["process-01", "process-00"],
    ["process-04", "process-06"],
    ["process-06", "process-10"],
  ].map(([reference, actual]) => ({
    id: reference,
    reference: sharp(`${mock}/A2/A2-${reference}.png`),
    actual: sharp(`${captures}/${actual}.png`).extract(plateBox).resize(1536, 1024),
    columns: [
      { name: "steps", x: [1040, 1470], y: [110, 900], ink: "bright", tolerance: 12 },
      { name: "intro", x: [190, 660], y: [100, 620], ink: "bright", tolerance: 12 },
      { name: "landings", x: [976, 1000], y: [30, 900], ink: "line", tolerance: 4 },
    ],
  })),
  {
    id: "mobile-sections",
    reference: sharp(`${mock}/A2-mobile/A2-mobile-full-390.png`).extract({
      left: 0,
      top: 0,
      width: 390,
      height: 5569,
    }),
    actual: sharp(`${captures}/mobile-full.png`).extract({
      left: 0,
      top: 0,
      width: 390,
      height: 5569,
    }),
    columns: [
      {
        name: "paper sections",
        x: [0, 390],
        y: [0, 5569],
        ink: "paper",
        tolerance: 24,
      },
      {
        name: "chapter text",
        x: [20, 380],
        y: [1496, 3370],
        ink: "bright",
        tolerance: 24,
      },
    ],
  },
  {
    id: "mobile-viewport",
    reference: sharp(`${mock}/A2-mobile/A2-mobile-full-390.png`).extract({
      left: 0,
      top: 0,
      width: 390,
      height: 844,
    }),
    actual: sharp(`${captures}/mobile-full.png`).extract({
      left: 0,
      top: 0,
      width: 390,
      height: 844,
    }),
    columns: [
      { name: "hero text", x: [20, 370], y: [60, 360], ink: "bright", tolerance: 8 },
    ],
  },
];

/* ----------------------------------------------------------- detector */

async function bands(path, { x, y, ink }) {
  const { data, info } = await sharp(path)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const hit = (px, py) => {
    const k = (py * W + px) * 3;
    const hi = Math.max(data[k], data[k + 1], data[k + 2]);
    const lo = Math.min(data[k], data[k + 1], data[k + 2]);
    if (ink === "bright") return hi > 165;
    if (ink === "dark") return lo < 110;
    if (ink === "paper") return lo > 215;
    return hi > 110; // grey, or orange on the current landing
  };
  const minimum =
    ink === "line" || ink === "paper" ? Math.round((x[1] - x[0]) * 0.8) : 2;
  const result = [];
  let start = null;
  for (let row = y[0]; row < Math.min(y[1], info.height); row++) {
    let count = 0;
    for (let col = x[0]; col < x[1]; col++) if (hit(col, row)) count++;
    const on = count >= minimum;
    if (on && start === null) start = row;
    if (!on && start !== null) {
      if (row - start >= (ink === "line" ? 1 : 5)) result.push([start, row - 1]);
      start = null;
    }
  }
  if (start !== null) result.push([start, Math.min(y[1], info.height) - 1]);
  return result;
}

function pair(reference, actual, tolerance) {
  return reference.map(([top, bottom]) => {
    const nearest = actual.reduce(
      (best, band) => (Math.abs(band[0] - top) < Math.abs(best[0] - top) ? band : best),
      actual[0] ?? [Number.NaN, Number.NaN],
    );
    const delta = nearest[0] - top;
    return {
      reference: [top, bottom],
      actual: nearest,
      delta,
      pass: Math.abs(delta) <= tolerance,
    };
  });
}

/* ---------------------------------------------------------------- run */

const summary = [];
for (const frame of frames) {
  const referencePath = await png(
    frame.reference,
    `${out}/frames/${frame.id}-reference.png`,
  );
  const actualPath = await png(frame.actual, `${out}/frames/${frame.id}-actual.png`);
  const columns = [];
  for (const column of frame.columns) {
    const reference = await bands(referencePath, column);
    const actual = await bands(actualPath, column);
    const pairs = pair(reference, actual, column.tolerance);
    columns.push({
      ...column,
      referenceBands: reference.length,
      actualBands: actual.length,
      reference,
      actual,
      passed: pairs.filter((entry) => entry.pass).length,
      pairs,
    });
  }
  let pixel = null;
  try {
    execFileSync(
      "node",
      [
        fidelityTool,
        "--root",
        ".",
        "--reference",
        referencePath,
        "--actual",
        actualPath,
        "--label",
        frame.id,
        "--out",
        out,
      ],
      { stdio: "pipe" },
    );
    pixel = JSON.parse(
      (await import("node:fs")).readFileSync(`${out}/${frame.id}-metrics.json`, "utf8"),
    );
  } catch (error) {
    pixel = { error: String(error.message ?? error).slice(0, 300) };
  }
  summary.push({ id: frame.id, columns, pixel: pixel?.metrics ?? pixel });
  const line = columns
    .map((column) => `${column.name} ${column.passed}/${column.referenceBands}`)
    .join(", ");
  console.log(`${frame.id}: ${line}`);
}
await writeFile(
  `${out}/summary.json`,
  JSON.stringify({ plateBox, stageP, summary }, null, 2) + "\n",
);
