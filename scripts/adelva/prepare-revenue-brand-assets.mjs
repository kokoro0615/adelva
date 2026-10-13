/** Deterministic delivery derivatives; spec §10. No generative image changes. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const base = "assets/source/generated/adelva/revenue-brand-2026-09-28";
const out = "public/media/adelva/revenue-brand";
await mkdir(out, { recursive: true });
const derivatives = [];
// `--only=fog` re-encodes just the fog layers (the plates and cards are
// unchanged and slow to encode).
const onlyFog = process.argv.includes("--only=fog");
async function encode(input, name, width, format, crop, role) {
  let p = sharp(`${base}/${input}`);
  if (crop) p = p.extract(crop);
  p = p.resize({ width, kernel: "lanczos3" });
  p =
    format === "avif"
      ? p.avif({ quality: 58, effort: 5 })
      : p.webp({ quality: 80, effort: 6, smartSubsample: true });
  const path = `${out}/${name}-${width}.${format}`;
  const info = await p.toFile(path);
  const bytes = await readFile(path);
  derivatives.push({
    path,
    source: `${base}/${input}`,
    role,
    width: info.width,
    height: info.height,
    format,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    crop: crop ?? null,
    alt: "",
    owner: "ADELVA project",
    license: "User-authorized generated imagery; fictional locations",
    loading:
      role === "background"
        ? name.endsWith("-0")
          ? "media-specific preload"
          : name.endsWith("-1")
            ? "eager"
            : "lazy"
        : "lazy",
  });
}
// Sequential tile families bound encoder memory while the main worktree builds.
for (const [key, width, height, count, small] of onlyFog
  ? []
  : [
      ["d", 1536, 8704, 8, 1024],
      ["m", 853, 12960, 10, 600],
    ]) {
  for (let n = 0; n < count; n++)
    for (const w of [width, small])
      for (const f of ["avif", "webp"])
        await encode(
          `plates/${key === "d" ? "desktop" : "mobile"}-plate.png`,
          `${key}-plate-${n}`,
          w,
          f,
          {
            left: 0,
            top: (n * height) / count,
            width,
            height: height / count + (n === count - 1 ? 0 : 4),
          },
          "background",
        );
  console.log(`${key}: ${count * 4} tiles`);
}
for (const c of onlyFog ? [] : ["C1", "C2"])
  for (const w of [1200, 800])
    for (const f of ["avif", "webp"])
      await encode(`raw/${c}.png`, c.toLowerCase(), w, f, null, "related-card");
/* The fog plates are mist on black, made to be screen-blended. Screen with a
 * grey layer f equals ordinary alpha compositing of white-ish colour f/a at
 * alpha a = max(f): b + f - bf = b(1 - a) + f when the channels agree. These
 * alpha versions let the page composite the mist without a blend mode (R4). */
async function fogAlpha(input, name, width) {
  const { data, info } = await sharp(`${base}/${input}`)
    .resize({ width, kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // One flat colour (the mist's alpha-weighted mean hue) keeps the colour
  // planes featureless, so the alpha version stays small.
  const sum = [0, 0, 0];
  let weight = 0;
  for (let i = 0; i < data.length; i += 3) {
    const a = Math.max(data[i], data[i + 1], data[i + 2]);
    if (a < 8) continue;
    for (let c = 0; c < 3; c++) sum[c] += data[i + c];
    weight += a;
  }
  const tint = sum.map((v) => Math.min(255, Math.round((v / (weight || 1)) * 255)));
  const out4 = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    out4[j] = tint[0];
    out4[j + 1] = tint[1];
    out4[j + 2] = tint[2];
    out4[j + 3] = Math.max(data[i], data[i + 1], data[i + 2]);
  }
  for (const format of ["avif", "webp"]) {
    const path = `${out}/${name}-${width}.${format}`;
    const encoder = sharp(out4, {
      raw: { width: info.width, height: info.height, channels: 4 },
    });
    const info2 = await (
      format === "avif"
        ? encoder.avif({ quality: 55, effort: 5 })
        : encoder.webp({ quality: 70, alphaQuality: 50, effort: 6 })
    ).toFile(path);
    const bytes = await readFile(path);
    derivatives.push({
      path,
      source: `${base}/${input}`,
      role: "fog (alpha, screen-equivalent)",
      width: info2.width,
      height: info2.height,
      format,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      crop: null,
      alt: "",
      owner: "ADELVA project",
      license: "User-authorized generated imagery; fictional locations",
      loading: "lazy",
    });
  }
}
for (const c of ["F1", "F2"])
  for (const w of [1536, 768]) await fogAlpha(`raw/${c}.png`, `${c.toLowerCase()}a`, w);
if (onlyFog) {
  // Swap only the fog entries of the existing manifest.
  const manifest = JSON.parse(await readFile(`${base}/manifest.json`, "utf8"));
  manifest.derivatives = [
    ...manifest.derivatives.filter((d) => !String(d.role).startsWith("fog")),
    ...derivatives,
  ];
  await writeFile(`${base}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
  console.log(derivatives.map((d) => `${d.path} ${d.bytes}`).join("\n"));
  process.exit(0);
}
await writeFile(
  `${base}/manifest.json`,
  JSON.stringify(
    {
      generatedBy: "scripts/adelva/prepare-revenue-brand-assets.mjs",
      sourceOwner: "ADELVA project",
      sourceMethod:
        "Built-in image_gen; prompts and stitching by Opus; Astra image workers",
      derivatives,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
