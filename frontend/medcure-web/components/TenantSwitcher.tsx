"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveTenant, getTenants, saveAuth } from "@/lib/auth";
import type { AuthResponse, Tenant } from "@/lib/types";

export default function TenantSwitcher() {
  const router = useRouter();
  const [active, setActive] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(getActiveTenant());
    setTenants(getTenants());
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function pick(t: Tenant) {
    setOpen(false);
    if (active && t.id === active.id) return;
    const r = await api<AuthResponse>(`/api/auth/switch-tenant/${t.id}`, { method: "POST" });
    saveAuth(r);
    setActive(r.activeTenant);
    setTenants(r.tenants);
    router.refresh();
  }

  if (!active) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="tenant-switch" onClick={() => setOpen(o => !o)}>
        <span className="tenant-pic" style={{ background: active.colorHex }}>{active.initial}</span>
        <span className="tenant-meta">
          <span className="tenant-name">{active.name}</span>
          <span className="tenant-loc">{active.tier} · {active.location}</span>
        </span>
        <span className="chev">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      {open && (
        <div className="dropdown" style={{ right: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px 8px" }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Switch organization
            </span>
            <a href="/tenant-selector" style={{ fontSize: 10.5, fontWeight: 700, borderBottom: "1px solid var(--line)" }}>Manage all →</a>
          </div>
          {tenants.map(t => (
            <div key={t.id} className={`tm-row ${active.id === t.id ? "active" : ""}`} onClick={() => pick(t)}>
              <span className="tm-pic" style={{ background: t.colorHex }}>{t.initial}</span>
              <span><b>{t.name}</b><i>{t.role} · {t.location}</i></span>
              {active.id === t.id ? <span style={{ fontSize: 12, fontWeight: 800, color: "var(--good)" }}>✓</span> : <span />}
            </div>
          ))}
          <div className="tm-sep" />
          <a className="tm-row" href="/tenant-selector">
            <span className="tm-pic" style={{ background: "#fafbfc", color: "var(--ink-mute)", border: "1.5px dashed var(--line)" }}>+</span>
            <span><b>Create / join organization</b><i>New tenant or invite code</i></span>
            <span />
          </a>
        </div>
      )}
    </div>
  );
}
