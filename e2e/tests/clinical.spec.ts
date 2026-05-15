/**
 * Clinical workflows (PRD §5.7)
 * ─────────────────────────────
 * care-plan · allergy-management · immunizations · clinic-visit
 * (vitals-entry covered in patient-workflow.spec.ts)
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES: Array<{ path: string; needle: RegExp }> = [
  { path: "/care-plan", needle: /care plan|goal|problem|intervention/i },
  { path: "/allergy-management", needle: /allerg|reaction|severity|severe/i },
  { path: "/immunizations", needle: /immuniz|vaccine|dose|cvx/i },
  { path: "/clinic-visit", needle: /clinic visit|encounter|sign & file/i },
];

test.describe("Clinical workflow pages", () => {
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
