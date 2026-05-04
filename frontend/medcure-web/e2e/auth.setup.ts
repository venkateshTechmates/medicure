import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/session.json");

setup("authenticate as demo user", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel(/email/i).fill("demo@medcure.health");
  await page.getByLabel(/password/i).fill("demo123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("/", { timeout: 10_000 });
  await expect(page.getByRole("navigation")).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
