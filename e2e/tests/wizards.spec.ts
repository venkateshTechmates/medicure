/**
 * Multi-step workflows (PRD §5.6)
 * ───────────────────────────────
 * admit · discharge · schedule · note-composer ·
 * consult-request · transfer-request · signout (I-PASS)
 *
 * Each test asserts the wizard renders its step indicator + first step.
 */
import { test, expect } from "@playwright/test";
import { signIn } from "./helpers";

const WIZARDS: Array<{ path: string; needle: RegExp }> = [
  { path: "/admit", needle: /admit|demographics|insurance|bed|consent/i },
  { path: "/discharge", needle: /discharge|disposition|med rec|follow.?up/i },
  { path: "/schedule", needle: /schedule|visit type|provider|time slot/i },
  { path: "/note-composer", needle: /note|soap|h&p|template|sign & file/i },
  { path: "/consult-request", needle: /consult|specialist|page/i },
  { path: "/transfer-request", needle: /transfer|accepting|destination/i },
  { path: "/signout", needle: /signout|i.?pass|hand.?off|patient summary/i },
];

test.describe("Multi-step wizards", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  for (const { path, needle } of WIZARDS) {
    test(`${path} wizard renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page).not.toHaveURL(/sign-in/);
      await expect(page.getByText(needle).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("admit wizard has Next or step navigation", async ({ page }) => {
    await page.goto("/admit");
    const next = page
      .getByRole("button", { name: /next|continue|step\s*2/i })
      .or(page.getByText(/step\s*[1-4]|demographics|insurance|bed|consent/i).first());
    await expect(next.first()).toBeVisible({ timeout: 8_000 });
  });

  test("discharge wizard has Next or sign button", async ({ page }) => {
    await page.goto("/discharge");
    const next = page
      .getByRole("button", { name: /next|continue|sign|submit/i })
      .or(page.getByText(/disposition|med rec|instructions|follow.?up/i).first());
    await expect(next.first()).toBeVisible({ timeout: 8_000 });
  });

  test("admit wizard advances through all 4 steps", async ({ page }) => {
    await page.goto("/admit");
    // Step 1: Demographics
    await expect(page.getByRole("heading", { name: /demographics/i })).toBeVisible({
      timeout: 8_000,
    });
    await page.getByRole("button", { name: /continue|next/i }).first().click();
    // Step 2: Insurance
    await expect(page.getByRole("heading", { name: /insurance/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: /continue|next/i }).first().click();
    // Step 3: Bed assignment
    await expect(page.getByRole("heading", { name: /bed assignment/i })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole("button", { name: /continue|next/i }).first().click();
    // Step 4: Consent & sign — submit button label changes
    await expect(page.getByRole("heading", { name: /consent/i })).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByRole("button", { name: /submit admission/i }).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
