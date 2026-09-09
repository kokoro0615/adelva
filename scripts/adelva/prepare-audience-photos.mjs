import sharp from "sharp";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = "assets/source/generated/adelva/audience-2026-09-10";
const destination = "public/media/adelva/audience-v4";
await mkdir(destination, { recursive: true });
const manifest = [];
for (const file of (await readdir(source)).filter((x) => x.endsWith(".png")).sort()) {
  const name = file.replace(".png", "");
  const image = sharp(`${source}/${file}`);
  const { width, height } = await image.metadata();
  const formats = [];
  for (const size of [
    ...new Set(name.endsWith("mobile") ? [width] : [Math.min(840, width), width]),
  ]) {
    const output = `${destination}/${name}${size === width ? "" : "-" + size}.webp`;
    const data = await image
      .clone()
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: 96, effort: 6 })
      .toBuffer();
    await writeFile(output, data);
    formats.push({
      path: output.replace(/^public/, ""),
      width: size,
      height: Math.round((height * size) / width),
      bytes: data.length,
      sha256: createHash("sha256").update(data).digest("hex"),
    });
  }
  manifest.push({
    name,
    source: `${source}/${file}`,
    width,
    height,
    formats,
    owner: "ADELVA commissioned original imagegen output",
    license:
      "User-requested generated original for this website; fictional property, no client/project attribution",
    role: "decorative hospitality photography",
    altIntent: "empty",
    loading:
      name.includes("exterior") || name.includes("lobby")
        ? "hero eager/high priority"
        : "lazy HTML photograph; water is CSS background",
    generation:
      "Built-in subscription imagegen; requested canvas is not observed output; no upscale",
    reference: name.endsWith("mobile")
      ? "Generated landscape master as identity/material reference"
      : "Original prompt; Aman.com is mood research only, no third-party assets used",
  });
}
await writeFile(`${source}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  manifest.map(({ name, width, height, formats }) => ({
    name,
    width,
    height,
    bytes: formats.reduce((s, f) => s + f.bytes, 0),
  })),
);
