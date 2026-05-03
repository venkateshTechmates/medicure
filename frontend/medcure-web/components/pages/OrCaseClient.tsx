"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";

const TIMELINE = [
  { t: "07:42", lbl: "Patient in pre-op",        cls: "good" },
  { t: "08:14", lbl: "Anesthesia consent",       cls: "good" },
  { t: "08:28", lbl: "Time-out completed",       cls: "good" },
  { t: "08:32", lbl: "Incision",                 cls: "good" },
  { t: "10:18", lbl: "Closing",                  cls: "warn" },
  { t: "10:42", lbl: "Out of OR",                cls: "info" },
  { t: "10:55", lbl: "PACU arrival",             cls: "info" },
];

export default function OrCaseClient() {
  const router = useRouter();
  const [cases, setCases] = useState<Appointment[]>([]);
  const [sel, setSel] = useState<Appointment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Appointment[]>("/api/appointments?type=Procedure&take=20").then(rows => {
      setCases(rows);
      if (rows.length) setSel(rows[0]);
    }).catch(() => {});
  }, []);

  async function close() {
    if (!sel) return;
    setBusy(true);
    try {
      await api(`/api/appointments/${sel.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "completed" }) });
      router.push("/surgery-board");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">OR · case detail</span>
          <h1 className="h1">{sel?.type ?? "Procedure"} · {sel?.patient?.fullName ?? ""}</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={sel?.id ?? ""} onChange={e => setSel(cases.find(c => c.id === Number(e.target.value)) ?? null)} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {cases.map(c => <option key={c.id} value={c.id}>{c.patient?.fullName ?? "—"} · {c.type}</option>)}
              {cases.length === 0 && <option value="">No procedures scheduled</option>}
            </select>
            <span>· {sel?.providerName ?? "—"} · {sel?.durationMin ?? 90} min planned · status {sel?.status ?? "—"}</span>
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print case sheet</button>
          <button className="btn primary" onClick={close} disabled={busy || !sel}>{busy ? "Closing…" : "Close case →"}</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Wheels-in to incision</div><div className="num">50<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>m</span></div><div className="delta">target ≤ 60m</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Operative time</div><div className="num">1:46</div><div className="delta">incision → close</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>EBL</div><div className="num">25<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>mL</span></div><div className="delta">low</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Anesthesia</div><div className="num">GA</div><div className="delta">No reversal needed</div></div>
      </div>

      <div className="cpoe-grid">
        <div>
          <div className="card panel">
            <h2>Timeline</h2>
            <div className="tl" style={{ marginTop: 14 }}>
              {TIMELINE.map((e, i) => (
                <div key={i} className="tl-item">
                  <div className="t">{e.t}</div>
                  <div className="h">{e.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Operative note</h2>
            <div className="cpoe-field"><label>Procedure</label><input defaultValue="Laparoscopic cholecystectomy" /></div>
            <div className="cpoe-field"><label>Indication</label><input defaultValue="Symptomatic cholelithiasis" /></div>
            <div className="cpoe-field"><label>Findings</label><textarea rows={3} defaultValue="Inflamed gallbladder with multiple cholesterol stones. No common bile duct injury. No anatomical anomaly." /></div>
            <div className="cpoe-field"><label>Procedure detail</label><textarea rows={4} defaultValue="GA induced. Pneumoperitoneum established. 4-port technique. Calot's triangle dissected, critical view obtained. Cystic artery and duct clipped and divided. Gallbladder dissected from liver bed. Hemostasis confirmed. Specimen retrieved through umbilical port." /></div>
            <div className="cpoe-field"><label>Disposition</label><textarea rows={2} defaultValue="Patient extubated and transferred to PACU in stable condition. Plan POD 0 discharge if tolerating PO." /></div>
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Team</div>
            {[
              { r: "Surgeon",     n: "Dr. T. Achebe" },
              { r: "Asst. Surgeon", n: "Dr. M. Cole" },
              { r: "Anesthesia",  n: "Dr. K. Tanaka" },
              { r: "Scrub RN",    n: "RN Brooks" },
              { r: "Circulator",  n: "RN Park" },
            ].map(t => (
              <div className="bill-row" key={t.r}><span className="k">{t.r}</span><span className="v">{t.n}</span></div>
            ))}
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Supply &amp; counts</div>
            <div className="bill-row"><span className="k">Sponge count</span><span className="v" style={{ color: "var(--good)" }}>✓ Correct</span></div>
            <div className="bill-row"><span className="k">Sharp count</span><span className="v" style={{ color: "var(--good)" }}>✓ Correct</span></div>
            <div className="bill-row"><span className="k">Instruments</span><span className="v" style={{ color: "var(--good)" }}>✓ Correct</span></div>
            <div className="bill-row"><span className="k">Specimen sent</span><span className="v">Pathology</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
