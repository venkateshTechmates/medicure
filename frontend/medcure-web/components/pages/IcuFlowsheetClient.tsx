"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PatientSummary, Vital } from "@/lib/types";

const HOURS = ["00", "02", "04", "06", "08", "10", "12", "14"];
type Cell = { v: string; cls?: "bad" | "warn" | "good" };
type Row = { lbl: string; values: Cell[]; section?: boolean };

const ROWS: Row[] = [
  { lbl: "VITALS", values: HOURS.map(() => ({ v: "" })), section: true },
  { lbl: "HR (bpm)",        values: [{ v: "112", cls: "warn" }, { v: "108" }, { v: "104" }, { v: "98" }, { v: "96" }, { v: "94" }, { v: "92" }, { v: "90" }] },
  { lbl: "BP (sys/dia)",    values: [{ v: "88/54", cls: "bad" }, { v: "92/58", cls: "warn" }, { v: "98/62" }, { v: "104/64" }, { v: "108/68" }, { v: "112/70" }, { v: "118/72" }, { v: "120/74" }] },
  { lbl: "MAP (mmHg)",      values: [{ v: "65", cls: "warn" }, { v: "69" }, { v: "74" }, { v: "77" }, { v: "81" }, { v: "84" }, { v: "87" }, { v: "89" }] },
  { lbl: "SpO₂ (%)",        values: [{ v: "88", cls: "bad" }, { v: "91", cls: "warn" }, { v: "94" }, { v: "95" }, { v: "96" }, { v: "97" }, { v: "97" }, { v: "98" }] },
  { lbl: "RR (/min)",       values: [{ v: "32", cls: "bad" }, { v: "28", cls: "warn" }, { v: "24" }, { v: "22" }, { v: "20" }, { v: "18" }, { v: "18" }, { v: "16" }] },
  { lbl: "Temp (°C)",       values: [{ v: "38.4", cls: "warn" }, { v: "38.1" }, { v: "37.8" }, { v: "37.4" }, { v: "37.1" }, { v: "36.9" }, { v: "36.8" }, { v: "36.8" }] },
  { lbl: "VENTILATOR", values: HOURS.map(() => ({ v: "" })), section: true },
  { lbl: "Mode",            values: HOURS.map(() => ({ v: "AC/VC" })) },
  { lbl: "Tidal Vol (mL)",  values: HOURS.map(() => ({ v: "420" })) },
  { lbl: "PEEP",            values: HOURS.map(() => ({ v: "10" })) },
  { lbl: "FiO₂",            values: [{ v: "100", cls: "bad" }, { v: "80", cls: "warn" }, { v: "60" }, { v: "50" }, { v: "45" }, { v: "40" }, { v: "40" }, { v: "35" }] },
  { lbl: "Plat (cmH₂O)",    values: HOURS.map(() => ({ v: "24" })) },
  { lbl: "DRIPS", values: HOURS.map(() => ({ v: "" })), section: true },
  { lbl: "Norepi (mcg/kg/min)", values: [{ v: "0.3", cls: "bad" }, { v: "0.2" }, { v: "0.15" }, { v: "0.1" }, { v: "0.08" }, { v: "0.05" }, { v: "0.02" }, { v: "off", cls: "good" }] },
  { lbl: "Vaso (U/hr)",     values: [{ v: "0.04" }, { v: "0.04" }, { v: "0.02" }, { v: "off", cls: "good" }, { v: "off", cls: "good" }, { v: "off", cls: "good" }, { v: "off", cls: "good" }, { v: "off", cls: "good" }] },
  { lbl: "Propofol (mcg/kg/min)", values: HOURS.map(() => ({ v: "30" })) },
  { lbl: "Fent (mcg/hr)",   values: HOURS.map(() => ({ v: "75" })) },
  { lbl: "Insulin (U/hr)",  values: HOURS.map((_, i) => ({ v: String(2 + i % 3) })) },
  { lbl: "I/O", values: HOURS.map(() => ({ v: "" })), section: true },
  { lbl: "IV in (mL)",      values: ["180", "180", "200", "180", "150", "120", "100", "100"].map(v => ({ v })) },
  { lbl: "Urine (mL)",      values: ["20", "30", "55", "80", "110", "125", "140", "150"].map(v => ({ v })) },
  { lbl: "Net (mL)",        values: ["+160", "+150", "+145", "+100", "+40", "-5", "-40", "-50"].map(v => ({ v })) },
];

export default function IcuFlowsheetClient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?ward=ICU&take=20").then(rows => {
      setPatients(rows.length ? rows : []);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (pat == null) return;
    const me = patients.find(p => p.id === pat);
    if (!me) return;
    api<Vital[]>(`/api/patients/${me.mrn}/vitals`).then(setVitals).catch(() => setVitals([]));
  }, [pat, patients]);

  const me = patients.find(p => p.id === pat);

  // Build live HR/BP/SpO2 row from last 8 vitals
  const live = vitals.slice(0, 8).reverse();
  const hrCells = live.length ? live.map(v => ({ v: String(v.hr), cls: v.hr > 100 ? "warn" as const : v.hr < 50 ? "bad" as const : undefined })) : null;
  const bpCells = live.length ? live.map(v => ({ v: `${v.sbp}/${v.dbp}`, cls: v.sbp < 90 ? "bad" as const : v.sbp > 160 ? "warn" as const : undefined })) : null;
  const spo2Cells = live.length ? live.map(v => ({ v: String(v.spo2), cls: v.spo2 < 90 ? "bad" as const : v.spo2 < 94 ? "warn" as const : undefined })) : null;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Critical care · ICU flowsheet</span>
          <h1 className="h1">ICU flowsheet</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
              {patients.length === 0 && <option value="">No ICU patients</option>}
            </select>
            <span>· {me?.ward ?? "—"} / {me?.bed ?? "—"} · {vitals.length} vitals · auto-pulled</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print</button>
          <button className="btn">Export CSV</button>
          <button className="btn primary">+ Quick entry <span className="arrow">→</span></button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="flow-table">
          <thead>
            <tr>
              <th>Parameter</th>
              {HOURS.map(h => <th key={h}>{h}:00</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((origRow, i) => {
              const r = origRow.lbl === "HR (bpm)" && hrCells
                ? { ...origRow, values: padCells(hrCells, HOURS.length) }
                : origRow.lbl === "BP (sys/dia)" && bpCells
                ? { ...origRow, values: padCells(bpCells, HOURS.length) }
                : origRow.lbl === "SpO₂ (%)" && spo2Cells
                ? { ...origRow, values: padCells(spo2Cells, HOURS.length) }
                : origRow;
              return r.section ? (
                <tr key={i} className="section"><td colSpan={HOURS.length + 1}>{r.lbl}</td></tr>
              ) : (
                <tr key={i}>
                  <td>{r.lbl}</td>
                  {r.values.map((v, j) => (
                    <td key={j} className={`flow-cell ${v.cls ?? "good"}`}>{v.v}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function padCells(cells: { v: string; cls?: "bad" | "warn" | "good" }[], len: number) {
  if (cells.length >= len) return cells.slice(-len);
  return [...Array(len - cells.length).fill({ v: "—" }), ...cells];
}
