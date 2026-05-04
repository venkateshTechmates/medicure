import { test, expect } from "@playwright/test";

// These tests do NOT use the shared auth storage state — they test auth flows directly.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("authentication", () => {
  test("sign-in page loads with demo credentials pre-filled", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveValue("demo@medcure.health");
  });

  test("successful sign-in redirects to dashboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill("demo@medcure.health");
    await page.locator('input[type="password"]').fill("demo123!");
    await page.getByRole("button", { name: /sign in to medcure/i }).click();
    await page.waitForURL("/", { timeout: 15_000 });
    await expect(page.locator(".nav")).toBeVisible();
  });

  test("wrong credentials shows error message", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="email"]').fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("badpassword");
    await page.getByRole("button", { name: /sign in to medcure/i }).click();
    await expect(page.getByText(/email or password is incorrect/i)).toBeVisible();
  });

  test("unauthenticated access to dashboard redirects to sign-in", async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForURL(/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/sign-in/);
  });
});
