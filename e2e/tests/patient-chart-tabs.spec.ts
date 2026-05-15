/**
 * Patient chart — every tab + patient profile
 * ───────────────────────────────────────────
 * PRD §5.2: chart has 13 tabs (Summary, Vitals, Meds, Labs, Notes,
 * Problems, Allergies, Team, Orders, Imaging, Documents, Timeline, Care plan).
 * Hash-based deep links per CLAUDE.md.
 */
import { test, expect, type Page } from "@playwright/test";
import { signIn } from "./helpers";

async function openFirstPatient(page: Page) {
  await page.goto("/patients");
  const firstRow = page
    .getByRole("row")
    .nth(1)
    .or(page.locator("[data-testid='patient-card']").first());
  await expect(firstRow).toBeVisible({ timeout: 10_000 });
  await firstRow.click();
  await expect(page).toHaveURL(/\/patients\/[^/]+/, { timeout: 8_000 });
}

const TABS = [
  "summary",
  "vitals",
  "meds",
  "labs",
  "notes",
  "problems",
  "allergies",
  "team",
  "orders",
  "imaging",
  "documents",
  "timeline",
  "care-plan",
];

test.describe("Patient chart tabs", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  for (const tab of TABS) {
    test(`tab #${tab} renders`, async ({ page }) => {
      await openFirstPatient(page);
      // Try clickable tab/link first; fall back to hash navigation.
      const tabBtn = page
        .getByRole("tab", { name: new RegExp(tab.replace("-", ".?"), "i") })
        .or(page.getByRole("link", { name: new RegExp(tab.replace("-", ".?"), "i") }));
      if (await tabBtn.count()) {
        await tabBtn.first().click();
      } else {
        await page.evaluate((t) => {
          window.location.hash = t;
        }, tab);
      }
      // No crash → an h1/h2 or table or generic content stays visible.
      await expect(page.locator("h1, h2, table, [role='tabpanel']").first()).toBeVisible({
        timeout: 8_000,
      });
    });
  }

  test("dedicated patient profile route renders", async ({ page }) => {
    const { firstMrn, loginViaApi } = await import("./helpers");
    const token = await loginViaApi();
    const mrn = await firstMrn(token);
    expect(mrn).toBeTruthy();
    await page.goto(`/patients/${mrn}/profile`);
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(
      page.getByText(/patient profile|face sheet|demographics|insurance|contacts|code status/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
