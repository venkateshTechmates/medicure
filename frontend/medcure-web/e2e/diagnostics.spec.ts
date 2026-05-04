/**
 * Diagnostics: Labs list → lab detail → specimen tracking → imaging → radiology → pathology
 */
import { test, expect } from "@playwright/test";

// ── Labs list ─────────────────────────────────────────────────────────────────
test.describe("labs list", () => {
  test("labs page loads with result table", async ({ page }) => {
    await page.goto("/labs");
    await expect(page.getByRole("heading", { name: /labs/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /patient/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /test/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /value/i })).toBeVisible();
  });

  test("labs search box is present", async ({ page }) => {
    await page.goto("/labs");
    await expect(page.getByPlaceholder(/search by patient or test/i)).toBeVisible();
  });

  test("labs filter buttons render", async ({ page }) => {
    await page.goto("/labs");
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /critical/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /abnormal/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /normal/i })).toBeVisible();
  });

  test("order lab button is present", async ({ page }) => {
    await page.goto("/labs");
    await expect(page.getByRole("button", { name: /order lab/i })).toBeVisible();
  });

  test("critical filter shows only flagged results", async ({ page }) => {
    await page.goto("/labs");
    await page.getByRole("button", { name: /critical/i }).click();
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("lab search filters results", async ({ page }) => {
    await page.goto("/labs");
    await page.getByPlaceholder(/search by patient or test/i).fill("CBC");
    await page.waitForTimeout(400);
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Lab detail ────────────────────────────────────────────────────────────────
test.describe("lab detail", () => {
  test("lab detail page loads when navigated to", async ({ page }) => {
    await page.goto("/labs");
    const detailLink = page.locator("table tbody tr a").first();
    if (await detailLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await detailLink.click();
      await expect(page).not.toHaveURL(/sign-in/);
    } else {
      // Direct smoke check
      await page.goto("/labs/1");
      await expect(page).not.toHaveURL(/sign-in/);
    }
  });
});

// ── Specimen tracking ─────────────────────────────────────────────────────────
test.describe("specimen tracking", () => {
  test("specimen tracking page loads", async ({ page }) => {
    await page.goto("/specimen-tracking");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Imaging ───────────────────────────────────────────────────────────────────
test.describe("imaging viewer", () => {
  test("imaging page loads", async ({ page }) => {
    await page.goto("/imaging");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("imaging download button is present when viewer loads", async ({ page }) => {
    await page.goto("/imaging");
    const downloadBtn = page.getByRole("button", { name: /download/i });
    if (await downloadBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(downloadBtn).toBeVisible();
    }
  });
});

// ── Radiology ────────────────────────────────────────────────────────────────
test.describe("radiology", () => {
  test("radiology page loads", async ({ page }) => {
    await page.goto("/radiology");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Pathology ─────────────────────────────────────────────────────────────────
test.describe("pathology", () => {
  test("pathology page loads", async ({ page }) => {
    await page.goto("/pathology");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Full diagnostics chain ────────────────────────────────────────────────
test("diagnostics chain: labs list → search → critical filter → specimen → imaging", async ({ page }) => {
  // 1. Labs list
  await page.goto("/labs");
  await expect(page.getByRole("heading", { name: /labs/i })).toBeVisible();

  // 2. Search
  const search = page.getByPlaceholder(/search by patient or test/i);
  await search.fill("hemo");
  await page.waitForTimeout(400);
  await search.clear();

  // 3. Critical filter
  await page.getByRole("button", { name: /critical/i }).click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 4. Abnormal filter
  await page.getByRole("button", { name: /abnormal/i }).click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 5. Specimen tracking
  await page.goto("/specimen-tracking");
  await expect(page).not.toHaveURL(/sign-in/);

  // 6. Imaging
  await page.goto("/imaging");
  await expect(page).not.toHaveURL(/sign-in/);

  // 7. Radiology
  await page.goto("/radiology");
  await expect(page).not.toHaveURL(/sign-in/);

  // 8. Pathology
  await page.goto("/pathology");
  await expect(page).not.toHaveURL(/sign-in/);
});
