"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getActiveRole } from "../lib/auth";

// Order matches Mocks/scripts/nav.js (Message singular, Stock for inventory)
const tabs = [
  { id: "overview",     label: "Overview",     href: "/" },
  { id: "documents",    label: "Documents",    href: "/documents" },
  { id: "message",      label: "Message",      href: "/messages" },
  { id: "labs",         label: "Labs",         href: "/labs" },
  { id: "patients",     label: "Patients",     href: "/patients" },
  { id: "appointments", label: "Appointments", href: "/appointments" },
  { id: "pharmacy",     label: "Pharmacy",     href: "/pharmacy" },
  { id: "billing",      label: "Billing",      href: "/billing" },
  { id: "stock",        label: "Stock",        href: "/inventory" },
  { id: "staff",        label: "Staff",        href: "/staff" },
  { id: "ed",           label: "ED",           href: "/ed" },
  { id: "settings",     label: "Settings",     href: "/settings" },
  { id: "telemetry",    label: "Telemetry",    href: "/telemetry" },
  { id: "sitemap",      label: "Map",          href: "/sitemap" },
];

// Role -> allowed tab ids. Roles not listed fall through to a permissive default so a
// freshly-seeded role string doesn't blank the nav while we iterate the matrix.
const ROLE_TABS: Record<string, string[]> = {
  MD:           ["overview","patients","appointments","labs","pharmacy","ed","telemetry","message","documents","settings"],
  Resident:     ["overview","patients","appointments","labs","pharmacy","ed","telemetry","message","documents","settings"],
  RN:           ["patients","ed","telemetry","message","documents","settings"],
  RnEd:         ["patients","ed","telemetry","message","documents","settings"],
  ChargeNurse:  ["patients","ed","telemetry","message","documents","settings"],
  RPh:          ["pharmacy","stock","patients","message","settings"],
  Tech:         ["labs","patients","message","settings"],
  Reg:          ["patients","appointments","message","settings"],
  Bill:         ["billing","patients","message","settings"],
  Admin:        ["overview","documents","message","labs","patients","appointments","pharmacy","billing","stock","staff","ed","settings","telemetry","sitemap"],
  Privacy:      ["overview","documents","message","labs","patients","appointments","pharmacy","billing","stock","staff","ed","settings","telemetry","sitemap"],
};

function tabsForRole(role: string | null) {
  if (!role) return tabs;
  const allowed = ROLE_TABS[role];
  if (!allowed) return tabs; // unknown role — show everything rather than nothing
  return tabs.filter(t => allowed.includes(t.id));
}

export default function NavTabs() {
  const path = usePathname() || "/";
  const isActive = (href: string) => href === "/" ? path === "/" : path.startsWith(href);

  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  // Default to 7 visible (Overview…ED) so first paint matches the mock instead of "All in More".
  const [visibleCount, setVisibleCount] = useState(7);
  const [open, setOpen] = useState(false);

  // Role-filtered tabs. Resolve on mount (SSR-safe) and react to tenant changes via a
  // storage listener so a tenant switch in another tab updates the nav too.
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    setRole(getActiveRole());
    function onStorage(e: StorageEvent) {
      if (e.key === "activeTenant" || e.key === "medcure_tenant") setRole(getActiveRole());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const visibleTabs = tabsForRole(role);

  useEffect(() => {
    function recompute() {
      const wrap = wrapRef.current;
      const measure = measureRef.current;
      if (!wrap || !measure) return;
      const nav = wrap.parentElement; // .nav (grid: 1fr auto 1fr)
      if (!nav) return;

      const items = Array.from(measure.children) as HTMLElement[];
      const widths = items.map(el => el.offsetWidth + 6);
      if (widths.some(w => w <= 0)) {
        requestAnimationFrame(recompute);
        return;
      }
      const total = widths.reduce((a, b) => a + b, 0);

      // Available = nav width - logo - nav-right - grid gaps - tabs container padding
      const logo  = nav.querySelector(".logo") as HTMLElement | null;
      const right = nav.querySelector(".nav-right") as HTMLElement | null;
      const navW  = nav.clientWidth;
      const reserved = (logo?.offsetWidth ?? 0) + (right?.offsetWidth ?? 0) + 36 + 12;
      const available = Math.max(0, navW - reserved);

      if (total <= available) { setVisibleCount(prev => prev === visibleTabs.length ? prev : visibleTabs.length); return; }

      const moreW = 96;
      const cap = available - moreW;
      let used = 0, count = 0;
      for (let i = 0; i < widths.length; i++) {
        if (used + widths[i] <= cap) { used += widths[i]; count++; }
        else break;
      }
      const next = Math.max(1, count);
      setVisibleCount(prev => prev === next ? prev : next);
    }

    recompute();
    if (typeof document !== "undefined" && document.fonts && "ready" in document.fonts) {
      document.fonts.ready.then(recompute).catch(() => {});
    }
    window.addEventListener("resize", recompute);
    return () => { window.removeEventListener("resize", recompute); };
  }, [visibleTabs.length]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const visible  = visibleTabs.slice(0, visibleCount);
  const overflow = visibleTabs.slice(visibleCount);

  return (
    <>
      <div ref={measureRef} aria-hidden style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", display: "flex", gap: 6, top: -9999, left: -9999 }}>
        {visibleTabs.map(t => (
          <span key={t.id} className="tab">{t.label}</span>
        ))}
      </div>

      <div ref={wrapRef} className="tabs">
        {visible.map(t => (
          <Link key={t.id} className={`tab ${isActive(t.href) ? "active" : ""}`} href={t.href}>
            {t.label}
          </Link>
        ))}
        {overflow.length > 0 && (
          <div ref={moreRef} className="tab-more-wrap">
            <button
              className={`tab tab-more ${overflow.some(t => isActive(t.href)) ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
              aria-haspopup="true"
              aria-expanded={open}
            >
              <span className="ic" style={{ display: "inline-grid", placeItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                </svg>
              </span>
              More
            </button>
            {open && (
              <div className="tab-menu">
                {overflow.map(t => (
                  <Link key={t.id} className={isActive(t.href) ? "active" : ""} href={t.href} onClick={() => setOpen(false)}>
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
