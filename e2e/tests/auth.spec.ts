/**
 * Auth flow E2E tests
 * ──────────────────
 * 1. Sign in with valid credentials → lands on app
 * 2. Sign in with wrong password → shows error
 * 3. Sign out → redirected to sign-in
 * 4. Accessing a protected page unauthenticated → redirected to sign-in
 */
import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD, signIn } from "./helpers";

test.describe("Authentication", () => {
  test("sign in with valid credentials", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should leave the sign-in page
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });

    // JWT should be stored
    const token = await page.evaluate(() => localStorage.getItem("medcure_token"));
    expect(token).not.toBeNull();
    expect(typeof token).toBe("string");
    expect(token!.split(".").length).toBe(3); // valid JWT shape
  });

  test("sign in with wrong password shows error", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Stay on sign-in and see an error
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.getByRole("alert").or(page.getByText(/invalid|incorrect|failed/i))).toBeVisible({
      timeout: 5_000,
    });
  });

  test("sign out clears session", async ({ page }) => {
    await signIn(page);

    // Navigate to sign-out or find the sign-out button
    const signOutLink = page.getByRole("link", { name: /sign.?out|logout/i });
    const signOutBtn = page.getByRole("button", { name: /sign.?out|logout/i });

    if (await signOutLink.isVisible()) {
      await signOutLink.click();
    } else {
      await signOutBtn.click();
    }

    await expect(page).toHaveURL(/sign-in/, { timeout: 8_000 });

    const token = await page.evaluate(() => localStorage.getItem("medcure_token"));
    expect(token).toBeNull();
  });

  test("protected page redirects unauthenticated users", async ({ page }) => {
    // Ensure clean state
    await page.goto("/sign-in");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/patients");
    await expect(page).toHaveURL(/sign-in/, { timeout: 8_000 });
  });
});
