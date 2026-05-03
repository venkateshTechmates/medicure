"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Claim, PatientSummary } from "@/lib/types";

const CPT_PRESETS = [
  { code: "99232", desc: "Subseq inpt visit · 99232", amount: 148 },
  { code: "99233", desc: "Subseq inpt visit · 99233", amount: 218 },
  { code: "99291", desc: "Critical care · 99291",      amount: 422 },
  { code: "99253", desc: "Cardiac consult · 99253",    amount: 168 },
  { code: "99213", desc: "Outpt EM · 99213",            amount: 102 },
];

export default function ChargeCaptureClient() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [cpt, setCpt] = useState(CPT_PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const rows = await api<Claim[]>("/api/billing/claims?take=20").catch(() => [] as Claim[]);
    setClaims(rows);
  }
  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
    refresh();
  }, []);

  async function add() {
    if (!pat) { setMsg("Pick a patient"); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/api/billing/claims", { method: "POST", body: JSON.stringify({
        patientId: pat,
        payer: "Aetna",
        cptCode: cpt.code,
        serviceDescription: cpt.desc,
        amount: cpt.amount,
        status: "submitted",
      }) });
      setMsg(`✓ Charge captured · ${cpt.code} $${cpt.amount}`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const today = claims.filter(c => {
    const d = new Date(c.dateOfService);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const total = claims.reduce((s, c) => s + c.amount, 0);
  const paid    = claims.filter(c => c.status === "paid").length;
  const denied  = claims.filter(c => c.status === "denied").length;
  const pending = claims.filter(c => c.status === "submitted" || c.status === "draft").length;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Billing · Charge capture</span>
          <h1 className="h1">Charge capture</h1>
          <div className="meta">{claims.length} charges · {today.length} today · {pending} pending · ${total.toLocaleString()} total</div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn">Submit batch</button>
          <button className="btn primary" onClick={add} disabled={busy}>{busy ? "Saving…" : "+ Capture charge →"}</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Total</div><div className="num">${total.toLocaleString()}</div><div className="delta">{claims.length} charges</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Paid</div><div className="num">{paid}</div><div className="delta">cleared</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Pending</div><div className="num">{pending}</div><div className="delta">awaiting payer</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Denied</div><div className="num">{denied}</div><div className="delta">need appeal</div></div>
      </div>

      <div className="card panel" style={{ marginBottom: 14 }}>
        <h2>Capture new charge</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div className="cpoe-field">
            <label>Patient</label>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
          </div>
          <div className="cpoe-field">
            <label>CPT code</label>
            <select value={cpt.code} onChange={e => { const c = CPT_PRESETS.find(x => x.code === e.target.value); if (c) setCpt(c); }}>
              {CPT_PRESETS.map(c => <option key={c.code} value={c.code}>{c.code} — {c.desc}</option>)}
            </select>
          </div>
          <div className="cpoe-field">
            <label>Amount</label>
            <input value={`$${cpt.amount.toLocaleString()}`} readOnly />
          </div>
          <button className="btn primary" onClick={add} disabled={busy} style={{ height: 38 }}>
            {busy ? "Saving…" : "Capture →"}
          </button>
        </div>
      </div>

      <div className="card panel">
        <h2>Charge queue</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Patient</th><th>Service</th><th>Payer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {claims.map(c => {
              const cls = c.status === "paid" ? "good" : c.status === "denied" ? "bad" : c.status === "appealing" ? "warn" : "info";
              return (
                <tr key={c.id}>
                  <td><b>{c.patient?.fullName ?? "—"}</b><br /><span className="muted" style={{ fontSize: 11 }}>{c.patient?.mrn ?? "—"}</span></td>
                  <td>{c.serviceDescription}<br /><span className="muted" style={{ fontSize: 11 }}>{c.cptCode}</span></td>
                  <td>{c.payer}</td>
                  <td>{new Date(c.dateOfService).toLocaleDateString()}</td>
                  <td><b>${c.amount.toLocaleString()}</b></td>
                  <td><span className={`pill ${cls}`}><span className="pdot" />{c.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
