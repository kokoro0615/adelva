/** Reference fidelity for /contact (spec §14): the C2 mocks vs a capture in the
 * same state (`capture-contact.mjs --state=mock`). One detector — near-neutral
 * bright ink per scanline — measures both rasters inside the same declared
 * windows; photographs are compared only as diagnostic metrics and overlays.
 *   node scripts/adelva/compare-contact.mjs [actual-dir] [out-dir] */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const actual = process.argv[2] ?? "artifacts/contact/actual";
const out = process.argv[3] ?? "artifacts/contact/fidelity";
const mock = "references/adelva/mockups/contact-r2-2026-09-29/C2";
await mkdir(`${out}/frames`, { recursive: true });
const tool = [
  "/home/kokoro/.claude/skills/image-to-code/scripts/visual-fidelity.mjs",
  "/home/kokoro/.agents/skills/image-to-code/scripts/visual-fidelity.mjs",
].find(existsSync);
if (!tool) throw new Error("Reference fidelity tool unavailable");

// [id, x, y, w, h] in reference CSS px (spec §6, from the mock's own HTML).
const definitions = {
  desktop: {
    width: 1440,
    height: 5760,
    file: `${mock}/C2-full.png`,
    frames: [
      ["hero", 0, 900],
      ["q02-q03", 900, 1800],
      ["q03-q04", 1800, 2700],
      ["q04-send", 2700, 3600],
      ["after", 3600, 4500],
      ["notes-inn", 4500, 5400],
    ],
    landmarks: [
      ["CONTACT", 735, 150, 110, 22],
      ["h1-line1", 238, 196, 964, 91],
      ["h1-line2", 276, 287, 888, 91],
      ["q01-ask", 530, 482, 380, 24],
      ["card-1", 340, 552, 190, 24],
      ["card-6", 790, 710, 180, 24],
      ["q02-ask", 495, 1114, 450, 50],
      ["q02-card-2", 648, 1210, 175, 24],
      ["q03-ask", 320, 1714, 800, 50],
      ["q03-help", 568, 1774, 305, 24],
      ["q04-ask", 475, 2544, 490, 50],
      ["label-company", 280, 2628, 110, 24],
      ["label-email", 280, 2734, 110, 24],
      ["summary-label", 667, 2885, 106, 23],
      ["consent", 625, 2997, 220, 24],
      ["after-title", 590, 4120, 260, 57],
      ["step-03", 760, 4406, 200, 30],
      ["after-link", 630, 4536, 180, 26],
      ["note-1", 170, 4640, 260, 35],
      ["note-2", 750, 4640, 235, 35],
    ],
  },
  mobile: {
    width: 390,
    height: 5925,
    file: `${mock}/mobile/C2-mobile-full-390.png`,
    frames: [
      ["hero", 0, 844],
      ["q01-q02", 844, 1688],
      ["q03-q04", 1688, 2532],
      ["q04-send", 2532, 3376],
      ["after", 3376, 4220],
      ["steps-notes", 4220, 5064],
      ["inn", 5064, 5908],
    ],
    landmarks: [
      ["CONTACT", 205, 96, 95, 19],
      ["h1-1", 105, 132, 180, 50],
      ["h1-4", 70, 281, 250, 50],
      ["q01-ask", 100, 445, 190, 26],
      ["card-1", 78, 537, 175, 22],
      ["card-6", 78, 867, 160, 22],
      ["q02-ask", 45, 1195, 300, 36],
      ["q03-ask", 55, 1705, 280, 36],
      ["q03-help", 65, 1785, 260, 20],
      ["q04-ask", 30, 2315, 330, 36],
      ["label-company", 24, 2377, 105, 22],
      ["label-email", 24, 2557, 100, 21],
      ["summary-label", 145, 2802, 100, 21],
      ["consent", 108, 2998, 205, 22],
      ["after-title", 95, 3945, 200, 44],
      ["step-02", 95, 4130, 110, 24],
      ["after-link", 110, 4360, 170, 26],
      ["note-1", 24, 4560, 215, 29],
      ["note-2", 24, 4698, 195, 29],
    ],
  },
};

async function raster(path) {
  return sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}
