/** Delivery derivatives for /contact (docs/specs/adelva-contact-spec.md §10).
 * Deterministic: bakes the C2 mock's multiply tone into the plates, then tiles.
 * No generative image changes. */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const mock = "references/adelva/mockups/contact-r2-2026-09-29/C2";
const out = "public/media/adelva/contact";
const record = "assets/source/generated/adelva/contact-2026-09-29";
await mkdir(out, { recursive: true });
await mkdir(record, { recursive: true });

/** The mock's `.tone` layer: rgb(58 72 96) multiplied with alpha stops in page px. */
const TONE = [58, 72, 96];
const tones = {
  // C2/build/style.css: 4200 px tall at 1440 wide; plate px = page px / 0.9375.
  d: {
    pageToPlate: 1536 / 1440,
    stops: [
      [0, 0.34],
      [0.62, 0.3],
      [0.88, 0.16],
      [1, 0],
    ],
    height: 4200,
  },
  // C2/mobile/build/style.css: 3300 px tall at 390 wide.
  m: {
    pageToPlate: 853 / 390,
    stops: [
      [0, 0.3],
      [0.7, 0.26],
      [1, 0],
    ],
    height: 3300,
  },
};

function alphaAt(tone, plateRow) {
  const t = plateRow / (tone.height * tone.pageToPlate);
  if (t >= 1) return 0;
  const s = tone.stops;
  for (let i = 1; i < s.length; i++)
    if (t <= s[i][0]) {
      const f = (t - s[i - 1][0]) / (s[i][0] - s[i - 1][0]);
      return s[i - 1][1] + (s[i][1] - s[i - 1][1]) * f;
    }
  return 0;
}

async function tonedPlate(path, key) {
  const { data, info } = await sharp(path)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const tone = tones[key];
  for (let y = 0; y < info.height; y++) {
    const a = alphaAt(tone, y);
    if (!a) continue;
    const f = TONE.map((c) => 1 - a + (a * c) / 255);
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 3;
      data[i] = Math.round(data[i] * f[0]);
      data[i + 1] = Math.round(data[i + 1] * f[1]);
      data[i + 2] = Math.round(data[i + 2] * f[2]);
    }
  }
  return { raw: data, info };
}

const derivatives = [];
async function encode(input, name, width, format, crop, role, loading) {
  let p = input.raw
    ? sharp(input.raw, {
        raw: { width: input.info.width, height: input.info.height, channels: 3 },
      })
    : sharp(input.path);
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
    source: input.source,
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
    loading,
  });
}

for (const [key, source, width, height, count, small] of [
  ["d", `${mock}/plates/plate.png`, 1536, 6144, 8, 1024],
  ["m", `${mock}/mobile/plate.png`, 853, 12960, 10, 600],
]) {
  const toned = { ...(await tonedPlate(source, key)), source };
  const step = height / count;
  for (let n = 0; n < count; n++)
    for (const w of [width, small])
      for (const f of ["avif", "webp"])
        await encode(
          toned,
          `${key}-plate-${n}`,
          w,
          f,
          {
            left: 0,
            top: n * step,
            width,
            height: step + (n === count - 1 ? 0 : 4),
          },
          "background",
          n === 0 ? "media-specific preload" : n === 1 ? "eager" : "lazy",
        );
  console.log(`${key}: ${count} tiles`);
}

for (const [name, file, width, small] of [
  ["d-clear-0", `${mock}/raw/V-clear-T00.png`, 1536, 1024],
  ["d-clear-1", `${mock}/raw/V-clear-T01.png`, 1536, 1024],
  ["d-clear-4", `${mock}/raw/V-clear-T04.png`, 1536, 1024],
  ["m-clear-1", `${mock}/mobile/variants/V-B1.png`, 853, 600],
  ["m-clear-2", `${mock}/mobile/variants/V-B2.png`, 853, 600],
  ["m-clear-4", `${mock}/mobile/variants/V-B4.png`, 853, 600],
  ["m-clear-5", `${mock}/mobile/variants/V-B5.png`, 853, 600],
])
  for (const w of [width, small])
    for (const f of ["avif", "webp"])
      await encode(
        { path: file, source: file },
        name,
        w,
        f,
        null,
        "fog-lifted variant",
        "after first interaction",
      );

const sources = {};
for (const d of derivatives)
  if (!sources[d.source])
    sources[d.source] = createHash("sha256")
      .update(await readFile(d.source))
      .digest("hex");

await writeFile(
  `${record}/manifest.json`,
  JSON.stringify(
    {
      generatedBy: "scripts/adelva/prepare-contact-assets.mjs",
      sourceOwner: "ADELVA project",
      sourceMethod:
        "Built-in image_gen clean plates and fog-lifted variants (Codex gpt-6-astra workers, Opus prompts and stitching); see the C2 READMEs",
      tone: { color: TONE, ...tones },
      sources,
      derivatives,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${derivatives.length} files; manifest written`);
