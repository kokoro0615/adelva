import { expect, test } from "@playwright/test";

test("home exposes a single main landmark and usable navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("keyboard users can reveal the skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /skip to content/i })).toBeFocused();
});

test("Antarctica index preserves the observed HTTP redirect", async ({ request }) => {
  const response = await request.get("/antarctica", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/antarctica/wolfs-fang-runway-mountains");
});
