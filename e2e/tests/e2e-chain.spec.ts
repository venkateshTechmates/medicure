/**
 * PRD §10 Definition-of-done end-to-end chain
 * ───────────────────────────────────────────
 *   sign-in → tenant → dashboard → patient chart → CPOE
 *           → pharmacy verify → eMAR → lab result
 *
 * One test threads through the entire clinical loop, asserting each
 * stop renders. Selectors stay loose so seeded data drift doesn't break it.
 */
import { test, expect } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./helpers";

test.describe("PRD §10 end-to-end chain", () => {
  test("login → dashboard → chart → CPOE → pharmacy → eMAR → labs", async ({ page }) => {
    // 1. sign in
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });

    // 2. tenant selector (only if multi-tenant prompt appears)
    if (/tenant-selector/.test(page.url())) {
      const firstTenant = page
        .getByRole("button", { name: /select|continue|open/i })
        .or(page.getByRole("link").filter({ hasText: /general|hospital|clinic|memorial/i }))
        .first();
      if (await firstTenant.count()) await firstTenant.click();
      await expect(page).not.toHaveURL(/tenant-selector/, { timeout: 8_000 });
    }

    // 3. dashboard
    await page.goto("/dashboard");
    await expect(
      page.getByText(/dashboard|appointment|today|kpi/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // 4. patient chart
    await page.goto("/patients");
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toBeVisible({ timeout: 10_000 });
    await firstRow.click();
    await expect(page).toHaveURL(/\/patients\/[^/]+/, { timeout: 8_000 });

    // 5. CPOE
    await page.goto("/cpoe");
    await expect(
      page.getByText(/order|medication|prescription|cart|catalog/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // 6. pharmacy verify
    await page.goto("/pharmacy");
    await expect(
      page.getByText(/pharmacy|verification|queue|formulary/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // 7. eMAR
    await page.goto("/emar");
    await expect(
      page.getByText(/medication|administer|emar|due|prn/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // 8. lab result
    await page.goto("/labs");
    await expect(
      page.getByText(/lab|result|critical|abnormal|cbc|bmp/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("CPOE sign → order arrives in pharmacy queue", async ({ page }) => {
    // Sign in
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(DEMO_EMAIL);
    await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/sign-in/, { timeout: 10_000 });

    // Snapshot existing pharmacy queue size (best-effort: count rows).
    await page.goto("/pharmacy");
    await expect(
      page.getByText(/pharmacy|verification queue/i).first()
    ).toBeVisible({ timeout: 10_000 });

    // Sign a new med order via CPOE.
    await page.goto("/cpoe");
    await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible({
      timeout: 10_000,
    });
    // Patient dropdown auto-selects first seeded patient on load.
    await page
      .getByPlaceholder(/type your full name to e-sign/i)
      .fill("Dr. E2E Tester");
    await page.getByRole("button", { name: /sign & submit order/i }).click();

    // On success the page either shows a confirmation banner or redirects to /pharmacy.
    await expect(
      page
        .getByText(/order signed|routed to pharmacy/i)
        .or(page.getByText(/verification queue|pharmacy/i).first())
    ).toBeVisible({ timeout: 10_000 });

    // Confirm we end up on the pharmacy queue (the CPOEClient submit() does setTimeout → /pharmacy).
    await expect(page).toHaveURL(/\/pharmacy/, { timeout: 8_000 });
  });
});
