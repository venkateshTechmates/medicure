import { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@medcure.health";
export const DEMO_PASSWORD = "demo123!";
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

/** Sign in via the UI and wait for the dashboard to load. */
export async function signIn(page: Page, email = DEMO_EMAIL, password = DEMO_PASSWORD) {
  await page.goto("/sign-in");
  await page.waitForLoadState("networkidle");
  // Labels have no for/id association — select by input type
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in to medcure/i }).click();
  await page.waitForURL("/", { timeout: 15_000 });
}

/** Clear localStorage and navigate to sign-in. */
export async function signOut(page: Page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto("/sign-in");
}

/** Navigate to a patient chart by MRN. */
export async function openPatient(page: Page, mrn: string) {
  await page.goto(`/patients/${mrn}`);
}

/** Switch to a hash tab on the current page. */
export async function switchTab(page: Page, fragment: string) {
  const url = page.url().split("#")[0];
  await page.goto(`${url}#${fragment}`);
}
