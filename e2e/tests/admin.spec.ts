/**
 * Admin / ops + ancillary pages (PRD §5.9 + leftovers)
 * ───────────────────────────────────────────────────
 * inventory · staff · messages · documents · settings · sitemap ·
 * blood-bank · pathology · radiology · dashboard · appointments
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES: Array<{ path: string; needle: RegExp }> = [
  { path: "/dashboard", needle: /dashboard|appointment|kpi|today/i },
  { path: "/appointments", needle: /appointment|schedule|provider/i },
  { path: "/inventory", needle: /inventory|stock|par level|expiring|reorder/i },
  { path: "/staff", needle: /staff|onboard|provider|credential/i },
  { path: "/messages", needle: /message|thread|inbox|reply/i },
  { path: "/documents", needle: /document|repository|signature|category/i },
  { path: "/settings", needle: /settings|profile|notification|security/i },
  { path: "/sitemap", needle: /sitemap|core navigation|all pages/i },
  { path: "/blood-bank", needle: /blood bank|crossmatch|unit|request/i },
  { path: "/pathology", needle: /pathology|accession|specimen/i },
  { path: "/radiology", needle: /radiology|worklist|study|read/i },
];

test.describe("Admin / ops pages", () => {
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
