/**
 * Reference-vs-implementation comparison for /approach.
 *
 *   node scripts/adelva/compare-approach.mjs <captures-dir> [out-dir]
 *
 * Captures come from scripts/adelva/capture-approach.mjs (reduced motion:
 * the finished static descent both adopted mocks show). The shared footer is
 * excluded; it is the production HomeFooter in the mocks as well.
 *
 * Gates (declared in docs/specs/adelva-approach-spec.md §11):
 *   - photographs: one detector lists the photograph bands (rows that are not
 *     plain page ink) in both rasters; tops and bottoms must agree;
 *   - text: one detector lists the rows holding text-like pixels inside named
 *     regions of both rasters; glyph tops, left edges and widths must agree.
 * Pixel metrics, overlays and differences come from the image-to-code
 * visual-fidelity tool and are diagnostic only: the photographs were redrawn
 * as text-free plates and the type is live HTML.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import sharp from "sharp";

const captures = process.argv[2] ?? "artifacts/adelva-approach/actual";
const out = process.argv[3] ?? "artifacts/adelva-approach/fidelity";
const mock = "references/adelva/mockups/approach-page-2026-09-25";
const fidelityTool = `${homedir()}/.claude/skills/image-to-code/scripts/visual-fidelity.mjs`;
await mkdir(`${out}/frames`, { recursive: true });

const pages = {
  desktop: {
    width: 1440,
    height: 8564,
    reference: `${mock}/A-full.png`,
    actual: `${captures}/desktop-full.png`,
  },
  mobile: {
    width: 390,
    height: 7088,
    reference: `${mock}/A-mobile/A-mobile-full@2x.png`,
    actual: `${captures}/mobile-full.png`,
  },
};

/** Both rasters at CSS scale, footer removed. */
async function load(file, width, height) {
  const resized = await sharp(file)
    .removeAlpha()
    .resize({ width, kernel: "lanczos3" })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const buffer = await sharp(resized)
    .extract({ left: 0, top: 0, width, height: Math.min(height, meta.height) })
    .png()
    .toBuffer();
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { buffer, data, width: info.width, height: info.height };
}

const inks = {
  bright: ([r, g, b]) => r > 205 && g > 205 && b > 195,
  orange: ([r, g, b]) => r > 200 && g > 80 && g < 160 && b < 80,
  dark: ([r, g, b]) => r < 70 && g < 70 && b < 80,
};
const pixel = (image, x, y) => {
  const k = (y * image.width + x) * 3;
  return [image.data[k], image.data[k + 1], image.data[k + 2]];
};

