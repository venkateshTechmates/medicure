"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/fmt";
import type { PatientDetail, PatientSummary } from "@/lib/types";

interface ProblemRow { id: number; nm: string; code: string; goals: string[]; inter: string[]; eval: string; status: "good" | "warn"; }

const FALLBACK: ProblemRow[] = [
  { id: 1, nm: "Acute asthma exacerbation", code: "J45.901", goals: ["Peak flow ≥80% predicted", "No nocturnal symptoms", "Tolerating PO meds"], inter: ["Albuterol PRN", "Steroids taper", "Asthma action plan", "Allergy referral"], eval: "Day 3 — peak flow 82%, sleeping well, ready for discharge tomorrow.", status: "good" },
  { id: 2, nm: "Allergic rhinitis",         code: "J30.9",   goals: ["Reduce symptom days < 2/week"], inter: ["Fluticasone nasal BID", "Cetirizine PO daily"], eval: "Controlled on current regimen.", status: "good" },
  { id: 3, nm: "Asthma med adherence",      code: "Z91.14",  goals: ["Daily ICS use confirmed"], inter: ["Action plan reviewed", "Pharmacy education", "Spacer device given"], eval: "Mom reports inconsistent home ICS — addressed.", status: "warn" },
];

const GOAL_TEMPLATES: Record<string, string[]> = {
  "Type 2 Diabetes":         ["A1C < 7%", "Fasting glucose 80-130", "Self-monitor adherence"],
  "Essential Hypertension":  ["BP < 130/80", "DASH diet started", "Med adherence ≥90%"],
  "CKD Stage 3":             ["eGFR stable", "ACEi/ARB tolerated", "Avoid nephrotoxins"],
  "COPD":                    ["No exacerbations 90d", "Smoking cessation", "Vaccination current"],
  "Atrial Fibrillation":     ["Rate control HR < 110", "Anticoag adherence", "Stroke risk discussed"],
  "Pneumonia":               ["Afebrile 48h", "Tolerating PO abx", "O2 sat ≥ 92% RA"],
  "Sepsis":                  ["Lactate < 2", "Source identified", "Off vasopressors"],
  "Coronary Artery Disease": ["No new chest pain", "DAPT adherence", "Cardiac rehab enrolled"],
};

const INTER_TEMPLATES: Record<string, string[]> = {
  "Type 2 Diabetes":         ["Metformin titrated", "Diabetes education", "Endocrine consult", "Foot exam"],
  "Essential Hypertension":  ["Lisinopril 10 mg", "Lifestyle counseling", "Home BP log"],
  "CKD Stage 3":             ["Lasix titration", "Avoid NSAIDs", "Nephro follow-up"],
  "COPD":                    ["Tiotropium daily", "Pulm rehab", "Tobacco cessation"],
  "Atrial Fibrillation":     ["Apixaban 5 mg BID", "Beta blocker", "Echo ordered"],
  "Pneumonia":               ["IV ceftriaxone", "Azithromycin", "Pulse ox monitoring"],
  "Sepsis":                  ["Lactate q4h", "Norepi titrate to MAP > 65", "Blood cx x 2"],
  "Coronary Artery Disease": ["DAPT", "Statin high-intensity", "Cardiac rehab"],
};

export default function CarePlanClient() {
  const [rows, setRows] = useState<ProblemRow[]>(FALLBACK);
  const [patient, setPatient] = useState<{ name: string; mrn: string } | null>(null);

  useEffect(() => {
    (async () => {
      const patients = await api<PatientSummary[]>("/api/patients?take=10").catch(() => [] as PatientSummary[]);
      const detailed = (await Promise.all(
        patients.slice(0, 5).map(p => api<PatientDetail>(`/api/patients/${p.mrn}`).catch(() => null))
      )).filter((p): p is PatientDetail => !!p && p.problems.length > 0);
      if (detailed[0]) {
        const p = detailed[0];
        setPatient({ name: p.fullName, mrn: p.mrn });
        setRows(p.problems.map(pr => ({
          id: pr.id,
          nm: pr.description,
          code: pr.icdCode,
          goals: GOAL_TEMPLATES[pr.description] ?? ["Symptoms controlled", "Adherence ≥ 90%", "No exacerbation"],
          inter: INTER_TEMPLATES[pr.description] ?? ["Routine monitoring", "Patient education", "Follow-up planned"],
          eval:  `Onset ${fmtDate(pr.onset)} · ${pr.type} · being managed`,
          status: pr.type === "active" ? "warn" : "good",
        })));
      }
    })();
  }, []);

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Clinical · Care plan</span>
          <h1 className="h1">Care plan</h1>
          <div className="meta">
            {patient ? `${patient.name} · MRN ${patient.mrn} · ` : ""}
            {rows.length} active problems · last review today
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print</button>
          <button className="btn primary">+ Add problem <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="list-card">
          <div className="lh"><h3>Active problems &amp; goals</h3><span className="muted">{rows.length}</span></div>
          {rows.map((p, i) => (
            <div key={p.id} style={{ padding: 18, borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none" }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{p.nm}</div>
                  <div className="muted" style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{p.code}</div>
                </div>
                <span className={`pill ${p.status}`}><span className="pdot" />{p.status === "good" ? "On track" : "Needs attention"}</span>
              </div>
              <div className="grid-3" style={{ marginTop: 10 }}>
                <div className="info-block">
                  <h4>Goals</h4>
                  {p.goals.map((g, gi) => <div key={gi} style={{ fontSize: 12, padding: "5px 0", borderTop: gi ? "1px solid var(--line)" : "none" }}>● {g}</div>)}
                </div>
                <div className="info-block">
                  <h4>Interventions</h4>
                  {p.inter.map((it, ii) => <div key={ii} style={{ fontSize: 12, padding: "5px 0", borderTop: ii ? "1px solid var(--line)" : "none" }}>☑ {it}</div>)}
                </div>
                <div className="info-block">
                  <h4>Evaluation</h4>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>{p.eval}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="side-card-sm">
            <h4>Care team</h4>
            <div className="care-row"><div className="pic" /><div style={{ flex: 1 }}><div className="nm">Dr. Achebe</div><div className="role">Attending · Pediatrics</div></div><span className="pill good"><span className="pdot" />On</span></div>
            <div className="care-row"><div className="pic" /><div style={{ flex: 1 }}><div className="nm">RN Brooks</div><div className="role">Primary RN</div></div><span className="pill good"><span className="pdot" />On</span></div>
            <div className="care-row"><div className="pic" /><div style={{ flex: 1 }}><div className="nm">PharmD Cole</div><div className="role">Pharmacy</div></div><span className="pill good"><span className="pdot" />On</span></div>
          </div>
          <div className="side-card-sm">
            <h4>Discharge readiness</h4>
            <div style={{ fontSize: 12 }}>
              {[["Vitals stable 24h", true], ["Tolerating PO", true], ["Med rec complete", true], ["Action plan delivered", false], ["Follow-up scheduled", true]].map(([t, done], i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0" }}>
                  <span style={{ color: done ? "var(--good)" : "var(--ink-mute)" }}>{done ? "✓" : "○"}</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
