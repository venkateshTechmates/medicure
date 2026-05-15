export type Theme = "light" | "dark";

const STORAGE_KEY = "medcure_theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "dark" || v === "light" ? v : null;
}

export function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = getStoredTheme();
  if (stored) return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  try {
    window.dispatchEvent(new CustomEvent("medcure-theme-change", { detail: theme }));
  } catch {
    // ignore
  }
}

export function toggleTheme(): Theme {
  const current = (typeof document !== "undefined" && (document.documentElement.dataset.theme as Theme)) || getPreferredTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
