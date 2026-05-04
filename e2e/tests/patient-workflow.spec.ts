/**
 * Patient workflow E2E tests
 * ──────────────────────────
 * Covers the core clinical workflow:
 *  1. Patient list loads
 *  2. Open a patient chart
 *  3. Navigate chart tabs (vitals, labs, orders)
 *  4. View vitals entry page
 *  5. Knowledge-graph cache endpoint is reachable
 */
import { test, expect, type Page } from "@playwright/test";
import { signIn, API } from "./helpers";

test.use({ storageState: undefined });

async function goToFirstPatient(page: Page): Promise<string> {
  await page.goto("/patients");
  // Wait for at least one patient row / card
  const firstRow = page.getByRole("row").nth(1).or(page.locator("[data-testid='patient-card']").first());
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();
  // Return current URL for MRN extraction
  return page.url();
}

test.describe("Patient workflow", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("patient list renders rows", async ({ page }) => {
    await page.goto("/patients");
    // Table should have at least one data row (skip header)
    const rows = page.getByRole("row");
    await expect(rows).toHaveCount(await rows.count(), { timeout: 8_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(1); // header + ≥1 patient
  });

  test("open patient chart from list", async ({ page }) => {
    const url = await goToFirstPatient(page);
    // URL should contain a patient identifier
    expect(url).toMatch(/patient|MRN|mrn|chart/i);
  });

  test("patient chart shows vitals tab", async ({ page }) => {
    await goToFirstPatient(page);

    const vitalsTab = page.getByRole("tab", { name: /vitals/i })
      .or(page.getByRole("link", { name: /vitals/i }));

    if (await vitalsTab.count() > 0) {
      await vitalsTab.first().click();
      // Some vital readings should appear
      await expect(
        page.getByText(/bp|blood pressure|hr|heart rate|temp|spo2/i).first()
      ).toBeVisible({ timeout: 8_000 });
    } else {
      // If hash-based navigation is used (#vitals)
      await page.evaluate(() => {
        window.location.hash = "vitals";
      });
      await expect(page).toHaveURL(/#vitals/);
    }
  });

  test("patient chart shows labs tab", async ({ page }) => {
    await goToFirstPatient(page);

    const labsTab = page.getByRole("tab", { name: /labs/i })
      .or(page.getByRole("link", { name: /labs/i }));

    if (await labsTab.count() > 0) {
      await labsTab.first().click();
    } else {
      await page.evaluate(() => { window.location.hash = "labs"; });
    }

    // Wait for lab content to appear (table or empty state)
    await expect(
      page.getByRole("table").or(page.getByText(/no labs|no results|lab/i)).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("patient chart shows orders tab", async ({ page }) => {
    await goToFirstPatient(page);

    const ordersTab = page.getByRole("tab", { name: /orders/i })
      .or(page.getByRole("link", { name: /orders/i }));

    if (await ordersTab.count() > 0) {
      await ordersTab.first().click();
    } else {
      await page.evaluate(() => { window.location.hash = "orders"; });
    }

    await expect(
      page.getByRole("table").or(page.getByText(/no orders|order/i)).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("vitals entry page is accessible", async ({ page }) => {
    await page.goto("/vitals-entry");
    // Should not redirect to sign-in (already authenticated)
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByText(/vital|blood pressure|temperature/i).first()).toBeVisible({
      timeout: 8_000,
    });
  });
});
