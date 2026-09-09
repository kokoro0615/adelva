import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { compareImagePair } from "../fidelity/compare-reference.mjs";

const root = "docs/reports/adelva-approach-implementation-2026-09-10";
const output = `${root}/fidelity`;
await mkdir(output, { recursive: true });
const report = {
  specification: "docs/specs/adelva-approach-granite-spec.md",
  threshold: 0.16,
  photography: [],
  geometry: [],
  discrepancies: [
    "A1 UI lettering is replaced with approved real HTML; duplicate wordmark removed.",
    "User requested stronger light and luminous tail after initial implementation.",
    "Photo brightness .84, top/bottom seam fades, local text scrims are intentional.",
    "Only fixed global chrome is suppressed in isolated scene screenshots; ordinary viewport evidence retains it.",
    "Playwright's outward-rounded section clip may add one pixel; reject larger mismatches before normalizing to the source image plane.",
  ],
};
for (const [variant, width, height, viewport] of [
  ["desktop", 1086, 1448, 1440],
  ["mobile", 724, 2172, 390],
]) {
  const original = `assets/source/generated/adelva/approach-2026-09-10/${variant}.png`;
  const screenshot = `${root}/evidence/scene-${viewport}.png`;
  const metadata = await sharp(screenshot).metadata();
  const expectedHeight = (viewport * height) / width;
  if (metadata.width !== viewport || Math.abs(metadata.height - expectedHeight) > 1)
    throw new Error(`Invalid framing: ${screenshot}`);
  const normalized = `${output}/${variant}-actual-normalized.png`;
  await sharp(screenshot)
    .resize(width, height, { fit: "fill" })
    .png()
    .toFile(normalized);
  const adjusted = `${output}/${variant}-photo-reference.png`;
  await sharp(original).linear(0.84).png().toFile(adjusted);
  const pair = await compareImagePair({
    referencePath: adjusted,
    actualPath: normalized,
    label: `${variant}-photography`,
    outputRoot: output,
  });
  const region = {
    left: Math.round(width * 0.02),
    top: Math.round(height * 0.32),
    width: Math.round(width * 0.16),
    height: Math.round(height * 0.28),
  };
  const crop = async (file) =>
    sharp(file).extract(region).removeAlpha().raw().toBuffer();
  const [a, b] = await Promise.all([crop(adjusted), crop(normalized)]);
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  const mae = total / a.length / 255;
  report.photography.push({
    variant,
    source: { width, height },
    actual: { width: metadata.width, height: metadata.height },
    scale: width / viewport,
    region,
    normalizedRgbMae: mae,
    pass: mae <= report.threshold,
    fullFrameDiagnostic: pair.normalizedRgbMae,
  });
}
report.approvedA1Diagnostic = await compareImagePair({
  referencePath:
    "references/adelva/mockups/approach-2026-09-10/monumental/A1-granite-garden.png",
  actualPath: `${output}/desktop-actual-normalized.png`,
  label: "approved-a1",
  outputRoot: output,
});
const browser = await chromium.launch();
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await page.goto(process.env.APPROACH_TEST_URL ?? "http://127.0.0.1:4191");
  await page.locator("#approach").scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const measurements = await page.locator("#approach").evaluate((root) => {
    const scene = root.querySelector("[data-approach-scene]").getBoundingClientRect();
    const svg = [...root.querySelectorAll("svg[data-route]")].find(
      (el) => getComputedStyle(el).display !== "none",
    );
    const path = svg.querySelector("[data-path-flown]");
    const samples = Array.from({ length: 4097 }, (_, i) =>
      path.getPointAtLength((path.getTotalLength() * i) / 4096),
    );
    const labels = [...root.querySelectorAll("li")];
    const nodes = [...svg.querySelectorAll("[data-path-node]")].map((node, i) => {
      const x = node.cx.baseVal.value;
      const y = node.cy.baseVal.value;
      const box = labels[i].getBoundingClientRect();
      const nodeBox = node.getBoundingClientRect();
      return {
        step: labels[i].textContent,
        x,
        y,
        pathDistance: Math.min(...samples.map((p) => Math.hypot(p.x - x, p.y - y))),
        labelCenterDelta: Math.abs(
          box.y + box.height / 2 - nodeBox.y - nodeBox.height / 2,
        ),
        labelFont: getComputedStyle(labels[i]).fontSize,
      };
    });
    return { scene: { width: scene.width, height: scene.height }, nodes };
  });
  const pass = measurements.nodes.every(
    (node) => node.pathDistance <= 12 && node.labelCenterDelta <= 3,
  );
  report.geometry.push({ viewport: { width, height }, ...measurements, pass });
  await page.close();
}
await browser.close();
report.pass =
  report.photography.every((p) => p.pass) && report.geometry.every((g) => g.pass);
await writeFile(
  `${root}/fidelity-results.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      pass: report.pass,
      photography: report.photography,
      geometry: report.geometry.map((g) => ({ viewport: g.viewport, pass: g.pass })),
    },
    null,
    2,
  ),
);
if (!report.pass) process.exitCode = 1;
