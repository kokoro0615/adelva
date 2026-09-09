import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
const evidence = "docs/reports/site-revision-2026-09-10";
const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-fidelity-landmark="header-nav"]')).toBeVisible();
}
async function scroll(page: Page, selector: string, fraction = 0, line = 0.5) {
  await page.evaluate(
    ({ selector, fraction, line }) => {
      const r = document.querySelector(selector)!.getBoundingClientRect();
      window.scrollTo({
        top: scrollY + r.top + r.height * fraction - innerHeight * line,
        behavior: "instant",
      });
    },
    { selector, fraction, line },
  );
  await page.waitForTimeout(250);
}
for (const viewport of viewports) {
  test(`${viewport.width}: requested routes, common header/footer and axe`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let footerMarkup = "";
    for (const route of ["/", "/challenges", "/about", "/contact"]) {
      await page.goto(route);
      await ready(page);
      const header = page.locator('[data-fidelity-landmark="header-nav"]');
      await expect(header).toHaveCount(1);
      await expect(
        header.getByRole("link", { name: "導入事例", exact: true }),
      ).toHaveCount(0);
      if (viewport.width >= 1024) {
        await expect(
          header.getByRole("link", { name: "ADELVAについて", exact: true }),
        ).toHaveAttribute("href", "/about");
      } else {
        const opener = page.getByRole("button", {
          name: "メニューを開く",
          exact: true,
        });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: "サイトメニュー" });
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByRole("link", { name: "ADELVAについて", exact: true }),
        ).toHaveAttribute("href", "/about");
        await expect(
          dialog.getByRole("button", { name: "ADELVAについて", exact: true }),
        ).toHaveCount(0);
        await page.keyboard.press("Escape");
        await expect(opener).toBeFocused();
      }
      if (route === "/") {
        await expect(page.locator(".home-hero__standfirst")).toHaveCount(0);
        if (viewport.width === 1440) {
          const lines = await page
            .locator(".adelva-purpose > span")
            .evaluateAll((els) =>
              els.map(
                (e) =>
                  e.getBoundingClientRect().height /
                  parseFloat(getComputedStyle(e).lineHeight),
              ),
            );
          expect(lines).toHaveLength(2);
          lines.forEach((line) => expect(line).toBeCloseTo(1, 2));
        }
        await expect(page.locator(".adelva-founder-copy p")).toHaveCount(4);
        for (const [selector, label] of [
          [".last-continent", "purpose"],
          [".founder", "statement"],
        ] as const) {
          await scroll(page, selector, 0.5);
          await page.screenshot({ path: `${evidence}/${label}-${viewport.width}.png` });
        }
      }
      if (route === "/challenges") {
        await expect(page.locator('[data-ns-section="news"],.ns-footer')).toHaveCount(
          0,
        );
        await expect(page.locator(".ns-strip")).toHaveCount(8);
      }
      if (route != "/about") {
        const footer = page.locator("[data-home-footer]");
        await expect(footer).toHaveCount(1);
        const html = await footer.innerHTML();
        if (!footerMarkup) footerMarkup = html;
        else expect(html).toBe(footerMarkup);
        await footer.scrollIntoViewIfNeeded();
        await footer.locator("img").evaluate((e) => (e as HTMLImageElement).decode());
        await page.screenshot({
          path: `${evidence}/${route === "/challenges" ? "challenges" : route === "/contact" ? "contact" : "home"}-footer-${viewport.width}.png`,
        });
        await footer.getByRole("link", { name: "ページの先頭へ戻る" }).click();
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      await fs.writeFile(
        `${evidence}/axe-${route === "/" ? "home" : route.slice(1)}-${viewport.width}.json`,
        JSON.stringify(axe.violations, null, 2),
      );
      expect(axe.violations, JSON.stringify(axe.violations)).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      await page.screenshot({
        path: `${evidence}/${route === "/" ? "home" : route.slice(1)}-top-${viewport.width}.png`,
      });
    }
    expect(errors).toEqual([]);
  });
  test(`${viewport.width}: contact keyboard validation stays local`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    let writes = 0;
    page.on("request", (r) => {
      if (r.method() === "POST") writes++;
    });
    await page.goto("/contact");
    await ready(page);
    await page.getByRole("button", { name: "問い合わせを送信", exact: true }).click();
    await expect(page.locator("#contact-category")).toBeFocused();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(7);
    await page.screenshot({
      path: `${evidence}/contact-invalid-${viewport.width}.png`,
    });
    await page.locator("#contact-category").selectOption({ label: "経営・運営統括" });
    await page.locator("#contact-name1").fill("山田");
    await page.locator("#contact-name2").fill("太郎");
    await page.locator("#contact-tel").fill("0312345678");
    await page.locator("#contact-email").fill("review@example.com");
    await page.locator("#contact-message").fill("画面の検証です。");
    await page.locator("#contact-privacy").check();
    await page.getByRole("button", { name: "問い合わせを送信", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("送信は行われません");
    await expect(page.locator("#contact-message")).toHaveValue("画面の検証です。");
    expect(writes).toBe(0);
  });
  test(`${viewport.width}: approach heading/path/summary motion, reverse and reduction`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const root = page.locator("#approach");
    await expect(root).toHaveAttribute("data-approach-ready", "true");
    await ready(page);
    const heading = page.locator("#approach h2");
    await scroll(page, "[data-approach-reveal]", 0, 0.9);
    const start = await heading.evaluate((e) => Number(getComputedStyle(e).opacity));
    await scroll(page, "[data-approach-reveal]", 0, 0.45);
    await expect
      .poll(() => heading.evaluate((e) => Number(getComputedStyle(e).opacity)))
      .toBeGreaterThan(0.95);
    expect(start).toBeLessThan(0.1);
    const progress = async () => Number(await root.getAttribute("data-progress"));
    await scroll(page, "[data-approach-scene]", 0.5, 0.58);
    await expect.poll(progress).toBeGreaterThan(0.2);
    const mid = await progress();
    expect(mid).toBeLessThan(0.9);
    await page.screenshot({
      path: `${evidence}/approach-motion-${viewport.width}.png`,
    });
    await scroll(page, "[data-approach-scene]", 0.95, 0.58);
    await expect.poll(progress).toBe(1);
    await scroll(page, "[data-approach-scene]", 0.5, 0.58);
    await expect.poll(progress).toBeCloseTo(mid, 2);
    const summary = page.locator("[data-approach-summary] p").first();
    await scroll(page, "[data-approach-summary]", 0, 0.9);
    expect(
      await summary.evaluate((e) => Number(getComputedStyle(e).opacity)),
    ).toBeLessThan(0.1);
    await scroll(page, "[data-approach-summary]", 0, 0.4);
    await expect
      .poll(() => summary.evaluate((e) => Number(getComputedStyle(e).opacity)))
      .toBeGreaterThan(0.95);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(root).not.toHaveAttribute("data-motion", "active");
    await expect(heading).not.toHaveAttribute("style", /opacity: 0/);
    await expect(root.locator("li")).toHaveCount(6);
  });
}

test("UI-only contact never submits even without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const navigation: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest()) navigation.push(request.url());
  });
  await page.goto(`${baseURL}/contact`);
  await page.locator("#contact-email").fill("review@example.com");
  await page.locator("#contact-email").press("Enter");
  await page.getByRole("button", { name: "問い合わせを送信", exact: true }).click();
  expect(navigation).toEqual([`${baseURL}/contact`]);
  expect(page.url()).toBe(`${baseURL}/contact`);
  await context.close();
});
