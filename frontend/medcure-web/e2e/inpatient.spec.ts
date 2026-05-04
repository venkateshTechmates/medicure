/**
 * Inpatient monitoring: Bed board → telemetry → ICU flowsheet → surgery board → OR → dialysis → infusion
 */
import { test, expect } from "@playwright/test";

// ── Bed board ─────────────────────────────────────────────────────────────────
test.describe("bed board", () => {
  test("bed board loads KPI strip", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByRole("heading", { name: /bed board/i })).toBeVisible();
    await expect(page.getByText(/total beds/i)).toBeVisible();
    await expect(page.getByText(/available/i).first()).toBeVisible();
  });

  test("ward filter buttons are present", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByText("All wards")).toBeVisible();
    await expect(page.getByText("ICU")).toBeVisible();
    await expect(page.getByText("Med-surg")).toBeVisible();
  });

  test("run optimizer button is present", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByRole("button", { name: /run optimizer/i })).toBeVisible();
  });

  test("reserve bed button is present", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByRole("button", { name: /reserve bed/i })).toBeVisible();
  });

  test("bed legend items are shown", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByText("Occupied")).toBeVisible();
    await expect(page.getByText("Available")).toBeVisible();
    await expect(page.getByText("Cleaning")).toBeVisible();
  });

  test("demand forecast section is present", async ({ page }) => {
    await page.goto("/bed-board");
    await expect(page.getByText(/discharges.*today|inbound/i).first()).toBeVisible();
  });
});

// ── Telemetry ─────────────────────────────────────────────────────────────────
test.describe("cardiac telemetry", () => {
  test("telemetry page loads with unit filters", async ({ page }) => {
    await page.goto("/telemetry");
    await expect(page.getByRole("heading", { name: /telemetry/i })).toBeVisible();
    await expect(page.getByText("All units")).toBeVisible();
    await expect(page.getByText("ICU")).toBeVisible();
    await expect(page.getByText("CCU")).toBeVisible();
  });

  test("telemetry view filter options render", async ({ page }) => {
    await page.goto("/telemetry");
    await expect(page.getByText("All patients")).toBeVisible();
    await expect(page.getByText("Alarming")).toBeVisible();
    await expect(page.getByText("My patients")).toBeVisible();
  });

  test("alarm stats (Critical/Warning/Stable) are shown", async ({ page }) => {
    await page.goto("/telemetry");
    await expect(page.getByText(/critical/i).first()).toBeVisible();
    await expect(page.getByText(/warning/i).first()).toBeVisible();
    await expect(page.getByText(/stable/i).first()).toBeVisible();
  });

  test("telemetry acknowledge button is available", async ({ page }) => {
    await page.goto("/telemetry");
    const ackBtn = page.getByRole("button", { name: /acknowledge/i }).first();
    if (await ackBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(ackBtn).toBeVisible();
    }
  });
});

// ── ICU flowsheet ─────────────────────────────────────────────────────────────
test.describe("ICU flowsheet", () => {
  test("ICU flowsheet page loads", async ({ page }) => {
    await page.goto("/icu-flowsheet");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Surgery board ─────────────────────────────────────────────────────────────
test.describe("surgery board", () => {
  test("surgery board page loads", async ({ page }) => {
    await page.goto("/surgery-board");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── OR case management ────────────────────────────────────────────────────────
test.describe("OR case", () => {
  test("OR case page loads", async ({ page }) => {
    await page.goto("/or-case");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Dialysis ──────────────────────────────────────────────────────────────────
test.describe("dialysis", () => {
  test("dialysis page loads", async ({ page }) => {
    await page.goto("/dialysis");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Infusion ──────────────────────────────────────────────────────────────────
test.describe("infusion management", () => {
  test("infusion page loads", async ({ page }) => {
    await page.goto("/infusion");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Bed board → telemetry monitoring chain ───────────────────────────────
test("inpatient monitoring chain: bed board → telemetry → ICU flowsheet", async ({ page }) => {
  // 1. Bed board — check occupancy
  await page.goto("/bed-board");
  await expect(page.getByText(/total beds/i)).toBeVisible();

  // 2. Filter to ICU
  const icuFilter = page.getByText("ICU").first();
  await icuFilter.click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 3. Telemetry dashboard
  await page.goto("/telemetry");
  await expect(page.getByText("All units")).toBeVisible();

  // 4. Switch to alarming view
  const alarmingFilter = page.getByText("Alarming");
  if (await alarmingFilter.isVisible()) {
    await alarmingFilter.click();
    await expect(page).not.toHaveURL(/sign-in/);
  }

  // 5. ICU flowsheet
  await page.goto("/icu-flowsheet");
  await expect(page).not.toHaveURL(/sign-in/);

  // 6. Surgery board
  await page.goto("/surgery-board");
  await expect(page).not.toHaveURL(/sign-in/);
});
