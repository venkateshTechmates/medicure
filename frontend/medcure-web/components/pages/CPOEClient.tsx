"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface PSummary { id: number; mrn: string; fullName: string; age: number; ward: string; bed: string; }

interface OT { ic: string; bg: string; nm: string; sub: string; }
const ORDER_TYPES: OT[] = [
  { ic: "Rx", bg: "#3a86ff", nm: "Medication", sub: "eRx, IV, scheduled" },
  { ic: "Lb", bg: "#27c26b", nm: "Lab",        sub: "Chem · heme · micro" },
  { ic: "Im", bg: "#8b5cf6", nm: "Imaging",    sub: "XR · CT · MR · US" },
  { ic: "Nu", bg: "#ffb84d", nm: "Nursing",    sub: "Vitals · I/O · activity" },
  { ic: "Cn", bg: "#ff4d6b", nm: "Consult",    sub: "Specialty referral" },
  { ic: "Dt", bg: "#0e1116", nm: "Diet",       sub: "NPO · texture" },
];

const ORDER_SETS = [
  { nm: "CBC",          pn: "Hematology" },
  { nm: "BMP",          pn: "Chemistry" },
  { nm: "CMP",          pn: "Chemistry" },
  { nm: "LFT",          pn: "Hepatic" },
  { nm: "Lipid",        pn: "Cardiac" },
  { nm: "Troponin",     pn: "Cardiac" },
  { nm: "Lactate",      pn: "Sepsis" },
  { nm: "Blood culture", pn: "Micro · ×2" },
  { nm: "Sepsis bundle", pn: "Order set · 9 items" },
];

const CATALOG = [
  { ic: "Ab", nm: "Albuterol HFA 90 mcg/actuation inhaler", sub: "RxNorm 351137 · 2 puffs q4–6h PRN · Spacer required", added: true },
  { ic: "Az", nm: "Azithromycin 250 mg tablet",             sub: "RxNorm 248656 · 5-day pack · Macrolide", added: false },
  { ic: "Pr", nm: "Prednisolone 15 mg / 5 mL syrup",        sub: "RxNorm 312615 · Pediatric dosing required", added: false },
  { ic: "Mo", nm: "Montelukast 4 mg chewable",              sub: "RxNorm 88014 · Once daily evening", added: false },
  { ic: "Fl", nm: "Fluticasone 50 mcg nasal spray",         sub: "RxNorm 895594 · 1 spray each nostril daily", added: false },
];

