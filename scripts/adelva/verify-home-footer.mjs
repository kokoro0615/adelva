import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const out = "artifacts/adelva-home-footer";
async function raster(path, width) {
  const { data, info } = await sharp(path)
    .resize({ width })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, ...info };
}
function bounds(image, [x0, y0, x1, y1], threshold = 165) {
  let xMin = Infinity,
    yMin = Infinity,
    xMax = -1,
    yMax = -1;
  for (let y = y0; y < Math.min(y1, image.height); y++)
    for (let x = x0; x < Math.min(x1, image.width); x++) {
      const i = (y * image.width + x) * image.channels;
      if (
        image.data[i] > threshold &&
        image.data[i + 1] > threshold - 5 &&
        image.data[i + 2] > threshold - 20 &&
        Math.abs(image.data[i] - image.data[i + 1]) < 30
      ) {
        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x);
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
      }
    }
  return { x: xMin, y: yMin, width: xMax - xMin + 1, height: yMax - yMin + 1 };
}
function rule(image, y0, y1) {
  let best = { y: -1, x: 0, width: 0 };
  let left = Infinity;
  for (let y = y0; y < y1; y++) {
    let min = Infinity,
      count = 0;
    for (let x = Math.round(image.width * 0.025); x < image.width * 0.975; x++) {
      const i = (y * image.width + x) * image.channels;
      const [r, g, b] = image.data.subarray(i, i + 3);
      if (r > 65 && g > 65 && b > 55 && Math.abs(r - g) < 15) {
        min = Math.min(min, x);
        count++;
      }
    }
    if (count > image.width * 0.1) left = Math.min(left, min);
    if (count > best.width) best = { y, x: min, width: count };
  }
  return { ...best, x: left };
}
const result = [];
for (const [w, n] of [
  [1440, "desktop"],
  [390, "mobile"],
]) {
  const ref = await raster(
    `references/adelva/mockups/home-footer-2026-09-09/home-footer-${n}.png`,
    w,
  );
  const actual = await raster(`${out}/${w}-footer.png`, w);
  const cases =
    w === 1440
      ? [
          ["heading", [75, 190, 620, 295], 165, ["x", "y", "height"], 8],
          ["contact-label", [80, 395, 340, 450], 165, ["x", "y"], 8],
          ["audience-heading", [80, 545, 320, 595], 110, ["x", "y"], 8],
          ["service-heading", [510, 545, 750, 595], 110, ["x", "y"], 8],
          ["about-heading", [940, 545, 1240, 595], 110, ["x", "y"], 8],
          ["wordmark", [45, 765, 1400, 990], 165, ["x", "y", "height"], 10],
        ]
      : [
          ["heading", [25, 276, 275, 328], 165, ["x", "y", "height"], 8],
          ["contact-label", [25, 385, 220, 420], 165, ["x", "y"], 8],
          ["audience-heading", [25, 470, 260, 505], 110, ["x", "y"], 8],
          ["service-heading", [25, 600, 260, 638], 110, ["x", "y"], 8],
          ["about-heading", [25, 760, 260, 801], 110, ["x", "y"], 8],
          ["wordmark", [15, 930, 378, 1010], 165, ["x", "y", "height"], 10],
        ];
  const checks = cases.map(([name, region, t, keys, tolerance]) => {
    const reference = bounds(ref, region, t),
      implementation = bounds(actual, region, t);
    const delta = Object.fromEntries(
      keys.map((k) => [k, implementation[k] - reference[k]]),
    );
    return {
      name,
      reference,
      implementation,
      delta,
      tolerance,
      pass: Object.values(delta).every((v) => Math.abs(v) <= tolerance),
    };
  });
  for (const [name, y0, y1, tolerance] of w === 1440
    ? [
        ["main-rule", 500, 530, 5],
        ["bottom-rule", 995, 1025, 6],
      ]
    : [
        ["main-rule", 433, 459, 5],
        ["bottom-rule", 1010, 1035, 6],
      ]) {
    const reference = rule(ref, y0, y1),
      implementation = rule(actual, y0, y1);
    const delta = {
      y: implementation.y - reference.y,
      x: implementation.x - reference.x,
    };
    checks.push({
      name,
      reference,
      implementation,
      delta,
      tolerance,
      pass: Math.abs(delta.y) <= tolerance && Math.abs(delta.x) <= 4,
    });
  }
  checks.push({
    name: "footer-height",
    reference: ref.height,
    implementation: actual.height,
    tolerance: 12,
    pass: Math.abs(actual.height - ref.height) <= 12,
  });
  result.push({ viewport: w, checks, pass: checks.every((c) => c.pass) });
}
await writeFile(`${out}/landmarks.json`, JSON.stringify(result, null, 2) + "\n");
for (const r of result)
  console.log(
    r.viewport,
    r.pass ? "PASS" : "FAIL",
    r.checks.filter((c) => !c.pass),
  );
if (result.some((r) => !r.pass)) process.exitCode = 1;
