import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
const out =
  process.env.CHALLENGES_CAPTURE_OUT || "artifacts/challenges-correction-2026-09-09";
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const report = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const p = await b.newPage({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  await p.clock.install();
  await p.goto("http://127.0.0.1:3002/challenges");
  await p.locator('[data-ns-ready="true"]').waitFor();
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (img) => {
        img.loading = "eager";
        await img.decode().catch(() => {});
      }),
    );
  });
  const current = await p.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    landmarks: [...document.querySelectorAll("[data-ns-section]")].map((e) => {
      const r = e.getBoundingClientRect();
      return {
        id: e.dataset.nsSection,
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      };
    }),
  }));
  const reference = JSON.parse(
    await readFile(`references/nosigner/reference/${width}.json`, "utf8"),
  );
  const geometry = [];
  for (const a of current.landmarks) {
    const r = reference.landmarks.find((v) => v.id === a.id);
    if (!r) continue;
    for (const k of ["x", "y", "width", "height"]) {
      const delta = Math.abs(a[k] - r[k]);
      if (delta > 5)
        geometry.push({ id: a.id, key: k, reference: r[k], actual: a[k], delta });
    }
  }
  for (let i = 0; i < 5; i++) {
    if (i) await p.clock.fastForward(6000);
    await p.clock.runFor(100);
    await p.screenshot({
      path: `${out}/hero-${width}-${i + 1}.png`,
      animations: "disabled",
    });
  }
  await p.clock.fastForward(6000);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p
    .getByRole("button", {
      name: width >= 1024 ? "課題から探す" : "メニューを開く",
      exact: true,
    })
    .click();
  await p.clock.runFor(100);
  await p.screenshot({ path: `${out}/menu-${width}.png` });
  await p.keyboard.press("Escape");
  const pixels = [];
  for (const id of ["how", "why"]) {
    const y = current.landmarks.find((v) => v.id === id).y;
    await p.evaluate((y) => scrollTo(0, y), y);
    await p.mouse.move(0, 0);
    await p.clock.runFor(100);
    const actual = `${out}/${id}-${width}.png`;
    await p.screenshot({ path: actual });
    const ref = `references/nosigner/reference/${width}-${id}.png`;
    // Top 100px is intentionally now the shared ADELVA menu; compare only the
    // unchanged content field, separately from authored Playwright snapshots.
    const region = { left: 0, top: 100, width, height: height - 100 };
    const R = await sharp(ref).extract(region).removeAlpha().raw().toBuffer();
    const A = await sharp(actual).extract(region).removeAlpha().raw().toBuffer();
    let absolute = 0;
    for (let i = 0; i < R.length; i++) absolute += Math.abs(R[i] - A[i]);
    pixels.push({
      id,
      meanAbsoluteError: absolute / R.length / 255,
      region,
      reference: ref,
      actual,
    });
    const overlay = Buffer.alloc(A.length);
    const difference = Buffer.alloc(A.length);
    for (let i = 0; i < A.length; i++) {
      overlay[i] = Math.round((A[i] + R[i]) / 2);
      difference[i] = Math.min(255, Math.abs(A[i] - R[i]) * 4);
    }
    const raw = { width, height: height - 100, channels: 3 };
    const panels = await Promise.all(
      [R, A, overlay, difference].map((buffer) =>
        sharp(buffer, { raw }).png().toBuffer(),
      ),
    );
    await sharp({
      create: {
        width: width * 4,
        height: height - 100,
        channels: 3,
        background: "#000",
      },
    })
      .composite(panels.map((input, index) => ({ input, left: width * index, top: 0 })))
      .png()
      .toFile(`${out}/compare-${id}-${width}.png`);
  }
  await p.emulateMedia({ reducedMotion: "no-preference" });
  for (const id of ["how", "why"]) {
    await p.evaluate(
      (y) => scrollTo(0, y),
      current.landmarks.find((v) => v.id === id).y - 170,
    );
    await p.mouse.move(0, 0);
    await p.clock.runFor(1500);
    await p.screenshot({ path: `${out}/${id}-heading-${width}.png` });
  }
  report.push({
    width,
    height,
    geometry,
    pixels,
    scrollHeight: current.scrollHeight,
    referenceScrollHeight: reference.scrollHeight,
  });
  await p.close();
}
await b.close();
await writeFile(
  `${out}/reference-comparison.json`,
  JSON.stringify(
    {
      source: "https://nosigner.com/ja/",
      reference: "Previously captured external reference, research only",
      intentional:
        "HERO photography/copy and menu replaced by ADELVA; excluded from NOSIGNER pixel equivalence",
      report,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(report, null, 2));
