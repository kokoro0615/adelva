import { expect, test, type Page } from "@playwright/test";

/*
 * Shared chrome (header, drawer, footer, route feedback) on the production
 * build, with motion allowed: the default config runs reduced motion, which
 * hides every behaviour checked here. docs/reports/adelva-polish-2026-10-13/shared/.
 */

const phone = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  contextOptions: { reducedMotion: "no-preference" as const },
};

async function backdropFilters(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        "header[data-fidelity-landmark='header-nav'] *, [data-site-nav-drawer], [data-site-nav-drawer] *",
      ),
    ]
      .map((element) => getComputedStyle(element).backdropFilter)
      .filter((value) => value && value !== "none"),
  );
}

test.describe("phone header", () => {
  test.use(phone);

  test("never asks for a backdrop filter, compacts from a sentinel and smokes the bar", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/approach");
    const header = page.locator("header[data-fidelity-landmark='header-nav']");
    await expect(header).toHaveAttribute("data-compact", "false");
    expect(await backdropFilters(page)).toEqual([]);

    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-compact", "true");
    const bar = page.getByRole("button", { name: "メニューを開く" }).locator("..");
    await expect
      .poll(() =>
        bar.evaluate((node) => {
          const match = getComputedStyle(node).backgroundColor.match(/[\d.]+/g) ?? [];
          return match.length === 4 ? Number(match[3]) : 0;
        }),
      )
      .toBeGreaterThan(0.8);
    expect(await backdropFilters(page)).toEqual([]);

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(page.locator("[data-site-nav-drawer]")).toHaveAttribute(
      "data-open",
      "true",
    );
    expect(await backdropFilters(page)).toEqual([]);

    await page.getByRole("button", { name: "閉じる", exact: true }).click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-compact", "false");
    expect(errors).toEqual([]);
  });

  test("loads no other page's payload, media or stylesheets", async ({ page }) => {
    const foreign: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.search.includes("_rsc") || url.pathname.startsWith("/media/target/")) {
        foreign.push(url.pathname + url.search);
      }
    });
    const warnings: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("preloaded using link preload but not used")) {
        warnings.push(message.text());
      }
    });
    await page.goto("/contact");
    await page.waitForTimeout(4000);
    expect(foreign).toEqual([]);
    expect(warnings).toEqual([]);
  });

  test("a drawer link opens the next page at its top with the lock released", async ({
    page,
  }) => {
    await page.goto("/approach");
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
    await page.getByRole("button", { name: "メニューを開く" }).click();
    const drawer = page.locator("[data-site-nav-drawer]");
    await expect(drawer).toHaveAttribute("data-open", "true");
    await drawer.getByRole("link", { name: "ADELVAについて", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked", /.*/);
    await expect(page.locator("[data-site-nav-drawer]")).toHaveAttribute(
      "data-open",
      "false",
    );
    await expect(page.locator("#main-content")).not.toHaveJSProperty("inert", true);
  });
});

test.describe("footer", () => {
  test.use(phone);

  test("the call and the orange line arrive once, and the canvas follows the end", async ({
    page,
  }) => {
    await page.goto("/contact");
    const heading = page.locator("[data-site-footer] h2");
    await expect(heading).toHaveAttribute("data-arrive", "armed");
    await page.evaluate(() => {
      const footer = document.querySelector("[data-site-footer]")!;
      window.scrollTo({
        top: footer.getBoundingClientRect().top + window.scrollY,
        behavior: "instant",
      });
    });
    await expect(heading).toHaveAttribute("data-arrive", "arrived");
    await expect(
      page.locator("[data-site-footer] [data-arrive]:not(h2)"),
    ).toHaveAttribute("data-arrive", "arrived");

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await expect(page.locator("html")).toHaveAttribute("data-footer-end", "");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.locator("html")).not.toHaveAttribute("data-footer-end", /.*/);
  });

  test("reduced motion: nothing is armed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/contact");
    await page.waitForTimeout(500);
    await expect(page.locator("[data-site-footer] h2")).toHaveAttribute(
      "data-arrive",
      "",
    );
  });

  test("touch rows are 44px and the company group no longer repeats itself", async ({
    page,
  }) => {
    await page.goto("/contact");
    const nav = page.locator("[data-site-footer] nav");
    for (const link of await nav.locator("a").all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const company = nav.locator("section").nth(2);
    await expect(company.locator("h3")).toHaveText("会社情報");
    await expect(company.locator("a")).toHaveText(["支援の進め方", "ADELVAについて"]);
    await expect(page.locator("[data-site-footer] small")).toHaveText(
      "© ADELVA合同会社",
    );
  });
});
