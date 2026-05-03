"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Claim } from "@/lib/types";

export default function ClaimDetailClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sel, setSel] = useState<Claim | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const rows = await api<Claim[]>("/api/billing/claims?take=20").catch(() => [] as Claim[]);
    setClaims(rows);
    if (!sel && rows.length) setSel(rows[0]);
  }
  useEffect(() => { refresh(); }, []);

  async function resubmit() {
    if (!sel) return;
    setBusy(true);
    try {
      await api(`/api/billing/claims/${sel.id}/submit`, { method: "POST" });
      await refresh();
    } finally { setBusy(false); }
  }
  async function pay() {
    if (!sel) return;
    setBusy(true);
    try {
      await api(`/api/billing/claims/${sel.id}/pay`, { method: "POST" });
      await refresh();
    } finally { setBusy(false); }
  }

  if (!sel) return <div className="muted">Loading…</div>;

  const allowed = Math.round(sel.amount * 0.8);
  const ptResp  = sel.amount - allowed;
  const cls = sel.status === "paid" ? "good" : sel.status === "denied" ? "bad" : sel.status === "appealing" ? "warn" : "info";

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/billing">Billing</a><span>›</span><span className="bc-cur">Claim {sel.claimNumber}</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Billing · Claim detail</span>
          <h1 className="h1">{sel.claimNumber}</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={sel.id} onChange={e => setSel(claims.find(c => c.id === Number(e.target.value)) ?? null)} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {claims.map(c => <option key={c.id} value={c.id}>{c.claimNumber} · {c.patient?.fullName ?? "—"}</option>)}
            </select>
            <span>· DOS {new Date(sel.dateOfService).toLocaleDateString()} · {sel.payer}</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print 1500</button>
          {sel.status !== "paid" && <button className="btn" onClick={pay} disabled={busy}>{busy ? "…" : "Mark paid"}</button>}
          <button className="btn primary" onClick={resubmit} disabled={busy}>{busy ? "Submitting…" : "Resubmit →"}</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Total charges</div><div className="num">${sel.amount.toLocaleString()}</div><div className="delta">{sel.cptCode}</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Allowed</div><div className="num">${allowed.toLocaleString()}</div><div className="delta">contractual rate</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Insurance pays</div><div className="num">${allowed.toLocaleString()}</div><div className="delta">100% allowed</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Patient resp.</div><div className="num">${ptResp.toLocaleString()}</div><div className="delta">deductible/copay</div></div>
      </div>

      <div className="bill-grid">
        <div>
          <div className="bill-section">
            <h3 style={{ margin: "0 0 12px", fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 22 }}>Service line</h3>
            <table className="table">
              <thead><tr><th>DOS</th><th>CPT</th><th>Description</th><th>Payer</th><th>Amount</th></tr></thead>
              <tbody>
                <tr>
                  <td className="muted">{new Date(sel.dateOfService).toLocaleDateString()}</td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{sel.cptCode}</td>
                  <td>{sel.serviceDescription}</td>
                  <td className="muted">{sel.payer}</td>
                  <td><b>${sel.amount.toLocaleString()}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="bill-section">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Status</div>
            <span className={`pill ${cls}`}><span className="pdot" />{sel.status}</span>
            <div className="bill-row" style={{ marginTop: 10 }}><span className="k">Patient</span><span className="v">{sel.patient?.fullName ?? "—"}</span></div>
            <div className="bill-row"><span className="k">MRN</span><span className="v">{sel.patient?.mrn ?? "—"}</span></div>
            <div className="bill-row"><span className="k">DOS</span><span className="v">{new Date(sel.dateOfService).toLocaleDateString()}</span></div>
            {sel.denialReason && <div className="bill-row"><span className="k">Denial</span><span className="v" style={{ color: "var(--bad)" }}>{sel.denialReason}</span></div>}
          </div>
        </div>
      </div>
    </>
  );
}
