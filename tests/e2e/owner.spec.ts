import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  chapters,
  contact,
  decision,
  execution,
  hero,
  phases,
  phasesCopy,
  plain,
  roles,
  support,
  verification,
} from "../../src/content/adelva-owner";

const route = "/challenges/owner";
const required = [
  hero.eyebrow,
  hero.title.join(""),
  plain(hero.lead),
  plain(phasesCopy.title),
  ...phases.flatMap((p) => [p.title, plain(p.text)]),
  plain(decision.title),
  plain(decision.body),
  ...decision.points,
  plain(support.title),
  plain(support.note),
  ...support.rows.flat(),
  plain(roles.title),
  ...roles.items.map((r) => r.name),
  plain(roles.agreement),
  plain(roles.note),
  roles.cross.label,
  plain(execution.title),
  ...execution.steps,
  plain(verification.title),
  plain(verification.body),
  ...verification.items,
  plain(contact.title),
];
const ignored = /preloaded using link preload but not used/;

async function ready(page: Page, hash = "") {
  await page.goto(route + hash);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("[data-owner]")).toHaveCount(1);
}

for (const [width, height] of [
  [1440, 900],
  [1280, 800],
  [1024, 768],
  [1920, 1080],
  [768, 1024],
  [390, 844],
  [360, 780],
] as const)
  test.describe(`owner ${width}`, () => {
    test.use({ viewport: { width, height } });

    test("copy, one h1, no overflow, scenes in order, text left of the pole", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await ready(page);
      const text = (await page.locator("main").textContent())!.replace(/\s+/g, "");
      for (const s of required) expect(text).toContain(s.replace(/\s+/g, ""));
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      // Every visible text run of a scene ends above the next scene's top.
      const overlaps = await page.evaluate(() => {
        const sections = [...document.querySelectorAll("section[data-chapter]")];
        const bad: string[] = [];
        sections.forEach((section, i) => {
          const next = sections[i + 1]?.getBoundingClientRect().top ?? Infinity;
          for (const n of section.querySelectorAll("*")) {
            if (
              ![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent!.trim())
            )
              continue;
            if (n.closest("[class*=visuallyHidden]") || !n.getClientRects().length)
              continue;
            const r = n.getBoundingClientRect();
            if (r.bottom > next + 1)
              bad.push(`${i}: ${n.textContent!.trim().slice(0, 12)}`);
          }
        });
        return bad;
      });
      expect(overlaps).toEqual([]);
      if (width >= 1024) {
        // The hook's pole (x 720 of 1440) is the axis: 01–04 keep their words left of it.
        const crossing = await page.evaluate(() => {
          const stage = document.querySelector("[data-stage]")!.getBoundingClientRect();
          const pole = stage.left + (stage.width * 712) / 1440;
          return [
            ...document.querySelectorAll(
              "#owner-hero h1 span, #owner-hero p, section[data-chapter] h2:not(#owner-contact-title), [data-point] span, table, [data-hearth] li, #owner-04 p",
            ),
          ]
            .filter((n) => n.getBoundingClientRect().right > pole)
            .map((n) => n.textContent!.trim().slice(0, 12));
        });
        expect(crossing).toEqual([]);
      }
      expect(errors).toEqual([]);
    });

    if ([1440, 768, 390].includes(width))
      test("axe before and after choosing a phase", async ({ page }) => {
        await ready(page);
        for (const pass of [0, 1]) {
          if (pass)
            await page
              .locator('input[name="phase"][value="gm"]')
              .check({ force: true });
          const audit = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(audit.violations).toEqual([]);
        }
      });
  });

