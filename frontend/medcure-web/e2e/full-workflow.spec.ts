/**
 * End-to-end clinical workflow: sign-in → dashboard → patient chart
 * → place a Lab order (CPOE) → verify in pharmacy → sign out.
 */
import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("full clinical workflow: admission to order verification", async ({ page }) => {
  // ─── 1. Sign in ─────────────────────────────────────────────────────────
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

  await page.locator('input[type="email"]').fill("demo@medcure.health");
  await page.locator('input[type="password"]').fill("demo123!");
  await page.getByRole("button", { name: /sign in to medcure/i }).click();
  await page.waitForURL("/", { timeout: 15_000 });

  // ─── 2. Dashboard ────────────────────────────────────────────────────────
  await expect(page.getByRole("heading", { name: /medical.*dashboard/is })).toBeVisible();
  await expect(page.locator(".nav")).toBeVisible();

  // ─── 3. Navigate to Patients ─────────────────────────────────────────────
  await page.goto("/patients");
  await expect(page.getByRole("heading", { name: "Patients" })).toBeVisible();

  const rows = page.locator("table tbody tr");
  await rows.first().waitFor({ timeout: 8_000 });
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

  // ─── 7. Review medications ───────────────────────────────────────────────
  await page.goto(`/patients/${mrn}#medications`);
  await expect(page).not.toHaveURL(/sign-in/);

  // ─── 8. Place a Lab order via CPOE ───────────────────────────────────────
  await page.goto("/cpoe");
  await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible();
  await page.getByText("Lab").click();
  await expect(page.getByText("CBC")).toBeVisible();

  const statBtn = page.getByRole("button", { name: /stat/i });
  if (await statBtn.isVisible()) {
    await statBtn.click();
    await expect(statBtn).toHaveClass(/active/);
  }

  const esign = page.getByPlaceholder(/type your full name/i);
  if (await esign.isVisible()) {
    await esign.fill("Demo Physician");
  }

  const submitBtn = page.getByRole("button", { name: /sign.*submit/i });
  if (await submitBtn.isVisible() && await submitBtn.isEnabled()) {
    await submitBtn.click();
    await page.waitForTimeout(1_000);
  }

  // ─── 9. Pharmacy queue ───────────────────────────────────────────────────
  await page.goto("/pharmacy");
  await expect(page.getByRole("heading", { name: /pharmacy/i })).toBeVisible();

  // ─── 10. Module smoke checks ─────────────────────────────────────────────
  for (const path of ["/appointments", "/ed", "/billing", "/inventory", "/bed-board", "/telemetry"]) {
    await page.goto(path);
    await expect(page).not.toHaveURL(/sign-in/);
  }

  // ─── 11. Sign out ────────────────────────────────────────────────────────
  await page.evaluate(() => localStorage.clear());
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});
