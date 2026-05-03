"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const ESI_LEVELS = [
  { n: 1, lbl: "Resus",       desc: "Imminent threat to life",       cls: "lvl1" },
  { n: 2, lbl: "Emergent",    desc: "High risk · time-critical",     cls: "lvl2" },
  { n: 3, lbl: "Urgent",      desc: "Many resources",                cls: ""     },
  { n: 4, lbl: "Less-urgent", desc: "One resource",                  cls: ""     },
  { n: 5, lbl: "Non-urgent",  desc: "No resources",                  cls: ""     },
];

const PAIN_LOCS = ["L chest", "L jaw", "L arm", "R chest", "Back", "Abdomen", "Head", "Other"];

export default function TriageClient() {
  const router = useRouter();
  const [esi, setEsi] = useState(2);
  const [pain, setPain] = useState(9);
  const [locs, setLocs] = useState<Record<string, boolean>>({ "L chest": true, "L jaw": true, "L arm": true });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState({
    last: "Carpenter", first: "Riley", dob: "03/14/1986", sex: "Female", mrn: "—",
    arrival: "EMS – stretcher",
    hpi: "Sudden severe chest pain on the left side started 40 min ago, sweating, short of breath, feels like an elephant on me.",
    category: "Chest pain – cardiac suspected",
    onset: "40 min ago · sudden", provoked: "At rest · while watching TV",
    quality: "Pressure / heavy", radiation: "L jaw, L arm", associated: "Diaphoresis, SOB, nausea",
    hr: 118, bp: "92/58", rr: 22, spo2: 94, temp: 36.8,
    allergies: "NKDA", lastMeal: "Lunch 13:00 · sandwich",
    pregnancy: "Not pregnant · LMP 14d", meds: "OCP, lisinopril 10 mg, atorvastatin 40 mg",
    pmh: "HTN, HLD, smoker 1ppd ×15y", famHx: "Father MI age 52",
  });

  const set = <K extends keyof typeof data>(k: K, v: typeof data[K]) => setData(d => ({ ...d, [k]: v }));

  async function dispatch() {
    setBusy(true);
    try {
      await api("/api/ed/triage", { method: "POST", body: JSON.stringify({
        patientName: `${data.last}, ${data.first}`,
        age: 38, sex: data.sex.startsWith("F") ? "F" : "M",
        chiefComplaint: data.hpi.slice(0, 80),
        esiLevel: esi, arrivalMode: data.arrival,
        hr: data.hr, sbp: parseInt(data.bp), spo2: data.spo2,
      }) });
    } catch { /* fallthrough to navigate anyway */ }
    router.push("/ed/live");
  }

  function vitClass(field: "hr" | "bp" | "spo2" | "temp" | "rr" | "pain"): string {
    if (field === "hr" && data.hr > 100) return "warn";
    if (field === "bp" && parseInt(data.bp) < 100) return "warn";
    if (field === "spo2" && data.spo2 < 92) return "abn";
    if (field === "pain" && pain >= 7) return "abn";
    return "";
  }

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/ed">ED</a>
        <span>›</span>
        <span className="bc-cur">Triage intake</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">Triage</h1>
          <div className="meta">ESI 5-level algorithm · 2-ID minimum · door-to-doc target ≤ 14 min</div>
        </div>
        <div className="toolbar">
          <button className="btn">Save draft</button>
          <button className="btn">Cancel</button>
        </div>
      </div>

      <div className="triage-layout">
        <div>
          <div className="tg-form">
            <h3>Patient identification</h3>
            <div className="sb">Capture or confirm before vitals · 2-ID minimum (name + DOB)</div>
            <div className="tg-grid3">
              <div className="tg-field"><label>Last name</label><input value={data.last} onChange={e => set("last", e.target.value)} /></div>
              <div className="tg-field"><label>First name</label><input value={data.first} onChange={e => set("first", e.target.value)} /></div>
              <div className="tg-field"><label>DOB</label><input value={data.dob} onChange={e => set("dob", e.target.value)} /></div>
              <div className="tg-field"><label>Sex / gender</label>
                <select value={data.sex} onChange={e => set("sex", e.target.value)}>
                  <option>Female</option><option>Male</option><option>Nonbinary</option>
                </select>
              </div>
              <div className="tg-field"><label>MRN (if known)</label><input value={data.mrn} onChange={e => set("mrn", e.target.value)} /></div>
              <div className="tg-field"><label>Arrival mode</label>
                <select value={data.arrival} onChange={e => set("arrival", e.target.value)}>
                  <option>EMS – stretcher</option><option>EMS – ambulatory</option><option>Walk-in</option><option>POV</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tg-form">
            <h3>Chief complaint</h3>
            <div className="sb">In the patient&apos;s own words · then categorize</div>
            <div className="tg-field"><textarea rows={3} value={data.hpi} onChange={e => set("hpi", e.target.value)} /></div>
            <div className="tg-grid3">
              <div className="tg-field"><label>Category</label>
                <select value={data.category} onChange={e => set("category", e.target.value)}>
                  <option>Chest pain – cardiac suspected</option>
                  <option>Abdominal pain</option><option>Headache</option><option>Trauma</option>
                  <option>Respiratory distress</option><option>Stroke-like</option>
                </select>
              </div>
              <div className="tg-field"><label>Onset</label><input value={data.onset} onChange={e => set("onset", e.target.value)} /></div>
              <div className="tg-field"><label>Provoked by</label><input value={data.provoked} onChange={e => set("provoked", e.target.value)} /></div>
              <div className="tg-field"><label>Quality</label>
                <select value={data.quality} onChange={e => set("quality", e.target.value)}>
                  <option>Pressure / heavy</option><option>Sharp</option><option>Burning</option><option>Cramping</option>
                </select>
              </div>
              <div className="tg-field"><label>Radiation</label><input value={data.radiation} onChange={e => set("radiation", e.target.value)} /></div>
              <div className="tg-field"><label>Associated</label><input value={data.associated} onChange={e => set("associated", e.target.value)} /></div>
            </div>
          </div>

          <div className="tg-form">
            <h3>Initial vitals</h3>
            <div className="sb">Auto-pulled from monitor · click to override</div>
            <div className="vit-grid">
              <div className={`vit ${vitClass("hr")}`}><div className="l">HR</div><input value={data.hr} onChange={e => set("hr", Number(e.target.value) || 0)} /><div className="u">bpm</div></div>
              <div className={`vit ${vitClass("bp")}`}><div className="l">BP</div><input value={data.bp} onChange={e => set("bp", e.target.value)} /><div className="u">mmHg</div></div>
              <div className="vit"><div className="l">RR</div><input value={data.rr} onChange={e => set("rr", Number(e.target.value) || 0)} /><div className="u">/min</div></div>
              <div className={`vit ${vitClass("spo2")}`}><div className="l">SpO₂</div><input value={data.spo2} onChange={e => set("spo2", Number(e.target.value) || 0)} /><div className="u">% RA</div></div>
              <div className="vit"><div className="l">Temp</div><input value={data.temp} onChange={e => set("temp", Number(e.target.value) || 0)} /><div className="u">°C</div></div>
              <div className={`vit ${vitClass("pain")}`}><div className="l">Pain</div><input value={pain} onChange={e => setPain(Number(e.target.value) || 0)} /><div className="u">/10</div></div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em", color: "var(--ink-mute)", marginBottom: 6 }}>Pain location</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {PAIN_LOCS.map(loc => (
                  <label key={loc} style={{ display: "flex", gap: 6, padding: "8px 10px", background: locs[loc] ? "#0e1116" : "#fafbfc", color: locs[loc] ? "#fff" : "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!locs[loc]} onChange={e => setLocs(l => ({ ...l, [loc]: e.target.checked }))} />
                    {loc}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.05em", color: "var(--ink-mute)", marginBottom: 6 }}>Pain intensity · NRS 0–10</div>
              <div className="pain-grid">
                {Array.from({ length: 11 }, (_, i) => (
                  <button key={i} className={pain === i ? "sel" : ""} onClick={() => setPain(i)}>{i}</button>
                ))}
              </div>
              <div className="pain-bar" />
            </div>
          </div>

          <div className="tg-form">
            <h3>ESI level</h3>
            <div className="sb">Algorithm: life threat? high risk? resources? vitals?</div>
            <div className="esi-grid">
              {ESI_LEVELS.map(l => (
                <div key={l.n} className={`esi-tile ${l.cls} ${esi === l.n ? "selected" : ""}`} onClick={() => setEsi(l.n)}>
                  <div className="num">{l.n}</div>
                  <div className="lbl">{l.lbl}</div>
                  <div className="desc">{l.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#fef9d7", border: "1px solid #ffd633", borderRadius: 12, padding: 12, fontSize: 12, color: "#7a4400", lineHeight: 1.5 }}>
              <b>Recommended ESI 2.</b> Algorithm: chest pain + diaphoresis + hypotension + tachycardia + age 38 = high-risk requiring time-critical evaluation. STEMI protocol candidate — page cardiology, EKG &lt; 10 min.
            </div>
          </div>

          <div className="tg-form">
            <h3>Quick history</h3>
            <div className="tg-grid2">
              <div className="tg-field"><label>Allergies</label><input value={data.allergies} onChange={e => set("allergies", e.target.value)} /></div>
              <div className="tg-field"><label>Last meal</label><input value={data.lastMeal} onChange={e => set("lastMeal", e.target.value)} /></div>
              <div className="tg-field"><label>Pregnancy status</label><input value={data.pregnancy} onChange={e => set("pregnancy", e.target.value)} /></div>
              <div className="tg-field"><label>Current meds</label><input value={data.meds} onChange={e => set("meds", e.target.value)} /></div>
              <div className="tg-field"><label>PMH</label><input value={data.pmh} onChange={e => set("pmh", e.target.value)} /></div>
              <div className="tg-field"><label>Family hx</label><input value={data.famHx} onChange={e => set("famHx", e.target.value)} /></div>
            </div>
          </div>
        </div>

        <div>
          <div className="esi-sum">
            <div className="l">Recommended ESI</div>
            <div className="v">{esi}</div>
            <div className="n">{ESI_LEVELS[esi - 1].lbl} · Bay {esi <= 2 ? 4 : 8}</div>
            <div className="why">High-risk presentation · activating STEMI protocol · door-to-EKG &lt; 10 min · door-to-cath &lt; 90 min</div>
          </div>
          <div className="tg-panel">
            <h4>Door clock</h4>
            <div className="timer">02:42</div>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-mute)" }}>Since arrival · 14:15</div>
            <div className="row" style={{ marginTop: 10 }}><span className="k">Triage target</span><span className="v" style={{ color: "var(--good)" }}>≤ 5 min</span></div>
            <div className="row"><span className="k">Doc target</span><span className="v">≤ 14 min</span></div>
            <div className="row"><span className="k">EKG target</span><span className="v" style={{ color: "var(--bad)" }}>≤ 10 min · 7 left</span></div>
          </div>
          <div className="tg-panel">
            <h4>Auto-triggered actions</h4>
            <div className="row"><span className="k">EKG order</span><span className="v" style={{ color: "var(--good)" }}>✓ placed</span></div>
            <div className="row"><span className="k">Cardiac panel</span><span className="v" style={{ color: "var(--good)" }}>✓ placed</span></div>
            <div className="row"><span className="k">IV access ×2</span><span className="v">In progress</span></div>
            <div className="row"><span className="k">ASA 325 mg</span><span className="v">Pending RN</span></div>
            <div className="row"><span className="k">Cards paged</span><span className="v" style={{ color: "var(--good)" }}>✓ Dr. Vasquez</span></div>
          </div>
          <div className="tg-panel">
            <h4>Bed assignment</h4>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", lineHeight: 1.6 }}>
              <b>Bay 4</b> — cardiac monitored, defib at bedside, RT on standby<br />
              <b>RN:</b> J. Park (assigned)<br />
              <b>MD:</b> Dr. Lin (next up)<br />
              <b>ETA:</b> 90 sec (in transit)
            </div>
            <button className="btn primary" onClick={dispatch} disabled={busy} style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
              {busy ? "Dispatching…" : "Confirm & dispatch →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
