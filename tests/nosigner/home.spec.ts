import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  challengesHero,
  challengeBands,
  supportBands,
} from "../../src/content/adelva-challenges";

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

test.beforeEach(async ({ page }) => {
  if (process.env.NOSIGNER_TEST_BASE_URL) {
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal{display:none!important}";
        document.head.appendChild(style);
      });
    });
  }
});

async function openMenu(page: Page, width: number) {
  const opener = page.getByRole("button", {
    name: width >= 1024 ? "課題から探す" : "メニューを開く",
    exact: true,
  });
  await opener.click();
  const menu =
    width >= 1024
      ? page.getByRole("navigation", { name: "課題から探すメニュー" })
      : page.getByRole("dialog", { name: "サイトメニュー" });
  await expect(menu).toBeVisible();
  return { opener, menu };
}
async function checkAxe(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
}

for (const viewport of viewports) {
  test(`${viewport.width}: ADELVA hero, shared menu, no cookie banner, keyboard and accessibility`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle("課題から探す — ADELVA");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "経営判断を、現場で動く仕組みと成果へ。",
    );
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "ADELVA", exact: true }),
    ).toHaveAttribute("href", "/");
    await expect(page.locator(".ns-consent")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "すべて同意する" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "必要なクッキーのみ" })).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(() => localStorage.getItem("nosigner-consent")),
    ).toBeNull();
    await expect(page.locator(".ns-page")).toHaveAttribute("data-paused", "true");
    await expect(page.locator(".ns-strip")).toHaveCount(8);
    await expect(page.locator(".ns-news-list > li")).toHaveCount(4);
    await expect(page.locator(".ns-strip-promise")).toHaveCount(0);
    await expect(page.locator("#ns-how-title .ns-chapter-japanese")).toHaveText(
      "課題から探す",
    );
    await expect(page.locator("#ns-why-title .ns-chapter-japanese")).toHaveText(
      "3つの支援領域",
    );
    await expect(page.locator(".ns-keyvisual-mark")).toHaveText("ADELVA");
    await expect(page.locator(".ns-contact")).toHaveText("相談する");
    await expect(page.locator(".ns-contact")).toHaveAttribute("href", "/contact");
    for (const [i, card] of [...challengeBands, ...supportBands].entries())
      await expect(page.locator(".ns-strip").nth(i)).toContainText(card.label);
    for (const id of [
      "management-profit",
      "opening-operations",
      "operations-people",
      "revenue-brand",
      "digital-foundation",
    ])
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator(".ns-hero-copy")).toHaveCount(1);
    await expect(page.locator(".ns-slide")).toHaveCount(challengesHero.length);
    await checkAxe(page);
    await expect(page.locator(".ns-hero button")).toHaveCount(0);
    await expect(page.locator(".ns-hero-progress")).toHaveCount(0);
    for (const image of challengesHero) {
      await expect(page.locator(`.ns-slide img[src="${image.image.src}"]`)).toHaveCount(
        1,
      );
    }
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { opener, menu } = await openMenu(page, viewport.width);
    await checkAxe(page);
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(opener).toBeFocused();
    await page.locator("#section-how").scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await checkAxe(page);
    await page.locator(".ns-footer").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      viewport.width,
    );
    expect(errors).toEqual([]);
    await page.reload();
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await expect(page.locator(".ns-consent")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "すべて同意する" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "必要なクッキーのみ" })).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(() => localStorage.getItem("nosigner-consent")),
    ).toBeNull();
  });

  test(`${viewport.width}: static regression and focused category`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map(async (image) => {
          image.loading = "eager";
          await image.decode().catch(() => {});
        }),
      );
    });
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot(`${viewport.width}-adelva-hero.png`, {
      animations: "disabled",
    });
    await openMenu(page, viewport.width);
    await expect(page).toHaveScreenshot(`${viewport.width}-adelva-menu.png`, {
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    const first = page.locator(".ns-strip-link").first();
    await first.focus();
    await expect(first).toBeFocused();
    await expect(first.locator(".ns-strip-description")).toHaveCSS("opacity", "1");
    await page.evaluate(() => {
      const row = document.querySelector(".ns-strip")!;
      window.scrollTo(0, row.getBoundingClientRect().top + scrollY - 100);
    });
    await page.mouse.move(0, 0);
    await expect(page.locator(".ns-strip").first()).toHaveScreenshot(
      `${viewport.width}-category-focus.png`,
      { animations: "disabled" },
    );
  });
}

test("HOME keeps ADELVA navigation and routes to challenges", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("banner")).toBeVisible();
  const index = page.getByRole("link", { name: "課題一覧を見る", exact: true });
  const trigger = page.getByRole("button", { name: "課題から探す", exact: true });
  // SSR buttons are visible before React has attached their event handlers.
  await expect
    .poll(() =>
      trigger.evaluate((el) =>
        Object.keys(el).some((key) => key.startsWith("__reactProps$")),
      ),
    )
    .toBe(true);
  await trigger.hover();
  await expect(index).toHaveAttribute("href", "/challenges");
  await index.click();
  await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
  await expect(page.getByRole("banner")).toHaveCount(1);
});

for (const viewport of viewports) {
  test(`${viewport.width}: autoplay continues under pointer and keeps copy on all five images`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/challenges");
    await expect(page.locator('[data-ns-ready="true"]')).toBeVisible();
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    for (let i = 1; i <= challengesHero.length; i++) {
      await page.clock.fastForward(6000);
      await expect(page.locator('.ns-slide[data-active="true"] img')).toHaveAttribute(
        "src",
        challengesHero[i % challengesHero.length].image.src,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".ns-hero-copy")).toContainText("ADELVA");
      await expect(page.locator(".ns-hero-copy")).toContainText(
        "HOSPITALITY MANAGEMENT PARTNER",
      );
    }
    await expect(page.locator(".ns-hero button")).toHaveCount(0);
    await page.getByRole("button", { name: "動きを一時停止" }).click();
    await page.locator(".ns-hero").scrollIntoViewIfNeeded();
    await page.clock.runFor(100);
    const stopped = await page
      .locator('.ns-slide[data-active="true"] img')
      .getAttribute("src");
    await page.clock.fastForward(12000);
    await expect(page.locator('.ns-slide[data-active="true"] img')).toHaveAttribute(
      "src",
      stopped!,
    );
    await page.getByRole("button", { name: "動きを再生" }).click();
    await page.locator(".ns-hero").scrollIntoViewIfNeeded();
    await page.clock.runFor(100);
    await page.clock.fastForward(6000);
    await expect(page.locator('.ns-slide[data-active="true"] img')).not.toHaveAttribute(
      "src",
      stopped!,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".ns-page")).toHaveAttribute("data-paused", "true");
    const reducedSlide = await page
      .locator('.ns-slide[data-active="true"] img')
      .getAttribute("src");
    await page.clock.fastForward(12000);
    await expect(page.locator('.ns-slide[data-active="true"] img')).toHaveAttribute(
      "src",
      reducedSlide!,
    );
  });
}