/** Row bands that hold at least two text-like pixels inside a region. */
function textBands(image, [x0, y0, x1, y1], ink) {
  const test = inks[ink];
  const bands = [];
  let band = null;
  for (let y = y0; y <= Math.min(y1, image.height - 1); y++) {
    let left = Infinity;
    let right = -1;
    let count = 0;
    for (let x = x0; x <= Math.min(x1, image.width - 1); x++)
      if (test(pixel(image, x, y))) {
        count++;
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    if (count >= 2) {
      if (!band) band = { top: y, bottom: y, left, right };
      else {
        band.bottom = y;
        band.left = Math.min(band.left, left);
        band.right = Math.max(band.right, right);
      }
    } else if (band) {
      if (band.bottom - band.top >= 3) bands.push(band);
      band = null;
    }
  }
  if (band && band.bottom - band.top >= 3) bands.push(band);
  return bands.map((b) => ({
    top: b.top,
    left: b.left,
    width: b.right - b.left + 1,
    height: b.bottom - b.top + 1,
  }));
}

/** Photograph bands: rows that are not plain page ink across the canvas. */
function photoBands(image, [y0, y1]) {
  const ink = ([r, g, b]) =>
    Math.abs(r - 11) < 10 && Math.abs(g - 16) < 10 && Math.abs(b - 23) < 12;
  const bands = [];
  let start = null;
  const x0 = Math.round(image.width * 0.02);
  const x1 = Math.round(image.width * 0.98);
  for (let y = y0; y <= y1; y++) {
    let plain = 0;
    let total = 0;
    for (let x = x0; x < x1; x += 2) {
      total++;
      if (ink(pixel(image, x, y))) plain++;
    }
    const content = plain / total <= 0.93;
    if (content && start === null) start = y;
    if (!content && start !== null) {
      if (y - start > 60) bands.push({ top: start, bottom: y });
      start = null;
    }
  }
  if (start !== null && y1 - start > 60) bands.push({ top: start, bottom: y1 });
  return bands;
}

/** Regions: [name, [x0, y0, x1, y1] in CSS px, ink, tolerance px]. */
const regions = {
  desktop: [
    ["hero breadcrumb", [50, 205, 560, 240], "bright", 8],
    ["hero roman", [50, 270, 560, 300], "bright", 8],
    ["hero title", [50, 310, 760, 440], "bright", 8],
    ["hero lead", [50, 450, 760, 560], "bright", 8],
    ["hero body", [50, 595, 760, 710], "bright", 8],
    ["hero cta", [45, 725, 360, 815], "orange", 8],
    ["stage 01 number", [80, 1025, 200, 1085], "orange", 12],
    ["stage 01 copy", [80, 1095, 620, 1300], "bright", 12],
    ["stage 03 copy", [70, 2340, 600, 2600], "bright", 12],
    ["stage 05 copy", [70, 3725, 600, 3940], "bright", 12],
    ["stage 06 number", [60, 5160, 210, 5240], "orange", 12],
    ["stage 06 copy", [60, 5255, 1100, 5520], "bright", 12],
    ["roles label", [60, 5585, 300, 5630], "orange", 12],
    ["roles title", [60, 5640, 1400, 5730], "bright", 12],
    ["roles first row", [60, 5825, 470, 5905], "bright", 12],
    ["roles ADELVA", [60, 6035, 470, 6075], "orange", 12],
    ["roles note", [60, 6265, 900, 6350], "bright", 12],
    ["integrated title", [60, 6900, 700, 7135], "bright", 12],
    ["domain 01", [60, 7230, 480, 7450], "bright", 12],
    ["domain 02", [530, 7230, 950, 7450], "bright", 12],
    ["verification title", [90, 7820, 1340, 7930], "bright", 12],
    ["check 01", [60, 8060, 360, 8230], "bright", 12],
    ["audience 01", [60, 8380, 700, 8480], "dark", 16],
  ],
  mobile: [
    ["hero title", [20, 180, 330, 240], "bright", 8],
    ["hero lead", [20, 245, 330, 300], "bright", 8],
    ["hero body", [20, 315, 330, 405], "bright", 8],
    ["stage 01 number", [30, 850, 120, 890], "orange", 8],
    ["stage 01 copy", [30, 885, 300, 950], "bright", 8],
    ["stage 06 number", [15, 4390, 120, 4430], "orange", 8],
    ["stage 06 copy", [15, 4435, 330, 4550], "bright", 8],
    ["roles label", [15, 4712, 200, 4735], "orange", 8],
    ["integrated label", [15, 5738, 300, 5760], "orange", 8],
    ["integrated title", [15, 5765, 380, 5850], "bright", 8],
    ["verification title", [15, 6425, 380, 6530], "bright", 8],
  ],
};

const summary = { generated: new Date().toISOString(), pages: {} };
let failures = 0;

for (const [id, spec] of Object.entries(pages)) {
  const reference = await load(spec.reference, spec.width, spec.height);
  const actual = await load(spec.actual, spec.width, spec.height);
  const result = { photos: [], text: [] };

  // Photographs.
  const range = id === "desktop" ? [940, 5200] : [800, 4400];
  const refPhotos = photoBands(reference, range);
  const actPhotos = photoBands(actual, range);
  refPhotos.forEach((band, index) => {
    const match = actPhotos[index];
    const pass =
      Boolean(match) &&
      Math.abs(match.top - band.top) <= 3 &&
      Math.abs(match.bottom - band.bottom) <= 3;
    if (!pass) failures++;
    result.photos.push({ reference: band, actual: match ?? null, pass });
  });

  // Text landmarks.
  for (const [name, region, ink, tolerance] of regions[id]) {
    const refBands = textBands(reference, region, ink);
    const actBands = textBands(actual, region, ink);
    for (const band of refBands) {
      const match = actBands.reduce(
        (best, candidate) =>
          !best || Math.abs(candidate.top - band.top) < Math.abs(best.top - band.top)
            ? candidate
            : best,
        null,
      );
      const widthRatio = match ? match.width / band.width : 0;
      const pass =
        Boolean(match) &&
        Math.abs(match.top - band.top) <= tolerance &&
        Math.abs(match.left - band.left) <= tolerance &&
        widthRatio > 0.88 &&
        widthRatio < 1.12;
      if (!pass) failures++;
      result.text.push({
        region: name,
        reference: band,
        actual: match,
        delta: match
          ? {
              top: match.top - band.top,
              left: match.left - band.left,
              widthRatio: +widthRatio.toFixed(3),
            }
          : null,
        tolerance,
        pass,
      });
    }
  }

  // Diagnostic overlays per section.
  const sections =
    id === "desktop"
      ? [
          ["viewport", 0, 900],
          ["descent", 900, 5540],
          ["roles", 5540, 6412],
          ["integrated", 6412, 7740],
          ["closing", 7740, 8564],
        ]
      : [
          ["viewport", 0, 844],
          ["descent", 750, 4648],
          ["roles-integrated", 4648, 6400],
          ["closing", 6400, 7088],
        ];
  result.frames = [];
  for (const [name, top, bottom] of sections) {
    const label = `${id}-${name}`;
    const cut = (image) =>
      sharp(image.buffer)
        .extract({ left: 0, top, width: spec.width, height: bottom - top })
        .png()
        .toFile(
          `${out}/frames/${label}-${image === reference ? "reference" : "actual"}.png`,
        );
    await cut(reference);
    await cut(actual);
    execFileSync(
      "node",
      [
        fidelityTool,
        "--root",
        process.cwd(),
        "--reference",
        `${out}/frames/${label}-reference.png`,
        "--actual",
        `${out}/frames/${label}-actual.png`,
        "--label",
        label,
        "--out",
        out,
      ],
      { stdio: "ignore" },
    );
    const metrics = JSON.parse(await readFile(`${out}/${label}-metrics.json`, "utf8"));
    result.frames.push({ label, top, bottom, metrics: metrics.metrics ?? metrics });
  }

  summary.pages[id] = result;
}

summary.failures = failures;
await writeFile(
  `${out}/fidelity-summary.json`,
  `${JSON.stringify(summary, null, 2)}\n`,
);
for (const [id, result] of Object.entries(summary.pages)) {
  const photoPass = result.photos.filter((p) => p.pass).length;
  const textPass = result.text.filter((t) => t.pass).length;
  console.log(
    `${id}: photographs ${photoPass}/${result.photos.length}, text bands ${textPass}/${result.text.length}`,
  );
  for (const t of result.text.filter((entry) => !entry.pass))
    console.log(
      `  ✗ ${t.region} ref top ${t.reference.top} → ${t.actual?.top ?? "—"} ${JSON.stringify(t.delta)}`,
    );
  for (const p of result.photos.filter((entry) => !entry.pass))
    console.log(
      `  ✗ photo ${JSON.stringify(p.reference)} → ${JSON.stringify(p.actual)}`,
    );
}
process.exitCode = failures ? 1 : 0;
