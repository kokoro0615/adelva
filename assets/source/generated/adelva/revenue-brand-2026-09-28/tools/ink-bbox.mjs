// Ink bounding boxes of text in the adopted mock (measurement helper, Opus 5.5).
// usage: node ink-bbox.mjs <image> '<json [{id, box:[x0,y0,x1,y1], mode:"white"|"orange"|"dark"}]>'
// Prints per id: bbox [x0,y0,x1,y1], and ink row bands (text lines) inside the box.
import sharp from "sharp";
const [img, json] = process.argv.slice(2);
const items = JSON.parse(json);
const { data, info } = await sharp(img)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const test = {
  white: (r, g, b) =>
    r > 200 && g > 200 && b > 195 && Math.max(r, g, b) - Math.min(r, g, b) < 40,
  orange: (r, g, b) => r > 200 && r - b > 110 && g > 70 && g < 190,
  dark: (r, g, b) => r < 70 && g < 70 && b < 80,
};
for (const it of items) {
  const [x0, y0, x1, y1] = it.box;
  const f = test[it.mode ?? "white"];
  let bx0 = 1e9,
    by0 = 1e9,
    bx1 = -1,
    by1 = -1;
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let n = 0;
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 3;
      if (f(data[i], data[i + 1], data[i + 2])) {
        n++;
        bx0 = Math.min(bx0, x);
        bx1 = Math.max(bx1, x);
        by0 = Math.min(by0, y);
        by1 = Math.max(by1, y);
      }
    }
    rows.push(n);
  }
  const bands = [];
  let start = -1;
  rows.forEach((n, k) => {
    const on = n >= (it.min ?? 2);
    if (on && start < 0) start = k;
    if (!on && start >= 0) {
      if (k - start >= 2) bands.push([y0 + start, y0 + k - 1]);
      start = -1;
    }
  });
  if (start >= 0) bands.push([y0 + start, y1]);
  console.log(
    it.id.padEnd(14),
    "bbox",
    bx1 < 0 ? "none" : [bx0, by0, bx1, by1].join(","),
    "lines",
    bands.map((b) => b.join("-")).join(" "),
  );
}
