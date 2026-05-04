/**
 * Clinical orders: CPOE full flow → order detail → eMAR → vitals entry → result acknowledgement
 */
import { test, expect } from "@playwright/test";

// ── Order detail ───────────────────────────────────────────────────────────────
test.describe("order detail", () => {
  test("orders list smoke", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("order detail page loads via /orders/:id", async ({ page }) => {
    // Navigate from pharmacy queue if a verify link exists (carries orderId)
    await page.goto("/pharmacy");
    const verifyLink = page.locator("a").filter({ hasText: /verify/i }).first();
    if (await verifyLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const href = (await verifyLink.getAttribute("href")) ?? "";
      const orderId = href.split("/").pop();
      if (orderId) {
        await page.goto(`/orders/${orderId}`);
        await expect(page).not.toHaveURL(/sign-in/);
      }
    }
  });
});

// ── eMAR ──────────────────────────────────────────────────────────────────────
test.describe("electronic medication administration record (eMAR)", () => {
  test("eMAR page loads with time grid", async ({ page }) => {
    await page.goto("/emar");
    await expect(page.getByRole("heading", { name: /emar/i })).toBeVisible();
  });

  test("eMAR shows time range filter buttons", async ({ page }) => {
    await page.goto("/emar");
    await expect(page.getByRole("button", { name: /last 8h/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /last 24h/i })).toBeVisible();
  });

  test("eMAR legend items are visible", async ({ page }) => {
    await page.goto("/emar");
    await expect(page.getByText(/given/i).first()).toBeVisible();
    await expect(page.getByText(/due now/i).first()).toBeVisible();
  });

  test("scan to administer button is present", async ({ page }) => {
    await page.goto("/emar");
    await expect(page.getByRole("button", { name: /scan/i })).toBeVisible();
  });
});

// ── Vitals entry ──────────────────────────────────────────────────────────────
test.describe("vitals entry", () => {
  test("vitals entry page loads with vital sign inputs", async ({ page }) => {
    await page.goto("/vitals-entry");
    await expect(page.getByRole("heading", { name: /vitals entry/i })).toBeVisible();
    await expect(page.getByLabel(/heart rate/i)).toBeVisible();
    await expect(page.getByLabel(/systolic/i)).toBeVisible();
    await expect(page.getByLabel(/spo/i)).toBeVisible();
  });

  test("vitals entry shows intake & output section", async ({ page }) => {
    await page.goto("/vitals-entry");
    await expect(page.getByText(/intake.*output|i.*o/i).first()).toBeVisible();
  });

  test("pull from monitor button is present", async ({ page }) => {
    await page.goto("/vitals-entry");
    await expect(page.getByRole("button", { name: /pull from monitor/i })).toBeVisible();
  });

  test("save vitals button is present", async ({ page }) => {
    await page.goto("/vitals-entry");
    await expect(page.getByRole("button", { name: /save vitals/i })).toBeVisible();
  });

  test("pain assessment section renders", async ({ page }) => {
    await page.goto("/vitals-entry");
    await expect(page.getByText(/pain/i).first()).toBeVisible();
  });

  test("vitals can be entered into heart rate field", async ({ page }) => {
    await page.goto("/vitals-entry");
    const hrInput = page.getByLabel(/heart rate/i);
    await hrInput.fill("72");
    await expect(hrInput).toHaveValue("72");
  });
});

// ── Result acknowledgement ────────────────────────────────────────────────────
test.describe("result acknowledgement", () => {
  test("result-ack page loads", async ({ page }) => {
    await page.goto("/result-ack");
    await expect(page).not.toHaveURL(/sign-in/);
  });
});

// ── CPOE full interaction flow ────────────────────────────────────────────────
test.describe("CPOE — full order entry workflow", () => {
  test("medication order type shows dose/route/frequency fields", async ({ page }) => {
    await page.goto("/cpoe");
    await page.getByText("Medication").click();
    // Common medication fields should appear
    await expect(page.getByText(/dose/i).first()).toBeVisible();
    await expect(page.getByText(/route/i).first()).toBeVisible();
    await expect(page.getByText(/frequency/i).first()).toBeVisible();
  });

  test("imaging order type card is clickable", async ({ page }) => {
    await page.goto("/cpoe");
    await page.getByText("Imaging").click();
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("nursing order type card is clickable", async ({ page }) => {
    await page.goto("/cpoe");
    await page.getByText("Nursing").click();
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("diet order type card is clickable", async ({ page }) => {
    await page.goto("/cpoe");
    await page.getByText("Diet").click();
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("routine priority button is selectable", async ({ page }) => {
    await page.goto("/cpoe");
    const routineBtn = page.getByRole("button", { name: /routine/i });
    if (await routineBtn.isVisible()) {
      await routineBtn.click();
      await expect(routineBtn).toHaveClass(/active/);
    }
  });

  test("e-sign field accepts provider name", async ({ page }) => {
    await page.goto("/cpoe");
    const esign = page.getByPlaceholder(/type your full name/i);
    if (await esign.isVisible()) {
      await esign.fill("Dr. Demo");
      await expect(esign).toHaveValue("Dr. Demo");
    }
  });
});

// ── E2E: CPOE → eMAR → vitals entry chain ────────────────────────────────────
test("clinical orders chain: CPOE → eMAR → vitals entry", async ({ page }) => {
  // CPOE
  await page.goto("/cpoe");
  await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible();
  await page.getByText("Lab").click();
  await expect(page.getByText("CBC")).toBeVisible();

  // eMAR
  await page.goto("/emar");
  await expect(page.getByRole("heading", { name: /emar/i })).toBeVisible();
  await expect(page.getByText(/given/i).first()).toBeVisible();

  // Vitals entry
  await page.goto("/vitals-entry");
  await expect(page.getByLabel(/heart rate/i)).toBeVisible();
  await page.getByLabel(/heart rate/i).fill("80");
  await page.getByLabel(/systolic/i).fill("120");
  await page.getByLabel(/spo/i).fill("98");
  await expect(page.getByRole("button", { name: /save vitals/i })).toBeVisible();
});
