/**
 * Reference-vs-implementation comparison for /services/dx-it-procurement.
 *
 *   node scripts/adelva/compare-dx-it-procurement.mjs <captures-dir> [out-dir]
 *
 * One detector measures both rasters: it lists the row bands that contain
 * text-like pixels inside a named column of a frame (bright ink on the dark
 * scenes, dark ink on paper), then pairs every reference band with the
 * nearest implementation band. The thresholds are the ones declared in
 * docs/specs/adelva-dx-it-procurement-spec.md §14 before implementation.
 * Pixel metrics, overlays and differences come from the image-to-code
 * visual-fidelity tool and are diagnostic only: the photographs were redrawn.
 */
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import sharp from "sharp";

const captures =
  process.argv[2] ?? "docs/reports/adelva-dx-it-procurement-2026-09-28/actual";
const out =
  process.argv[3] ?? "docs/reports/adelva-dx-it-procurement-2026-09-28/fidelity";
const mock = "references/adelva/mockups/dx-it-procurement-2026-09-24";
const fidelityTool = `${homedir()}/.agents/skills/image-to-code/scripts/visual-fidelity.mjs`;
await mkdir(`${out}/frames`, { recursive: true });

const png = (pipeline, path) =>
  pipeline
    .removeAlpha()
    .png()
    .toFile(path)
    .then(() => path);

/* ------------------------------------------------------------- frames */

// All frames use the original full mock, at the predeclared CSS scale.
const desktopReference = await sharp(mock + "/A-full.png")
  .resize({ width: 1440 })
  .png()
  .toBuffer();
