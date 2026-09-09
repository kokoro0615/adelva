import { readFile, writeFile, stat, mkdir } from "node:fs/promises";
import sharp from "sharp";
const out = "references/nosigner/diff";
await mkdir(out, { recursive: true });
const report = {
  schema: "nosigner-fidelity/v1",
  route: "/challenges",
  source: "https://nosigner.com/ja/",
  missing: [],
  extra: [],
  geometry: [],
  artifacts: [],
  pixels: [],
  notes: [
    "Time-varying canvas noise is an authored approximation and is not asserted pixel-identical.",
    "A11y controls and contrast are documented intentional deviations.",
  ],
};
const required = [
  "intro",
  "how",
  "quote-form",
  "why",
  "news",
  "quote-future",
  "footer",
  ...Array.from({ length: 16 }, (_, i) => "strip-" + i),
];
for (const w of [1440, 768, 390]) {
  const r = JSON.parse(await readFile(`references/nosigner/reference/${w}.json`));
  const a = JSON.parse(await readFile(`references/nosigner/actual/${w}.json`));
  for (const id of required) {
    const rr = r.landmarks.find((x) => x.id === id),
      aa = a.landmarks.find((x) => x.id === id);
    if (!rr || !aa) {
      report.missing.push({ w, id, reference: !!rr, actual: !!aa });
      continue;
    }
    for (const key of ["x", "y", "width", "height"]) {
      const delta = Math.abs(rr[key] - aa[key]);
      if (delta > (id === "footer" ? 8 : 5))
        report.geometry.push({
          w,
          id,
          key,
          reference: rr[key],
          actual: aa[key],
          delta,
        });
    }
  }
  for (const x of a.landmarks)
    if (!required.includes(x.id) && !["index-main", "how-group"].includes(x.id))
      report.extra.push({ w, id: x.id });
  if (Math.abs(r.scrollHeight - a.scrollHeight) > 12)
    report.geometry.push({
      w,
      id: "document",
      delta: Math.abs(r.scrollHeight - a.scrollHeight),
    });
  for (const state of [
    "hero",
    "intro",
    "intro-end",
    "how",
    "why",
    "news",
    "footer",
    "menu",
    "quote-form",
    "quote-future",
  ]) {
    const ref = `references/nosigner/reference/${w}-${state}.png`,
      act = `references/nosigner/actual/${w}-${state}.png`;
    for (const path of [ref, act]) {
      try {
        await stat(path);
      } catch {
        report.artifacts.push({ missing: path });
      }
    }
    const R = await sharp(ref)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const A = await sharp(act).removeAlpha().raw().toBuffer();
    if (R.data.length !== A.length) throw Error("raster dimension mismatch");
    let sum = 0,
      changed = 0;
    const d = Buffer.alloc(A.length),
      overlay = Buffer.alloc(A.length);
    for (let i = 0; i < A.length; i += 3) {
      let mx = 0;
      for (let c = 0; c < 3; c++) {
        const delta = Math.abs(R.data[i + c] - A[i + c]);
        sum += delta;
        mx = Math.max(mx, delta);
        d[i + c] = Math.min(255, delta * 4);
        overlay[i + c] = Math.round((R.data[i + c] + A[i + c]) / 2);
      }
      if (mx > 16) changed++;
    }
    const metrics = {
      width: w,
      state,
      mae: sum / A.length / 255,
      changedRatio: changed / (A.length / 3),
      status:
        state === "hero"
          ? sum / A.length / 255 <= 0.02 && changed / (A.length / 3) <= 0.03
            ? "pass"
            : "fail"
          : "diagnostic",
    };
    report.pixels.push(metrics);
    await sharp(d, { raw: { width: R.info.width, height: R.info.height, channels: 3 } })
      .png()
      .toFile(`${out}/${w}-${state}-difference.png`);
    await sharp(overlay, {
      raw: { width: R.info.width, height: R.info.height, channels: 3 },
    })
      .png()
      .toFile(`${out}/${w}-${state}-overlay.png`);
  }
  for (const tile of r.tiles ?? []) {
    try {
      await stat(tile.path);
    } catch {
      report.artifacts.push({ missing: tile.path });
    }
  }
}
report.structurePassed =
  !report.missing.length &&
  !report.extra.length &&
  !report.geometry.length &&
  !report.artifacts.length;
report.heroPassed = report.pixels
  .filter((x) => x.state === "hero")
  .every((x) => x.status === "pass");
report.fullVisualAcceptance = {
  status: "blocked",
  reasons: [
    "Canvas2D light fields differ from the source WebGL shader and its timed phases.",
    "Mobile menu opens at the beginning for keyboard access; source framing differs.",
    "The measured geometry/hero checks are only a subset of full-page visual acceptance.",
  ],
};
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      missing: report.missing,
      extra: report.extra,
      geometry: report.geometry,
      hero: report.pixels.filter((x) => x.state === "hero"),
      structurePassed: report.structurePassed,
    },
    null,
    2,
  ),
);
// Fail closed for full fidelity. The explicit subset command is diagnostic and
// never grants full-page acceptance or promotes authored regression goldens.
if (
  !report.structurePassed ||
  !report.heroPassed ||
  !process.argv.includes("--geometry-and-hero")
)
  process.exitCode = 1;
