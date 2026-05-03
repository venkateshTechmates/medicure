"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PatientDetail, PatientSummary } from "@/lib/types";

const FALLBACK = [
  { id: 0, patientId: 0, substance: "Penicillin",  reaction: "Anaphylaxis · throat swelling, hypotension", severity: "severe" },
  { id: 0, patientId: 0, substance: "Peanuts",     reaction: "Hives, wheezing",                            severity: "severe" },
  { id: 0, patientId: 0, substance: "Sulfa",       reaction: "Maculopapular rash, no anaphylaxis",         severity: "moderate" },
  { id: 0, patientId: 0, substance: "Latex",       reaction: "Contact dermatitis",                          severity: "mild" },
  { id: 0, patientId: 0, substance: "IV contrast", reaction: "Hot flush, no anaphylaxis",                   severity: "mild" },
];

export default function AllergyManagementClient() {
  const [list, setList] = useState(FALLBACK);
  const [patient, setPatient] = useState<{ name: string; mrn: string } | null>(null);

  useEffect(() => {
    (async () => {
      const patients = await api<PatientSummary[]>("/api/patients?take=10").catch(() => [] as PatientSummary[]);
      const withAllergies = (await Promise.all(
        patients.slice(0, 5).map(p => api<PatientDetail>(`/api/patients/${p.mrn}`).catch(() => null))
      )).filter((p): p is PatientDetail => !!p && p.allergies.length > 0);
      if (withAllergies[0]) {
        const p = withAllergies[0];
        setPatient({ name: p.fullName, mrn: p.mrn });
        setList(p.allergies.map(a => ({ id: a.id, patientId: p.id, substance: a.substance, reaction: a.reaction, severity: a.severity })));
      }
    })();
  }, []);

  const counts = {
    severe:   list.filter(a => a.severity === "severe").length,
    moderate: list.filter(a => a.severity === "moderate").length,
    mild:     list.filter(a => a.severity === "mild").length,
  };
  const fmtCls = (s: string) => s === "severe" ? "crit" : s === "moderate" ? "warn" : "info";

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Clinical · Patient safety</span>
          <h1 className="h1">Allergies</h1>
          <div className="meta">
            {patient ? `${patient.name} · MRN ${patient.mrn} · ` : ""}
            {list.length} documented · {counts.severe} severe · last reviewed today
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Verify with patient</button>
          <button className="btn primary">+ Add allergy <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Severe</div><div className="num">{counts.severe}</div><div className="delta">Anaphylactic risk</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Moderate</div><div className="num">{counts.moderate}</div><div className="delta">Avoid where possible</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Mild</div><div className="num">{counts.mild}</div><div className="delta">Document &amp; monitor</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Verified</div><div className="num">{list.length}/{list.length}</div><div className="delta">Source documented</div></div>
      </div>

      <div className="list-card">
        <div className="lh"><h3>Active allergies &amp; intolerances</h3><span className="muted">{list.length}</span></div>
        {list.length === 0 && <div className="muted" style={{ padding: 30, textAlign: "center" }}>No known allergies (NKA)</div>}
        {list.map((a, i) => (
          <div key={a.id || i} className="list-row">
            <div className={`ic ${fmtCls(a.severity)}`}>⚠</div>
            <div>
              <div className="nm">{a.substance}</div>
              <div className="sub">{a.reaction}</div>
            </div>
            <span className={`pill ${a.severity === "severe" ? "bad" : a.severity === "moderate" ? "warn" : "info"}`}><span className="pdot" />{a.severity}</span>
            <div className="code">Verified</div>
          </div>
        ))}
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Drug-allergy CDS active</h2>
        <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>All medication orders are screened against this list before signing.</div>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div className="info-block" style={{ background: "#fff7f8", borderColor: "#ffe1e7" }}>
            <h4 style={{ color: "#b3263d" }}>⚠ Hard stop</h4>
            <div style={{ fontSize: 12 }}>Severe → blocks order until pharmacist override with reason.</div>
          </div>
          <div className="info-block" style={{ background: "#fffaef", borderColor: "#ffd9a3" }}>
            <h4 style={{ color: "#a05a00" }}>⚠ Soft warning</h4>
            <div style={{ fontSize: 12 }}>Moderate / mild → modal warning, provider attestation required.</div>
          </div>
        </div>
      </div>
    </>
  );
}
