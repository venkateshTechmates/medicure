"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PrintButton from "@/components/PrintButton";

interface ServerSpecimen { id: number; type: string; status: string; collectedAt?: string | null; collectedBy: string; location: string; priority: string; patientId: number; }

const DEMO_SPECIMENS = [
  { id: "S-2024-0042", pat: "Maria Hernandez",  typ: "Blood culture x2", coll: "11:48 RN Foster", stage: "In transit",   eta: "12:00",  cls: "warn" },
  { id: "S-2024-0041", pat: "James Liu",        typ: "Lactate",          coll: "11:42 RN Brooks", stage: "Resulted",     eta: "—",      cls: "good" },
  { id: "S-2024-0040", pat: "Robert Kim",       typ: "BMP + Mg + Phos",  coll: "11:30 RN Brooks", stage: "Processing",   eta: "12:14",  cls: "info" },
  { id: "S-2024-0039", pat: "Sarah Johnson",    typ: "Coags (PT/INR)",   coll: "10:55 Phleb T",   stage: "Received",     eta: "12:30",  cls: "info" },
  { id: "S-2024-0038", pat: "Priya Shah",       typ: "CBC",              coll: "10:42 Phleb T",   stage: "Resulted",     eta: "—",      cls: "good" },
  { id: "S-2024-0037", pat: "Albert Smith",     typ: "Type & Screen",    coll: "10:30 Phleb T",   stage: "Cross-matched", eta: "—",      cls: "good" },
];

export default function SpecimenTrackingClient() {
  const [live, setLive] = useState<ServerSpecimen[]>([]);
  useEffect(() => { api<ServerSpecimen[]>("/api/specimens").then(setLive).catch(() => {}); }, []);

  const SPECIMENS = live.length
    ? live.map(s => ({
        id: `S-${s.id.toString().padStart(7, "0")}`,
        rawId: s.id,
        pat: `Patient #${s.patientId}`,
        typ: s.type,
        coll: s.collectedAt ? `${new Date(s.collectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${s.collectedBy}` : "—",
        stage: s.status,
        eta: s.priority,
        cls: s.status === "resulted" ? "good" : s.status === "processing" || s.status === "received" ? "info" : "warn",
      }))
    : DEMO_SPECIMENS.map(s => ({ ...s, rawId: 0 as number }));

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Lab logistics · chain of custody</span>
          <h1 className="h1">Specimen tracking</h1>
          <div className="meta">42 specimens today · 8 in pipeline · TAT median 38 min · 0 lost or contaminated</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print labels</button>
          <button className="btn primary">+ Collect specimen <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="pipeline">
        {[
          { lbl: "Ordered",      ct: 12 },
          { lbl: "Collected",    ct: 8 },
          { lbl: "In transit",   ct: 3, cls: "warn" },
          { lbl: "Processing",   ct: 5, cls: "warn" },
          { lbl: "Resulted",     ct: 14 },
        ].map(s => (
          <div key={s.lbl} className={`pipe-stage ${s.cls ?? ""}`}>
            <div className="lbl">{s.lbl}</div>
            <div className="ct">{s.ct}</div>
          </div>
        ))}
      </div>

      <div className="card panel">
        <h2>Recent specimens</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Accession</th><th>Patient</th><th>Test</th><th>Collected</th><th>Stage</th><th>ETA</th></tr></thead>
          <tbody>
            {SPECIMENS.map(s => (
              <tr key={s.id}>
                <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>{s.id}</b></td>
                <td><b>{s.pat}</b></td>
                <td>{s.typ}</td>
                <td className="muted">{s.coll}</td>
                <td><span className={`pill ${s.cls}`}><span className="pdot" />{s.stage}</span></td>
                <td className="muted">{s.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Chain of custody · S-2024-0042</h2>
        <div className="tl" style={{ marginTop: 14 }}>
          {[
            { t: "11:42", h: "Order placed",       b: "Dr. Mendez · CCU" },
            { t: "11:46", h: "Phlebotomy paged",   b: "Pneumatic tube" },
            { t: "11:48", h: "Specimen drawn",     b: "RN Foster · 2× aerobic + 2× anaerobic bottles" },
            { t: "11:52", h: "Labels scanned",     b: "Auto-verified at bedside" },
            { t: "11:58", h: "In transit",         b: "Tube station 4-East" },
            { t: "12:04", h: "Lab received",       b: "Microbiology · auto-loaded analyzer" },
          ].map((e, i) => (
            <div key={i} className="tl-item">
              <div className="t">{e.t}</div>
              <div className="h">{e.h}</div>
              <div className="b">{e.b}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
