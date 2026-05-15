"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PatientSummary, Appointment } from "@/lib/types";
import VideoCall from "@/components/VideoCall";

export default function ClinicVisitClient() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [videoOn, setVideoOn] = useState(false);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
    api<Appointment[]>("/api/appointments?take=20").then(setAppts).catch(() => {});
  }, []);

  const me = patients.find(p => p.id === pat);
  const myAppt = appts.find(a => a.patient?.id === pat);

  async function complete() {
    if (!pat) return;
    setBusy(true); setMsg(null);
    try {
      await api("/api/notes", { method: "POST", body: JSON.stringify({
        patientId: pat,
        type: "Progress",
        content: "Clinic follow-up. Patient stable. Continue current regimen. Follow-up in 8 weeks unless symptoms recur.",
        signed: true
      }) });
      if (myAppt) {
        await api(`/api/appointments/${myAppt.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) }).catch(() => {});
      }
      setMsg("✓ Visit signed");
      setTimeout(() => router.push("/appointments"), 700);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sign failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Outpatient · Clinic visit</span>
          <h1 className="h1">Clinic visit</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span>· {me?.attendingName ?? "—"}</span>
            {myAppt && <span>· {new Date(myAppt.scheduledAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={() => setVideoOn(v => !v)} disabled={!myAppt && !pat}>
            {videoOn ? "End video visit" : "Start video visit"}
          </button>
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn primary" onClick={complete} disabled={busy}>{busy ? "Signing…" : "Complete & sign →"}</button>
        </div>
      </div>

      {videoOn && (myAppt || pat) && (
        <VideoCall
          roomId={`appt-${myAppt?.id ?? `pat-${pat}`}`}
          onEnd={() => setVideoOn(false)}
        />
      )}

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces)" }} />
        <div>
          <div className="nm">Adison Reyes · MRN 08423 · 6 yo F</div>
          <div className="meta"><span><b>PCP</b> Dr. Achebe</span><span><b>Last visit</b> 8 wks ago</span><span><b>Allergies</b> NKDA</span><span><b>Insurance</b> Aetna PPO</span></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}><span className="pill info"><span className="pdot" />Checked in</span></div>
      </div>

      <div className="cpoe-grid">
        <div>
          <div className="card panel">
            <h2>Reason for visit</h2>
            <div className="sub">Recent ED visit for asthma — 2-week follow-up</div>
            <div className="grid-3" style={{ marginTop: 12 }}>
              <div className="info-block"><h4>Today's vitals</h4>
                <div className="info-row"><span className="k">Wt</span><span className="v">22.4 kg</span></div>
                <div className="info-row"><span className="k">Ht</span><span className="v">114 cm</span></div>
                <div className="info-row"><span className="k">BMI</span><span className="v">17.2 (50%)</span></div>
                <div className="info-row"><span className="k">HR</span><span className="v">96</span></div>
                <div className="info-row"><span className="k">SpO₂</span><span className="v">99% RA</span></div>
                <div className="info-row"><span className="k">Peak flow</span><span className="v">88% predicted</span></div>
              </div>
              <div className="info-block"><h4>Active issues</h4>
                <div className="problem-pill"><div><div className="nm">Asthma</div></div><span className="code">J45.901</span></div>
                <div className="problem-pill"><div><div className="nm">Allergic rhinitis</div></div><span className="code">J30.9</span></div>
              </div>
              <div className="info-block"><h4>Active meds</h4>
                <div style={{ fontSize: 12, padding: "5px 0" }}>Albuterol HFA · 2 puffs PRN</div>
                <div style={{ fontSize: 12, padding: "5px 0", borderTop: "1px solid var(--line)" }}>Fluticasone 110 mcg · 1 puff BID</div>
                <div style={{ fontSize: 12, padding: "5px 0", borderTop: "1px solid var(--line)" }}>Cetirizine 5 mg · daily</div>
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Visit note (SOAP)</h2>
            <div className="cpoe-field"><label>Subjective</label><textarea rows={3} defaultValue="Mom reports good adherence with daily ICS. No nocturnal cough, no SOB on play. Used albuterol 2x in past 2 weeks (with seasonal allergens)." /></div>
            <div className="cpoe-field"><label>Objective</label><textarea rows={3} defaultValue="Well-appearing, in NAD. Lungs CTA bilaterally, no wheezing. Mild allergic shiners. Peak flow 88% predicted (up from 60%)." /></div>
            <div className="cpoe-field"><label>Assessment &amp; Plan</label><textarea rows={4} defaultValue="Asthma well-controlled. Continue current regimen. Action plan reviewed with mom. Allergy referral pending. Follow-up 3 mo unless symptoms worsen." /></div>
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Encounter checklist</div>
            {["Vitals captured", "Allergies verified", "Med rec done", "HPI obtained", "Exam performed", "Plan documented", "Discharge instructions printed", "Follow-up scheduled"].map((s, i) => (
              <label key={i} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 12 }}>
                <input type="checkbox" defaultChecked={i < 6} /> {s}
              </label>
            ))}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}>
              <div className="bill-row"><span className="k">CPT</span><span className="v">99213</span></div>
              <div className="bill-row"><span className="k">Time</span><span className="v">22 min</span></div>
              <div className="bill-row"><span className="k">Insurance</span><span className="v" style={{ color: "var(--good)" }}>✓ Verified</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
