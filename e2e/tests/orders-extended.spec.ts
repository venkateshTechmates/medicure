/**
 * Orders / pharmacy / labs detail pages
 * ─────────────────────────────────────
 * Covers PRD §5.3 surfaces not hit by orders.spec.ts:
 *   pharmacy queue · pharmacy-verify (7-rights) · order detail
 *   result-ack · specimen-tracking · lab detail
 *
 * Detail-page tests fetch a real seeded ID via the API rather than
 * scraping the list page (more robust + faster).
 */
import { test, expect } from "@playwright/test";
import { signIn, loginViaApi, firstId, apiGet } from "./helpers";

test.describe("Orders & results — extended", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("pharmacy queue page", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/pharmacy|verification queue|formulary/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("pharmacy verify (7-rights) for a real order", async ({ page }) => {
    const token = await loginViaApi();
    // Pharmacy verify route is /pharmacy/verify/[orderId] — need a medication order.
    const orders = await apiGet<Array<{ id: number; orderType: string }>>(
      "/api/orders?type=Medication&take=5",
      token
    );
    const id = orders?.[0]?.id;
    test.skip(!id, "No medication orders seeded");
    await page.goto(`/pharmacy/verify/${id}`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/7.?rights|verify|right patient|right drug|right dose/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("result-ack inbox", async ({ page }) => {
    await page.goto("/result-ack");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/acknowledge|critical|abnormal|result/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("specimen-tracking page", async ({ page }) => {
    await page.goto("/specimen-tracking");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/specimen|chain of custody|phlebotomy/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("order detail loads for a seeded order", async ({ page }) => {
    const token = await loginViaApi();
    const id = await firstId("/api/orders?take=1", token);
    test.skip(!id, "No orders seeded");
    await page.goto(`/orders/${id}`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/sign|verify|administer|order|cds|audit/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("lab detail loads for a seeded lab", async ({ page }) => {
    const token = await loginViaApi();
    const id = await firstId("/api/labs?take=1", token);
    test.skip(!id, "No labs seeded");
    await page.goto(`/labs/${id}`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/result|analyte|range|reference|wbc|hgb|specimen/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
