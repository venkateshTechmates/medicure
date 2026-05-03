"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const NOTE_TYPES = ["SOAP progress", "H&P (admission)", "Discharge summary", "Procedure note", "Operative", "Consult", "Nursing", "Telephone", "Critical care", "Death note"];
const SPECIALTY = ["Asthma exac (Peds)", "Sepsis admit", "Chest pain r/o", "Diabetic admit", "Stroke alert"];

export default function NoteComposerClient() {
  const router = useRouter();
  const [type, setType] = useState("SOAP progress");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(sign: boolean) {
    setBusy(true); setErr(null);
    try {
      const patients = await api<{ id: number }[]>("/api/patients?take=1");
      if (!patients.length) throw new Error("No patients available");
      await api("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          patientId: patients[0].id,
          type: type.split(" ")[0] || "Progress",
          content: "Day 3 progress note · auto-saved from composer",
          signed: sign,
        }),
      });
      setSaved(sign ? "Note signed and filed" : "Draft saved");
      if (sign) setTimeout(() => router.push("/patients"), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Compose note</h1>
          <div className="meta">Day 3 progress · Pediatrics · Asthma exacerbation</div>
        </div>
        <div className="toolbar">
          <span className="save-status">Auto-saved 8 sec ago</span>
          {saved && <span className="save-status">{saved}</span>}
          {err && <span style={{ color: "var(--bad)", fontSize: 12 }}>{err}</span>}
          <button className="btn" onClick={() => save(false)} disabled={busy}>Save draft</button>
          <button className="btn">Cosign &amp; route</button>
          <button className="btn primary" onClick={() => save(true)} disabled={busy}>{busy ? "Saving…" : "Sign & file"} <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces)" }} />
        <div>
          <div className="nm">Albert Smith · MRN 4421-08 · 9 yo M</div>
          <div className="meta">
            <span><b>Encounter</b> Inpt-2024-08841 · Day 3</span>
            <span><b>Author</b> Dr. M. Achebe, Pediatrics</span>
            <span><b>Cosign</b> Required (Resident → Attending)</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span className="pill warn"><span className="pdot" />Draft</span>
        </div>
      </div>

      <div className="note-layout">
        <div className="note-rail">
          <h3>Note type</h3>
          {NOTE_TYPES.map(t => (
            <button key={t} className={`rail-item ${type === t ? "act" : ""}`} onClick={() => setType(t)}>
              {t} {type === t && <span className="ct">Active</span>}
            </button>
          ))}
          <h3 style={{ marginTop: 14 }}>Specialty templates</h3>
          {SPECIALTY.map(t => (
            <button key={t} className="rail-item">{t}{t.includes("Asthma") && <span className="ct">★</span>}</button>
          ))}
          <h3 style={{ marginTop: 14 }}>My favorites</h3>
          <button className="rail-item">Asthma exac (Peds)</button>
          <button className="rail-item">Quick re-assessment</button>
        </div>

        <div className="editor-card">
          <div className="ed-tools">
            <button className="act"><b>B</b></button>
            <button><i>I</i></button>
            <button><u>U</u></button>
            <div className="div" />
            <button>H1</button><button>H2</button>
            <button>•</button><button>1.</button>
            <div className="div" />
            <button title="Link">🔗</button>
            <button title="Smart phrase">⚡</button>
            <button className="auto" title="Vitals">+ Vitals</button>
            <button className="auto" title="Meds">+ Meds</button>
            <button className="auto" title="Labs">+ Labs</button>
            <button className="auto" title="Macro">.dot</button>
            <div className="voice"><i /> Recording 0:14</div>
          </div>
          <div className="ed-meta">
            <div className="f"><label>Encounter</label><input defaultValue="Inpatient · Peds-2 / 14" readOnly /></div>
            <div className="f"><label>Service</label><input defaultValue="Pediatrics — Hospitalist" /></div>
            <div className="f"><label>Visit type</label><select><option>Progress</option><option>Admission H&amp;P</option><option>Discharge</option></select></div>
            <div className="f"><label>Date / time</label><input defaultValue="2026-05-03 · 08:14" readOnly /></div>
          </div>
          <div className="ed-body">
            <h2>Subjective</h2>
            <p>Patient is a 9-year-old male with a known history of <span className="smart">asthma</span> and <span className="smart">allergic rhinitis</span> admitted 3 days ago for acute exacerbation. Mother reports overnight he slept well, used <span className="smart">2 puffs of albuterol</span> at bedtime. This morning he denies shortness of breath at rest, mild cough productive of clear sputum.</p>
            <h2>Objective</h2>
            <p><b>Vitals (last 4 hrs):</b> <span className="vital-chip">HR 96</span> <span className="vital-chip">BP 118/76</span> <span className="vital-chip">SpO₂ 97% RA</span> <span className="vital-chip">RR 18</span> <span className="vital-chip">T 36.9°C</span> · trending toward baseline.</p>
            <p><b>General:</b> Alert, well-appearing. <b>Lungs:</b> mild expiratory wheeze bilaterally, improved air entry, no retractions. <b>Cardiac:</b> RRR, no m/r/g.</p>
            <div className="meds-block">
              • CBC: WBC 11.2 (↑ from 10.8), Hgb 13.4, Plt 280<br />
              • CRP: 14 mg/L (↓ from 28)<br />
              • Peak flow AM: 82% predicted (↑ from 60% on admission)<br />
              • CXR (Day 1): hyperinflation, no infiltrate
            </div>
            <h2>Assessment</h2>
            <p><b>1. Acute asthma exacerbation, moderate</b> (<span className="smart">J45.901</span>) — Day 3, responding well to bronchodilators and systemic corticosteroids. Discharge anticipated tomorrow.</p>
            <p><b>2. Allergic rhinitis</b> (<span className="smart">J30.9</span>) — chronic, controlled.</p>
            <h2>Plan</h2>
            <div className="meds-block">
              • Continue albuterol PRN, wean as tolerated<br />
              • Switch methylprednisolone IV → prednisolone PO 30 mg daily × 4d, then taper<br />
              • Start ICS — Fluticasone 110 mcg HFA 1 puff BID<br />
              • Peak flow monitoring AM/PM until d/c
            </div>
            <p><b>Disposition:</b> Plan d/c tomorrow if overnight stable. Asthma action plan reviewed with mother.</p>
          </div>
          <div className="ed-foot">
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--ink-mute)" }}>
              <span><b>Words</b> 384</span>
              <span><b>Reading time</b> 2 min</span>
              <span><b>Auto-billed</b> 99232</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn">Preview</button>
              <button className="btn">Spell check</button>
              <button className="btn primary">Sign &amp; file <span className="arrow">→</span></button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="side-card-sm">
            <h4>Smart phrases · .dot</h4>
            {[
              [".asthma-pe",   "Mild expiratory wheeze, no retractions..."],
              [".normalcv",    "RRR, no m/r/g, S1/S2 normal..."],
              [".normalresp",  "CTAB, no wheezing/rales/rhonchi..."],
              [".normalabd",   "Soft, non-tender, +BS, no HSM..."],
              [".dispo-home",  "D/c home in stable condition with..."],
              [".asthma-ap",   "Asthma action plan: green/yellow/red..."],
            ].map(([k, v]) => (
              <div className="snippet" key={k}><b>{k}</b><span>{v}</span></div>
            ))}
          </div>
          <div className="side-card-sm">
            <h4>Problem list · pull to A/P</h4>
            {[["Asthma exacerbation", "J45.901"], ["Allergic rhinitis", "J30.9"], ["Penicillin allergy", "Z88.0"], ["URI · resolving", "J06.9"]].map(([n, c]) => (
              <div className="problem-pill" key={n}><div><div className="nm">{n}</div></div><span className="code">{c}</span></div>
            ))}
            <div className="problem-pill" style={{ borderStyle: "dashed", color: "var(--ink-mute)" }}><div>+ Add to problem list</div><span /></div>
          </div>
          <div className="side-card-sm">
            <h4>Billing · CPT suggested</h4>
            <div style={{ fontSize: 12 }}>
              <div className="bill-row"><span className="k"><b>99232</b><br /><span style={{ fontSize: 10, color: "var(--ink-mute)" }}>Subseq inpt · Level 2</span></span><span className="v" style={{ color: "var(--good)" }}>$148</span></div>
              <div className="bill-row"><span className="k"><b>99358</b><br /><span style={{ fontSize: 10, color: "var(--ink-mute)" }}>Prolonged service add-on</span></span><span className="v" style={{ color: "var(--good)" }}>$68</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
