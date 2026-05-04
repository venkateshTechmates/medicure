/**
 * Billing & Revenue Cycle: Billing list → claim detail → eligibility
 * → charge capture → denial management → payment posting → patient statement
 */
import { test, expect } from "@playwright/test";

// ── Billing list ──────────────────────────────────────────────────────────────
test.describe("billing list", () => {
  test("billing page loads with AR summary", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible();
    await expect(page.getByText(/total a\/r|revenue cycle/i).first()).toBeVisible();
  });

  test("billing table has required columns", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByRole("columnheader", { name: /claim/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /patient/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /payer/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /amount/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
  });

  test("new claim button is present", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByRole("button", { name: /new claim/i })).toBeVisible();
  });

  test("AR report button is present", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByRole("button", { name: /ar report/i })).toBeVisible();
  });

  test("AR aging buckets render", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.getByText(/0.30|31.60|61.90/i).first()).toBeVisible();
  });
});

// ── Claim detail ──────────────────────────────────────────────────────────────
test.describe("claim detail", () => {
  test("claim detail page loads", async ({ page }) => {
    await page.goto("/claim-detail");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Eligibility ───────────────────────────────────────────────────────────────
test.describe("insurance eligibility", () => {
  test("eligibility page loads", async ({ page }) => {
    await page.goto("/eligibility");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Charge capture ────────────────────────────────────────────────────────────
test.describe("charge capture", () => {
  test("charge capture page loads", async ({ page }) => {
    await page.goto("/charge-capture");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Denial management ─────────────────────────────────────────────────────────
test.describe("denial management", () => {
  test("denial management page loads", async ({ page }) => {
    await page.goto("/denial-mgmt");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Payment posting ───────────────────────────────────────────────────────────
test.describe("payment posting", () => {
  test("payment posting page loads", async ({ page }) => {
    await page.goto("/payment-posting");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Patient statement ─────────────────────────────────────────────────────────
test.describe("patient statement", () => {
  test("patient statement page loads", async ({ page }) => {
    await page.goto("/patient-statement");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Full RCM chain ────────────────────────────────────────────────────────
test("billing RCM chain: billing list → claim detail → eligibility → charge capture → denial → payment → statement", async ({ page }) => {
  // 1. Billing overview
  await page.goto("/billing");
  await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /claim/i })).toBeVisible();

  // 2. Click into first claim if available
  const firstClaim = page.locator("table tbody tr").first();
  if (await firstClaim.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const claimLink = firstClaim.locator("a").first();
    if (await claimLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await claimLink.click();
      await expect(page).not.toHaveURL(/sign-in/);
      await page.goBack();
    }
  }

  // 3. Eligibility check
  await page.goto("/eligibility");
  await expect(page).not.toHaveURL(/sign-in/);

  // 4. Charge capture
  await page.goto("/charge-capture");
  await expect(page).not.toHaveURL(/sign-in/);

  // 5. Denial management
  await page.goto("/denial-mgmt");
  await expect(page).not.toHaveURL(/sign-in/);

  // 6. Payment posting
  await page.goto("/payment-posting");
  await expect(page).not.toHaveURL(/sign-in/);

  // 7. Patient statement
  await page.goto("/patient-statement");
  await expect(page).not.toHaveURL(/sign-in/);
});
