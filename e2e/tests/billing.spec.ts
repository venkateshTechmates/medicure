/**
 * Billing surfaces (PRD §5.8)
 * ───────────────────────────
 * billing · claim-detail · denial-mgmt · eligibility ·
 * charge-capture · payment-posting · patient-statement
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES: Array<{ path: string; needle: RegExp }> = [
  { path: "/billing", needle: /billing|claims|a\/r|aging|payer/i },
  { path: "/claim-detail", needle: /claim|cpt|icd|adjudic|appeal/i },
  { path: "/denial-mgmt", needle: /denial|appeal|reason code|recoup/i },
  { path: "/eligibility", needle: /eligibility|coverage|copay|deductible/i },
  { path: "/charge-capture", needle: /charge|capture|cpt|modifier/i },
  { path: "/payment-posting", needle: /payment|posting|era|auto.?post/i },
  { path: "/patient-statement", needle: /statement|balance|send statement/i },
];

test.describe("Billing pages", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  for (const { path, needle } of PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/sign-in/);
      await expect(page.getByText(needle).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
