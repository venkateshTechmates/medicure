"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Claim } from "@/lib/types";

export default function DenialMgmtClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const rows = await api<Claim[]>("/api/billing/claims?status=denied&take=50").catch(() => [] as Claim[]);
    setClaims(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function appeal(id: number) {
    setBusy(id);
    try {
      await api(`/api/billing/claims/${id}/appeal`, { method: "POST" });
      await refresh();
    } finally { setBusy(null); }
  }

  const totalAtRisk = claims.reduce((s, c) => s + c.amount, 0);
  const reasonGroups = new Map<string, { count: number; amt: number }>();
  for (const c of claims) {
    const key = c.denialReason || "Uncategorized";
    const g = reasonGroups.get(key) ?? { count: 0, amt: 0 };
    g.count++; g.amt += c.amount;
    reasonGroups.set(key, g);
  }
  const reasons = Array.from(reasonGroups.entries()).map(([reason, v]) => ({ reason, ...v })).sort((a, b) => b.amt - a.amt);

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Billing · Denial management</span>
          <h1 className="h1">Denial management</h1>
          <div className="meta">{claims.length} active denials · ${totalAtRisk.toLocaleString()} at risk · {claims.filter(c => c.status === "denied").length} appealable</div>
        </div>
        <div className="toolbar">
          <button className="btn">Export</button>
          <button className="btn primary">Bulk appeal <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Active denials</div><div className="num">{claims.length}</div><div className="delta">${totalAtRisk.toLocaleString()} at risk</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Reasons</div><div className="num">{reasons.length}</div><div className="delta">distinct codes</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Recovery rate</div><div className="num">62%</div><div className="delta">YTD avg</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Avg days</div><div className="num">8</div><div className="delta">target ≤ 14</div></div>
      </div>

      <div className="card panel">
        <h2>Top denial reasons</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Reason</th><th>Count</th><th>Amount at risk</th><th>% of total</th></tr></thead>
          <tbody>
            {reasons.map(r => (
              <tr key={r.reason}>
                <td>{r.reason}</td>
                <td><b>{r.count}</b></td>
                <td><b>${r.amt.toLocaleString()}</b></td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#f4f6f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(r.amt / Math.max(1, totalAtRisk)) * 100}%`, height: "100%", background: "var(--bad)" }} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 11 }}>{((r.amt / Math.max(1, totalAtRisk)) * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {reasons.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: "center", padding: 12 }}>No denials in queue.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Open denials</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Claim</th><th>Patient</th><th>Payer</th><th>Reason</th><th>Amount</th><th>Age</th><th /></tr></thead>
          <tbody>
            {claims.map(c => {
              const ageDays = Math.floor((Date.now() - new Date(c.dateOfService).getTime()) / 86400000);
              return (
                <tr key={c.id}>
                  <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.claimNumber}</b></td>
                  <td><b>{c.patient?.fullName ?? "—"}</b></td>
                  <td>{c.payer}</td>
                  <td className="muted" style={{ fontSize: 11 }}>{c.denialReason || "—"}</td>
                  <td><b>${c.amount.toLocaleString()}</b></td>
                  <td><b style={{ color: ageDays > 25 ? "var(--bad)" : ageDays > 14 ? "var(--warn)" : undefined }}>{ageDays}d</b></td>
                  <td><button className="btn primary" style={{ fontSize: 11, padding: "6px 10px" }} onClick={() => appeal(c.id)} disabled={busy === c.id}>{busy === c.id ? "…" : "Appeal →"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
