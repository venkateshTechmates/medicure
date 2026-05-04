/**
 * Shared Playwright helpers – sign in and get an authenticated page.
 */
import { type Browser, type Page, expect } from "@playwright/test";

export const DEMO_EMAIL = "demo@medcure.health";
export const DEMO_PASSWORD = "demo123!";
export const BASE = process.env.BASE_URL || "http://localhost:3000";
export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/** Sign in via the UI and return the page with auth stored in localStorage. */
export async function signIn(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(DEMO_EMAIL);
  await page.getByLabel(/password/i).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect to dashboard or patient list
  await expect(page).toHaveURL(/\/(dashboard|patients|$)/, { timeout: 10_000 });
}

/** Pull JWT token from localStorage (requires signed-in page). */
export async function getToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem("medcure_token"));
  if (!token) throw new Error("No token in localStorage – not signed in");
  return token;
}
