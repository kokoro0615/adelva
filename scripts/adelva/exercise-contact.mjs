/** Motion-enabled walk through /contact → /contact/thanks (spec §8–§9).
 *   CONTACT_BASE_URL=http://127.0.0.1:4471 node scripts/adelva/exercise-contact.mjs <out-dir> [--mobile]
 * Needs a server started with CONTACT_DELIVERY=accept. Records console
 * problems, the mask state after selecting, the error summary, and the
 * keyframe screenshots. */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.env.CONTACT_BASE_URL ?? "http://127.0.0.1:4471";
const out = process.argv[2] ?? "artifacts/contact/exercise";
const mobile = process.argv.includes("--mobile");
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  reducedMotion: "no-preference",
  hasTouch: mobile,
});
const page = await context.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (["warning", "error"].includes(m.type()))
    problems.push(`${m.type()}: ${m.text()}`);
});
const log = {};
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });

await page.goto(base + "/contact", { waitUntil: "networkidle" });
await page.waitForTimeout(250);
await shot("1-load-early");
await page.waitForTimeout(1600);
await shot("1-load-settled");

const form = page.locator("[data-contact-form]");
await form.getByLabel("現場品質・人材を改善したい").check();
await form.getByLabel("集客・ブランドを強くしたい").check();
await page.waitForTimeout(1500);
log.masks = await page.evaluate(() =>
  [...document.querySelectorAll("[data-clear]")].map((n) => ({
    id: n.dataset.clear,
    hidden: n.hidden,
    layers: (n.firstElementChild?.style.maskImage.match(/radial-gradient/g) ?? [])
      .length,
    loaded: Boolean(
      n.querySelector("img")?.complete && n.querySelector("img")?.naturalWidth,
    ),
  })),
);
log.domains = await page
  .locator("[data-contact-form] [aria-live] p")
  .last()
  .innerText();
await shot("2-selected");

// Submit empty-ish: errors summary + focus to the first error.
await page.locator("[data-contact-form] button[type=submit]").click();
await page.waitForTimeout(400);
log.summary = await page.locator("[role=alert]").first().innerText();
log.focusAfterInvalid = await page.evaluate(() => document.activeElement?.id);
await shot("3-invalid");

await form.getByLabel("総支配人・現場責任者").check();
await page.locator("#contact-message").fill("客室清掃の品質と人員配置を見直したい。");
await page.waitForTimeout(700);
await shot("3b-typing");
await page.locator("#contact-company").fill("テスト旅館");
await page.locator("#contact-name").fill("山田 花子");
await page.locator("#contact-email").fill("hanako@example.jp");
await page.locator("#contact-tel").fill("03-1234-5678");
await page.locator("#contact-consent").check();
await page.locator("#contact-consent").blur();
await page.locator("[data-contact-form] button[type=submit]").scrollIntoViewIfNeeded();
await page.evaluate(() => {
  const b = document.querySelector("[data-contact-form] button[type=submit]");
  window.scrollBy({
    top: b.getBoundingClientRect().top - innerHeight * 0.62,
    behavior: "instant",
  });
});
await page.waitForTimeout(1500);
log.ready = await page
  .locator("[data-contact-form] button[type=submit]")
  .getAttribute("data-ready");
await shot("4-ready");
await page.locator("[data-contact-form] button[type=submit]").click();
await page.waitForTimeout(700);
log.sendingLabel = await page
  .locator("[data-contact-form] button[type=submit]")
  .innerText();
await shot("5-sending");
await page.waitForURL("**/contact/thanks", { timeout: 15000 });
await page.waitForLoadState("networkidle");
await page.waitForTimeout(400);
await shot("6-thanks-early");
await page.waitForTimeout(2200);
await shot("6-thanks");
log.thanksHeading = await page.locator("h1").first().innerText();
log.currentStep = await page.locator("ol li[aria-current=step]").innerText();

// Direct visit without the cookie returns to the form.
const fresh = await browser.newContext();
const direct = await fresh.newPage();
await direct.goto(base + "/contact/thanks");
log.directVisit = new URL(direct.url()).pathname;
await fresh.close();

log.problems = problems;
await writeFile(`${out}/exercise.json`, JSON.stringify(log, null, 2) + "\n");
console.log(JSON.stringify(log, null, 2));
await browser.close();
