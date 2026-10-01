import { expect, test } from "@playwright/test";

/**
 * Global-shell acceptance contract.
 *
 * The shell is deliberately tested separately from page content: the menu and
 * footer are shared by every route. HOME's own choreography (A2r3) is covered
 * by `home.spec.ts`. All waits in this file observe a state or a geometry
 * boundary; none depend on an arbitrary sleep.
 */

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name}: ADELVA header preserves direct links, disclosures and focus`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const header = page.locator('[data-fidelity-landmark="header-nav"]');
    await expect(header).toBeVisible();
    await expect(
      header.getByRole("link", { name: "導入事例", exact: true }),
    ).toHaveCount(0);
    if (viewport.width >= 1024) {
      await expect(
        header.getByRole("link", { name: "ADELVAについて", exact: true }),
      ).toHaveAttribute("href", "/about");
      await expect(
        header.getByRole("button", { name: "ADELVAについて", exact: true }),
      ).toHaveCount(0);
      const trigger = header.getByRole("button", { name: "課題から探す", exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.getByRole("link", { name: "課題一覧を見る", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    } else {
      const trigger = page.getByRole("button", { name: "メニューを開く", exact: true });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "サイトメニュー" });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("link", { name: "ADELVAについて", exact: true }),
      ).toHaveAttribute("href", "/about");
      await expect(
        dialog.getByRole("button", { name: "ADELVAについて", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("data-scroll-locked", "true");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-scroll-locked",
        "true",
      );
    }
  });
}
