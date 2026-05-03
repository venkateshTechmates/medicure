"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Claim } from "@/lib/types";

export default function PaymentPostingClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function refresh() {
    const rows = await api<Claim[]>("/api/billing/claims?take=100").catch(() => [] as Claim[]);
    setClaims(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function pay(id: number) {
    setBusy(id);
    try {
      await api(`/api/billing/claims/${id}/pay`, { method: "POST" });
      await refresh();
    } finally { setBusy(null); }
  }

  async function autoPost() {
    setBulkBusy(true);
    try {
      const submitted = claims.filter(c => c.status === "submitted").slice(0, 5);
      await Promise.all(submitted.map(c => api(`/api/billing/claims/${c.id}/pay`, { method: "POST" })));
      await refresh();
    } finally { setBulkBusy(false); }
  }

  // Group submitted claims by payer to simulate ERAs
  const byPayer = new Map<string, Claim[]>();
  for (const c of claims.filter(c => c.status === "submitted")) {
    const list = byPayer.get(c.payer) ?? [];
    list.push(c);
    byPayer.set(c.payer, list);
  }
  const eras = Array.from(byPayer.entries()).map(([payer, items], i) => ({
    id: `ERA-${new Date().getFullYear()}-${String(2400 + i).padStart(4, "0")}`,
    payer,
    eft: `EFT-${String(880000 + i * 1000).slice(0, 6)}`,
    items,
    gross: items.reduce((s, c) => s + c.amount, 0),
    adj: Math.round(items.reduce((s, c) => s + c.amount, 0) * 0.18),
  }));

  const paid = claims.filter(c => c.status === "paid");
  const denied = claims.filter(c => c.status === "denied");
  const postedToday = paid.reduce((s, c) => s + c.amount, 0);
  const adjustments = Math.round(postedToday * 0.18);
  const ptResp = Math.round(postedToday * 0.07);

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Billing · Payment posting</span>
          <h1 className="h1">Payment posting</h1>
          <div className="meta">{eras.length} ERAs in queue · {paid.length} posted · {denied.length} denied · {byPayer.size} payers</div>
        </div>
        <div className="toolbar">
          <button className="btn">Import ERA file</button>
          <button className="btn primary" onClick={autoPost} disabled={bulkBusy}>{bulkBusy ? "Posting…" : "Auto-post batch →"}</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Posted</div><div className="num">${postedToday.toLocaleString()}</div><div className="delta">{paid.length} claims</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Adjustments</div><div className="num">${adjustments.toLocaleString()}</div><div className="delta">contractual</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Patient resp.</div><div className="num">${ptResp.toLocaleString()}</div><div className="delta">to statement</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Denials</div><div className="num">{denied.length}</div><div className="delta">routed to denial mgmt</div></div>
      </div>

      <div className="card panel">
        <h2>ERA / EOB queue</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>ERA</th><th>Payer</th><th>Check / EFT</th><th>Claims</th><th>Gross</th><th>Adjustments</th><th /></tr></thead>
          <tbody>
            {eras.map(e => (
              <tr key={e.id}>
                <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>{e.id}</b></td>
                <td><b>{e.payer}</b></td>
                <td className="muted" style={{ fontFamily: "JetBrains Mono, monospace" }}>{e.eft}</td>
                <td>{e.items.length}</td>
                <td><b>${e.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
                <td className="muted">${e.adj.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td>
                  <button className="btn primary" style={{ fontSize: 11, padding: "6px 10px" }}
                    onClick={async () => { for (const c of e.items.slice(0, 5)) await pay(c.id); }}
                    disabled={bulkBusy}>Post →</button>
                </td>
              </tr>
            ))}
            {eras.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 12 }}>No ERAs awaiting posting.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Posted claims · today</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Claim</th><th>Patient</th><th>Payer</th><th>Amount</th><th /></tr></thead>
          <tbody>
            {paid.slice(0, 12).map(c => (
              <tr key={c.id}>
                <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>{c.claimNumber}</b></td>
                <td>{c.patient?.fullName ?? "—"}</td>
                <td>{c.payer}</td>
                <td><b>${c.amount.toLocaleString()}</b></td>
                <td><span className="pill good"><span className="pdot" />Paid</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
