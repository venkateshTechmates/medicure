/**
 * Inpatient & OR surfaces (PRD §5.4)
 * ──────────────────────────────────
 * bed-board · imaging · surgery-board · or-case · icu-flowsheet ·
 * telemetry · dialysis · infusion
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const PAGES: Array<{ path: string; needle: RegExp }> = [
  { path: "/bed-board", needle: /bed board|ward|occupancy|icu/i },
  { path: "/imaging", needle: /imaging|pacs|worklist|ct|mri/i },
  { path: "/surgery-board", needle: /surgery|or\s|case|gantt/i },
  { path: "/or-case", needle: /procedure|case|or\s|close case/i },
  { path: "/icu-flowsheet", needle: /icu|flowsheet|vitals|drip/i },
  { path: "/telemetry", needle: /telemetry|monitor|rhythm/i },
  { path: "/dialysis", needle: /dialysis|treatment|hd/i },
  { path: "/infusion", needle: /infusion|drip|pump/i },
];

test.describe("Inpatient & OR pages", () => {
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
