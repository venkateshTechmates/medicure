"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import PrintButton from "@/components/PrintButton";
import ConsentModal from "@/components/ConsentModal";
import StatusPill from "@/components/StatusPill";
import type { Consent, PatientDetail, StatusKind } from "@/lib/types";

function consentStatusKind(s: string): StatusKind {
  if (s === "signed") return "good";
  if (s === "revoked" || s === "expired") return "bad";
  if (s === "draft") return "warn";
  return "info";
}

const REQUIRED_KINDS: Array<{ kind: "treatment" | "hipaa"; title: string; body: string; requiredWitness: boolean }> = [
  {
    kind: "treatment",
    title: "Consent for medical evaluation and treatment",
    body:
      "I voluntarily consent to medical evaluation, diagnostic tests, and treatment as deemed appropriate by the medical staff of this facility. I authorize release of medical information necessary to process insurance claims and for continuity of care. I acknowledge financial responsibility for charges not covered by my insurance.",
    requiredWitness: false,
  },
  {
    kind: "hipaa",
    title: "Acknowledgement of Notice of Privacy Practices (HIPAA)",
    body:
      "I acknowledge that I have been offered a copy of this facility's Notice of Privacy Practices, which describes how my protected health information (PHI) may be used and disclosed and how I can obtain access to this information. I authorize the use and disclosure of my PHI for treatment, payment, and healthcare operations.",
    requiredWitness: false,
  },
];

export default function AdmitClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [admitted, setAdmitted] = useState<PatientDetail | null>(null);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [openConsent, setOpenConsent] = useState<Consent | null>(null);
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
      const p = await api<PatientDetail>("/api/patients", { method: "POST", body: JSON.stringify({
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString()
      }) });
      setAdmitted(p);
      setMsg("✓ Patient admitted — print wristband or continue");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Admit failed");
    } finally { setBusy(false); }
  }

  async function refreshConsents(pid: number) {
    const list = await api<Consent[]>(`/api/consents?patientId=${pid}`).catch(() => [] as Consent[]);
    setConsents(list);
  }

  useEffect(() => {
    if (!admitted) return;
    (async () => {
      const list = await api<Consent[]>(`/api/consents?patientId=${admitted.id}`).catch(() => [] as Consent[]);
      const existingKinds = new Set(list.map(c => c.kind));
      for (const t of REQUIRED_KINDS) {
        if (!existingKinds.has(t.kind)) {
          await api<Consent>("/api/consents", {
            method: "POST",
            body: JSON.stringify({
              patientId: admitted.id,
              kind: t.kind,
              title: t.title,
              bodyText: t.body,
              requiredWitness: t.requiredWitness,
            }),
          }).catch(() => null);
        }
      }
      refreshConsents(admitted.id);
    })();
  }, [admitted]);

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
          {admitted && (
            <PrintButton
              label="Print wristband"
              htmlUrl={`/api/labels/wristband/${admitted.id}?fmt=html`}
              zplUrl={`/api/labels/wristband/${admitted.id}?fmt=zpl`}
              zplFilename={`wristband-${admitted.mrn}.zpl`}
              variant="primary"
            />
          )}
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn">Save draft</button>
          {admitted ? (
            <button className="btn primary" onClick={() => router.push("/patients")}>Done →</button>
          ) : (
            <button className="btn primary" onClick={() => step === STEPS.length - 1 ? handleSubmit() : setStep(s => s + 1)} disabled={busy}>
              {busy ? "Admitting…" : step === STEPS.length - 1 ? "Submit admission" : "Next →"}
            </button>
          )}
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
              <h3>Consents</h3>
              {!admitted && (
                <div className="cds info" style={{ marginBottom: 12 }}>
                  <div className="t">Submit admission to enable consent capture</div>
                  After admission, the required treatment and HIPAA consents will appear here for e-signature on this device.
                </div>
              )}
              {admitted && consents.length === 0 && (
                <div className="meta" style={{ padding: 12, color: "var(--ink-mute)" }}>Preparing required consents…</div>
              )}
              {admitted && consents.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", textTransform: "capitalize" }}>
                      {c.kind} · {c.requiredWitness ? "witness required" : "no witness"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StatusPill kind={consentStatusKind(c.status)}>{c.status}</StatusPill>
                    {c.status === "draft" && (
                      <button className="btn primary" onClick={() => setOpenConsent(c)}>Sign now</button>
                    )}
                  </div>
                </div>
              ))}
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
            {(() => {
              const consentDone = consents.length > 0 && consents.every(c => c.status === "signed");
              const rows: [string, string][] = [
                ["Insurance eligibility", "good"],
                ["Bed availability", "good"],
                ["Consent collected", consentDone ? "good" : "warn"],
                ["MRN assigned", admitted ? "good" : "warn"],
              ];
              return rows.map(([k, c], i) => (
                <div key={i} className="bill-row"><span className="k">{k}</span><span className={`pill ${c}`}><span className="pdot" />{c === "good" ? "OK" : "Pending"}</span></div>
              ));
            })()}
          </div>
        </div>
      </div>

      {openConsent && (
        <ConsentModal
          consent={openConsent}
          onClose={() => setOpenConsent(null)}
          onSigned={() => admitted && refreshConsents(admitted.id)}
        />
      )}
    </>
  );
}
