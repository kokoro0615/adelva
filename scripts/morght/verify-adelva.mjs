import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const base = process.env.MORGHT_URL || "http://127.0.0.1:3002";
const out = "artifacts/adelva-about/final";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [],
  failures = [];
const headerGeometry = (header) =>
  [...header.querySelectorAll("a,button")]
    .filter((e) => {
      const c = getComputedStyle(e),
        r = e.getBoundingClientRect();
      return !e.closest("[inert]") && c.visibility === "visible" && r.width && r.height;
    })
    .map((e) => {
      const r = e.getBoundingClientRect(),
        c = getComputedStyle(e);
      return {
        text: e.textContent.trim(),
        name: e.getAttribute("aria-label"),
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        font: c.fontFamily,
        size: c.fontSize,
      };
    });
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [],
    artifacts = [],
    motion = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const homeHeader = await page
    .locator("[data-fidelity-landmark=header-nav]")
    .evaluate(headerGeometry);
  await page.screenshot({
    path: `${out}/${width}-home-header.png`,
    clip: { x: 0, y: 0, width, height: 160 },
  });
  const response = await page.goto(base + "/about", { waitUntil: "networkidle" });
  await page.waitForSelector(
    '[data-morght-version="2026-09-09-adelva-v2"][data-ready="true"]',
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((i) => {
        i.loading = "eager";
        return i.decode().catch(() => {});
      }),
    );
  });
  await page.waitForTimeout(4200);
  await page.locator(".mg-pause").evaluate((e) => e.click());
  await page.waitForSelector('[data-paused="true"]');
  await page.addStyleTag({
    content:
      "nextjs-portal{display:none!important}.mg-circle-ring svg{animation:none!important}",
  });
  const aboutHeader = await page
    .locator("[data-fidelity-landmark=header-nav]")
    .evaluate(headerGeometry);
  if (JSON.stringify(homeHeader) !== JSON.stringify(aboutHeader))
    failures.push({ width, headerGeometry: { homeHeader, aboutHeader } });
  const shot = async (name) => {
    const path = `${out}/${width}-${name}.png`;
    await page.screenshot({ path });
    artifacts.push(path);
  };
  await shot("top");
  const geometry = await page.locator(".mg-main>section,.mg-footer").evaluateAll((es) =>
    es.map((e) => {
      const r = e.getBoundingClientRect();
      return {
        id: e.dataset.section || "footer",
        y: r.y + scrollY,
        height: r.height,
        width: r.width,
        x: r.x,
      };
    }),
  );
  const source = JSON.parse(
    await readFile(`references/morght/final/${width}.json`, "utf8"),
  );
  const expected = [...source.sections, ...source.shell.sections],
    offset = width < 768 ? 24 : 72;
  const missing = expected
    .filter((r) => !geometry.some((a) => a.id === r.id))
    .map((r) => r.id);
  const extra = geometry
    .filter((a) => !expected.some((r) => r.id === a.id))
    .map((a) => a.id);
  if (
    missing.length ||
    extra.length ||
    new Set(geometry.map((a) => a.id)).size !== geometry.length
  )
    failures.push({
      width,
      missing,
      extra,
      duplicate: geometry.length !== new Set(geometry.map((a) => a.id)).size,
    });
  for (let i = 0; i < expected.length; i++) {
    const a = geometry[i],
      r = expected[i];
    if (
      !a ||
      a.id !== r.id ||
      Math.abs(a.y - r.bounds.y - (i === 0 ? 0 : offset)) > 3 ||
      Math.abs(a.height - r.bounds.height - (i === 0 ? offset : 0)) > 2 ||
      Math.abs(a.width - r.bounds.width) > 2
    )
      failures.push({ width, section: r.id, actual: a, reference: r.bounds, offset });
  }
  const track = await page.locator(".mg-circle-track").evaluate((e) => ({
    start: e.getBoundingClientRect().top + scrollY,
    height: e.offsetHeight,
  }));
  const refCircle = source.motion[0];
  if (Math.abs(track.height - height - refCircle.pinDistance) > 3)
    failures.push({ width, pinDistance: track.height - height });
  for (const [phase, p] of [
    ["start", 0],
    ["mid", 0.5],
    ["end", 1],
    ["reverse", 0],
  ]) {
    await page.evaluate(
      (y) => scrollTo(0, y),
      track.start + (track.height - height) * p,
    );
    await page.waitForTimeout(450);
    const sample = await page.locator(".mg-circle-crop").evaluate((e) => {
      const r = e.getBoundingClientRect(),
        img = e.querySelector("img").getBoundingClientRect();
      return {
        crop: r.width,
        image: e.querySelector(".mg-circle-image").getBoundingClientRect().width,
        photoTop: img.top,
        photoBottom: img.bottom,
      };
    });
    const ref = refCircle.samples.find((s) => s.phase === phase);
    if (Math.abs(sample.crop - ref.crop) > 3 || Math.abs(sample.image - ref.image) > 3)
      failures.push({ width, phase, sample, reference: ref });
    if (phase === "end" && (sample.photoTop > 1 || sample.photoBottom < height - 1))
      failures.push({ width, blankImageEdge: sample });
    motion.push({ phase, ...sample });
    await shot(`circle-${phase}`);
  }
  await page.evaluate(() => scrollTo(0, 0));
  const trigger = page.getByRole("button", {
    name: width >= 1024 ? "ADELVAについて" : "メニューを開く",
    exact: true,
  });
  await trigger.click();
  await page.waitForTimeout(650);
  await shot("menu");
  await page.keyboard.press("Escape");
  if (response.status() !== 200 || errors.length)
    failures.push({ width, status: response.status(), errors });
  results.push({
    missing,
    extra,
    width,
    height,
    source: source.sourceUrl,
    actual: base + "/about",
    expectedFlowOffset: offset,
    geometry,
    homeHeader,
    aboutHeader,
    motion,
    artifacts,
    errors,
  });
  console.log(
    width,
    `missing=${JSON.stringify(missing)} extra=${JSON.stringify(extra)}`,
    errors,
  );
  await page.close();
}
await browser.close();
await writeFile(
  "artifacts/adelva-about/verification.json",
  JSON.stringify(
    {
      schemaVersion: 1,
      observedAt: new Date().toISOString(),
      scope:
        "ADELVA requested identity/header/image revision; not full Morght pixel parity",
      failures,
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ failures, viewports: results.length }, null, 2));
if (failures.length) process.exitCode = 1;
