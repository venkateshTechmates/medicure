"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PatientSummary } from "@/lib/types";

interface VTile { key: string; label: string; unit: string; range: [number, number]; }
const VITALS: VTile[] = [
  { key: "hr",   label: "Heart rate",      unit: "bpm",   range: [60, 100] },
  { key: "sbp",  label: "Systolic BP",     unit: "mmHg",  range: [90, 140] },
  { key: "dbp",  label: "Diastolic BP",    unit: "mmHg",  range: [60, 90] },
  { key: "spo2", label: "SpO₂",            unit: "%",     range: [95, 100] },
  { key: "rr",   label: "Resp rate",       unit: "/min",  range: [12, 20] },
  { key: "temp", label: "Temperature",     unit: "°C",    range: [36.5, 37.5] },
  { key: "wt",   label: "Weight",          unit: "kg",    range: [40, 100] },
  { key: "glu",  label: "Blood glucose",   unit: "mg/dL", range: [70, 110] },
  { key: "o2",   label: "O₂ delivery",     unit: "L/min", range: [0, 6] },
];

const IO_TYPES = [
  { k: "iv",    nm: "IV fluids",  cls: "info",  v: 250 },
  { k: "po",    nm: "PO fluids",  cls: "info",  v: 320 },
  { k: "tube",  nm: "Tube feed",  cls: "info",  v: 0 },
  { k: "urine", nm: "Urine",      cls: "warn",  v: 380 },
  { k: "stool", nm: "Stool",      cls: "warn",  v: 0 },
  { k: "emesis",nm: "Emesis",     cls: "bad",   v: 0 },
];

