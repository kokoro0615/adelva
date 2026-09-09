import sharp from "sharp";
import { readdir } from "node:fs/promises";
// Exact Figma assets retained for reproducibility. Photographs only; UI stays HTML.
const source = "references/adelva/audience-v3/source-assets/";
const out = "public/media/adelva/audience-v3/";
for (const name of await readdir(source)) {
  if (
    !name.endsWith(".png") ||
    name.includes("Logo") ||
    name.includes("ExactSourceCrop")
  )
    continue;
  await sharp(source + name)
    .webp({ quality: 95 })
    .toFile(out + name.replace(/\.png$/, ".webp"));
}
const composite = source + "189-669-imgCorridorExactSourceCrop.png";
await sharp(composite)
  .resize(1441, 3584, { fit: "fill" })
  .extract({ left: 0, top: 1196, width: 637, height: 453 })
  .webp({ quality: 95 })
  .toFile(out + "gm-corridor-crop.webp");
await sharp(composite)
  .resize(1440, 3579, { fit: "fill" })
  .extract({ left: 0, top: 2093, width: 1440, height: 275 })
  .webp({ quality: 95 })
  .toFile(out + "gm-dining-crop.webp");
