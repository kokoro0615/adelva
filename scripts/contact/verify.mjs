import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import sharp from "sharp";
const out = "docs/reports/site-revision-2026-09-10";
const references = JSON.parse(
  await fs.readFile("references/morght/contact/observations.json", "utf8"),
);
const b = await chromium.launch();
const results = [];
for (const reference of references) {
  const { viewport } = reference;
  const page = await b.newPage({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto((process.env.REVISION_URL ?? "http://127.0.0.1:4196") + "/contact");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#contact-category").selectOption({ label: "その他" });
  await page.locator("[data-contact-form]").evaluate((e) => e.reset());
  await page.locator("[data-home-footer]").scrollIntoViewIfNeeded();
  await page.locator("[data-home-footer] img").evaluate((e) => e.decode());
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(350);
  const current = await page.evaluate(() =>
    [...document.querySelectorAll("h1,form,select,textarea")].map((e) => {
      const r = e.getBoundingClientRect();
      return { tag: e.tagName, x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  const checks = [];
  for (const tag of ["H1", "FORM", "SELECT", "TEXTAREA"]) {
    const a = current.find((e) => e.tag === tag);
    const r = reference.elements.find((e) => e.tag === tag);
    for (const key of ["x", "w", "y"]) {
      const tolerance = key === "y" ? (tag === "H1" ? 8 : 22) : 3;
      checks.push({
        tag,
        key,
        reference: r[key],
        actual: a[key],
        delta: Math.abs(r[key] - a[key]),
        tolerance,
        pass: Math.abs(r[key] - a[key]) <= tolerance,
      });
    }
    if (tag === "SELECT" || tag === "TEXTAREA")
      checks.push({
        tag,
        key: "h",
        reference: r.h,
        actual: a.h,
        delta: Math.abs(r.h - a.h),
        tolerance: 3,
        pass: Math.abs(r.h - a.h) <= 3,
      });
  }
  const name = `contact-${viewport.width}`;
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  // Contact main only: ADELVA header/footer are explicit shell exceptions.
  // Differences remain visible (no pixel masking): metric is diagnostic.
  const actual = await sharp(`${out}/${name}.png`).metadata();
  const ref = await sharp(
    `references/morght/contact/reference-${viewport.width}.png`,
  ).metadata();
  const height = Math.min(actual.height, ref.height);
  const ra = await sharp(`references/morght/contact/reference-${viewport.width}.png`)
    .extract({ left: 0, top: 0, width: viewport.width, height })
    .removeAlpha()
    .raw()
    .toBuffer();
  const aa = await sharp(`${out}/${name}.png`)
    .extract({ left: 0, top: 0, width: viewport.width, height })
    .removeAlpha()
    .raw()
    .toBuffer();
  const overlay = Buffer.alloc(ra.length),
    diff = Buffer.alloc(ra.length);
  let sum = 0;
  for (let i = 0; i < ra.length; i++) {
    overlay[i] = Math.round((ra[i] + aa[i]) / 2);
    const d = Math.abs(ra[i] - aa[i]);
    sum += d;
    diff[i] = Math.min(255, d * 3);
  }
  await sharp(overlay, { raw: { width: viewport.width, height, channels: 3 } })
    .png()
    .toFile(`${out}/${name}-overlay.png`);
  await sharp(diff, { raw: { width: viewport.width, height, channels: 3 } })
    .png()
    .toFile(`${out}/${name}-diff.png`);
  results.push({
    viewport,
    scaleX: 1,
    scaleY: 1,
    checks,
    errors,
    pixelMAE: sum / ra.length / 255,
    missing: [],
    extra: [],
    intentional: [
      "ADELVA header/footer",
      "ADELVA categories",
      "UI-only status / no policy link",
      "stronger field/placeholder contrast",
      "16px inputs",
      "CSS ambience",
    ],
  });
  await page.close();
}
await b.close();
await fs.writeFile(`${out}/contact-fidelity.json`, JSON.stringify(results, null, 2));
const failed = results.flatMap((r) =>
  r.checks.filter((c) => !c.pass).map((c) => ({ width: r.viewport.width, ...c })),
);
console.log(
  JSON.stringify(
    {
      viewports: results.map((r) => r.viewport.width),
      failed,
      errors: results.flatMap((r) => r.errors),
    },
    null,
    2,
  ),
);
if (failed.length || results.some((r) => r.errors.length)) process.exitCode = 1;
