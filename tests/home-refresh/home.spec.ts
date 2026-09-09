import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`ADELVA content, keyboard, photos and axe ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const support = page.locator("[data-support-section]");
    const links = support.locator("[data-support-audience]");
    await links.first().focus();
    await expect(links.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(links.nth(1)).toBeFocused();
    await expect(links.first()).toHaveAttribute("href", "/challenges/owners");
    const widths = await links.evaluateAll((es) =>
      es.map((e) => e.getBoundingClientRect().width),
    );
    expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1);
    await page.screenshot({
      path: `docs/reports/home-2026-09-10/support-${viewport.width}.png`,
    });
    const titles = [
      "経営・収益を改善したい",
      "開業・運営体制を整えたい",
      "現場品質・人材を改善したい",
      "集客・ブランドを強くしたい",
      "DX・IT・調達を整えたい",
    ];
    const cards = page.locator(".flick__link");
    await expect(cards).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const card = cards.nth(i);
      await card.focus();
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeInViewport();
      await expect(card.getByRole("heading")).toHaveText(titles[i]);
      await expect(card).toHaveAttribute("href", /^\/challenges#/);
      await expect(card).not.toContainText("US $");
      await card.locator("img").evaluate(async (node) => {
        await (node as HTMLImageElement).decode();
      });
      const fits = await card
        .locator(".flick__title")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
      expect(fits).toBe(true);
      await page.screenshot({
        path: `docs/reports/home-2026-09-10/challenge-${i + 1}-${viewport.width}.png`,
      });
    }
    const panels = page.locator(".camps__panel--camp");
    await expect(panels).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await panels.nth(i).scrollIntoViewIfNeeded();
      await panels
        .nth(i)
        .locator("img")
        .evaluate(async (node) => {
          await (node as HTMLImageElement).decode();
        });
      await expect(panels.nth(i).getByRole("heading")).toHaveText(
        ["経営・運営統括", "収益・ブランド成長", "DX・IT・調達基盤"][i],
      );
      await page.screenshot({
        path: `docs/reports/home-2026-09-10/expertise-${i + 1}-${viewport.width}.png`,
      });
    }
    await expect(page.locator(".adelva-purpose")).toContainText("経営判断を");
    await expect(page.locator(".adelva-founder-copy")).toContainText("責任分界とKPI");
    await expect(page.locator(".founder")).not.toContainText("White Desert");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    for (const selector of [
      "[data-support-section]",
      ".flick--adelva",
      ".camps--adelva",
      ".founder",
      ".last-continent",
    ]) {
      const result = await new AxeBuilder({ page })
        .include(selector)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, JSON.stringify(result.violations)).toEqual([]);
    }
    expect(errors).toEqual([]);
    await page.goto("/challenges");
    for (const id of [
      "management-profit",
      "opening-operations",
      "operations-people",
      "revenue-brand",
      "digital-foundation",
      "support-management",
      "support-revenue",
      "support-digital",
    ])
      await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
  });
}

test("audience hover reverses, ambient completes, reduced motion removes movement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const link = page.locator("[data-support-audience]").first();
  await link.scrollIntoViewIfNeeded();
  await expect(link).toHaveAttribute("data-ambient-ready", "true");
  const surface = () => link.evaluate((el) => getComputedStyle(el, "::before").opacity);
  await link.hover();
  await expect.poll(surface).toBe("1");
  await page.screenshot({
    path: "docs/reports/home-2026-09-10/support-hover-1440.png",
  });
  await page.mouse.move(1, 1);
  await expect.poll(surface).toBe("0.2");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await link.evaluate((el) => getComputedStyle(el, "::before").transform)).toBe(
    "none",
  );
  await link.focus();
  await expect(link).toBeFocused();
  await expect.poll(surface).toBe("1");
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`expertise scroll choreography and Japanese copy ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const selector of [".adelva-purpose", ".founder"]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      await page.screenshot({
        path: `docs/reports/home-2026-09-10/${selector === ".founder" ? "founder" : "purpose"}-${viewport.width}.png`,
      });
    }
    for (let index = 0; index < 3; index++) {
      await page
        .locator(".camps__panel--camp img")
        .nth(index)
        .evaluate(async (e) => {
          (e as HTMLImageElement).loading = "eager";
          await (e as HTMLImageElement).decode();
        });
      await page.evaluate((i) => {
        const root = document.querySelector<HTMLElement>(".camps")!;
        const track = document.querySelector<HTMLElement>(".camps__track")!;
        const panel = document.querySelectorAll<HTMLElement>(".camps__panel--camp")[i];
        const height =
          document.querySelector<HTMLElement>(".camps__viewport")!.clientHeight;
        const hold =
          (1.448 +
            ((1.239 - 1.448) * (Math.min(1440, Math.max(390, innerWidth)) - 390)) /
              1050) *
          height;
        const travel = track.scrollWidth - innerWidth;
        const x = panel.offsetLeft - (innerWidth - panel.offsetWidth) / 2;
        window.scrollTo({
          top:
            root.getBoundingClientRect().top +
            scrollY +
            hold +
            (x / travel) * (root.offsetHeight - height - hold),
          behavior: "instant",
        });
      }, index);
      await page.waitForTimeout(250);
      const card = page
        .locator(".camps__panel--camp")
        .nth(index)
        .locator(".camps__link");
      await expect(card).toBeInViewport({ ratio: 0.75 });
      await page.screenshot({
        path: `docs/reports/home-2026-09-10/expertise-motion-${index + 1}-${viewport.width}.png`,
      });
    }
  });
}
