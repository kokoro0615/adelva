import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const out = "artifacts/challenges-type-correction";
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await page.goto(
    process.env.NOSIGNER_TEST_BASE_URL
      ? `${process.env.NOSIGNER_TEST_BASE_URL}/challenges`
      : "http://127.0.0.1:3002/challenges",
  );
  await page.locator('[data-ns-ready="true"]').waitFor();
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map(async (i) => {
        i.loading = "eager";
        await i.decode().catch(() => {});
      }),
    );
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const fonts = [];
  for (const selector of [
    ".ns-keyvisual-mark",
    ".ns-strip-label",
    ".ns-strip-description",
    ".ns-statement-lead",
    ".ns-statement-body",
  ]) {
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector,
    });
    for (const nodeId of nodeIds)
      fonts.push({
        selector,
        ...(await cdp.send("CSS.getPlatformFontsForNode", { nodeId })),
      });
  }
  const geometry = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    brand: [
      ...document.querySelectorAll(
        ".ns-keyvisual,.ns-keyvisual-canvas,.ns-keyvisual-mark,.ns-keyvisual-content > p",
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        selector: el.className || "subtitle",
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      };
    }),
    bands: [...document.querySelectorAll(".ns-strip")].map((el) => {
      const a = el.getBoundingClientRect(),
        b = el.querySelector(".ns-strip-bottom").getBoundingClientRect();
      return {
        id: el.id,
        width: a.width,
        height: a.height,
        centerX: b.x + b.width / 2 - a.x - a.width / 2,
        centerY: b.y + b.height / 2 - a.y - a.height / 2,
      };
    }),
  }));
  // Brand screenshot uses mark center at 40% viewport height, matching source study.
  await page
    .locator(".ns-keyvisual-mark")
    .evaluate((el) =>
      scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.36),
    );
  await page.screenshot({ path: `${out}/${width}-brand.png` });
  for (const [i, row] of (await page.locator(".ns-strip").all()).entries())
    await row.screenshot({
      path: `${out}/${width}-band-${i}.png`,
      animations: "disabled",
    });
  for (const id of ["section-how", "section-why"]) {
    await page
      .locator(`#${id} .ns-heading`)
      .evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 160));
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.screenshot({ path: `${out}/${width}-${id}-heading.png` });
  }
  for (const id of ["quote-form", "quote-future"])
    await page
      .locator(`[data-ns-section="${id}"]`)
      .screenshot({ path: `${out}/${width}-${id}.png`, animations: "disabled" });
  results.push({ width, height, geometry, fonts });
  await page.close();
}
await browser.close();
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(
  results.map((r) => ({
    width: r.width,
    geometry: r.geometry,
    fallback: r.fonts.flatMap((f) => f.fonts.filter((x) => !x.isCustomFont)),
  })),
);
