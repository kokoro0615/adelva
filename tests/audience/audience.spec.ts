import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const route of ["owner", "general-managers"]) {
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    test(`${route} ${width}: semantics, overflow, axe and issue navigation`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto(`/challenges/${route}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      await expect(page.locator("[data-home-footer]")).toHaveCount(1);
      if (route === "owner")
        expect(
          await page
            .locator('[data-section="roles"]')
            .evaluate((e) => e.nextElementSibling?.getAttribute("data-section")),
        ).toBe("execution");
      await page
        .locator('[data-home-footer] a[aria-label="ページの先頭へ戻る"]')
        .click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      const audit = await new AxeBuilder({ page })
        .include("[data-audience-v3]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      const issue = page
        .locator('[data-section="challenges"] a[href^="#support-"]')
        .first();
      const target = await issue.getAttribute("href");
      await issue.click();
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await expect(page.locator(target!)).toBeInViewport();
      const summary =
        width >= 1024
          ? page.getByRole("button", { name: "課題から探す", exact: true })
          : page.locator('header button[aria-controls="site-menu"]');
      await page.evaluate(() => scrollTo(0, 0));
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(summary).toHaveAttribute("aria-expanded", "true");
      const openAudit = await new AxeBuilder({ page })
        .include("[data-audience-v3]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(openAudit.violations).toEqual([]);
      await page.addStyleTag({ content: "nextjs-portal{display:none}" });
      await page.screenshot({
        path: `artifacts/adelva-audience-v4/${route}-${width}-menu.png`,
      });
      await page.keyboard.press("Escape");
      await expect(page.locator('header button[aria-expanded="true"]')).toHaveCount(0);
      await expect(summary).toBeFocused();
    });
  }
  test(`${route}: no JavaScript and narrow reflow`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 844 },
      baseURL,
    });
    const page = await context.newPage();
    await page.goto(`/challenges/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("[data-home-footer] nav a").first()).toHaveAttribute(
      "href",
      "/challenges/owners",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    await context.close();
  });
  test(`${route}: motion preserves readable content and settles`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/challenges/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    for (const section of await page.locator("[data-section]").all()) {
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
    }
    // The step sequence is scroll-linked, so nothing may stay dimmed or
    // unfilled once its section has been read.
    await expect(page.locator("[data-process] li[data-step]")).toHaveCount(6);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(
        () =>
          page.locator("[data-process]").evaluate((node) => {
            const steps = [...node.querySelectorAll<HTMLElement>("li[data-step]")].map(
              (step) => {
                const number = step.querySelector<HTMLElement>("[class*='stepNumber']");
                return Number(getComputedStyle(number ?? step).opacity);
              },
            );
            const bar = node.querySelector<HTMLElement>("[data-process-progress]");
            const filled =
              bar && bar.getBoundingClientRect().width > 0
                ? new DOMMatrixReadOnly(getComputedStyle(bar).transform).a
                : 1;
            return Math.min(filled, ...steps);
          }),
        { timeout: 4000 },
      )
      .toBeGreaterThan(0.95);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator("[data-monument]")
        .first()
        .evaluate((e) => getComputedStyle(e).clipPath),
    ).toBe("none");
  });
}
test("legacy plural owner URL redirects", async ({ page }) => {
  await page.goto("/challenges/owners");
  await expect(page).toHaveURL(/\/challenges\/owner$/);
});
