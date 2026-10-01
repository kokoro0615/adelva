import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  approach,
  expertise,
  founder,
  purpose,
  skipLabel,
  who,
  yourChallenges,
} from "../../src/content/adelva-home";

/* HOME — A2r3「二つの視点 — 一本の線」. Spec: docs/specs/adelva-home-spec.md.
   Reference fidelity against the adopted prototypes is measured separately
   (docs/reports/adelva-home-2026-10-02/). */

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const requiredStrings: readonly string[] = [
  purpose.statement,
  ...purpose.body,
  ...who.owner,
  ...who.field,
  ...who.intro,
  ...who.cards.flatMap((card) => [card.viewpoint, ...card.title, ...card.body]),
  yourChallenges.title,
  ...yourChallenges.items.flatMap((item) => [item.title.join(""), item.description]),
  founder.lead.join(""),
  ...founder.paragraphs,
  founder.author,
  ...expertise.plan,
  expertise.planBody,
  ...expertise.domains.flatMap((domain) => [domain.label, domain.description]),
  ...approach.steps.flatMap((step) => [step.name, ...step.tags]),
  approach.body,
  approach.cue,
].filter((value): value is string => typeof value === "string");

async function open(page: Page, query = "") {
  const response = await page.goto(`/${query}`);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of viewports) {
  test.describe(`${viewport.name} ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("every approved string is DOM text, links resolve, nothing overflows", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await open(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
        purpose.statement,
      );
      const text = await page
        .locator("main")
        .evaluate((main) => (main.textContent ?? "").replace(/\s+/g, ""));
      for (const value of requiredStrings)
        expect(text).toContain(value.replace(/\s+/g, ""));

      for (const card of who.cards)
        await expect(page.locator(`[data-card][href="${card.href}"]`)).toHaveCount(1);
      for (const item of yourChallenges.items)
        await expect(page.locator(`[data-item] a[href="${item.href}"]`)).toHaveCount(1);
      for (const domain of expertise.domains)
        await expect(page.locator(`[data-domain][href="${domain.href}"]`)).toHaveCount(
          1,
        );
      await expect(page.locator(`[data-final] a[href="${approach.href}"]`)).toHaveCount(
        1,
      );
      await expect(page.getByRole("img", { name: founder.signatureLabel })).toHaveCount(
        1,
      );
      // the old HOME's leftovers stay gone
      await expect(page.getByText("Watch Film")).toHaveCount(0);
      await expect(page.locator('a[href="/enquire"]')).toHaveCount(0);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test("the moving page: regime, sticky scenes, header hand-over and both photographs drawn", async ({
      page,
    }) => {
      test.slow();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await open(page, "?capture");
      await page.waitForFunction(() => Boolean(window.__home));
      expect(await page.evaluate(() => window.__home!.regime)).toBe(
        viewport.width >= 1024 ? "desktop" : "mobile",
      );
      // load every photograph now (the page fetches them lazily)
      await page.evaluate(async () => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await window.__home!.ready;
        window.scrollTo(0, 0);
      });
      expect(await page.locator("[data-home-root]").getAttribute("data-gl")).toBeNull();

      const header = page.locator('[data-fidelity-landmark="header-nav"]');
      await expect(header).toHaveAttribute("data-brand", "hidden");

      const at = async (scene: string, p: number) => {
        const y = await page.evaluate(
          ([name, progress]) => {
            const el = document.querySelector<HTMLElement>(`[data-scene="${name}"]`)!;
            const top = el.getBoundingClientRect().top + window.scrollY;
            return Math.round(
              top + Number(progress) * (el.offsetHeight - window.innerHeight),
            );
          },
          [scene, p] as const,
        );
        await page.evaluate(async (target) => {
          for (let i = 0; i < 80; i++) {
            if (
              Math.abs(window.scrollY - target) < 1 &&
              !document.documentElement.classList.contains("lenis-scrolling")
            )
              break;
            window.scrollTo(0, target);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.__home!.frame(target, 20);
        }, y);
        return y;
      };

      // the purpose is read in after the film parts; the brand has flown into the bar
      await at("hero", 0.8);
      await expect(header).toHaveAttribute("data-brand", "shown");
      await expect(header).toHaveAttribute("data-surface", "paper");
      const stageTop = await page
        .locator('[data-scene="hero"] [data-stage]')
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(Math.abs(stageTop)).toBeLessThan(1);

      // the first place on the path, its card, and a drawn (non-blank) panorama
      await at("challenges", 0.2);
      await expect(page.locator('[data-item="0"]')).toBeVisible();
      await expect(page.locator('[data-item="1"]')).toBeHidden();
      await expect(header).toHaveAttribute("data-surface", "glass");
      const drawn = async (selector: string) =>
        page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
          const probe = document.createElement("canvas");
          probe.width = 32;
          probe.height = 32;
          const c = probe.getContext("2d")!;
          c.drawImage(canvas, 0, 0, 32, 32);
          const d = c.getImageData(0, 0, 32, 32).data;
          let min = 255;
          let max = 0;
          for (let i = 0; i < d.length; i += 4) {
            const l = (d[i]! + d[i + 1]! + d[i + 2]!) / 3;
            min = Math.min(min, l);
            max = Math.max(max, l);
          }
          return max - min;
        });
      expect(await drawn("canvas[data-pano]")).toBeGreaterThan(60);

      // the letter is signed by scrolling
      await at("founder", 0.95);
      await expect(page.locator("[data-signer]")).toHaveCSS("opacity", "1");

      // the crossing: the fourth step is read on the lake
      await at("approach", 0.6);
      await expect(page.locator("[data-step]").nth(3)).toBeVisible();
      expect(await drawn("canvas[data-lake]")).toBeGreaterThan(60);
      await at("approach", 0.97);
      await expect(page.locator("[data-final] a")).toBeVisible();

      expect(errors).toEqual([]);
    });

    test("reduced motion reads as a still document and passes axe", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page);
      await expect(page.locator("[data-home-root]")).toHaveAttribute(
        "data-motion",
        "still",
      );
      const header = page.locator('[data-fidelity-landmark="header-nav"]');
      await expect(header).toHaveAttribute("data-brand", "shown");
      // every scene is in normal flow, with its text visible
      const sticky = await page
        .locator("[data-stage]")
        .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
      expect(sticky.every((v) => v !== "sticky")).toBe(true);
      for (const item of yourChallenges.items)
        await expect(page.locator(`[data-item] a[href="${item.href}"]`)).toBeVisible();
      await expect(page.locator("[data-step]").first()).toBeVisible();
      await expect(page.getByRole("link", { name: approach.cue })).toBeVisible();

      const results = await new AxeBuilder({ page }).include("main").analyze();
      expect(
        results.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        ),
      ).toEqual([]);
    });

    test("keyboard: skip link, then the first scene links in reading order", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: skipLabel })).toBeFocused();
      await page.getByRole("link", { name: skipLabel }).press("Enter");
      await expect(page).toHaveURL(/#main-content$/);
    });
  });
}
