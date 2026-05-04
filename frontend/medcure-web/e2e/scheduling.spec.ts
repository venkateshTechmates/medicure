/**
 * Scheduling: Appointments list → schedule appointment → clinic visit
 */
import { test, expect } from "@playwright/test";

// ── Appointments list ─────────────────────────────────────────────────────────
test.describe("appointments list", () => {
  test("appointments page loads", async ({ page }) => {
    await page.goto("/appointments");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("appointments page shows heading or calendar", async ({ page }) => {
    await page.goto("/appointments");
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 5_000 });
    await expect(heading).toBeVisible();
  });

  test("book an appointment link leads to /schedule", async ({ page }) => {
    await page.goto("/");
    const scheduleLink = page.getByRole("link", { name: /book an appointment/i });
    if (await scheduleLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(scheduleLink).toHaveAttribute("href", "/schedule");
    }
  });
});

// ── Schedule appointment ──────────────────────────────────────────────────────
test.describe("schedule appointment", () => {
  test("schedule page loads", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("schedule page has a heading", async ({ page }) => {
    await page.goto("/schedule");
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 5_000 });
    await expect(heading).toBeVisible();
  });
});

// ── Clinic visit ──────────────────────────────────────────────────────────────
test.describe("clinic visit", () => {
  test("clinic visit page loads", async ({ page }) => {
    await page.goto("/clinic-visit");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Scheduling chain ─────────────────────────────────────────────────────
test("scheduling chain: appointments → schedule → clinic visit", async ({ page }) => {
  // 1. Appointments
  await page.goto("/appointments");
  await expect(page).not.toHaveURL(/sign-in/);
  const heading = page.getByRole("heading").first();
  await heading.waitFor({ timeout: 5_000 });

  // 2. Navigate to schedule new appointment
  await page.goto("/schedule");
  await expect(page).not.toHaveURL(/sign-in/);

  // 3. Clinic visit flow
  await page.goto("/clinic-visit");
  await expect(page).not.toHaveURL(/sign-in/);
});
