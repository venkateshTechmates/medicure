/**
 * Shared Playwright helpers – sign in and fetch seeded IDs from the API.
 */
import { type Page, expect, request as pwRequest } from "@playwright/test";

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

/** Get a JWT via direct API call (no browser). */
export async function loginViaApi(): Promise<string> {
  const ctx = await pwRequest.newContext({ baseURL: API });
  const res = await ctx.post("/api/auth/login", {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()}`);
  const body = await res.json();
  await ctx.dispose();
  return body.token as string;
}

/** Authenticated GET helper. Returns parsed JSON or null on non-2xx. */
export async function apiGet<T>(path: string, token: string): Promise<T | null> {
  const ctx = await pwRequest.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  const res = await ctx.get(path);
  await ctx.dispose();
  return res.ok() ? ((await res.json()) as T) : null;
}

/** Pick the first seeded ID from a list endpoint; returns null when empty. */
export async function firstId(path: string, token: string): Promise<number | null> {
  const rows = await apiGet<Array<{ id: number }>>(path, token);
  return rows?.[0]?.id ?? null;
}

/** Pick the first seeded MRN. */
export async function firstMrn(token: string): Promise<string | null> {
  const rows = await apiGet<Array<{ mrn: string }>>("/api/patients?take=1", token);
  return rows?.[0]?.mrn ?? null;
}
