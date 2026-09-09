import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import sharp from "sharp";
await mkdir("artifacts/morght/diff", { recursive: true });
const failures = [],
  results = [];
for (const width of [1440, 768, 390]) {
  const ref = JSON.parse(
    await readFile(`references/morght/final/${width}.json`, "utf8"),
  );
  const actual = JSON.parse(
    await readFile(`artifacts/morght/final/${width}.json`, "utf8"),
  );
  const missing = ref.directChildren.filter(
    (id) => !actual.directChildren.includes(id),
  );
  const extra = actual.directChildren.filter((id) => !ref.directChildren.includes(id));
  const structural = [];
  for (const entry of [ref, actual]) {
    if (entry.schemaVersion !== 1 || entry.scope !== "route-content")
      structural.push("schema/scope");
    if (entry.status !== 200 || entry.errors?.length)
      structural.push({ browser: entry.errors, status: entry.status });
    if (new Set(entry.directChildren).size !== entry.directChildren.length)
      structural.push("duplicate section");
    const required = [
      "top",
      "overview",
      "menu",
      ...[...entry.sections, ...entry.shell.sections].flatMap((s) =>
        ["start", "center", "end", "crop"].map((p) => `${s.id}-${p}`),
      ),
      ...["start", "mid", "end", "reverse"].map((p) => `circle-${p}`),
    ];
    for (const name of required)
      if (!entry.artifacts.some((a) => a.name === name))
        structural.push(`missing evidence ${name}`);
    if (!entry.artifacts.some((a) => a.name === "overview" && a.fullPage))
      structural.push("missing full-page overview");
  }
  if (ref.route !== "/" || actual.route !== "/about")
    structural.push("route authority");
  if (missing.length || extra.length) structural.push({ missing, extra });
  if (JSON.stringify(ref.directChildren) !== JSON.stringify(actual.directChildren))
    structural.push("order");
  if (ref.width !== actual.width || ref.height !== actual.height)
    structural.push("viewport");
  if (Math.abs(ref.scrollHeight - actual.scrollHeight) > 8)
    structural.push({ height: [ref.scrollHeight, actual.scrollHeight] });
  for (const a of [...ref.artifacts, ...actual.artifacts])
    await access(a.path).catch(() => structural.push(`missing ${a.path}`));
  for (const [i, s] of [...ref.sections, ...ref.shell.sections].entries()) {
    const a = [...actual.sections, ...actual.shell.sections][i];
    if (
      s.kind !== a.kind ||
      s.parent !== a.parent ||
      s.order !== a.order ||
      s.heading !== a.heading ||
      s.items !== a.items
    )
      structural.push({
        id: s.id,
        semantic: [s.heading, a.heading],
        items: [s.items, a.items],
      });
    for (const key of ["x", "y", "width", "height"])
      if (
        Math.abs(s.bounds[key] - a.bounds[key]) >
        { intro: 2, mission: 3, service: 5, career: 6, news: 6, company: 8, footer: 8 }[
          s.id
        ]
      )
        structural.push({
          id: s.id,
          key,
          reference: s.bounds[key],
          actual: a.bounds[key],
        });
  }
  for (const layer of ref.motion) {
    const a = actual.motion.find((x) => x.id === layer.id);
    if (!a) {
      structural.push("missing motion " + layer.id);
      continue;
    }
    if (Math.abs(layer.pinDistance - a.pinDistance) > 3)
      structural.push("pin distance");
    for (let i = 0; i < layer.samples.length; i++)
      for (const k of ["crop", "image"])
        if (Math.abs(layer.samples[i][k] - a.samples[i][k]) > 3)
          structural.push({
            motion: layer.id,
            phase: layer.samples[i].phase,
            k,
            reference: layer.samples[i][k],
            actual: a.samples[i][k],
          });
  }
  console.log(
    width,
    "missing=" + JSON.stringify(missing),
    "extra=" + JSON.stringify(extra),
    "structure",
    JSON.stringify(structural),
  );
  failures.push(...structural.map((x) => ({ width, structural: x })));
  const names = [
    "top",
    "mission-start",
    "service-center",
    "career-end",
    "news-start",
    "company-center",
    "footer-start",
    "menu",
    "circle-start",
    "circle-mid",
    "circle-end",
  ];
  for (const name of names) {
    const r = ref.artifacts.find((x) => x.name === name),
      a = actual.artifacts.find((x) => x.name === name);
    const rb = await sharp(r.path).removeAlpha().raw().toBuffer(),
      ab = await sharp(a.path).removeAlpha().raw().toBuffer();
    if (rb.length !== ab.length) {
      failures.push({ width, name, error: "raster size" });
      continue;
    }
    let sum = 0,
      changed = 0;
    const diff = Buffer.alloc(rb.length),
      overlay = Buffer.alloc(rb.length);
    for (let i = 0; i < rb.length; i += 3) {
      let max = 0;
      for (let j = 0; j < 3; j++) {
        const d = Math.abs(rb[i + j] - ab[i + j]);
        sum += d;
        max = Math.max(max, d);
        diff[i + j] = Math.min(255, d * 4);
        overlay[i + j] = Math.round((rb[i + j] + ab[i + j]) / 2);
      }
      if (max > 25.5) changed++;
    }
    const mae = sum / rb.length / 255,
      ratio = changed / (rb.length / 3),
      pass = mae <= 0.025 && ratio <= 0.08;
    const prefix = `artifacts/morght/diff/${width}-${name}`;
    await sharp(diff, { raw: { width, height: ref.height, channels: 3 } })
      .png()
      .toFile(prefix + "-difference.png");
    await sharp(overlay, { raw: { width, height: ref.height, channels: 3 } })
      .png()
      .toFile(prefix + "-overlay.png");
    results.push({
      width,
      name,
      mae,
      changedPixelRatio: ratio,
      pass,
      reference: r.path,
      actual: a.path,
      overlay: prefix + "-overlay.png",
      difference: prefix + "-difference.png",
    });
    if (!pass) failures.push({ width, name, mae, ratio });
  }
}
await writeFile(
  "artifacts/morght/fidelity-report.json",
  JSON.stringify(
    {
      schemaVersion: 1,
      thresholds: { mae: 0.025, changedPixelRatio: 0.08, bounds: 8 },
      failures,
      results,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    { failures, pass: results.filter((r) => r.pass).length, total: results.length },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
