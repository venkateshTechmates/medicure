/**
 * Emergency department (PRD §5.5)
 * ───────────────────────────────
 * ed · triage · code-blue · code-stemi
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES: Array<{ path: string; needle: RegExp }> = [
  { path: "/ed", needle: /emergency|ed |triage|ems|bay/i },
  { path: "/triage", needle: /triage|esi|chief complaint|vitals/i },
  { path: "/code-blue", needle: /code blue|arrest|cpr|defib/i },
  { path: "/code-stemi", needle: /code stemi|door.?to.?balloon|cath/i },
];

test.describe("Emergency department pages", () => {
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
