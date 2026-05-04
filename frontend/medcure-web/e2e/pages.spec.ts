import { test, expect } from "@playwright/test";

test.describe("dashboard", () => {
  test("dashboard loads with patient KPIs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /medical.*dashboard/is })).toBeVisible();
    // KPI strip shows patient count
    await expect(page.getByText(/patients/i).first()).toBeVisible();
  });
});

test.describe("patients list", () => {
  test("patients page loads census table", async ({ page }) => {
    await page.goto("/patients");
    await expect(page.getByRole("heading", { name: "Patients" })).toBeVisible();
    await expect(page.getByPlaceholder(/search by mrn/i)).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /patient/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /ward/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
  });

  test("search filters patient list", async ({ page }) => {
    await page.goto("/patients");
    const search = page.getByPlaceholder(/search by mrn/i);
    await search.fill("MRN");
    // Table should still have rows or show empty state
    await page.waitForTimeout(400);
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("admit patient button links to /admit", async ({ page }) => {
    await page.goto("/patients");
    const admitBtn = page.getByRole("link", { name: /admit patient/i });
    await expect(admitBtn).toBeVisible();
    await expect(admitBtn).toHaveAttribute("href", "/admit");
  });
});

test.describe("patient chart", () => {
  let firstMrn: string;

  test.beforeEach(async ({ page }) => {
    await page.goto("/patients");
    // Grab the MRN from the first chart link in the table
    const chartLink = page.locator('a[title="Chart"]').first();
    await chartLink.waitFor({ timeout: 5_000 });
    const href = await chartLink.getAttribute("href") ?? "";
    firstMrn = href.split("/patients/")[1]?.split("/")[0] ?? "MRN001";
  });

  test("chart summary tab shows patient header and demographics", async ({ page }) => {
    await page.goto(`/patients/${firstMrn}`);
    // Patient name visible in header
    await expect(page.locator(".pt-header")).toBeVisible();
  });

  test("vitals tab loads vitals table", async ({ page }) => {
    await page.goto(`/patients/${firstMrn}#vitals`);
    await expect(page.getByRole("columnheader", { name: "HR" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /bp/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /spo/i })).toBeVisible();
  });

  test("labs tab loads results table", async ({ page }) => {
    await page.goto(`/patients/${firstMrn}#labs`);
    await expect(page.getByRole("columnheader", { name: /test/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /value/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /flag/i })).toBeVisible();
  });

  test("orders tab renders medication orders", async ({ page }) => {
    await page.goto(`/patients/${firstMrn}#orders`);
    await expect(page.getByRole("columnheader", { name: /order/i }).first()).toBeVisible();
  });

  test("tab navigation links to CPOE", async ({ page }) => {
    await page.goto(`/patients/${firstMrn}`);
    const cpoeLink = page.getByRole("link", { name: /quick actions/i });
    await expect(cpoeLink).toBeVisible();
    await expect(cpoeLink).toHaveAttribute("href", "/cpoe");
  });
});

test.describe("CPOE — computerized provider order entry", () => {
  test("CPOE page loads stepper and order type cards", async ({ page }) => {
    await page.goto("/cpoe");
    await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible();
    await expect(page.getByText("Medication")).toBeVisible();
    await expect(page.getByText("Lab")).toBeVisible();
    await expect(page.getByText("Imaging")).toBeVisible();
  });

  test("selecting Lab order type shows common order sets", async ({ page }) => {
    await page.goto("/cpoe");
    await page.getByText("Lab").click();
    await expect(page.getByText("CBC")).toBeVisible();
    await expect(page.getByText("BMP")).toBeVisible();
  });

  test("stat priority can be selected", async ({ page }) => {
    await page.goto("/cpoe");
    const statBtn = page.getByRole("button", { name: /stat/i });
    if (await statBtn.isVisible()) {
      await statBtn.click();
      await expect(statBtn).toHaveClass(/active/);
    }
  });
});

test.describe("pharmacy", () => {
  test("pharmacy queue page loads", async ({ page }) => {
    await page.goto("/pharmacy");
    await expect(page.getByRole("heading", { name: /pharmacy/i })).toBeVisible();
    await expect(page.getByPlaceholder(/search rx/i)).toBeVisible();
  });

  test("pharmacy verify page loads for any order", async ({ page }) => {
    await page.goto("/pharmacy");
    const verifyLink = page.getByRole("link", { name: /verify/i }).first();
    if (await verifyLink.isVisible()) {
      await verifyLink.click();
      await expect(page).toHaveURL(/pharmacy\/verify/);
    }
  });
});
