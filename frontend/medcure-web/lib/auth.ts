"use client";
import type { AuthResponse, Tenant, User } from "./types";

const TOKEN_KEY = "medcure_token";
const USER_KEY  = "medcure_user";
const TENANT_KEY = "medcure_tenant";
const TENANTS_KEY = "medcure_tenants";

export function saveAuth(r: AuthResponse) {
  localStorage.setItem(TOKEN_KEY,   r.token);
  localStorage.setItem(USER_KEY,    JSON.stringify(r.user));
  localStorage.setItem(TENANT_KEY,  JSON.stringify(r.activeTenant));
  localStorage.setItem(TENANTS_KEY, JSON.stringify(r.tenants));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(TENANTS_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const j = localStorage.getItem(USER_KEY);
  return j ? (JSON.parse(j) as User) : null;
}

export function getActiveTenant(): Tenant | null {
  if (typeof window === "undefined") return null;
  const j = localStorage.getItem(TENANT_KEY);
  return j ? (JSON.parse(j) as Tenant) : null;
}

export function getTenants(): Tenant[] {
  if (typeof window === "undefined") return [];
  const j = localStorage.getItem(TENANTS_KEY);
  return j ? (JSON.parse(j) as Tenant[]) : [];
}

export function setActiveTenant(t: Tenant) {
  localStorage.setItem(TENANT_KEY, JSON.stringify(t));
}

/**
 * Returns the role string for the currently active tenant, or null if absent.
 * Reads from the "activeTenant" localStorage key per the role-gating spec, with a
 * fallback to the historical "medcure_tenant" key used by saveAuth().
 */
export function getActiveRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const a = localStorage.getItem("activeTenant");
    if (a) {
      const parsed = JSON.parse(a) as { role?: string };
      if (parsed?.role) return parsed.role;
    }
  } catch { /* fall through */ }
  try {
    const b = localStorage.getItem(TENANT_KEY);
    if (b) {
      const parsed = JSON.parse(b) as { role?: string };
      if (parsed?.role) return parsed.role;
    }
  } catch { /* fall through */ }
  return null;
}
