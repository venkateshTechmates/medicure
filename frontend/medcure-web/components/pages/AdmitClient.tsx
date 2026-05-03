"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdmitClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [data, setData] = useState({
    firstName: "Aria", lastName: "Chen",
    dateOfBirth: "1985-07-20", sex: "F",
    phone: "+1 (513) 555-0142",
    address: "142 Elm St, Apt 4B, Cincinnati, OH 45202",
    insurance: "Aetna PPO",
    ward: "CCU",
    bed: "CCU-04",
    attendingName: "Dr. Hae-jin Park",
    codeStatus: "Full Code",
    status: "warn"
  });
  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData(d => ({ ...d, [k]: v }));

  const STEPS = ["Demographics", "Insurance", "Bed assignment", "Consent & sign"];

  async function handleSubmit() {
    setBusy(true); setMsg(null);
    try {
      await api("/api/patients", { method: "POST", body: JSON.stringify({
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString()
      }) });
      setMsg("✓ Patient admitted");
      setTimeout(() => router.push("/patients"), 700);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Admit failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/patients">Patients</a>
        <span>›</span>
        <span className="bc-cur">Admit patient</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">Admit patient</h1>
          <div className="meta">4-step admission · auto-checks insurance, bed availability, consent</div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn">Save draft</button>
          <button className="btn primary" onClick={() => step === STEPS.length - 1 ? handleSubmit() : setStep(s => s + 1)} disabled={busy}>
            {busy ? "Admitting…" : step === STEPS.length - 1 ? "Submit admission" : "Next →"}
          </button>
        </div>
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
              <h3>Demographics</h3>
              <div className="grid-2">
                <div className="cpoe-field"><label>First name</label><input value={data.firstName} onChange={e => set("firstName", e.target.value)} /></div>
                <div className="cpoe-field"><label>Last name</label><input value={data.lastName} onChange={e => set("lastName", e.target.value)} /></div>
                <div className="cpoe-field"><label>Date of birth</label><input type="date" value={data.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} /></div>
                <div className="cpoe-field"><label>Sex</label>
                  <select value={data.sex} onChange={e => set("sex", e.target.value)}>
                    <option>F</option><option>M</option><option>X</option>
                  </select>
                </div>
                <div className="cpoe-field"><label>Phone</label><input value={data.phone} onChange={e => set("phone", e.target.value)} /></div>
              </div>
              <div className="cpoe-field"><label>Address</label><input value={data.address} onChange={e => set("address", e.target.value)} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="wiz-panel">
              <h3>Insurance</h3>
              <div className="cds info" style={{ marginBottom: 14 }}>
                <div className="t">ℹ Eligibility verified — Aetna PPO active</div>
                Real-time check via X12 270/271 · deductible met $425/$1,500 · OOP $1,240/$4,500
              </div>
              <div className="grid-2">
                <div className="cpoe-field"><label>Primary payer</label>
                  <select value={data.insurance} onChange={e => set("insurance", e.target.value)}>
                    <option>Aetna PPO</option><option>BCBS</option><option>UHC</option><option>Medicare</option><option>Medicaid</option><option>Self-pay</option>
                  </select>
                </div>
                <div className="cpoe-field"><label>Plan name</label><input defaultValue="Open Choice Gold" /></div>
                <div className="cpoe-field"><label>Member ID</label><input defaultValue="W42117809" /></div>
                <div className="cpoe-field"><label>Group #</label><input defaultValue="812044" /></div>
                <div className="cpoe-field"><label>Subscriber</label><input defaultValue="Eric Chen (husband)" /></div>
                <div className="cpoe-field"><label>Effective</label><input defaultValue="2024-01-01" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wiz-panel">
              <h3>Bed assignment</h3>
              <div className="grid-2">
                <div className="cpoe-field"><label>Ward</label>
                  <select value={data.ward} onChange={e => set("ward", e.target.value)}>
                    <option>CCU</option><option>Med-Surg</option><option>Telemetry</option><option>ICU</option><option>Step-down</option><option>Peds</option>
                  </select>
                </div>
                <div className="cpoe-field"><label>Acuity</label>
                  <select value={data.status} onChange={e => set("status", e.target.value)}>
                    <option value="warn">Watcher</option><option value="good">Stable</option><option value="bad">Critical</option>
                  </select>
                </div>
              </div>
              <div className="cpoe-field"><label>Attending</label>
                <input value={data.attendingName} onChange={e => set("attendingName", e.target.value)} />
              </div>
              <div className="cpoe-field"><label>Bed</label>
                <input value={data.bed} onChange={e => set("bed", e.target.value)} />
              </div>
              <div className="cpoe-field"><label>Code status</label>
                <select value={data.codeStatus} onChange={e => set("codeStatus", e.target.value)}>
                  <option>Full Code</option><option>DNR</option><option>DNI</option><option>DNR/DNI</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wiz-panel">
              <h3>Consent &amp; e-sign</h3>
              <div className="info-block" style={{ marginBottom: 12 }}>
                <h4>Consent for admission &amp; treatment</h4>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                  I consent to medical evaluation, diagnostic procedures, and treatment as deemed appropriate by the medical staff. I authorize release of medical information for billing and continuity of care. I acknowledge financial responsibility for amounts not covered by insurance.
                </p>
              </div>
              <div className="info-block" style={{ marginBottom: 12 }}>
                <h4>HIPAA notice of privacy practices</h4>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                  I have received a copy of the Notice of Privacy Practices. I authorize use and disclosure of PHI for treatment, payment, and operations.
                </p>
              </div>
              {[
                "I consent to admission and treatment",
                "I have received and reviewed the Notice of Privacy Practices",
                "I acknowledge financial responsibility",
                "I consent to release of records for billing",
              ].map((c, i) => (
                <label key={i} style={{ display: "flex", gap: 8, padding: "8px 0", fontSize: 12, borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <input type="checkbox" defaultChecked={i < 2} /> {c}
                </label>
              ))}
              <div className="esign" style={{ marginTop: 14 }}>
                <div className="lbl">Patient e-signature</div>
                <input placeholder="Type full name to sign" />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>}
            <div style={{ flex: 1 }} />
            <button className="btn primary" onClick={() => step === STEPS.length - 1 ? handleSubmit() : setStep(s => s + 1)} disabled={busy}>
              {busy ? "Admitting…" : step === STEPS.length - 1 ? "Submit admission" : "Continue →"}
            </button>
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Admission summary</div>
            <div className="bill-row"><span className="k">Patient</span><span className="v">{data.firstName} {data.lastName}</span></div>
            <div className="bill-row"><span className="k">DOB</span><span className="v">{data.dateOfBirth}</span></div>
            <div className="bill-row"><span className="k">Ward</span><span className="v">{data.ward}</span></div>
            <div className="bill-row"><span className="k">Bed</span><span className="v">{data.bed}</span></div>
            <div className="bill-row"><span className="k">Attending</span><span className="v">{data.attendingName}</span></div>
            <div className="bill-row"><span className="k">Insurance</span><span className="v" style={{ color: "var(--good)" }}>{data.insurance} ✓</span></div>
            <div className="bill-row"><span className="k">Code</span><span className="v">{data.codeStatus}</span></div>
          </div>
          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Auto checks</div>
            {[["Insurance eligibility", "good"], ["Bed availability", "good"], ["Consent collected", "warn"], ["MRN assigned", "good"]].map(([k, c], i) => (
              <div key={i} className="bill-row"><span className="k">{k}</span><span className={`pill ${c}`}><span className="pdot" />{c === "good" ? "OK" : "Pending"}</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
