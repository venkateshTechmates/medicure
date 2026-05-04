import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/session.json");

setup("authenticate as demo user", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");

  // Labels are not associated with inputs (no for/id), use type selectors
  await page.locator('input[type="email"]').fill("demo@medcure.health");
  await page.locator('input[type="password"]').fill("demo123!");
  await page.getByRole("button", { name: /sign in to medcure/i }).click();

  await page.waitForURL("/", { timeout: 15_000 });
  await expect(page.locator(".nav")).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
