import { test, expect } from "@playwright/test";
import { signIn, signOut } from "./helpers/utils";

// These tests do NOT use the shared auth storage state — they test auth flows directly.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("authentication", () => {
  test("sign-in page loads with demo credentials pre-filled", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toHaveValue("demo@medcure.health");
  });

  test("successful sign-in redirects to dashboard", async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("wrong credentials shows error message", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("badpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email or password is incorrect/i)).toBeVisible();
  });

  test("unauthenticated access to dashboard redirects to sign-in", async ({ page }) => {
    await signOut(page);
    await page.goto("/");
    await page.waitForURL(/sign-in/, { timeout: 5_000 });
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in button is disabled while submitting", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill("demo@medcure.health");
    await page.getByLabel(/password/i).fill("demo123!");

    const btn = page.getByRole("button", { name: /sign in/i });
    await btn.click();
    // Button shows disabled "Signing in…" state during request
    await expect(btn).toBeDisabled();
    await page.waitForURL("/");
  });
});
