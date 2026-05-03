"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtMoney } from "@/lib/fmt";
import type { Claim } from "@/lib/types";

interface Aging { b0_30: number; b31_60: number; b61_90: number; b91_120: number; b120: number; }

export default function BillingClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [aging, setAging] = useState<Aging | null>(null);

  useEffect(() => {
    api<Claim[]>("/api/billing/claims").then(setClaims).catch(() => {});
    api<Aging>("/api/billing/aging").then(setAging).catch(() => {});
  }, []);

  const denied = claims.filter(c => c.status === "denied").length;
  const paid   = claims.filter(c => c.status === "paid").length;
  const totalAR = aging ? aging.b0_30 + aging.b31_60 + aging.b61_90 + aging.b91_120 + aging.b120 : 0;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Revenue cycle</div>
          <h1 className="h1">Billing</h1>
          <div className="meta">{claims.length} claims · {fmtMoney(totalAR)} A/R · {denied} denied · {paid} paid</div>
        </div>
        <div className="toolbar">
          <button className="btn">Run AR report</button>
          <button className="btn primary">New claim <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Total A/R</div><div className="num">{fmtMoney(totalAR)}</div><div className="delta">all buckets</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>61–90 days</div><div className="num">{fmtMoney(aging?.b61_90 ?? 0)}</div><div className="delta">aging risk</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Denied</div><div className="num">{denied}</div><div className="delta">in last 30 d</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Paid</div><div className="num">{paid}</div><div className="delta">posted</div></div>
      </div>

      {aging && (
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>A/R aging</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
            {[
              { label: "0–30",   v: aging.b0_30 },
              { label: "31–60",  v: aging.b31_60 },
              { label: "61–90",  v: aging.b61_90 },
              { label: "91–120", v: aging.b91_120 },
              { label: "120+",   v: aging.b120 },
            ].map(b => (
              <div key={b.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: "100%",
                  height: `${Math.max(4, (b.v / Math.max(1, totalAR)) * 100)}%`,
                  background: "var(--ink)", borderRadius: "8px 8px 0 0"
                }} />
                <div className="muted" style={{ fontSize: 11, fontWeight: 700 }}>{b.label}</div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>{fmtMoney(b.v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <table className="table">
        <thead><tr><th>Claim</th><th>Patient</th><th>Service</th><th>Payer</th><th>DOS</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          {claims.map(c => (
            <tr key={c.id}>
              <td><b>{c.claimNumber}</b><br /><span className="muted" style={{ fontSize: 11 }}>CPT {c.cptCode}</span></td>
              <td>{c.patient?.fullName ?? "—"}</td>
              <td>{c.serviceDescription}</td>
              <td>{c.payer}</td>
              <td className="muted">{fmtDate(c.dateOfService)}</td>
              <td><b>{fmtMoney(c.amount)}</b></td>
              <td><span className={`pill ${c.status === "paid" ? "good" : c.status === "denied" ? "bad" : c.status === "appealing" ? "warn" : "info"}`}><span className="pdot" />{c.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
