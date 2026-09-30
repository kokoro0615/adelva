/** Text contrast over the photograph for /contact and /contact/thanks
 * (spec §11). Every visible text run is compared with the p95 luminance of its
 * own text-free background (text made transparent; scrims, glass and shadows
 * kept), in the resting state and in the reference state.
 *   PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4472 node scripts/adelva/measure-contact-contrast.mjs [out.json]
 * The server must run with CONTACT_DELIVERY=accept for the thanks page. */
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const base = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4472";
const out = process.argv[2] ?? "docs/reports/adelva-contact-2026-09-29/contrast.json";
const channel = (v) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

async function settle(p) {
  await p.evaluate(async () => {
    await document.fonts.ready;
    for (const i of document.images) if (i.getClientRects().length) i.loading = "eager";
    await Promise.all(
      [...document.images]
        .filter((i) => i.getClientRects().length)
        .map((i) => i.decode().catch(() => {})),
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await p.mouse.move(0, 0);
  await p.waitForTimeout(400);
}

async function measure(p, label, viewport) {
  const texts = await p.evaluate(() => {
    const out = [];
    let i = 0;
    for (const n of document.querySelectorAll("main *")) {
      const direct = [...n.childNodes].some(
        (c) => c.nodeType === 3 && c.textContent.trim(),
      );
      if (
        !direct ||
        n.closest(".visually-hidden,[class*=visuallyHidden],[class*=trap]")
      )
        continue;
      const s = getComputedStyle(n);
      if (s.visibility === "hidden" || s.display === "none") continue;
      // Only the element's own text runs, never an icon beside them.
      let r = null;
      for (const c of n.childNodes) {
        if (c.nodeType !== 3 || !c.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(c);
        const b = range.getBoundingClientRect();
        r = r
          ? DOMRect.fromRect({
              x: Math.min(r.x, b.x),
              y: Math.min(r.y, b.y),
              width: Math.max(r.right, b.right) - Math.min(r.x, b.x),
              height: Math.max(r.bottom, b.bottom) - Math.min(r.y, b.y),
            })
          : b;
      }
      if (!r || r.width < 2 || r.height < 2) continue;
      let opacity = 1;
      for (let e = n; e; e = e.parentElement)
        opacity *= Number(getComputedStyle(e).opacity);
      n.setAttribute("data-contrast-id", String(i));
      out.push({
        id: i++,
        text: [...n.childNodes]
          .filter((c) => c.nodeType === 3)
          .map((c) => c.textContent.trim())
          .join(""),
        color: s.color,
        fontSize: parseFloat(s.fontSize),
        weight: parseInt(s.fontWeight),
        decorative: Boolean(n.closest('[aria-hidden="true"]')),
        opacity,
        x: r.x,
        y: r.y + scrollY,
        width: r.width,
        height: r.height,
      });
    }
    return out;
  });
  const visible = await sharp(await p.screenshot({ fullPage: true }))
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const style = await p.addStyleTag({
    content:
      "main [data-contrast-id]{color:transparent!important;-webkit-text-fill-color:transparent!important}",
  });
  const shot = await p.screenshot({ fullPage: true });
  await style.evaluate((n) => n.remove());
  const { data, info } = await sharp(shot)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const t of texts) {
    const color = t.color.match(/[\d.]+/g).map(Number);
    const values = [];
    const glyph = [];
    for (
      let y = Math.max(0, Math.ceil(t.y));
      y < Math.min(info.height, Math.floor(t.y + t.height));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(t.x));
        x < Math.min(info.width, Math.floor(t.x + t.width));
        x++
      ) {
        const k = (y * info.width + x) * 3;
        const under = lum([data[k], data[k + 1], data[k + 2]]);
        const shown = lum([visible.data[k], visible.data[k + 1], visible.data[k + 2]]);
        values.push(under);
        glyph.push([Math.abs(shown - under), shown]);
      }
    if (!values.length) continue;
    values.sort((a, b) => a - b);
    const background = values[Math.floor(values.length * 0.95)] ?? 0;
    // Rendered text colour: the glyph cores, i.e. the 4% of pixels that the
    // text changes most (includes opacity, blending and antialiasing).
    glyph.sort((a, b) => b[0] - a[0]);
    const core = glyph.slice(0, Math.max(3, Math.floor(glyph.length * 0.04)));
    const rendered = core.reduce((sum, g) => sum + g[1], 0) / core.length;
    const alpha = (color[3] ?? 1) * t.opacity;
    const specified = lum(color) * alpha + background * (1 - alpha);
    // Report the more conservative of the two estimates.
    const contrast = Math.min(
      ratio(rendered, background),
      ratio(specified, background) * (t.opacity < 1 ? Infinity : 1),
    );
    const target =
      t.fontSize >= 24 || (t.weight >= 700 && t.fontSize >= 18.66) ? 3 : 4.5;
    rows.push({
      state: label,
      viewport,
      text: t.text,
      fontSize: t.fontSize,
      decorative: t.decorative,
      contrast: +contrast.toFixed(2),
      target,
      pass: contrast >= target,
    });
  }
  return rows;
}

const browser = await chromium.launch();
const results = [];
for (const [width, height] of [
  [1440, 900],
  [768, 1024],
  [390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  await p.goto(base + "/contact", { waitUntil: "networkidle" });
  await settle(p);
  results.push(...(await measure(p, "rest", width)));
  const form = p.locator("[data-contact-form]");
  await form.getByLabel("現場品質・人材を改善したい").check();
  await form.getByLabel("集客・ブランドを強くしたい").check();
  await form.getByLabel("総支配人・現場責任者").check();
  await p.locator("#contact-email").focus();
  await p.locator("#contact-company").focus();
  await p.locator("#contact-consent").check();
  await p.locator("[data-contact-form] button[type=submit]").click();
  // The first error takes focus on the next frame: that is focus mode.
  await p.waitForTimeout(300);
  await settle(p);
  results.push(...(await measure(p, "errors+focus-mode", width)));
  await p.evaluate(() => document.activeElement?.blur());
  await settle(p);
  results.push(...(await measure(p, "answered+errors", width)));
  await p.locator("#contact-message").fill("相談内容");
  await p.locator("#contact-name").fill("山田 花子");
  await p.locator("#contact-email").fill("hanako@example.jp");
  await p.locator("#contact-tel").fill("0312345678");
  await p.locator("[data-contact-form] button[type=submit]").click();
  await p.waitForURL("**/contact/thanks");
  await p.waitForLoadState("networkidle");
  await settle(p);
  results.push(...(await measure(p, "thanks", width)));
  await context.close();
}
await browser.close();
const failures = results.filter((r) => !r.pass && !r.decorative);
const summary = {
  base,
  method:
    "p95 background luminance of each text run (text made transparent) against the rendered glyph cores; for opaque runs also against the specified colour, whichever is lower",
  measured: results.length,
  failures: failures.length,
  decorativeBelowTarget: results.filter((r) => !r.pass && r.decorative).length,
  minimum: results
    .filter((r) => !r.decorative)
    .sort((a, b) => a.contrast / a.target - b.contrast / b.target)
    .slice(0, 8),
};
await mkdir(out.slice(0, out.lastIndexOf("/")), { recursive: true });
await writeFile(out, JSON.stringify({ ...summary, results }, null, 2) + "\n");
console.log(JSON.stringify({ ...summary, failuresList: failures }, null, 2));
