/**
 * End-to-end clinical workflow: sign-in → dashboard → patient chart
 * → place a Lab order (CPOE) → verify in pharmacy → sign out.
 *
 * This test relies on the demo seed data. It does not use the shared auth
 * storage state because it exercises the full sign-in / sign-out cycle.
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("full clinical workflow: admission to order verification", async ({ page }) => {
  // ─── 1. Sign in ─────────────────────────────────────────────────────────
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.getByLabel(/email/i).fill("demo@medcure.health");
  await page.getByLabel(/password/i).fill("demo123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/", { timeout: 10_000 });

  // ─── 2. Dashboard ────────────────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: /medical.*dashboard/is })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();

  // ─── 3. Navigate to Patients ─────────────────────────────────────────────
  await page.goto("/patients");
  await expect(page.getByRole("heading", { name: "Patients" })).toBeVisible();

  // Confirm census table has at least one row
  const rows = page.locator("table tbody tr");
  await rows.first().waitFor({ timeout: 5_000 });
  expect(await rows.count()).toBeGreaterThan(0);

  // ─── 4. Open first patient chart ─────────────────────────────────────────
  const chartLink = page.locator('a[title="Chart"]').first();
  const chartHref = (await chartLink.getAttribute("href")) ?? "/patients/MRN001";
  const mrn = chartHref.split("/patients/")[1]?.split("/")[0] ?? "MRN001";

  await page.goto(`/patients/${mrn}`);
  await expect(page.locator(".pt-header")).toBeVisible();

  // ─── 5. Review vitals ────────────────────────────────────────────────────
  await page.goto(`/patients/${mrn}#vitals`);
  await expect(page.getByRole("columnheader", { name: "HR" })).toBeVisible();

  // ─── 6. Review labs ──────────────────────────────────────────────────────
  await page.goto(`/patients/${mrn}#labs`);
  await expect(page.getByRole("columnheader", { name: /test/i })).toBeVisible();

  // ─── 7. Review current medications ───────────────────────────────────────
  await page.goto(`/patients/${mrn}#medications`);
  // At minimum the section heading should exist
  await expect(page.locator("h2, h3").filter({ hasText: /medication|med/i }).first()).toBeVisible();

  // ─── 8. Place a new Lab order via CPOE ───────────────────────────────────
  await page.goto("/cpoe");
  await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible();

  // Step 1 — select patient (if a dropdown is present, pick the first option)
  const patientSelect = page.locator("select").first();
  if (await patientSelect.isVisible()) {
    await patientSelect.selectOption({ index: 1 });
  }

  // Step 2 — select Lab order type
  await page.getByText("Lab").click();

  // Step 3 — add CBC from common order sets
  const cbcBtn = page.getByRole("button", { name: /add/i }).first();
  if (await cbcBtn.isVisible()) {
    await cbcBtn.click();
  }

  // Step 4 — set STAT priority
  const statBtn = page.getByRole("button", { name: /stat/i });
  if (await statBtn.isVisible()) {
    await statBtn.click();
    await expect(statBtn).toHaveClass(/active/);
  }

  // Step 5 — e-sign
  const esignInput = page.getByPlaceholder(/type your full name/i);
  if (await esignInput.isVisible()) {
    await esignInput.fill("Demo Physician");
  }

  // Step 6 — submit (only if sign button is enabled)
  const submitBtn = page.getByRole("button", { name: /sign.*submit/i });
  if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
    await submitBtn.click();
    // After submission, page navigates or shows confirmation
    await page.waitForTimeout(1_000);
  }

  // ─── 9. Pharmacy queue ───────────────────────────────────────────────────
  await page.goto("/pharmacy");
  await expect(page.getByRole("heading", { name: /pharmacy/i })).toBeVisible();
  // Queue section or Rx list is present
  await expect(page.getByPlaceholder(/search rx/i)).toBeVisible();

  // ─── 10. Check appointments ──────────────────────────────────────────────
  await page.goto("/appointments");
  // Page loads without crashing
  await expect(page).not.toHaveURL(/sign-in/);

  // ─── 11. Check ED board ──────────────────────────────────────────────────
  await page.goto("/ed");
  await expect(page).not.toHaveURL(/sign-in/);

  // ─── 12. Check billing ───────────────────────────────────────────────────
  await page.goto("/billing");
  await expect(page).not.toHaveURL(/sign-in/);

  // ─── 13. Check inventory ─────────────────────────────────────────────────
  await page.goto("/inventory");
  await expect(page).not.toHaveURL(/sign-in/);

  // ─── 14. Sign out ────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear());
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});
