"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getActiveTenant, getTenants, getToken, saveAuth } from "@/lib/auth";
import type { AuthResponse, Tenant } from "@/lib/types";

export default function TenantSelectorPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [active, setActive] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/sign-in");
    setTenants(getTenants());
    setActive(getActiveTenant());
  }, [router]);

  async function pick(t: Tenant) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api<AuthResponse>(`/api/auth/switch-tenant/${t.id}`, { method: "POST" });
      saveAuth(r);
      router.push("/");
    } finally { setBusy(false); }
  }

  return (
    <div className="tenant-page-shell">
      <div className="tenant-card-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span className="eyebrow">Choose a workspace</span>
          <Link href="/sign-in" style={{ fontSize: 11, color: "var(--ink-soft)" }}>Sign out</Link>
        </div>
        <h1 className="h1" style={{ fontSize: 42 }}>Switch organization</h1>
        <div className="meta">
          You belong to {tenants.length} {tenants.length === 1 ? "organization" : "organizations"}. Each workspace scopes its own patients, orders, and billing — switch any time from the top nav.
        </div>

        <div className="tenant-grid">
          {tenants.map(t => (
            <button
              key={t.id}
              onClick={() => pick(t)}
              className={`tenant-tile ${active?.id === t.id ? "act-t" : ""}`}
              style={{ textAlign: "left" }}
              disabled={busy}
            >
              <div className="head-r">
                <span className="pic-t" style={{ background: t.colorHex }}>{t.initial}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{t.location} · {t.tier}</div>
                </div>
                {active?.id === t.id && <span className="pill good"><span className="pdot" />Active</span>}
              </div>
              <div className="stat-grid-t">
                <div><b>{Math.floor(80 + t.id * 13)}</b>my patients</div>
                <div><b>{Math.floor(8 + t.id * 3)}</b>inbox</div>
                <div><b>{Math.floor(t.id * 8)}h</b>on-call</div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7 }}>
                Role: <b style={{ fontWeight: 700 }}>{t.role}</b>
              </div>
            </button>
          ))}
          <div className="tenant-tile" style={{ borderStyle: "dashed", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: 32, cursor: "default" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f4f6f9", color: "var(--ink-mute)", display: "grid", placeItems: "center", fontSize: 22, marginBottom: 10 }}>+</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Join with invite code</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Or create a new organization</div>
            <input placeholder="ABCD-EFGH-1234" style={{ marginTop: 14, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, width: "100%", fontFamily: "JetBrains Mono, monospace", fontSize: 12, textAlign: "center" }} />
          </div>
        </div>

        <div style={{ marginTop: 22, padding: 14, background: "#fafbfc", borderRadius: 12, fontSize: 11, color: "var(--ink-soft)", textAlign: "center" }}>
          Switching organizations issues a fresh session token scoped to that tenant. PHI from one org is never visible to another.
        </div>
      </div>
    </div>
  );
}