export default function VitalsEntryClient() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [v, setV] = useState<Record<string, string>>({
    hr: "96", sbp: "118", dbp: "76", spo2: "97", rr: "18", temp: "36.9", wt: "31", glu: "98", o2: "0",
  });
  const [pain, setPain] = useState(2);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  async function save() {
    if (!pat) { setMsg("Pick a patient"); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/api/vitals", { method: "POST", body: JSON.stringify({
        patientId: pat,
        hr: parseInt(v.hr) || 0,
        sbp: parseInt(v.sbp) || 0,
        dbp: parseInt(v.dbp) || 0,
        spo2: parseInt(v.spo2) || 0,
        rr: parseInt(v.rr) || 0,
        tempC: parseFloat(v.temp) || 0,
        pain
      }) });
      setMsg("✓ Vitals saved");
      setTimeout(() => router.push("/patients"), 800);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const me = patients.find(p => p.id === pat);

  function isFlagged(t: VTile, val: string) {
    const n = parseFloat(val);
    if (isNaN(n)) return false;
    return n < t.range[0] || n > t.range[1];
  }

  const flags = VITALS.filter(t => isFlagged(t, v[t.key])).map(t => t.label);
  const ioIn  = IO_TYPES.filter(x => ["iv", "po", "tube"].includes(x.k)).reduce((s, x) => s + x.v, 0);
  const ioOut = IO_TYPES.filter(x => ["urine", "stool", "emesis"].includes(x.k)).reduce((s, x) => s + x.v, 0);

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/patients">Patients</a><span>›</span>
        <span className="bc-cur">Vitals entry</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Bedside · vitals charting</span>
          <h1 className="h1">Vitals entry</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span>· {me?.attendingName ?? "Brooks RN"}</span>
          </div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn">Pull from monitor</button>
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save vitals →"}</button>
        </div>
      </div>

      <div className="vitals-layout">
        <div>
          <div className="card panel">
            <h2>Vital signs</h2>
            <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
              Tap to edit · auto-flag values out of range
            </div>
            <div className="vitals-grid">
              {VITALS.map(t => {
                const flagged = isFlagged(t, v[t.key]);
                return (
                  <div key={t.key} className={`vital-input ${flagged ? "flag" : ""}`}>
                    <label>{t.label}</label>
                    <input value={v[t.key]} onChange={e => setV(s => ({ ...s, [t.key]: e.target.value }))} />
                    <div className="unit">{t.unit} · normal {t.range[0]}-{t.range[1]}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Pain assessment</h2>
            <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
              0-10 numeric rating scale · select location and quality
            </div>
            <div className="pain-scale">
              {Array.from({ length: 11 }).map((_, n) => (
                <button key={n} className={pain === n ? "active" : ""} onClick={() => setPain(n)}>{n}</button>
              ))}
            </div>
            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="cpoe-field">
                <label>Quality</label>
                <select><option>Sharp</option><option>Dull</option><option>Burning</option><option>Cramping</option><option>Throbbing</option></select>
              </div>
              <div className="cpoe-field">
                <label>Location</label>
                <input placeholder="e.g. RUQ, chest, generalized" />
              </div>
            </div>
            <div className="cpoe-field">
              <label>Onset / triggers</label>
              <input placeholder="e.g. 2 hrs ago after activity" />
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Intake &amp; output (mL · last 8h)</h2>
            <div className="grid-2">
              <div className="info-block">
                <h4>Intake</h4>
                {IO_TYPES.filter(x => ["iv", "po", "tube"].includes(x.k)).map(x => (
                  <div key={x.k} className="bill-row">
                    <span className="k">{x.nm}</span>
                    <input defaultValue={x.v} style={{ width: 90, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8, textAlign: "right" }} />
                  </div>
                ))}
                <div className="bill-row" style={{ marginTop: 8, fontWeight: 800 }}>
                  <span className="k">Total in</span>
                  <span className="v" style={{ color: "var(--good)" }}>{ioIn} mL</span>
                </div>
              </div>
              <div className="info-block">
                <h4>Output</h4>
                {IO_TYPES.filter(x => ["urine", "stool", "emesis"].includes(x.k)).map(x => (
                  <div key={x.k} className="bill-row">
                    <span className="k">{x.nm}</span>
                    <input defaultValue={x.v} style={{ width: 90, padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 8, textAlign: "right" }} />
                  </div>
                ))}
                <div className="bill-row" style={{ marginTop: 8, fontWeight: 800 }}>
                  <span className="k">Total out</span>
                  <span className="v" style={{ color: "var(--bad)" }}>{ioOut} mL</span>
                </div>
              </div>
            </div>
            <div className="bill-row" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 14 }}>
              <span className="k" style={{ fontWeight: 700 }}>Net balance · 8h</span>
              <span className="v" style={{ fontFamily: "Instrument Serif", fontSize: 26, color: ioIn - ioOut > 0 ? "var(--good)" : "var(--bad)" }}>
                {ioIn - ioOut > 0 ? "+" : ""}{ioIn - ioOut} mL
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Auto-flags ({flags.length})</div>
            {flags.length === 0 && <div className="muted" style={{ fontSize: 12 }}>All values within normal range.</div>}
            {flags.map((f, i) => (
              <div key={i} style={{ background: "#fff7f8", border: "1px solid #ffe1e7", padding: 10, borderRadius: 10, marginBottom: 8, fontSize: 12, color: "#b3263d" }}>
                <b>⚠ {f}</b> outside normal range
              </div>
            ))}
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Last 6 readings · HR</div>
            <svg viewBox="0 0 280 80" style={{ width: "100%", height: 80 }}>
              <g stroke="#ebedf1" strokeDasharray="2 4">
                <line x1="0" y1="20" x2="280" y2="20" />
                <line x1="0" y1="40" x2="280" y2="40" />
                <line x1="0" y1="60" x2="280" y2="60" />
              </g>
              <path d="M 10 50 L 60 46 L 110 42 L 160 38 L 210 36 L 260 32" fill="none" stroke="#0e1116" strokeWidth="2" strokeLinecap="round" />
              {[10, 60, 110, 160, 210, 260].map((x, i) => (
                <circle key={i} cx={x} cy={[50, 46, 42, 38, 36, 32][i]} r="3" fill="#0e1116" />
              ))}
            </svg>
            <div className="muted" style={{ fontSize: 11, textAlign: "center", marginTop: 6 }}>104 → 96 bpm · trending toward baseline</div>
          </div>
        </div>
      </div>
    </>
  );
}