test("choosing a phase by keyboard lights 02 and 03 and is kept in the URL", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  // named by the 01 heading (its line breaks read as spaces)
  const group = page.getByRole("radiogroup", { name: /ありますか。$/ });
  const first = group.getByRole("radio", { name: "経営・収益" });
  await first.focus();
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const gm = group.getByRole("radio", { name: "GM不在" });
  await expect(gm).toBeChecked();
  await expect(gm).toHaveAccessibleDescription(/^GM機能と権限を\s?整理する$/);
  await expect(page).toHaveURL(/#phase-gm$/);
  await expect(page.locator('[data-point][aria-current="true"]')).toHaveText(
    /実行責任者/,
  );
  await expect(page.locator('tr[aria-current="true"] th')).toHaveText("GM不在");
  await expect(page.locator('li[data-phase][aria-current="true"]')).toHaveCount(1);
  await expect
    .poll(() =>
      page.locator("[data-beam]").evaluate((n) => Number(getComputedStyle(n).opacity)),
    )
    .toBe(1);
  // choosing never jumps the page to a #phase- anchor
  expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("a shared #phase- link restores the choice", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page, "#phase-investment");
  await expect(page.locator('input[name="phase"][value="investment"]')).toBeChecked();
  await expect(page.locator('li[data-phase="investment"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.locator('[data-point="2"]')).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("without JavaScript the choice still lights 02 and 03", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(route);
  await page.locator('label[data-phase="opening"]').click();
  await expect(page.locator('input[name="phase"][value="opening"]')).toBeChecked();
  // 03: the chosen row's heading turns flare-soft; 02: the crossbar turns orange
  await expect
    .poll(() =>
      page
        .locator('tr[data-phase="opening"] th')
        .evaluate((n) => getComputedStyle(n).color),
    )
    .toMatch(/255, 172, 102|1 0\.67/);
  expect(
    await page
      .locator("[data-setbar]")
      .evaluate((n) => getComputedStyle(n).backgroundColor),
  ).toBe("rgb(255, 126, 21)");
  await context.close();
});

test("the chapter index links every chapter and follows the scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  const index = page.getByRole("navigation", { name: "このページの章" });
  const links = index.getByRole("link");
  await expect(links).toHaveCount(6);
  for (const [i, c] of chapters.entries()) {
    await expect(links.nth(i)).toHaveAttribute("href", `#${c.id}`);
    await expect(links.nth(i)).toHaveAccessibleName(`${c.number} ${c.label}`);
  }
  await expect(links.nth(0)).toHaveAttribute("aria-current", "location");
  await links.nth(2).click();
  await expect(page.locator("#owner-03")).toBeInViewport();
  await expect(links.nth(2)).toHaveAttribute("aria-current", "location");
  const box = await links.nth(2).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(24);
});

test("reduced motion never paints the pre-dawn layer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ready(page);
  expect(
    await page
      .locator("[data-dawn]")
      .evaluateAll((ns) => ns.map((n) => getComputedStyle(n).display)),
  ).toEqual(["none", "none"]);
  await expect(page.locator('[data-motion="on"]')).toHaveCount(0);
});

/* The dawn, the ember ignition and the hearth's breath only run while motion is
   allowed; check them with a real scroll through the whole page. */
for (const [width, height] of [
  [1440, 900],
  [390, 844],
] as const)
  test(`owner motion ${width}: dawn resolves, scrolling logs no errors, embers ignite`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (m) => {
      if (["warning", "error"].includes(m.type()) && !ignored.test(m.text()))
        errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await ready(page);
    await expect(page.locator('[data-motion="on"]')).toHaveCount(1);
    const dawn = page.locator(`[data-dawn="${width >= 1024 ? "d" : "m"}"]`);
    await expect(dawn).toHaveCSS("display", "block");
    await expect
      .poll(() => dawn.evaluate((n) => getComputedStyle(n).visibility), {
        timeout: 6000,
      })
      .toBe("hidden");
    await page.locator('input[name="phase"][value="opening"]').check({ force: true });
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += 300) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(40);
    }
    await expect(page.locator("[data-embers]")).toHaveAttribute("data-ignite", "done", {
      timeout: 6000,
    });
    await expect(page.locator("[data-step][data-lit]")).toHaveCount(5);
    await expect(page.locator("[data-hearth]")).toHaveAttribute("data-seat", "run");
    // the index steps aside over the footer
    await expect(page.locator("[data-index]")).toHaveAttribute("data-hidden", "");
    expect(errors).toEqual([]);
    await context.close();
  });
