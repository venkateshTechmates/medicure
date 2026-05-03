"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Problem, PatientSummary } from "@/lib/types";

const PATIENTS = [
  { pat: "Robert Kim",      mrn: "08305", typ: "HD",  acc: "AVF · L arm",   freq: "MWF · 4hr", st: "On run",    cls: "good", ufg: "2.4 L", time: "1:42 / 4:00" },
  { pat: "James Liu",       mrn: "08410", typ: "HD",  acc: "Tunneled cath", freq: "MWF · 3.5hr", st: "Pre-tx",   cls: "info", ufg: "—",     time: "—" },
  { pat: "Daniel Owusu",    mrn: "08299", typ: "PD",  acc: "Cath",          freq: "Nightly CCPD", st: "Home cycler", cls: "good", ufg: "0.8 L", time: "Cycler" },
  { pat: "Maria Hernandez", mrn: "08401", typ: "CRRT", acc: "Vascath R IJ",  freq: "Continuous", st: "On run",    cls: "warn", ufg: "1.1 L", time: "Hr 38" },
];

export default function DialysisClient() {
  const [renalPts, setRenalPts] = useState<PatientSummary[]>([]);

  useEffect(() => {
    Promise.all([
      api<Problem[]>("/api/problems?take=200").catch(() => [] as Problem[]),
      api<PatientSummary[]>("/api/patients?take=200").catch(() => [] as PatientSummary[]),
    ]).then(([problems, patients]) => {
      const renalIds = new Set(problems.filter(p => /CKD|renal|kidney|ESRD|dialysis/i.test(p.description || p.icdCode)).map(p => p.patientId));
      setRenalPts(patients.filter(p => renalIds.has(p.id)));
    });
  }, []);

  const liveCount = renalPts.length || PATIENTS.length;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Specialty · Renal replacement</span>
          <h1 className="h1">Dialysis</h1>
          <div className="meta">{liveCount} active patients with renal disease · 2 HD · 1 PD · 1 CRRT · last vitals all WNL</div>
        </div>
        <div className="toolbar">
          <button className="btn">Treatment schedule</button>
          <button className="btn primary">+ Add patient <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>HD chairs</div><div className="num">2/4</div><div className="delta">in use</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>PD home</div><div className="num">1</div><div className="delta">cycler running</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>CRRT</div><div className="num">1</div><div className="delta">hr 38 of run</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Holds today</div><div className="num">0</div><div className="delta">none</div></div>
      </div>

      <div className="card panel">
        <h2>Active treatments</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Patient</th><th>Modality</th><th>Access</th><th>Schedule</th><th>UFG</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>
            {(renalPts.length ? renalPts.map((p, i) => {
              const demo = PATIENTS[i % PATIENTS.length];
              return { pat: p.fullName, mrn: p.mrn, typ: demo.typ, acc: demo.acc, freq: demo.freq, st: demo.st, cls: demo.cls, ufg: demo.ufg, time: demo.time };
            }) : PATIENTS).map((p, i) => (
              <tr key={i}>
                <td><b>{p.pat}</b><br /><span className="muted" style={{ fontSize: 11 }}>{p.mrn}</span></td>
                <td><b>{p.typ}</b></td>
                <td className="muted">{p.acc}</td>
                <td className="muted">{p.freq}</td>
                <td>{p.ufg}</td>
                <td className="muted" style={{ fontFamily: "JetBrains Mono, monospace" }}>{p.time}</td>
                <td><span className={`pill ${p.cls}`}><span className="pdot" />{p.st}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Treatment flowsheet · Robert Kim</h2>
        <div className="grid-4" style={{ marginTop: 12 }}>
          <div className="info-block"><h4>BP pre</h4><div className="num" style={{ fontSize: 28 }}>142/86</div></div>
          <div className="info-block"><h4>BP current</h4><div className="num" style={{ fontSize: 28 }}>128/74</div></div>
          <div className="info-block"><h4>Dry weight</h4><div className="num" style={{ fontSize: 28 }}>74.2<span style={{ fontSize: 14, color: "var(--ink-mute)" }}> kg</span></div></div>
          <div className="info-block"><h4>UFG to date</h4><div className="num" style={{ fontSize: 28 }}>2.4<span style={{ fontSize: 14, color: "var(--ink-mute)" }}> L</span></div></div>
        </div>
      </div>
    </>
  );
}
