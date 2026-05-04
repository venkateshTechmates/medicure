/**
 * Clinical documentation: Note composer → care plan → immunizations → blood bank
 */
import { test, expect } from "@playwright/test";

// ── Note composer ─────────────────────────────────────────────────────────────
test.describe("note composer", () => {
  test("note composer loads with note type rail", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByRole("heading", { name: /compose note/i })).toBeVisible();
    await expect(page.getByText("Note type")).toBeVisible();
  });

  test("SOAP progress note type is available", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByText("SOAP progress")).toBeVisible();
  });

  test("H&P admission template is available", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByText(/H&P.*admission/i)).toBeVisible();
  });

  test("discharge summary template is available", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByText(/discharge summary/i)).toBeVisible();
  });

  test("specialty templates are shown", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByText("Specialty templates")).toBeVisible();
    await expect(page.getByText(/sepsis admit/i)).toBeVisible();
  });

  test("SOAP section headings render in editor", async ({ page }) => {
    await page.goto("/note-composer");
    // The SOAP editor should show Subjective / Objective / Assessment / Plan
    await expect(page.getByText("Subjective")).toBeVisible();
    await expect(page.getByText("Objective")).toBeVisible();
    await expect(page.getByText("Assessment")).toBeVisible();
    await expect(page.getByText("Plan")).toBeVisible();
  });

  test("sign & file button is present", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByRole("button", { name: /sign.*file/i })).toBeVisible();
  });

  test("save draft button is present", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
  });

  test("clicking SOAP note type loads the template", async ({ page }) => {
    await page.goto("/note-composer");
    await page.getByText("SOAP progress").click();
    await expect(page.getByText("Subjective")).toBeVisible();
  });

  test("dot phrase shortcut list renders", async ({ page }) => {
    await page.goto("/note-composer");
    await expect(page.getByText(/smart phrases|\.dot/i)).toBeVisible();
  });
});

// ── Care plan ─────────────────────────────────────────────────────────────────
test.describe("care plan", () => {
  test("care plan page loads", async ({ page }) => {
    await page.goto("/care-plan");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Immunizations ─────────────────────────────────────────────────────────────
test.describe("immunizations", () => {
  test("immunizations page loads", async ({ page }) => {
    await page.goto("/immunizations");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Blood bank ────────────────────────────────────────────────────────────────
test.describe("blood bank", () => {
  test("blood bank page loads", async ({ page }) => {
    await page.goto("/blood-bank");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Clinical documentation chain ─────────────────────────────────────────
test("documentation chain: note composer → care plan → immunizations", async ({ page }) => {
  // 1. Note composer — write a note
  await page.goto("/note-composer");
  await expect(page.getByRole("heading", { name: /compose note/i })).toBeVisible();

  // Select H&P template
  await page.getByText(/H&P.*admission/i).click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 2. Care plan
  await page.goto("/care-plan");
  await expect(page).not.toHaveURL(/sign-in/);

  // 3. Immunizations
  await page.goto("/immunizations");
  await expect(page).not.toHaveURL(/sign-in/);

  // 4. Blood bank
  await page.goto("/blood-bank");
  await expect(page).not.toHaveURL(/sign-in/);
});
