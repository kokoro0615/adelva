/** Deterministic /contact captures (spec §14). Owns no server: pass the base
 * URL of a server built from the current tree.
 *   node scripts/adelva/capture-contact.mjs <out-dir> [--state=mock|default] [--motion]
 * `mock` reproduces the reference state: two challenges, one role, the
 * message focused, the e-mail error shown, consent given (desktop also hovers
 * 「まだ整理できていない」). */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.CONTACT_BASE_URL ?? "http://127.0.0.1:4471";
const out = process.argv[2] ?? "artifacts/contact/actual";
const state = (
  process.argv.find((a) => a.startsWith("--state=")) ?? "--state=mock"
).slice(8);
const motion = process.argv.includes("--motion");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
await mkdir(out, { recursive: true });

const viewports = [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
  ["small", 360, 780],
  ["laptop", 1280, 800],
  ["boundary", 1024, 768],
  ["wide", 1920, 1080],
].filter(([name]) => !only || only.split(",").includes(name));

const browser = await chromium.launch();
const results = [];
for (const [name, width, height] of viewports) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: motion ? "no-preference" : "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (["warning", "error"].includes(m.type())) errors.push(m.text());
  });
  await page.goto(base + "/contact", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (state === "mock") {
    const form = page.locator("[data-contact-form]");
    await form.getByLabel("現場品質・人材を改善したい").check();
    await form.getByLabel("集客・ブランドを強くしたい").check();
    await form.getByLabel("総支配人・現場責任者").check();
    await page.locator("#contact-email").focus();
    await page.locator("#contact-company").focus();
    await page.locator("#contact-consent").check();
    await page.locator("#contact-consent").blur();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    if (width >= 720)
      await page.locator('[data-clear-key="challenge-undecided"]').hover();
    else await page.mouse.move(0, 0);
    await page.waitForTimeout(motion ? 1800 : 300);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  // Walk the page so every lazy tile loads, then wait for all of them.
  await page.evaluate(async () => {
    const step = innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    const images = [...document.images].filter((i) => i.getClientRects().length);
    for (const i of images) i.loading = "eager";
    await Promise.all(
      images.map((i) =>
        i.complete && i.naturalWidth
          ? null
          : new Promise((r) => {
              i.addEventListener("load", r, { once: true });
              i.addEventListener("error", r, { once: true });
            }),
      ),
    );
    await Promise.all(images.map((i) => i.decode().catch(() => {})));
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const box = (sel) =>
      [...document.querySelectorAll(sel)].map((n) => {
        const r = n.getBoundingClientRect();
        return [
          Math.round(r.x),
          Math.round(r.y + scrollY),
          Math.round(r.width),
          Math.round(r.height),
        ];
      });
    return {
      scrollWidth: document.documentElement.scrollWidth,
      stage: box("[data-stage]")[0],
      landmarks: {
        eyebrow: box("main header p")[0],
        h1: box("main h1 > span"),
        nums: box("[data-num]"),
        cards: box("[data-clear-key]"),
        area: box("#contact-message"),
        fields: box(
          "[data-contact-form] input[type=text], [data-contact-form] input[type=email], [data-contact-form] input[type=tel]",
        ),
        send: box("[data-contact-form] button[type=submit]"),
        afterTitle: box("#contact-after-title"),
        steps: box("ol li"),
        notes: box("main section h2"),
      },
      overflow: [
        ...document.querySelectorAll("main :is(h1,h2,p,button,li,label,a,span)"),
      ]
        .filter((n) => {
          const r = n.getBoundingClientRect();
          return (
            r.width > 0 &&
            (r.left < -0.5 || r.right > innerWidth + 0.5) &&
            getComputedStyle(n).visibility !== "hidden" &&
            !n.closest("[aria-hidden=true]")
          );
        })
        .map((n) => n.textContent?.slice(0, 30)),
    };
  });
  await page.screenshot({
    path: `${out}/${name}-full.png`,
    fullPage: true,
    caret: "hide",
  });
  results.push({ name, viewport: { width, height }, errors, ...metrics });
  console.log(
    name,
    "errors",
    errors.length,
    "overflow",
    metrics.overflow.length,
    "scrollWidth",
    metrics.scrollWidth,
  );
  await context.close();
}
await writeFile(
  `${out}/capture.json`,
  JSON.stringify({ base, state, motion, results }, null, 2) + "\n",
);
await browser.close();
