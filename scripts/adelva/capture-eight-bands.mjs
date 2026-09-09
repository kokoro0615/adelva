import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const out = "docs/reports/adelva-photo-tiles-2026-09-09";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
});
const observations = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await page.goto(process.env.NOSIGNER_TEST_BASE_URL + "/challenges");
  await page.locator("[data-ns-ready=true]").waitFor();
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
  for (const [name, selector] of [
    ["challenges", "#section-how .ns-categories"],
    ["support", "#section-why"],
  ]) {
    const el = page.locator(selector);
    await el.evaluate((el) =>
      window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 100),
    );
    await page.mouse.move(0, 0);
    await page.waitForTimeout(150);
    // Section-only captures exclude fixed global chrome. Viewport frames below
    // retain it to verify real anchor clearance and CTA placement independently.
    const style = await page.addStyleTag({
      content: "header,.ns-contact,.ns-skip{visibility:hidden!important}",
    });
    await el.screenshot({
      path: `${out}/${width}-${name}.png`,
      animations: "disabled",
    });
    await style.evaluate((el) => el.remove());
  }
  await page.locator("#management-profit").evaluate((el) => el.scrollIntoView());
  await page.screenshot({
    path: `${out}/${width}-viewport.png`,
    animations: "disabled",
  });
  observations.push({
    width,
    height,
    bands: await page.locator(".ns-strip-label").allTextContents(),
    brokenImages: await page
      .locator(".ns-strip img")
      .evaluateAll((els) => els.filter((i) => !i.naturalWidth).length),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await page.close();
}
await fs.writeFile(
  `${out}/observations.json`,
  JSON.stringify(observations, null, 2) + "\n",
);
await browser.close();
