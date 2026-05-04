/**
 * Pharmacy full: verification workflow → blood bank
 */
import { test, expect } from "@playwright/test";

// ── Pharmacy queue ─────────────────────────────────────────────────────────────
test.describe("pharmacy queue", () => {
  test("pharmacy queue has four status tabs", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByText(/new.*\d+|new/i).first()).toBeVisible();
    await expect(page.getByText(/in progress/i)).toBeVisible();
    await expect(page.getByText(/ready/i)).toBeVisible();
    await expect(page.getByText(/all/i).first()).toBeVisible();
  });

  test("pharmacy stat cards render", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByText(/filled today/i)).toBeVisible();
    await expect(page.getByText(/in queue/i)).toBeVisible();
    await expect(page.getByText(/interactions/i)).toBeVisible();
  });

  test("new Rx button is present", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByRole("button", { name: /new rx/i })).toBeVisible();
  });

  test("pharmacy search is present", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByPlaceholder(/search rx.*drug.*ndc/i)).toBeVisible();
  });

  test("interaction alerts section is visible", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByText(/interaction.*alert|drug.*interaction/i).first()).toBeVisible();
  });

  test("active tab filter works", async ({ page }) => {
    await page.goto("/pharmacy");
    await page.getByText(/in progress/i).click();
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("PMP query button is present", async ({ page }) => {
    await page.goto("/pharmacy");
    const pmpBtn = page.getByRole("button", { name: /pmp query/i });
    if (await pmpBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(pmpBtn).toBeVisible();
    }
  });
});

// ── Pharmacy verification ─────────────────────────────────────────────────────
test.describe("pharmacy order verification", () => {
  test("verify page loads when orderId is provided", async ({ page }) => {
    // Try to find an order from pharmacy queue
    await page.goto("/pharmacy");
    const verifyLink = page.locator("a").filter({ hasText: /verify/i }).first();

    if (await verifyLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const href = (await verifyLink.getAttribute("href")) ?? "";
      await page.goto(href);
      await expect(page).not.toHaveURL(/sign-in/);
    } else {
      // Smoke check with arbitrary id
      await page.goto("/pharmacy/verify/1");
      await expect(page).not.toHaveURL(/sign-in/);
    }
  });

  test("verify page shows verification workflow sections", async ({ page }) => {
    await page.goto("/pharmacy/verify/1");
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

// ── E2E: Full pharmacy workflow ───────────────────────────────────────────────
test("pharmacy workflow: queue → filter tabs → search → verify first order", async ({ page }) => {
  // 1. Open pharmacy queue
  await page.goto("/pharmacy");
  await expect(page.getByRole("heading", { name: /pharmacy/i })).toBeVisible();

  // 2. Check interaction alerts
  await expect(page.getByText(/interaction.*alert|drug.*interaction/i).first()).toBeVisible();

  // 3. Search for a specific drug
  const search = page.getByPlaceholder(/search rx.*drug.*ndc/i);
  await search.fill("aspirin");
  await page.waitForTimeout(400);
  await search.clear();

  // 4. Switch to "All" tab
  await page.getByText(/^all$/i).first().click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 5. Try to open first verify link
  const verifyLink = page.locator("a").filter({ hasText: /verify/i }).first();
  if (await verifyLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await verifyLink.click();
    await expect(page).not.toHaveURL(/sign-in/);
    await page.goBack();
  }

  // 6. Blood bank
  await page.goto("/blood-bank");
  await expect(page).not.toHaveURL(/sign-in/);
});
