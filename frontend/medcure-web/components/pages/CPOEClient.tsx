"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import CalculatorButton from "@/components/CalculatorButton";
import type { FavoriteOrder, FavoritePanel } from "@/lib/types";
import FavoritesPanel from "@/components/orders/FavoritesPanel";
import SaveAsFavoriteModal, { type SaveFavoriteInput } from "@/components/orders/SaveAsFavoriteModal";

interface PSummary { id: number; mrn: string; fullName: string; age: number; ward: string; bed: string; }

interface CdsCheckAlert { ruleKey: string; family: string; severity: string; message: string; }

const OVERRIDE_REASONS = [
  { code: "benefit-outweighs-risk",   label: "Clinical benefit outweighs risk" },
  { code: "verified-not-current",     label: "Allergy/condition no longer current" },
  { code: "alternative-unavailable",  label: "No appropriate alternative available" },
  { code: "specialist-recommended",   label: "Per specialist recommendation" },
  { code: "patient-tolerated-prior",  label: "Patient previously tolerated" },
];

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
  const [cdsAlerts, setCdsAlerts] = useState<CdsCheckAlert[]>([]);
  const [overrideModal, setOverrideModal] = useState<CdsCheckAlert[] | null>(null);
  const [overrideReason, setOverrideReason] = useState(OVERRIDE_REASONS[0].code);
  const [overrideText, setOverrideText] = useState("");

  // PRD §14.C — favorite orders + panels for the current clinician.
  const [favOrders, setFavOrders] = useState<FavoriteOrder[]>([]);
  const [favPanels, setFavPanels] = useState<FavoritePanel[]>([]);
  const [showSaveFav, setShowSaveFav] = useState(false);
  const [savingFav, setSavingFav] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);
  const [applyingPanelId, setApplyingPanelId] = useState<number | null>(null);

  useEffect(() => {
    api<PSummary[]>("/api/patients?take=40").then(rows => {
      setPatients(rows);
      if (rows.length) setPatientId(rows[0].id);
    }).catch(() => {});
    api<FavoriteOrder[]>("/api/favorites/orders").then(setFavOrders).catch(() => {});
    api<FavoritePanel[]>("/api/favorites/panels").then(setFavPanels).catch(() => {});
  }, []);

  function applyFavoriteToForm(fav: FavoriteOrder) {
    // Drop the favorite into the local form by adopting its order-type and surfacing the name.
    setOrderType(fav.orderType);
    setSelectedDrug({
      ic: fav.name.slice(0, 2),
      nm: fav.name,
      sub: [fav.dose, fav.route, fav.frequency].filter(Boolean).join(" · "),
      added: true,
    });
    setSubmitted(`Loaded favorite: ${fav.name}`);
    setTimeout(() => setSubmitted(null), 1500);
  }

  async function applyPanel(panel: FavoritePanel) {
    if (!patientId) { setErr("Select a patient before applying a panel."); return; }
    setApplyingPanelId(panel.id);
    setErr(null);
    try {
      const res = await api<{ createdOrderIds: number[] }>(`/api/favorites/panels/${panel.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ patientId }),
      });
      setSubmitted(`Applied panel "${panel.name}" — ${res.createdOrderIds.length} order${res.createdOrderIds.length === 1 ? "" : "s"} created`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to apply panel");
    } finally {
      setApplyingPanelId(null);
    }
  }

  async function saveFavorite(input: SaveFavoriteInput) {
    setSavingFav(true); setFavError(null);
    try {
      const saved = await api<FavoriteOrder>("/api/favorites/orders", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setFavOrders(prev => {
        const existing = prev.findIndex(f => f.id === saved.id);
        if (existing >= 0) {
          const next = prev.slice();
          next[existing] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      setShowSaveFav(false);
    } catch (e) {
      setFavError(e instanceof Error ? e.message : "Failed to save favorite");
    } finally {
      setSavingFav(false);
    }
  }

  async function deleteFavorite(id: number) {
    try {
      await api(`/api/favorites/orders/${id}`, { method: "DELETE" });
      setFavOrders(prev => prev.filter(f => f.id !== id));
    } catch { /* surface via err if desired */ }
  }

  async function deletePanel(id: number) {
    try {
      await api(`/api/favorites/panels/${id}`, { method: "DELETE" });
      setFavPanels(prev => prev.filter(p => p.id !== id));
    } catch { /* noop */ }
  }

  function buildOrderBody() {
    return {
      patientId,
      orderType,
      name: selectedDrug.nm,
      dose: "180 mcg (2 puffs)",
      route: "Inhaled",
      frequency: "q4–6h PRN",
      priority: priority === "stat" ? "Stat" : priority === "timed" ? "Urgent" : "Routine",
      status: "signed",
      indication: "Asthma exacerbation",
    };
  }

  async function postOrder() {
    await api("/api/orders", {
      method: "POST",
      body: JSON.stringify(buildOrderBody()),
    });
    setSubmitted("Order signed and routed to pharmacy queue");
    setTimeout(() => router.push("/pharmacy"), 1200);
  }

  async function submit() {
    if (!esign || !patientId) { setErr("Patient and signature required"); return; }
    setBusy(true); setErr(null);
    try {
      // 1. Real-time CDS check before signing.
      const draft = buildOrderBody();
      const alerts = await api<CdsCheckAlert[]>("/api/cds/check", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          orderDraftJson: JSON.stringify(draft),
          triggerPoint: "sign",
        }),
      });
      setCdsAlerts(alerts);

      // 2. Any hard-stop blocks signing until the user records an override.
      const hardStops = alerts.filter(a => a.severity === "hard-stop");
      if (hardStops.length > 0) {
        setOverrideModal(hardStops);
        setOverrideText("");
        setOverrideReason(OVERRIDE_REASONS[0].code);
        return;
      }

      // 3. No hard stops → proceed.
      await postOrder();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Order submission failed");
    } finally { setBusy(false); }
  }

  async function confirmOverride() {
    if (!overrideModal || !patientId) return;
    if (!overrideText.trim()) { setErr("Override justification required"); return; }
    setBusy(true); setErr(null);
    try {
      // Record one override row per hard-stop alert.
      for (const a of overrideModal) {
        await api("/api/cds/override", {
          method: "POST",
          body: JSON.stringify({
            ruleKey: a.ruleKey,
            patientId,
            orderId: null,
            reasonCode: overrideReason,
            reasonText: overrideText,
            severity: a.severity,
          }),
        });
      }
      setOverrideModal(null);
      await postOrder();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Override failed");
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
              <div className="cpoe-field">
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Dose</span>
                  <CalculatorButton
                    label="Calc"
                    initial="dose"
                    context={{ patientId: typeof patientId === "number" ? patientId : undefined, age: activePatient?.age }}
                  />
                </label>
                <input defaultValue="180 mcg (2 puffs)" />
              </div>
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
              {cdsAlerts.length === 0 && (
                <div className="cds info">
                  <div className="t">ℹ No alerts yet</div>
                  Real-time CDS will run when you sign. Drug-allergy, duplicate, renal-dose and pregnancy checks are active.
                </div>
              )}
              {cdsAlerts.map((a, i) => {
                const cls = a.severity === "hard-stop" ? "bad" : a.severity === "warn" ? "warn" : "info";
                const icon = a.severity === "hard-stop" ? "⛔" : a.severity === "warn" ? "⚠" : "ℹ";
                return (
                  <div className={`cds ${cls}`} key={`${a.ruleKey}-${i}`}>
                    <div className="t">{icon} {a.family} · {a.severity}</div>
                    {a.message}
                  </div>
                );
              })}
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
              <div className="summary-line"><span className="k">CDS alerts</span><span className="v" style={{ color: cdsAlerts.some(a => a.severity === "hard-stop") ? "#b3263d" : cdsAlerts.some(a => a.severity === "warn") ? "#a05a00" : "var(--ink-mute)" }}>
                {cdsAlerts.length === 0
                  ? "none yet"
                  : `${cdsAlerts.filter(a => a.severity === "warn").length} warn · ${cdsAlerts.filter(a => a.severity === "hard-stop").length} hard-stop`}
              </span></div>
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

      {overrideModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, background: "rgba(14,17,22,.55)",
            display: "grid", placeItems: "center", zIndex: 1000, padding: 20,
          }}
          onClick={() => !busy && setOverrideModal(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 560, width: "100%", padding: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4, color: "#b3263d" }}>
              ⛔ Hard-stop alert — override required
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 14 }}>
              Signing is blocked until you record a clinical justification. The override is logged to the audit chain.
            </div>
            {overrideModal.map((a, i) => (
              <div className="cds bad" key={`${a.ruleKey}-${i}`} style={{ marginBottom: 8 }}>
                <div className="t">⛔ {a.family}</div>
                {a.message}
                <div style={{ fontSize: 10, color: "var(--ink-mute)", marginTop: 4 }}>rule: {a.ruleKey}</div>
              </div>
            ))}

            <div className="cpoe-field" style={{ marginTop: 12 }}>
              <label>Override reason</label>
              <select value={overrideReason} onChange={e => setOverrideReason(e.target.value)}>
                {OVERRIDE_REASONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div className="cpoe-field" style={{ marginTop: 8 }}>
              <label>Justification (required)</label>
              <textarea
                rows={3}
                value={overrideText}
                onChange={e => setOverrideText(e.target.value)}
                placeholder="Explain why proceeding is in the patient's best interest…"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button className="btn" disabled={busy} onClick={() => setOverrideModal(null)}>Cancel</button>
              <button
                className="btn primary"
                disabled={busy || !overrideText.trim()}
                onClick={confirmOverride}
              >
                {busy ? "Recording…" : "Override & sign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
