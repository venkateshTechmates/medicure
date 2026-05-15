/**
 * Auth flows beyond sign-in/out
 * ─────────────────────────────
 * register · forgot-password · two-factor · tenant-selector
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Auth — register", () => {
  test("register wizard loads step 1", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
    await expect(
      page.getByText(/profile|create|register|step\s*1/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Auth — forgot password", () => {
  test("forgot-password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/forgot-password/);
    await expect(
      page.getByText(/reset|forgot|email|send/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Auth — two factor", () => {
  test("two-factor page renders", async ({ page }) => {
    await page.goto("/two-factor");
    await expect(
      page.getByText(/verify|two.?factor|code|otp|authent/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Auth — tenant selector", () => {
  test("tenant-selector page is reachable when signed in", async ({ page }) => {
    await signIn(page);
    await page.goto("/tenant-selector");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/organization|tenant|switch/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
