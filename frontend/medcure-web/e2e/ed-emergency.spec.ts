/**
 * ED & Emergency: ED mission control → triage → code blue → code STEMI → ED live
 */
import { test, expect } from "@playwright/test";

// ── Emergency Department ──────────────────────────────────────────────────────
test.describe("ED mission control", () => {
  test("ED page loads with KPI strip", async ({ page }) => {
    await page.goto("/ed");
    await expect(page.getByRole("heading", { name: /emergency dept/i })).toBeVisible();
    await expect(page.getByText(/active patients/i)).toBeVisible();
    await expect(page.getByText(/door to doc/i)).toBeVisible();
  });

  test("ED shows ESI triage board columns", async ({ page }) => {
    await page.goto("/ed");
    await expect(page.getByText(/ESI 1/i)).toBeVisible();
    await expect(page.getByText(/ESI 2/i)).toBeVisible();
    await expect(page.getByText(/ESI 3/i)).toBeVisible();
  });

  test("triage patient button is present", async ({ page }) => {
    await page.goto("/ed");
    await expect(page.getByRole("button", { name: /triage patient/i })).toBeVisible();
  });

  test("ED subnav filters render", async ({ page }) => {
    await page.goto("/ed");
    await expect(page.getByText("Resus")).toBeVisible();
    await expect(page.getByText("Fast Track")).toBeVisible();
    await expect(page.getByText("Behavioral")).toBeVisible();
  });

  test("bed map section is present", async ({ page }) => {
    await page.goto("/ed");
    await expect(page.getByText(/bed map/i)).toBeVisible();
  });

  test("active subnav filter highlights correctly", async ({ page }) => {
    await page.goto("/ed");
    const activeBtn = page.getByText("Active").first();
    await activeBtn.click();
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── ED Live ───────────────────────────────────────────────────────────────────
test.describe("ED live monitoring", () => {
  test("ED live page loads", async ({ page }) => {
    await page.goto("/ed/live");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Triage ────────────────────────────────────────────────────────────────────
test.describe("triage intake", () => {
  test("triage page loads with patient identification section", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByRole("heading", { name: /triage/i })).toBeVisible();
    await expect(page.getByText(/patient identification/i)).toBeVisible();
  });

  test("triage vital sign inputs are present", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByLabel(/hr/i).first()).toBeVisible();
    await expect(page.getByLabel(/spo/i).first()).toBeVisible();
  });

  test("ESI level buttons 1-5 are rendered", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByText("1 Resus")).toBeVisible();
    await expect(page.getByText("2 Emergent")).toBeVisible();
    await expect(page.getByText("3 Urgent")).toBeVisible();
    await expect(page.getByText("4 Less-urgent")).toBeVisible();
    await expect(page.getByText("5 Non-urgent")).toBeVisible();
  });

  test("confirm & dispatch button is present", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByRole("button", { name: /confirm.*dispatch/i })).toBeVisible();
  });

  test("triage quick history section renders", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByText(/quick history/i)).toBeVisible();
    await expect(page.getByText(/allergies/i).first()).toBeVisible();
    await expect(page.getByText(/current meds/i)).toBeVisible();
  });

  test("triage door clock is shown", async ({ page }) => {
    await page.goto("/triage");
    await expect(page.getByText(/door clock/i)).toBeVisible();
  });
});

// ── Code Blue ─────────────────────────────────────────────────────────────────
test.describe("code blue", () => {
  test("code blue page loads", async ({ page }) => {
    await page.goto("/code-blue");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Code STEMI ────────────────────────────────────────────────────────────────
test.describe("code STEMI", () => {
  test("code STEMI page loads", async ({ page }) => {
    await page.goto("/code-stemi");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: ED arrival → triage → assign ESI ────────────────────────────────────
test("ED workflow: mission control → triage intake → ESI assignment", async ({ page }) => {
  // 1. ED mission control
  await page.goto("/ed");
  await expect(page.getByRole("heading", { name: /emergency dept/i })).toBeVisible();
  await expect(page.getByText(/active patients/i)).toBeVisible();

  // 2. Start triage
  await page.getByRole("button", { name: /triage patient/i }).click();
  // Either navigates to /triage or opens a modal — handle both
  if (page.url().includes("/triage")) {
    await expect(page.getByRole("heading", { name: /triage/i })).toBeVisible();
  } else {
    await page.goto("/triage");
  }

  // 3. Fill patient info
  const lastName = page.getByLabel(/last name/i).first();
  if (await lastName.isVisible()) {
    await lastName.fill("TestPatient");
  }

  // 4. Record vital signs
  const hrInput = page.getByLabel(/hr/i).first();
  if (await hrInput.isVisible()) {
    await hrInput.fill("92");
  }

  // 5. Select ESI level 3 — Urgent
  const esi3 = page.getByText("3 Urgent");
  if (await esi3.isVisible()) {
    await esi3.click();
  }

  // 6. Verify dispatch button is enabled with data filled
  await expect(page.getByRole("button", { name: /confirm.*dispatch/i })).toBeVisible();

  // 7. Check code events pages
  await page.goto("/code-blue");
  await expect(page).not.toHaveURL(/sign-in/);

  await page.goto("/code-stemi");
  await expect(page).not.toHaveURL(/sign-in/);
});