const mobileReference = mock + "/A-mobile/A-mobile-full-390.png";
const desktopFrames = [
  [
    "hero",
    0,
    780,
    [{ name: "hero text", x: [80, 650], y: [230, 640], ink: "bright", tolerance: 8 }],
  ],
  [
    "chapters",
    780,
    1380,
    [
      {
        name: "chapter text",
        x: [80, 420],
        y: [0, 1080],
        ink: "bright",
        tolerance: 12,
      },
    ],
  ],
  [
    "boundaries",
    2160,
    598,
    [
      {
        name: "comparison headings",
        x: [510, 905],
        y: [65, 515],
        ink: "dark",
        tolerance: 8,
      },
      {
        name: "comparison right",
        x: [998, 1370],
        y: [165, 495],
        ink: "dark",
        tolerance: 8,
      },
    ],
  ],
  [
    "process",
    2758,
    1560,
    [
      {
        name: "vertical heading",
        x: [60, 165],
        y: [105, 710],
        ink: "bright",
        tolerance: 8,
      },
      { name: "intro", x: [235, 670], y: [230, 725], ink: "bright", tolerance: 8 },
      {
        name: "passed/current steps",
        x: [1010, 1330],
        y: [95, 790],
        ink: "bright",
        tolerance: 12,
      },
      {
        name: "upcoming steps",
        x: [1010, 1330],
        y: [800, 1160],
        ink: "grey",
        tolerance: 12,
      },
    ],
  ],
  [
    "related",
    4318,
    785,
    [{ name: "card titles", x: [80, 500], y: [540, 740], ink: "bright", tolerance: 8 }],
  ],
  [
    "audiences",
    5103,
    176,
    [
      {
        name: "audience labels",
        x: [100, 1300],
        y: [15, 150],
        ink: "dark",
        tolerance: 8,
      },
    ],
  ],
];
const frames = desktopFrames.map(([name, top, height, columns]) => ({
  id: "desktop-" + name,
  reference: sharp(desktopReference).extract({ left: 0, top, width: 1440, height }),
  actual:
    name === "process"
      ? sharp(captures + "/process-04-section.png")
      : sharp(captures + "/desktop-full.png").extract({
          left: 0,
          top,
          width: 1440,
          height,
        }),
  columns,
}));
for (const [name, top, height, columns] of [
  [
    "hero",
    0,
    844,
    [{ name: "hero text", x: [17, 297], y: [329, 526], ink: "bright", tolerance: 8 }],
  ],
  [
    "chapter1",
    1180,
    230,
    [{ name: "chapter one", x: [17, 297], y: [0, 217], ink: "bright", tolerance: 8 }],
  ],
  [
    "chapter2",
    1955,
    205,
    [{ name: "chapter two", x: [17, 297], y: [0, 180], ink: "bright", tolerance: 8 }],
  ],
  [
    "chapter3",
    2740,
    175,
    [{ name: "chapter three", x: [17, 297], y: [0, 155], ink: "bright", tolerance: 8 }],
  ],
  [
    "boundaries",
    3259,
    407,
    /* Rows from 13 down are an intentional deviation at 390 (Opus review
       2026-09-29): the 「02 収益・ブランド成長」 label takes its own line under
       the 12px floor, which moves 13's description, 18 and the note down by
       ~13 CSS px. See docs/specs/adelva-dx-it-procurement-spec.md §13. */
    [{ name: "panel text", x: [23, 291], y: [15, 222], ink: "dark", tolerance: 8 }],
  ],
  [
    "process",
    3670,
    1020,
    [
      {
        name: "vertical heading",
        x: [22, 66],
        y: [30, 280],
        ink: "bright",
        tolerance: 8,
      },
      {
        name: "process link",
        x: [20, 170],
        y: [945, 1000],
        ink: "bright",
        tolerance: 8,
      },
      { name: "intro", x: [90, 295], y: [38, 251], ink: "bright", tolerance: 8 },
      { name: "step names", x: [84, 208], y: [377, 925], ink: "bright", tolerance: 8 },
    ],
  ],
  [
    "related",
    5500,
    760,
    [
      {
        name: "card 01 text",
        x: [30, 270],
        y: [325, 402],
        ink: "bright",
        tolerance: 8,
      },
      {
        name: "card 02 text",
        x: [30, 270],
        y: [650, 735],
        ink: "bright",
        tolerance: 8,
      },
    ],
  ],
  [
    "audiences",
    6260,
    120,
    [{ name: "audience labels", x: [24, 364], y: [5, 115], ink: "dark", tolerance: 8 }],
  ],
])
  frames.push({
    id: "mobile-" + name,
    reference: sharp(mobileReference).extract({ left: 0, top, width: 390, height }),
    actual: sharp(captures + "/mobile-full.png").extract({
      left: 0,
      top,
      width: 390,
      height,
    }),
    columns,
  });

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
    if (ink === "bright") return lo > 165 && hi - lo < 65;
    if (ink === "grey") return lo > 140 && hi - lo < 65;
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
  // Antialiasing can split a glyph descender from the main stroke by 1–3 rows.
  return result.reduce((merged, band) => {
    const last = merged.at(-1);
    if (last && band[0] - last[1] <= 4) last[1] = band[1];
    else merged.push(band);
    return merged;
  }, []);
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
  if (pixel?.artifacts?.sideBySide) {
    await unlink(pixel.artifacts.sideBySide);
    delete pixel.artifacts.sideBySide;
    await writeFile(
      `${out}/${frame.id}-metrics.json`,
      JSON.stringify(pixel, null, 2) + "\n",
    );
  }
  summary.push({ id: frame.id, columns, pixel: pixel?.metrics ?? pixel });
  const line = columns
    .map((column) => `${column.name} ${column.passed}/${column.referenceBands}`)
    .join(", ");
  console.log(`${frame.id}: ${line}`);
}
async function titleWidth(path, roi) {
  const { data, info } = await sharp(path)
    .extract(roi)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const columns = [];
  for (let x = 0; x < info.width; x++) {
    let n = 0;
    for (let y = 0; y < info.height; y++) {
      const k = (y * info.width + x) * 3;
      const lo = Math.min(data[k], data[k + 1], data[k + 2]);
      const hi = Math.max(data[k], data[k + 1], data[k + 2]);
      if (lo > 165 && hi - lo < 65) n++;
    }
    if (n >= 4) columns.push(x);
  }
  return {
    left: roi.left + columns[0],
    right: roi.left + columns.at(-1),
    width: columns.at(-1) - columns[0] + 1,
  };
}
const titles = [];
for (const [id, roi] of [
  ["desktop-hero", { left: 75, top: 370, width: 755, height: 98 }],
  ["mobile-hero", { left: 15, top: 388, width: 290, height: 45 }],
]) {
  const reference = await titleWidth(out + "/frames/" + id + "-reference.png", roi);
  const actual = await titleWidth(out + "/frames/" + id + "-actual.png", roi);
  const deltaPercent = (100 * (actual.width - reference.width)) / reference.width;
  titles.push({
    id,
    reference,
    actual,
    deltaPercent,
    pass: Math.abs(deltaPercent) <= 4,
  });
}
const capturesData = JSON.parse(await readFile(captures + "/capture.json", "utf8"));
const tablet = capturesData.report.find((r) => r.name === "tablet");
const tabletGeometry = {
  columnWidth: tablet.column.width,
  columnLeft: tablet.column.x,
  scrollWidth: tablet.scrollWidth,
  pass:
    tablet.column.width === 640 && tablet.column.x === 64 && tablet.scrollWidth === 768,
};
const pass =
  summary.every(
    (frame) =>
      frame.columns.every(
        (c) => c.referenceBands > 0 && c.passed === c.referenceBands,
      ) && !frame.pixel?.error,
  ) &&
  titles.every((t) => t.pass) &&
  tabletGeometry.pass;
await writeFile(
  `${out}/summary.json`,
  JSON.stringify(
    { mapping: { desktop: 1.40625, mobile: 1 }, summary, titles, tabletGeometry, pass },
    null,
    2,
  ) + "\n",
);

console.log(JSON.stringify({ titles, tabletGeometry, pass }));
if (!pass) process.exitCode = 1;
