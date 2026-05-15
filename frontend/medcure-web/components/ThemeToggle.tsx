"use client";
import { useEffect, useState } from "react";
import { getPreferredTheme, setTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) || getPreferredTheme();
    setLocal(t);
    setMounted(true);
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Theme>).detail;
      if (detail === "light" || detail === "dark") setLocal(detail);
    }
    window.addEventListener("medcure-theme-change", onChange as EventListener);
    return () => window.removeEventListener("medcure-theme-change", onChange as EventListener);
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setLocal(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={flip}
      aria-label={label}
      title={label}
      suppressHydrationWarning
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: "#fafbfc", border: "1px solid var(--line)",
        display: "grid", placeItems: "center", cursor: "pointer",
      }}
    >
      {mounted && isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
