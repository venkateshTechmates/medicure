"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Claim, PatientSummary } from "@/lib/types";

export default function PatientStatementClient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pat == null) return;
    api<Claim[]>(`/api/billing/claims?take=100`)
      .then(rows => setClaims(rows.filter(c => c.patient?.id === pat)))
      .catch(() => setClaims([]));
  }, [pat]);

  const me = patients.find(p => p.id === pat);
  const totals = claims.reduce((acc, c) => {
    const ins = Math.round(c.amount * 0.8);
    const ptResp = c.amount - ins;
    return { ch: acc.ch + c.amount, ins: acc.ins + ins, pat: acc.pat + ptResp };
  }, { ch: 0, ins: 0, pat: 0 });

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Billing · Patient statement</span>
          <h1 className="h1">Patient statement</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span>· {me?.fullName ?? "—"} · {claims.length} claims · {me?.fullName ? `Insurance: ${me.fullName}` : ""}</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print PDF</button>
          <button className="btn">Email</button>
          <button className="btn primary">Send statement <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="bill-grid">
        <div>
          <div className="bill-section">
            <h3 style={{ margin: "0 0 12px", fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 22 }}>Charges &amp; payments</h3>
            <table className="table">
              <thead><tr><th>Date</th><th>Service</th><th>Payer</th><th>Charges</th><th>Insurance paid</th><th>Patient resp.</th><th>Status</th></tr></thead>
              <tbody>
                {claims.map(c => {
                  const ins = Math.round(c.amount * 0.8);
                  const ptResp = c.amount - ins;
                  const cls = c.status === "paid" ? "good" : c.status === "denied" ? "bad" : "info";
                  return (
                    <tr key={c.id}>
                      <td className="muted">{new Date(c.dateOfService).toLocaleDateString()}</td>
                      <td>{c.serviceDescription}<br /><span className="muted" style={{ fontSize: 11 }}>{c.cptCode}</span></td>
                      <td>{c.payer}</td>
                      <td><b>${c.amount.toLocaleString()}</b></td>
                      <td>${ins.toLocaleString()}</td>
                      <td><b>${ptResp.toLocaleString()}</b></td>
                      <td><span className={`pill ${cls}`}><span className="pdot" />{c.status}</span></td>
                    </tr>
                  );
                })}
                {claims.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 12 }}>No claims for this patient yet.</td></tr>}
              </tbody>
              <tfoot>
                <tr style={{ background: "#fafbfc", fontWeight: 700 }}>
                  <td colSpan={3}>Totals</td>
                  <td>${totals.ch.toLocaleString()}</td>
                  <td>${totals.ins.toLocaleString()}</td>
                  <td>${totals.pat.toLocaleString()}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div>
          <div className="bill-section">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Balance due</div>
            <div style={{ fontFamily: "Instrument Serif", fontSize: 48, lineHeight: 1, letterSpacing: "-0.02em" }}>${totals.pat.toLocaleString()}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Across {claims.length} claim{claims.length === 1 ? "" : "s"}</div>
            <button className="btn primary" style={{ width: "100%", marginTop: 14, justifyContent: "center" }}>Pay online →</button>
          </div>
          <div className="bill-section">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Plan options</div>
            <div className="bill-row"><span className="k">3 months</span><span className="v">${(totals.pat / 3).toFixed(2)}/mo</span></div>
            <div className="bill-row"><span className="k">6 months</span><span className="v">${(totals.pat / 6).toFixed(2)}/mo</span></div>
            <div className="bill-row"><span className="k">12 months</span><span className="v">${(totals.pat / 12).toFixed(2)}/mo</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
