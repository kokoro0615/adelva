import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const path = "references/morght/asset-manifest.json";
const manifest = JSON.parse(await readFile(path, "utf8")).filter(
  (a) => !a.id.endsWith("-still.webp"),
);
const dimensions = {};
for (const a of [...manifest]) {
  if (!a.width || !a.height) continue;
  dimensions[a.id] = { width: a.width, height: a.height };
  if (!a.id.endsWith("-deco.png")) continue;
  const output = a.path.replace(".png", "-still.webp");
  await sharp("public" + a.path)
    .webp({ lossless: true })
    .toFile("public" + output);
  manifest.push({
    ...a,
    id: a.id.replace(".png", "-still.webp"),
    path: output,
    transformation: "APNG first frame, lossless WebP; original preserved",
    role: "reduced-motion and pause fallback",
  });
}
await writeFile(path, JSON.stringify(manifest, null, 2));
await writeFile(
  "src/content/morght/dimensions.json",
  JSON.stringify(dimensions, null, 2),
);
