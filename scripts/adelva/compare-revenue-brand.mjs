/** Same ink detector for A4 and implementation. Photo pixel metrics are diagnostic. */
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";
const root = "docs/reports/adelva-revenue-brand-2026-09-28";
const actual = process.argv[2] ?? `${root}/actual`,
  out = process.argv[3] ?? `${root}/fidelity`;
await mkdir(`${out}/frames`, { recursive: true });
const mock = "references/adelva/mockups/revenue-brand-A4-2026-09-26";
const tool = [
  "/home/kokoro/.claude/skills/image-to-code/scripts/visual-fidelity.mjs",
  "/home/kokoro/.agents/skills/image-to-code/scripts/visual-fidelity.mjs",
].find(existsSync);
if (!tool) throw new Error("Reference fidelity tool unavailable");
const report = [];
const definitions = {
  desktop: {
    width: 1440,
    height: 9360,
    file: `${mock}/A4-full.png`,
    scale: 1.40625,
    sections: [
      ["hero", 0, 960],
      ["confluence", 960, 1800],
      ["lake", 2320, 3440],
      ["loop", 3800, 4510],
      ["differences", 4580, 5250],
      ["process", 5740, 7460],
      ["related", 8160, 9360],
    ],
    landmarks: [
      ["H1", 62, 464, 804, 96],
      ["chapter1", 420, 1056, 600, 56],
      ["service12", 59, 1612, 520, 40],
      ["service16", 1080, 1612, 300, 40],
      ["chapter2", 225, 2437, 990, 82],
      ["service13", 340, 2710, 245, 36],
      ["service14", 810, 2710, 390, 36],
      ["chapter3", 966, 3977, 400, 60],
      ["service15", 966, 4138, 400, 34],
      ["differences", 480, 4653, 480, 56],
      ["process", 470, 5782, 500, 60],
      ["related", 98, 8270, 410, 26],
    ],
  },
  mobile: {
    width: 390,
    height: 6763,
    file: `${mock}/A4-mobile/A4-mobile-full-390.png`,
    scale: 1,
    sections: [
      ["hero", 0, 830],
      ["confluence", 830, 1770],
      ["lake", 1950, 2730],
      ["loop", 3000, 3530],
      ["differences", 3750, 4230],
      ["process", 4460, 5620],
      ["related", 5900, 6763],
    ],
    landmarks: [
      ["H1", 22, 340, 300, 104],
      ["chapter1", 54, 1026, 290, 24],
      ["service12", 20, 1648, 250, 16],
      ["service16", 270, 1719, 105, 16],
      ["chapter2", 35, 2007, 330, 26],
      ["service13", 115, 2358, 160, 18],
      ["service14", 77, 2470, 235, 18],
      ["chapter3", 22, 3048, 210, 28],
      ["service15", 22, 3101, 180, 16],
      ["differences", 100, 3781, 195, 24],
      ["process", 26, 4490, 195, 24],
      ["related", 38, 5925, 220, 18],
    ],
  },
};
async function raster(path) {
  return sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
}
function ink({ data, info }, [label, x, y, w, h]) {
  const x0 = Math.max(0, Math.floor(x - 6)),
    x1 = Math.min(info.width, Math.ceil(x + w + 6)),
    y0 = Math.max(0, Math.floor(y - 12)),
    y1 = Math.min(info.height, Math.ceil(y + h + 22));
  const hit = (xx, yy) => {
    const i = (yy * info.width + xx) * info.channels;
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    return r > 200 && g > 200 && b > 195 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
  };
  const rows = [];
  for (let yy = y0; yy < y1; yy++) {
    let n = 0;
    for (let xx = x0; xx < x1; xx++) if (hit(xx, yy)) n++;
    rows.push(n);
  }
  // Same white-ink row-band detector as the supplied ink-bbox helper.
  // Pair the band nearest the declared landmark, excluding adjacent labels.
  const bands = [];
  let band = -1;
  for (let i = 0; i <= rows.length; i++) {
    if (i < rows.length && rows[i] >= 2) {
      if (band < 0) band = i;
    } else if (band >= 0) {
      if (i - band >= 2) bands.push(band);
      band = -1;
    }
  }
  bands.sort((a, b) => Math.abs(y0 + a - y) - Math.abs(y0 + b - y));
  const first = bands[0] ?? -1;
  if (first < 0) return { label, top: null, left: null, width: null };
  const top = y0 + first;
  let left = x1,
    right = x0;
  for (let yy = top; yy < Math.min(y1, top + h); yy++)
    for (let xx = x0; xx < x1; xx++)
      if (hit(xx, yy)) {
        left = Math.min(left, xx);
        right = Math.max(right, xx);
      }
  return { label, top, left, width: right - left + 1 };
}
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
      implementation = ink(act, l),
      delta =
        reference.top === null || implementation.top === null
          ? null
          : implementation.top - reference.top;
    return {
      id: l[0],
      specTop: l[2],
      reference,
      implementation,
      delta,
      tolerance: 8,
      pass: delta !== null && Math.abs(delta) <= 8,
    };
  });
  for (const [section, from, to] of def.sections) {
    const ref = `${out}/frames/${name}-${section}-reference.png`,
      act = `${out}/frames/${name}-${section}-actual.png`;
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
        `${name}-${section}`,
        "--out",
        out,
      ],
      { stdio: "pipe" },
    );
  }
  report.push({ name, referenceScale: def.scale, landmarks });
  console.log(name, landmarks.map((l) => `${l.id}: ${l.delta}`).join(", "));
}
await writeFile(
  `${out}/landmarks.json`,
  JSON.stringify(
    {
      method:
        "Identical near-neutral bright-ink scanline detector, declared §6 regions; photographs excluded from pass criterion.",
      report,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  `${out}/landmarks.md`,
  "| Viewport | Landmark | Reference ink y | Actual ink y | Delta | ±8 |\n| --- | --- | ---: | ---: | ---: | --- |\n" +
    report
      .flatMap((r) =>
        r.landmarks.map(
          (l) =>
            `| ${r.name} | ${l.id} | ${l.reference.top} | ${l.implementation.top} | ${l.delta} | ${l.pass ? "PASS" : "FAIL"} |`,
        ),
      )
      .join("\n") +
    "\n",
);
