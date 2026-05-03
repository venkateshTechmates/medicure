"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PatientSummary, PatientDetail } from "@/lib/types";

export default function EligibilityClient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ at: string; payer: string; status: string }[]>([
    { at: "Today 14:02", payer: "—", status: "Verified" },
    { at: "Today 09:14", payer: "—", status: "Verified" },
    { at: "Yest 16:30",  payer: "—", status: "Verified" },
  ]);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pat == null) return;
    const p = patients.find(x => x.id === pat);
    if (!p) return;
    api<PatientDetail>(`/api/patients/${p.mrn}`).then(setDetail).catch(() => setDetail(null));
  }, [pat, patients]);

  async function runAgain() {
    setBusy(true);
    await new Promise(r => setTimeout(r, 600));
    const now = new Date();
    setHistory(h => [{ at: `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, payer: detail?.insurance ?? "—", status: "Verified" }, ...h.slice(0, 4)]);
    setBusy(false);
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Billing · Real-time eligibility</span>
          <h1 className="h1">Eligibility</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            · {detail?.insurance ?? "—"} · X12 270/271 · ePA enabled
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={runAgain} disabled={busy}>{busy ? "Verifying…" : "Run again"}</button>
          <button className="btn primary">+ New check <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="bill-grid">
        <div>
          <div className="bill-section">
            <div className="row between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 22 }}>Coverage active</h3>
              <span className="pill good"><span className="pdot" />Verified</span>
            </div>
            <div className="grid-2">
              <div className="info-block">
                <h4>Plan</h4>
                <div className="bill-row"><span className="k">Payer</span><span className="v">{detail?.insurance ?? "—"}</span></div>
                <div className="bill-row"><span className="k">Plan name</span><span className="v">Open Choice Gold</span></div>
                <div className="bill-row"><span className="k">Group</span><span className="v">812044</span></div>
                <div className="bill-row"><span className="k">Member ID</span><span className="v">W{1000000 + (detail?.id ?? 0) * 1000}</span></div>
                <div className="bill-row"><span className="k">Effective</span><span className="v">2024-01-01 → 2024-12-31</span></div>
              </div>
              <div className="info-block">
                <h4>Subscriber</h4>
                <div className="bill-row"><span className="k">Name</span><span className="v">{detail?.fullName ?? "—"}</span></div>
                <div className="bill-row"><span className="k">Age</span><span className="v">{detail?.age ?? "—"}</span></div>
                <div className="bill-row"><span className="k">Relationship</span><span className="v">Self</span></div>
                <div className="bill-row"><span className="k">Address</span><span className="v">{detail?.address ? "verified" : "—"}</span></div>
              </div>
            </div>
          </div>

          <div className="bill-section">
            <h3 style={{ margin: "0 0 12px", fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 22 }}>Benefits</h3>
            <div className="grid-3">
              <div className="info-block"><h4>Deductible</h4><div className="bill-total">$425<span style={{ fontSize: 14, color: "var(--ink-mute)" }}> / $1,500</span></div><div className="muted" style={{ fontSize: 11 }}>met YTD</div></div>
              <div className="info-block"><h4>OOP max</h4><div className="bill-total">$1,240<span style={{ fontSize: 14, color: "var(--ink-mute)" }}> / $4,500</span></div><div className="muted" style={{ fontSize: 11 }}>YTD</div></div>
              <div className="info-block"><h4>Copay</h4><div className="bill-total">$30<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>/visit</span></div><div className="muted" style={{ fontSize: 11 }}>specialist $50</div></div>
            </div>
          </div>

          <div className="bill-section">
            <h3 style={{ margin: "0 0 12px", fontFamily: "Instrument Serif", fontWeight: 400, fontSize: 22 }}>Service-specific coverage</h3>
            {[
              ["Emergency room",     "Covered · $250 copay (waived if admitted)"],
              ["Inpatient hospital", "Covered · $300/day after deductible"],
              ["Imaging (CT/MRI)",   "Covered · 20% coinsurance · ePA required"],
              ["Pharmacy",           "Covered · tier 1 $10 / tier 2 $30 / tier 3 $60"],
              ["Specialty Rx",       "Covered · prior auth required"],
            ].map(([k, v]) => (
              <div className="bill-row" key={k}><span className="k">{k}</span><span className="v" style={{ color: "var(--good)" }}>{v}</span></div>
            ))}
          </div>
        </div>

        <div>
          <div className="bill-section">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Auth requirements</div>
            <div className="bill-row"><span className="k">Inpatient admit</span><span className="v" style={{ color: "var(--good)" }}>✓ Auth on file</span></div>
            <div className="bill-row"><span className="k">CT chest</span><span className="v" style={{ color: "var(--warn)" }}>⏱ ePA pending</span></div>
            <div className="bill-row"><span className="k">Specialist consult</span><span className="v" style={{ color: "var(--good)" }}>Not required</span></div>
            <div className="bill-row"><span className="k">DME</span><span className="v" style={{ color: "var(--warn)" }}>Required</span></div>
          </div>

          <div className="bill-section">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Recent checks</div>
            {history.map((h, i) => (
              <div key={i} className="bill-row">
                <span className="k">{h.at}<br /><span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{h.payer}</span></span>
                <span className="v" style={{ color: "var(--good)" }}>{h.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
