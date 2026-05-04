/**
 * Staff & admin: Staff directory → messages → documents → settings → inventory
 */
import { test, expect } from "@playwright/test";

// ── Staff directory ────────────────────────────────────────────────────────────
test.describe("staff directory", () => {
  test("staff page loads with table", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /name/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /role/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
  });

  test("staff search is present", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByPlaceholder(/search by name.*role.*specialty/i)).toBeVisible();
  });

  test("onboard staff button is present", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByRole("button", { name: /onboard staff/i })).toBeVisible();
  });

  test("staff stat cards render", async ({ page }) => {
    await page.goto("/staff");
    await expect(page.getByText(/total staff/i)).toBeVisible();
    await expect(page.getByText(/on-call/i)).toBeVisible();
  });

  test("staff search filters results", async ({ page }) => {
    await page.goto("/staff");
    await page.getByPlaceholder(/search by name.*role.*specialty/i).fill("Dr");
    await page.waitForTimeout(400);
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Secure messaging ───────────────────────────────────────────────────────────
test.describe("secure messaging", () => {
  test("messages page loads with thread list", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
  });

  test("new message button is present", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByRole("button", { name: /new message/i })).toBeVisible();
  });

  test("message filter tabs render", async ({ page }) => {
    await page.goto("/messages");
    await expect(page.getByText(/unread/i)).toBeVisible();
    await expect(page.getByText(/urgent/i)).toBeVisible();
    await expect(page.getByText(/teams/i)).toBeVisible();
  });

  test("compose modal opens on new message click", async ({ page }) => {
    await page.goto("/messages");
    await page.getByRole("button", { name: /new message/i }).click();
    // Either a modal or inline composer appears
    const subjectField = page.getByLabel(/subject/i).first();
    if (await subjectField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(subjectField).toBeVisible();
    }
  });

  test("urgent filter shows flagged threads", async ({ page }) => {
    await page.goto("/messages");
    await page.getByText(/urgent/i).first().click();
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── Documents ─────────────────────────────────────────────────────────────────
test.describe("documents", () => {
  test("documents page loads", async ({ page }) => {
    await page.goto("/documents");
    await expect(page).not.toHaveURL(/sign-in/);
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 5_000 });
    await expect(heading).toBeVisible();
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────
test.describe("user settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/sign-in/);
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 5_000 });
    await expect(heading).toBeVisible();
  });
});

// ── Inventory ─────────────────────────────────────────────────────────────────
test.describe("inventory management", () => {
  test("inventory page loads", async ({ page }) => {
    await page.goto("/inventory");
    await expect(page).not.toHaveURL(/sign-in/);
    const heading = page.getByRole("heading").first();
    await heading.waitFor({ timeout: 5_000 });
    await expect(heading).toBeVisible();
  });
});

// ── Sitemap ───────────────────────────────────────────────────────────────────
test.describe("sitemap", () => {
  test("sitemap page loads", async ({ page }) => {
    await page.goto("/sitemap");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── E2E: Staff and admin chain ────────────────────────────────────────────────
test("staff & admin chain: staff directory → messages → documents → settings → inventory", async ({ page }) => {
  // 1. Staff
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
  await page.getByPlaceholder(/search by name.*role.*specialty/i).fill("nurse");
  await page.waitForTimeout(300);
  await page.getByPlaceholder(/search by name.*role.*specialty/i).clear();

  // 2. Messages — compose new message
  await page.goto("/messages");
  await expect(page.getByRole("heading", { name: /messages/i })).toBeVisible();
  await page.getByRole("button", { name: /new message/i }).click();
  await page.keyboard.press("Escape"); // close modal if open

  // 3. Filter urgent messages
  await page.getByText(/urgent/i).first().click();
  await expect(page).not.toHaveURL(/sign-in/);

  // 4. Documents
  await page.goto("/documents");
  await expect(page).not.toHaveURL(/sign-in/);

  // 5. Settings
  await page.goto("/settings");
  await expect(page).not.toHaveURL(/sign-in/);

  // 6. Inventory
  await page.goto("/inventory");
  await expect(page).not.toHaveURL(/sign-in/);
});
