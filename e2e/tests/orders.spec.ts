/**
 * Orders workflow E2E tests
 * ─────────────────────────
 * 1. CPOE page loads
 * 2. Can navigate to an order detail
 * 3. eMAR page loads
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Orders & Medications", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("CPOE page loads without error", async ({ page }) => {
    await page.goto("/cpoe");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/order|medication|prescription/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("orders index page is reachable", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByRole("table").or(page.getByText(/order|no orders/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("eMAR page loads", async ({ page }) => {
    await page.goto("/emar");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/medication|administer|emar/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