function ink({ data, info }, [label, x, y, w, h]) {
  const x0 = Math.max(0, Math.floor(x - 8)),
    x1 = Math.min(info.width, Math.ceil(x + w + 8)),
    y0 = Math.max(0, Math.floor(y - 14)),
    y1 = Math.min(info.height, Math.ceil(y + h + 14));
  const hit = (xx, yy) => {
    const i = (yy * info.width + xx) * info.channels;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    return r > 178 && g > 174 && b > 166 && Math.max(r, g, b) - Math.min(r, g, b) < 36;
  };
  let top = null,
    bottom = null;
  for (let yy = y0; yy < y1; yy++) {
    let n = 0;
    for (let xx = x0; xx < x1; xx++) if (hit(xx, yy)) n++;
    if (n >= 2) {
      top ??= yy;
      bottom = yy;
    }
  }
  if (top === null) return { label, top: null, bottom: null, left: null, right: null };
  // Horizontal extent from columns that carry glyph strokes (≥2 ink pixels),
  // so an isolated highlight in the photograph cannot move the edge.
  let left = null,
    right = null;
  for (let xx = x0; xx < x1; xx++) {
    let n = 0;
    for (let yy = top; yy <= bottom; yy++) if (hit(xx, yy)) n++;
    if (n >= 2) {
      left ??= xx;
      right = xx;
    }
  }
  return { label, top, bottom, left, right };
}

const report = [];
for (const [name, def] of Object.entries(definitions)) {
  const refPath = `${out}/frames/${name}-reference.png`,
    actPath = `${out}/frames/${name}-actual.png`;
  await sharp(def.file)
    .resize({ width: def.width })
    .extract({ left: 0, top: 0, width: def.width, height: def.height })
    .png()
    .toFile(refPath);
  await sharp(`${actual}/${name}-full.png`)
    .extract({ left: 0, top: 0, width: def.width, height: def.height })
    .png()
    .toFile(actPath);
  const [ref, act] = await Promise.all([raster(refPath), raster(actPath)]);
  const landmarks = def.landmarks.map((l) => {
    const reference = ink(ref, l),
      implementation = ink(act, l);
    const dy =
      reference.top === null || implementation.top === null
        ? null
        : implementation.top - reference.top;
    const dx =
      reference.left === null || implementation.left === null
        ? null
        : implementation.left - reference.left;
    return {
      id: l[0],
      reference,
      implementation,
      dy,
      dx,
      pass: dy !== null && dx !== null && Math.abs(dy) <= 8 && Math.abs(dx) <= 4,
    };
  });
  const metrics = [];
  for (const [frame, from, to] of def.frames) {
    const ref = `${out}/frames/${name}-${frame}-reference.png`,
      act = `${out}/frames/${name}-${frame}-actual.png`;
    for (const [input, output] of [
      [refPath, ref],
      [actPath, act],
    ])
      await sharp(input)
        .extract({ left: 0, top: from, width: def.width, height: to - from })
        .png()
        .toFile(output);
    execFileSync(
      "node",
      [
        tool,
        "--root",
        ".",
        "--reference",
        ref,
        "--actual",
        act,
        "--label",
        `${name}-${frame}`,
        "--out",
        out,
      ],
      { stdio: "pipe" },
    );
    const m = JSON.parse(
      await readFile(`${out}/${name}-${frame}-metrics.json`, "utf8"),
    );
    metrics.push({ frame, ...(m.metrics ?? m) });
  }
  report.push({ name, referenceScale: 1, landmarks, metrics });
  console.log(
    name,
    landmarks.filter((l) => l.pass).length + "/" + landmarks.length,
    landmarks
      .filter((l) => !l.pass)
      .map((l) => `${l.id} dy=${l.dy} dx=${l.dx}`)
      .join(", "),
  );
}
await writeFile(
  `${out}/landmarks.json`,
  JSON.stringify(
    {
      method:
        "Identical near-neutral bright-ink scanline detector on reference and capture inside declared spec §6 windows; tolerance dy ±8, dx ±4 CSS px. Photograph metrics are diagnostic.",
      report,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  `${out}/landmarks.md`,
  "| Viewport | Landmark | Ref top,left | Actual top,left | dy | dx | Result |\n| --- | --- | --- | --- | ---: | ---: | --- |\n" +
    report
      .flatMap((r) =>
        r.landmarks.map(
          (l) =>
            `| ${r.name} | ${l.id} | ${l.reference.top},${l.reference.left} | ${l.implementation.top},${l.implementation.left} | ${l.dy} | ${l.dx} | ${l.pass ? "PASS" : "FAIL"} |`,
        ),
      )
      .join("\n") +
    "\n",
);
