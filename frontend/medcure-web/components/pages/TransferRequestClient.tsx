"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TransferRequest, PatientSummary } from "@/lib/types";

const WARDS = [
  { nm: "ICU",        avail: 1, status: "warn" as const },
  { nm: "CCU",        avail: 1, status: "warn" as const },
  { nm: "Med-Surg",   avail: 2, status: "good" as const },
  { nm: "Telemetry",  avail: 4, status: "good" as const },
  { nm: "Step-down",  avail: 6, status: "good" as const },
  { nm: "PACU",       avail: 3, status: "good" as const },
];
const ACUITY = ["Stable", "Watcher", "Critical"];
const ISOLATION = ["None", "Contact", "Droplet", "Airborne"];

export default function TransferRequestClient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [recent, setRecent] = useState<TransferRequest[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [from, setFrom] = useState("CCU");
  const [target, setTarget] = useState("Med-Surg");
  const [acuity, setAcuity] = useState("Watcher");
  const [iso, setIso] = useState("None");
  const [reason, setReason] = useState("Down-grade — clinically stable, ready for tele step-down");
  const [notes, setNotes] = useState("Day 2 post-PCI for inferior STEMI. Hemodynamically stable, no ectopy 24h. Continue DAPT.");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const list = await api<TransferRequest[]>("/api/transfers?take=20").catch(() => [] as TransferRequest[]);
    setRecent(list);
  }
  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
    refresh();
  }, []);

  async function submit() {
    if (!pat) { setMsg("Pick a patient"); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/api/transfers", { method: "POST", body: JSON.stringify({
        patientId: pat, fromUnit: from, toUnit: target,
        reason, acuity, isolation: iso, notes
      }) });
      setMsg(`✓ Transfer requested · ${from} → ${target}`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  async function accept(id: number) {
    await api(`/api/transfers/${id}/accept`, { method: "POST" });
    await refresh();
  }
  async function complete(id: number) {
    await api(`/api/transfers/${id}/complete`, { method: "POST" });
    await refresh();
  }

  const me = patients.find(p => p.id === pat);

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Transfer / bed request</h1>
          <div className="meta">Inter-ward transfer · choose destination · acuity · transport · hand-off</div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn">Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit transfer →"}</button>
        </div>
      </div>

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces)" }} />
        <div style={{ flex: 1 }}>
          <div className="nm">{me ? `${me.fullName} · MRN ${me.mrn}` : "Select patient"}</div>
          <div className="meta" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span><b>From</b></span>
            <select value={from} onChange={e => setFrom(e.target.value)} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {WARDS.map(w => <option key={w.nm} value={w.nm}>{w.nm}</option>)}
            </select>
          </div>
        </div>
        <div><span className={`pill ${acuity === "Critical" ? "bad" : acuity === "Watcher" ? "warn" : "good"}`}><span className="pdot" />{acuity}</span></div>
      </div>

      <div className="cpoe-grid">
        <div>
          <div className="card panel">
            <h2>1 · Destination ward</h2>
            <div className="sub">Live availability from bed board</div>
            <div className="order-types" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {WARDS.map(w => (
                <div key={w.nm} className={`ot ${target === w.nm ? "active" : ""}`} onClick={() => setTarget(w.nm)}>
                  <div className="ic" style={{ background: "#0e1116" }}>🛏</div>
                  <div className="nm">{w.nm}</div>
                  <div className="sub"><span className={`pill ${w.status}`}><span className="pdot" />{w.avail} available</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>2 · Acuity at transfer</h2>
            <div className="order-types" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {ACUITY.map(a => (
                <div key={a} className={`ot ${acuity === a ? "active" : ""}`} onClick={() => setAcuity(a)}>
                  <div className="nm" style={{ marginTop: 0 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>3 · Isolation precautions</h2>
            <div className="order-types" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {ISOLATION.map(i => (
                <div key={i} className={`ot ${iso === i ? "active" : ""}`} onClick={() => setIso(i)}>
                  <div className="nm" style={{ marginTop: 0 }}>{i}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>4 · Hand-off (SBAR)</h2>
            <div className="cpoe-field"><label>Reason for transfer</label><input value={reason} onChange={e => setReason(e.target.value)} /></div>
            <div className="cpoe-field"><label>Notes / hand-off</label><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Active transfers</h2>
              <span className="muted" style={{ fontSize: 11 }}>{recent.length}</span>
            </div>
            {recent.slice(0, 10).map(t => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, padding: "8px 0", borderBottom: "1px dashed var(--line)", fontSize: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.fromUnit} → {t.toUnit}</div>
                  <div className="muted" style={{ fontSize: 10 }}>{t.reason}</div>
                </div>
                <span className={`pill ${t.acuity === "Critical" ? "bad" : t.acuity === "Watcher" ? "warn" : "good"}`}>{t.acuity}</span>
                <span className={`pill ${t.status === "Completed" ? "good" : t.status === "Pending" ? "warn" : "info"}`}>{t.status}</span>
                {t.status === "Pending" && <button className="btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => accept(t.id)}>Accept</button>}
                {(t.status === "Accepted" || t.status === "InTransit") && <button className="btn" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => complete(t.id)}>Complete</button>}
                {t.status === "Completed" && <span className="muted" style={{ fontSize: 10 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Summary</div>
            <div className="bill-row"><span className="k">Patient</span><span className="v">{me ? me.fullName : "—"}</span></div>
            <div className="bill-row"><span className="k">From</span><span className="v">{from}</span></div>
            <div className="bill-row"><span className="k">To</span><span className="v">{target}</span></div>
            <div className="bill-row"><span className="k">Acuity</span><span className="v">{acuity}</span></div>
            <div className="bill-row"><span className="k">Isolation</span><span className="v">{iso}</span></div>
            <button className="btn primary" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit transfer →"}
            </button>
          </div>
          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Hand-off checklist</div>
            {["Vitals captured", "Active orders reviewed", "Lines/drains documented", "Pending labs noted", "RN-to-RN report given", "Family informed"].map(c => (
              <label key={c} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 12 }}>
                <input type="checkbox" defaultChecked /> {c}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
