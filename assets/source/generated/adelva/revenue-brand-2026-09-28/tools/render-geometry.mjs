// Draw a geometry JSON over its plate for review (Opus 5.5).
// usage: node render-geometry.mjs <plate.png> <geometry.json> <out.png>
import sharp from "sharp";
import { readFileSync } from "node:fs";
const [plate, geo, out] = process.argv.slice(2);
const g = JSON.parse(readFileSync(geo, "utf8"));
const { width: W, height: H } = g.plate;
let s = "";
for (const m of g.lineMasks) s += `<rect x="${m.rect[0]}" y="${m.rect[1]}" width="${m.rect[2]}" height="${m.rect[3]}" fill="#00f" fill-opacity="0.18" stroke="#44f"/>`;
const [ly0, ly1] = g.lakeDottedRangeY;
s += `<rect x="0" y="${ly0}" width="8" height="${ly1 - ly0}" fill="#0ff"/>`;
s += `<path d="${g.paths.main.d}" fill="none" stroke="#ff7e15" stroke-width="3"/>`;
for (const k of ["tributaryLeft", "tributaryRight", "loopOther"]) s += `<path d="${g.paths[k].d}" fill="none" stroke="#ffd000" stroke-width="3"/>`;
if (g.paths.sources) for (const v of Object.values(g.paths.sources)) s += `<path d="${v.d}" fill="none" stroke="#ff7e15" stroke-width="3"/><circle cx="${v.node[0]}" cy="${v.node[1]}" r="7" fill="#ff7e15"/>`;
const walk = (o, f) => Object.values(o).forEach((v) => (typeof v[0] === "number" ? f(v) : walk(v, f)));
walk(g.dots, (p) => (s += `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="none" stroke="#fff" stroke-width="2.5"/>`));
walk(g.chips, (p) => (s += `<rect x="${p[0] - 40}" y="${p[1] - 14}" width="80" height="28" rx="14" fill="none" stroke="#0f0" stroke-width="2"/>`));
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`);
await sharp(plate).composite([{ input: svg }]).png().toFile(out);