export default function CPOEClient() {
  const router = useRouter();
  const [orderType, setOrderType] = useState("Medication");
  const [priority, setPriority] = useState<"routine" | "stat" | "timed">("routine");
  const [esign, setEsign] = useState("");
  const [patients, setPatients] = useState<PSummary[]>([]);
  const [patientId, setPatientId] = useState<number | "">("");
  const [selectedDrug, setSelectedDrug] = useState(CATALOG[0]);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<PSummary[]>("/api/patients?take=40").then(rows => {
      setPatients(rows);
      if (rows.length) setPatientId(rows[0].id);
    }).catch(() => {});
  }, []);

  async function submit() {
    if (!esign || !patientId) { setErr("Patient and signature required"); return; }
    setBusy(true); setErr(null);
    try {
      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          orderType,
          name: selectedDrug.nm,
          dose: "180 mcg (2 puffs)",
          route: "Inhaled",
          frequency: "q4–6h PRN",
          priority: priority === "stat" ? "Stat" : priority === "timed" ? "Urgent" : "Routine",
          status: "signed",
          indication: "Asthma exacerbation",
        }),
      });
      setSubmitted("Order signed and routed to pharmacy queue");
      setTimeout(() => router.push("/pharmacy"), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Order submission failed");
    } finally { setBusy(false); }
  }

  const activePatient = patients.find(p => p.id === patientId);

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">New Order</h1>
          <div className="meta">CPOE · Computerized Provider Order Entry · Real-time CDS active</div>
        </div>
        <div className="toolbar">
          <button className="btn">Save draft</button>
          <button className="btn">Cancel</button>
        </div>
      </div>

      <div className="ctx-bar">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces)" }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select
              value={patientId}
              onChange={e => setPatientId(Number(e.target.value))}
              style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 14 }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id} style={{ color: "#000" }}>{p.fullName} · MRN {p.mrn}</option>
              ))}
            </select>
          </div>
          <div className="meta">
            {activePatient && (
              <>
                <span><b>Age</b> {activePatient.age}y</span>
                <span><b>Ward</b> {activePatient.ward} · Bed {activePatient.bed}</span>
              </>
            )}
            <span><b>Code</b> Full</span><span><b>CrCl</b> 92 mL/min</span><span><b>Allergies</b> Penicillin, Peanuts</span>
          </div>
        </div>
        <div className="alerts">
          <span className="alert-pill">⚠ PCN allergy</span>
          <span className="alert-pill warn-pill">Asthma</span>
        </div>
      </div>

      <div className="stepper">
        <button className="step done"><span className="n">✓</span>Patient</button>
        <button className="step active"><span className="n">2</span>Order type &amp; selection</button>
        <button className="step"><span className="n">3</span>Details &amp; CDS review</button>
        <button className="step"><span className="n">4</span>Sign &amp; submit</button>
      </div>

      <div className="cpoe-grid">
        <div>
          <div className="card panel">
            <h2>What are you ordering?</h2>
            <div className="sub">Choose a category, then add tests or medications. Multiple categories can be combined into one signed order set.</div>

            <div className="order-types">
              {ORDER_TYPES.map(o => (
                <div key={o.nm} className={`ot ${orderType === o.nm ? "active" : ""}`} onClick={() => setOrderType(o.nm)}>
                  <div className="ic" style={{ background: o.bg }}>{o.ic}</div>
                  <div className="nm">{o.nm}</div>
                  <div className="sub">{o.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Common order sets</div>
              <div className="panels-grid">
                {ORDER_SETS.map(s => (
                  <div className="pchip" key={s.nm}>{s.nm}<div className="pn">{s.pn}</div></div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Search catalog</div>
              <div className="cat-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input placeholder="Search by drug, test, RxNorm, NDC, LOINC..." />
                <span className="pill"><span className="pdot" />Favorites</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {CATALOG.map(c => (
                  <div key={c.ic} className={`cpoe-med-row ${selectedDrug.ic === c.ic ? "selected" : ""}`} onClick={() => setSelectedDrug(c)}>
                    <div className="ic">{c.ic}</div>
                    <div><div className="nm">{c.nm}</div><div className="sub">{c.sub}</div></div>
                    <button className="add-btn">{selectedDrug.ic === c.ic ? "✓ Added" : "+ Add"}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Details · Albuterol HFA 90 mcg</h2>
            <div className="sub">Pediatric dosing applied. Renal function normal — no adjustment needed.</div>

            <div className="field-row">
              <div className="cpoe-field"><label>Dose</label><input defaultValue="180 mcg (2 puffs)" /></div>
              <div className="cpoe-field"><label>Route</label><select><option>Inhaled</option><option>Nebulized</option></select></div>
              <div className="cpoe-field"><label>Frequency</label><select><option>q4–6h PRN wheezing</option><option>q4h scheduled</option><option>q6h scheduled</option></select></div>
            </div>
            <div className="field-row">
              <div className="cpoe-field"><label>Duration</label><input defaultValue="14 days" /></div>
              <div className="cpoe-field"><label>Refills</label><select><option>4</option><option>0</option><option>2</option><option>5</option></select></div>
              <div className="cpoe-field"><label>Pharmacy</label><select><option>CVS — Coolidge Cnr</option><option>In-house pharmacy</option></select></div>
            </div>
            <div className="cpoe-field">
              <label>Instructions for patient (printed on label)</label>
              <textarea rows={2} defaultValue="Use spacer device. 2 puffs every 4–6 hours as needed for wheezing or shortness of breath. If using more than 2× per week, contact provider." />
            </div>

            <div style={{ fontWeight: 700, fontSize: 11, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Priority</div>
            <div className="priority-row">
              <button className={`pr-btn ${priority === "routine" ? "active routine" : ""}`} onClick={() => setPriority("routine")}>Routine</button>
              <button className={`pr-btn ${priority === "stat" ? "active stat" : ""}`} onClick={() => setPriority("stat")}>STAT</button>
              <button className={`pr-btn ${priority === "timed" ? "active timed" : ""}`} onClick={() => setPriority("timed")}>Timed</button>
              <button className="pr-btn">Now</button>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Clinical decision support</div>
              <div className="cds info">
                <div className="t">ℹ Pediatric dose verified</div>
                For 31 kg patient · 180 mcg/dose is within recommended pediatric range (90–180 mcg q4–6h). No adjustment needed.
              </div>
              <div className="cds warn">
                <div className="t">⚠ Therapeutic duplication</div>
                Patient already has active <b>Albuterol HFA</b> on med list (last refill Apr 18, 4 refills remaining). Consider canceling existing Rx before signing this order.
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Replace existing</button>
                  <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Override with reason</button>
                </div>
              </div>
              <div className="cds info">
                <div className="t">ℹ Allergy check</div>
                No interaction with patient&apos;s documented allergies (Penicillin, Peanuts). Albuterol is safe.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — cart */}
        <div className="cart">
          <div className="card panel">
            <div className="cart-head">
              <div style={{ fontWeight: 700, fontSize: 15 }}>Order set <span style={{ color: "var(--ink-mute)", fontWeight: 500 }}>(1 item)</span></div>
              <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Clear</button>
            </div>

            <div className="cart-item">
              <div>
                <div className="nm">Albuterol HFA 90 mcg</div>
                <div className="sub">2 puffs · q4–6h PRN · 14 days</div>
                <span className="pill" style={{ marginTop: 6 }}><span className="pdot" />Routine</span>
              </div>
              <button className="x">✕</button>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
              <div className="summary-line"><span className="k">Items</span><span className="v">1</span></div>
              <div className="summary-line"><span className="k">CDS alerts</span><span className="v" style={{ color: "#a05a00" }}>1 warn · 0 critical</span></div>
              <div className="summary-line"><span className="k">Est. cost (patient)</span><span className="v">$8.40</span></div>
              <div className="summary-line"><span className="k">Insurance check</span><span className="v" style={{ color: "var(--good)" }}>✓ Aetna PPO covered</span></div>
            </div>

            <div className="esign">
              <div className="lbl">Provider attestation</div>
              <div style={{ fontSize: 11, color: "#7a5c00", marginBottom: 8 }}>I have reviewed the patient&apos;s allergies, current medications, and the CDS alerts above. This order is medically necessary.</div>
              <input placeholder="Type your full name to e-sign" value={esign} onChange={e => setEsign(e.target.value)} />
            </div>

            {submitted && <div style={{ background: "#e6f8ec", color: "#1a8a48", padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10, textAlign: "center" }}>{submitted}</div>}
            {err && <div style={{ background: "#ffe7eb", color: "#b3263d", padding: 10, borderRadius: 8, fontSize: 12, marginTop: 10 }}>{err}</div>}
            <button className="btn primary"
              style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
              onClick={submit}
              disabled={busy || !esign || !patientId}>
              {busy ? "Submitting…" : "Sign & submit order"}
              <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span>
            </button>
            <div style={{ fontSize: 10, color: "var(--ink-mute)", textAlign: "center", marginTop: 8 }}>
              Routes to pharmacy queue · Notifies primary RN · Logs to audit chain
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Patient&apos;s active meds</div>
            <div style={{ fontSize: 12, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <b>Albuterol HFA</b><div style={{ color: "var(--ink-mute)", fontSize: 11 }}>2 puffs q4–6h PRN · ⚠ duplicate</div>
            </div>
            <div style={{ fontSize: 12, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <b>Fluticasone 50 mcg nasal</b><div style={{ color: "var(--ink-mute)", fontSize: 11 }}>1 spray each nostril daily</div>
            </div>
            <div style={{ fontSize: 12, padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <b>Cetirizine 5 mg</b><div style={{ color: "var(--ink-mute)", fontSize: 11 }}>Daily PRN · OTC</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
