"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PatientSummary } from "@/lib/types";

const STEPS = ["Disposition", "Med rec", "Instructions", "Follow-up", "Sign"];
const DISPOSITIONS = ["Home", "Home with home health", "SNF", "Acute rehab", "LTAC", "Hospice", "AMA"];

export default function DischargeClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [disp, setDisp] = useState("Home");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [destDetails, setDestDetails] = useState("Home with parent · 142 Elm St");
  const [followUp, setFollowUp] = useState("PCP in 7-10 days · Allergy/Immunology in 4 weeks");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?status=warn&take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  const me = patients.find(p => p.id === pat);

  async function handleNext() {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    if (!me) return;
    setBusy(true); setMsg(null);
    try {
      await api(`/api/patients/${me.mrn}/discharge`, { method: "POST", body: JSON.stringify({
        disposition: `${disp} — ${destDetails}`,
        summary: "Patient stable, all discharge criteria met. Med rec complete, action plan reviewed.",
        followUp
      }) });
      setMsg("✓ Discharge signed");
      setTimeout(() => router.push("/patients"), 700);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Discharge failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/patients">Patients</a><span>›</span>
        <a className="bc-link" href="/patients">Albert Smith</a><span>›</span>
        <span className="bc-cur">Discharge</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">Discharge</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span>· {me?.ward ?? ""}</span>
          </div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn">Save draft</button>
          <button className="btn primary" onClick={handleNext} disabled={busy}>
            {busy ? "Signing…" : step === STEPS.length - 1 ? "Sign discharge" : "Next →"}
          </button>
        </div>
      </div>

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: `url(${me?.avatarUrl ?? "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop&crop=faces"})` }} />
        <div>
          <div className="nm">{me ? `${me.fullName} · ${me.age} yo ${me.sex}` : "Select patient"}</div>
          <div className="meta">
            <span><b>Ward</b> {me?.ward ?? "—"} / {me?.bed ?? "—"}</span>
            <span><b>Attending</b> {me?.attendingName ?? "—"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}><span className="pill good"><span className="pdot" />Ready</span></div>
      </div>

      <div className="steps">
        {STEPS.map((label, i) => (
          <div key={i} className={`step-card ${i < step ? "done" : ""} ${i === step ? "active-step" : ""}`}>
            <div className="num">{i < step ? "✓" : i + 1}</div>
            <div><div className="nm">{label}</div></div>
          </div>
        ))}
      </div>

      <div className="wiz-layout">
        <div>
          {step === 0 && (
            <div className="wiz-panel">
              <h3>Disposition</h3>
              <div className="order-types" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {DISPOSITIONS.map(d => (
                  <div key={d} className={`ot ${disp === d ? "active" : ""}`} onClick={() => setDisp(d)}>
                    <div className="nm" style={{ marginTop: 0 }}>{d}</div>
                  </div>
                ))}
              </div>
              <div className="cpoe-field" style={{ marginTop: 14 }}>
                <label>Discharge destination details</label>
                <input value={destDetails} onChange={e => setDestDetails(e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="wiz-panel">
              <h3>Medication reconciliation</h3>
              <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 14 }}>
                Compare hospital meds with home meds. Flag changes.
              </div>
              {[
                { nm: "Albuterol HFA 90 mcg",      sub: "2 puffs INH q4-6h PRN", action: "Continue", cls: "good" },
                { nm: "Fluticasone 110 mcg HFA",   sub: "1 puff BID — NEW",      action: "Start",    cls: "warn" },
                { nm: "Cetirizine 5 mg",           sub: "PO daily",              action: "Continue", cls: "good" },
                { nm: "Methylprednisolone IV",     sub: "DC — switch to PO",     action: "Stop",     cls: "bad" },
                { nm: "Prednisolone 30 mg",        sub: "PO daily × 4d, taper",  action: "Start",    cls: "warn" },
              ].map((m, i) => (
                <div key={i} className="med-row">
                  <div className="ic">{m.nm.slice(0, 2)}</div>
                  <div><div className="nm">{m.nm}</div><div className="sub">{m.sub}</div></div>
                  <span className={`pill ${m.cls}`}><span className="pdot" />{m.action}</span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="wiz-panel">
              <h3>Discharge instructions</h3>
              <div className="cpoe-field"><label>Diet</label><input defaultValue="Regular, encourage fluids" /></div>
              <div className="cpoe-field"><label>Activity</label><input defaultValue="As tolerated; avoid triggers (cold air, smoke)" /></div>
              <div className="cpoe-field"><label>Asthma action plan</label>
                <textarea rows={6} defaultValue={`GREEN (peak flow ≥80%): No symptoms — daily controller meds.
YELLOW (50-79%): Symptoms — albuterol q4h. If no improvement in 24h, call clinic.
RED (<50% or severe): Albuterol q20min. Call 911 if no improvement.`} />
              </div>
              <div className="cpoe-field"><label>When to seek care</label>
                <textarea rows={3} defaultValue="Trouble breathing, chest tightness not relieved by albuterol, fever, blue lips, concerning symptoms." />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wiz-panel">
              <h3>Follow-up</h3>
              <div className="grid-2">
                <div className="info-block">
                  <h4>Primary care</h4>
                  <div className="bill-row"><span className="k">Provider</span><span className="v">Dr. Achebe</span></div>
                  <div className="bill-row"><span className="k">When</span><span className="v">7-10 days</span></div>
                  <div className="bill-row"><span className="k">Date</span><span className="v">Tue Nov 12 · 11:00</span></div>
                  <div className="bill-row"><span className="k">Method</span><span className="v" style={{ color: "var(--good)" }}>Auto-scheduled ✓</span></div>
                </div>
                <div className="info-block">
                  <h4>Specialty referral</h4>
                  <div className="bill-row"><span className="k">Specialty</span><span className="v">Allergy / Immunology</span></div>
                  <div className="bill-row"><span className="k">Reason</span><span className="v">Skin testing</span></div>
                  <div className="bill-row"><span className="k">When</span><span className="v">≤ 4 weeks</span></div>
                  <div className="bill-row"><span className="k">Method</span><span className="v" style={{ color: "var(--warn)" }}>Pending auth</span></div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wiz-panel">
              <h3>Sign discharge</h3>
              <div className="cds info" style={{ marginBottom: 14 }}>
                <div className="t">ℹ All discharge criteria met</div>
                Vitals stable 24h · tolerating PO · peak flow 82% pred · action plan reviewed · follow-up scheduled
              </div>
              <div className="info-block" style={{ marginBottom: 12 }}>
                <h4>Discharge summary</h4>
                <div className="bill-row"><span className="k">Disposition</span><span className="v">{disp}</span></div>
                <div className="bill-row"><span className="k">LOS</span><span className="v">3 days</span></div>
                <div className="bill-row"><span className="k">Final dx</span><span className="v">Asthma exacerbation · J45.901</span></div>
                <div className="bill-row"><span className="k">Discharge time</span><span className="v">Tomorrow 10:00 AM</span></div>
              </div>
              <div className="esign">
                <div className="lbl">Attending e-signature</div>
                <input placeholder="Type full name to sign" />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>}
            <div style={{ flex: 1 }} />
            <button className="btn primary" onClick={handleNext} disabled={busy}>
              {busy ? "Signing…" : step === STEPS.length - 1 ? "Sign discharge" : "Continue →"}
            </button>
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Discharge readiness</div>
            {[
              ["Vitals stable 24h",      true],
              ["Tolerating PO",          true],
              ["Med rec complete",       step >= 1],
              ["Instructions delivered", step >= 2],
              ["Follow-up scheduled",    step >= 3],
              ["Attending sign-off",     step >= 4],
            ].map(([k, done], i) => (
              <div key={i} className="bill-row">
                <span className="k">{k as string}</span>
                <span className="v" style={{ color: done ? "var(--good)" : "var(--ink-mute)" }}>{done ? "✓" : "○"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
