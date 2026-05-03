"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { EDColumn } from "@/lib/types";

interface DemoP { n: string; cc: string; hr: string; sp: string; news: "l" | "m" | "h"; score: number; crit?: boolean; }

const DEMO_TRIAGE: { c1: DemoP[]; c2: DemoP[]; c3: DemoP[]; c4: DemoP[]; c5: DemoP[] } = {
  c1: [
    { n: "67 M · EMS",      cc: "STEMI · cath lab",     hr: "118", sp: "92", news: "h", score: 9, crit: true },
    { n: "52 F · transfer", cc: "Septic shock",         hr: "132", sp: "88", news: "h", score: 8, crit: true },
  ],
  c2: [
    { n: "71 M · Liu",      cc: "Hyperkalemia K 6.3",   hr: "88",  sp: "96", news: "m", score: 6 },
    { n: "34 F · MVC",      cc: "Trauma — c-spine",     hr: "104", sp: "97", news: "m", score: 5 },
    { n: "8 Y · Asthma",    cc: "SOB, wheeze",          hr: "128", sp: "93", news: "m", score: 5 },
    { n: "45 M · CP",       cc: "Chest pain, EKG nl",   hr: "92",  sp: "97", news: "l", score: 4 },
    { n: "29 F · OB",       cc: "Bleeding 2nd tri",     hr: "98",  sp: "99", news: "l", score: 4 },
    { n: "62 M · Stroke",   cc: "NIHSS 4",              hr: "76",  sp: "97", news: "m", score: 5 },
  ],
  c3: [
    { n: "38 F · Migraine", cc: "Severe HA + N/V",      hr: "82",  sp: "99", news: "l", score: 3 },
    { n: "14 M · Lac",      cc: "Hand laceration 4cm",  hr: "88",  sp: "99", news: "l", score: 2 },
    { n: "56 F · Back",     cc: "LBP, no red flags",    hr: "84",  sp: "98", news: "l", score: 3 },
    { n: "72 M · CHF",      cc: "Vol overload, dyspnea", hr: "94", sp: "92", news: "m", score: 4 },
    { n: "41 M · Renal",    cc: "Flank pain → stone",   hr: "96",  sp: "98", news: "l", score: 3 },
  ],
  c4: [
    { n: "28 F · UTI",      cc: "Dysuria, frequency",   hr: "80",  sp: "99",  news: "l", score: 1 },
    { n: "9 M · Cough",     cc: "Cough x 5d, low fever", hr: "108", sp: "97",  news: "l", score: 1 },
    { n: "51 F · Rash",     cc: "Pruritic rash, no anaphy", hr: "78", sp: "99", news: "l", score: 1 },
    { n: "33 M · Ankle",    cc: "Inversion injury, x-ray", hr: "82", sp: "99", news: "l", score: 1 },
  ],
  c5: [
    { n: "24 F · Med refill", cc: "Out of meds",  hr: "72", sp: "100", news: "l", score: 0 },
    { n: "45 M · Form",       cc: "Work note",    hr: "78", sp: "99",  news: "l", score: 0 },
    { n: "19 F · Sutures",    cc: "Removal · simple", hr: "76", sp: "99", news: "l", score: 0 },
  ],
};

const BED_STATES: ("occ" | "crit" | "clean" | "dirty" | "")[] = [
  "occ","occ","occ","occ","crit","occ","occ","clean",
  "occ","occ","occ","dirty","occ","crit","occ","occ",
  "occ","occ","occ","clean","dirty","occ","occ","occ",
  "occ","occ","occ","occ","dirty","occ","clean","occ",
];

export default function EDClient() {
  const [serverCols, setServerCols] = useState<EDColumn[]>([]);
  useEffect(() => { api<EDColumn[]>("/api/ed/board").then(setServerCols).catch(() => {}); }, []);
  const totalActive = serverCols.reduce((s, c) => s + c.patients.length, 0) || 42;

  const ESI_DATA = [
    { lvl: 1, label: "ESI 1 · Resus",       count: serverCols.find(c => c.esiLevel === 1)?.patients.length ?? 2,  pkg: DEMO_TRIAGE.c1, headCls: "col-1" },
    { lvl: 2, label: "ESI 2 · Emergent",    count: serverCols.find(c => c.esiLevel === 2)?.patients.length ?? 6,  pkg: DEMO_TRIAGE.c2, headCls: "col-2" },
    { lvl: 3, label: "ESI 3 · Urgent",      count: serverCols.find(c => c.esiLevel === 3)?.patients.length ?? 14, pkg: DEMO_TRIAGE.c3, headCls: "col-3" },
    { lvl: 4, label: "ESI 4 · Less Urgent", count: serverCols.find(c => c.esiLevel === 4)?.patients.length ?? 12, pkg: DEMO_TRIAGE.c4, headCls: "col-4" },
    { lvl: 5, label: "ESI 5 · Non-Urgent",  count: serverCols.find(c => c.esiLevel === 5)?.patients.length ?? 8,  pkg: DEMO_TRIAGE.c5, headCls: "col-5" },
  ];

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Live · ED Mission Control</div>
          <h1 className="h1">Emergency Dept</h1>
          <div className="meta">{totalActive} active · 8 awaiting bed · door-to-doc median 24 min · NEDOCS 142</div>
        </div>
        <div className="toolbar">
          <button className="btn"><span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--bad)", animation: "pulse 1.5s infinite", marginRight: 4 }} />Live</button>
          <button className="btn">Last 12h <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m6 9 6 6 6-6"/></svg></button>
          <button className="btn primary">Triage Patient <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>
        </div>
      </div>

      <div className="ed-kpis">
        <div className="ed-kpi"><div className="lbl">Active Patients</div><div className="num">{totalActive}</div><div className="delta up">▲ 6 last hour</div></div>
        <div className="ed-kpi"><div className="lbl">Door to Doc</div><div className="num">24<span className="unit">min</span></div><div className="delta up">▼ 4 vs target 30</div></div>
        <div className="ed-kpi"><div className="lbl">Median LOS</div><div className="num">3.8<span className="unit">hrs</span></div><div className="delta">target ≤ 4h</div></div>
        <div className="ed-kpi"><div className="lbl">Boarding</div><div className="num">8</div><div className="delta dn">▲ 2 awaiting bed</div></div>
        <div className="ed-kpi"><div className="lbl">LWBS</div><div className="num">1.2<span className="unit">%</span></div><div className="delta up">▼ 0.3</div></div>
      </div>

      <div className="ed-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="ed-board">
            <div className="ed-board-head">
              <h3>Triage Board · ESI Levels</h3>
              <div className="subnav">
                <button className="active">Active</button><button>Resus</button><button>Fast Track</button><button>Behavioral</button>
              </div>
            </div>
            <div className="triage-grid">
              {ESI_DATA.map(c => (
                <div key={c.lvl}>
                  <div className={`col-head ${c.headCls}`}>
                    <span>{c.label}</span>
                    <span className="ct">{c.count}</span>
                  </div>
                  <div className="esi-col">
                    {c.pkg.map((p, i) => (
                      <div key={i} className={`pcard ${p.crit ? "crit" : ""}`}>
                        <div className="top"><span>{p.n}</span><span className={`news ${p.news}`}>{p.score}</span></div>
                        <div className="cc">{p.cc}</div>
                        <div className="bot">
                          <div className="vit"><span>HR {p.hr}</span><span>SpO₂ {p.sp}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ed-board">
            <div className="ed-board-head">
              <h3>Bed Map · ED South</h3>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>28/32 occupied · 4 EVS in progress</div>
            </div>
            <div className="bedmap">
              {BED_STATES.map((s, i) => (
                <div key={i} className={`ed-bed ${s}`}>{i + 1}</div>
              ))}
            </div>
            <div className="ed-bed-legend">
              <span><i style={{ background: "#0e1116" }} />Occupied</span>
              <span><i style={{ background: "var(--bad)" }} />Critical</span>
              <span><i style={{ background: "var(--accent)" }} />Clean / Ready</span>
              <span><i style={{ background: "#fff3df" }} />EVS in progress</span>
              <span><i style={{ background: "#f4f6f9" }} />Empty</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="arrivals">
            <h3><span className="live" /> Incoming · Next 20 min</h3>
            <div className="arr">
              <div className="ic amb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M3 17h12V5H3z"/><path d="M15 9h4l2 4v4h-2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/></svg></div>
              <div style={{ flex: 1 }}>
                <div className="nm">EMS-4421 · 67 M <span style={{ color: "var(--bad)", fontWeight: 700 }}>2 min</span></div>
                <div className="det">CP, hypotensive, Trop pending · STEMI activation</div>
              </div>
            </div>
            <div className="arr">
              <div className="ic amb"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M3 17h12V5H3z"/><path d="M15 9h4l2 4v4h-2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/></svg></div>
              <div style={{ flex: 1 }}>
                <div className="nm">EMS-4422 · 34 F <span style={{ color: "var(--warn)", fontWeight: 700 }}>8 min</span></div>
                <div className="det">MVC, GCS 14, c-spine collar · Trauma alert</div>
              </div>
            </div>
            <div className="arr">
              <div className="ic walk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="12" cy="5" r="2"/><path d="M9 22V11l3-3 3 3v11M9 13l-3 5"/></svg></div>
              <div style={{ flex: 1 }}>
                <div className="nm">Walk-in · 8 Y <span style={{ color: "#bdc3cf", fontWeight: 700 }}>12 min</span></div>
                <div className="det">Asthma exacerbation · parent reports SOB</div>
              </div>
            </div>
            <div className="arr">
              <div className="ic walk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="12" cy="5" r="2"/><path d="M9 22V11l3-3 3 3v11M9 13l-3 5"/></svg></div>
              <div style={{ flex: 1 }}>
                <div className="nm">Transfer · 71 M <span style={{ color: "#bdc3cf", fontWeight: 700 }}>18 min</span></div>
                <div className="det">Stroke alert from outside facility · NIHSS 6</div>
              </div>
            </div>
          </div>

          <div className="acuity-card">
            <h3>Wait Time by Acuity</h3>
            <div className="acuity-bars">
              <div className="acuity-row"><div className="nm" style={{ color: "#a01a37" }}>ESI 1</div><div className="bar"><i style={{ width: "8%", background: "#a01a37" }} /></div><div className="v">0m</div></div>
              <div className="acuity-row"><div className="nm" style={{ color: "#a04a00" }}>ESI 2</div><div className="bar"><i style={{ width: "18%", background: "#e07a14" }} /></div><div className="v">6m</div></div>
              <div className="acuity-row"><div className="nm" style={{ color: "#7a5a00" }}>ESI 3</div><div className="bar"><i style={{ width: "48%", background: "#ffd84d" }} /></div><div className="v">22m</div></div>
              <div className="acuity-row"><div className="nm" style={{ color: "#1a4fb3" }}>ESI 4</div><div className="bar"><i style={{ width: "72%", background: "#3a86ff" }} /></div><div className="v">48m</div></div>
              <div className="acuity-row"><div className="nm" style={{ color: "#1a8a48" }}>ESI 5</div><div className="bar"><i style={{ width: "90%", background: "#27c26b" }} /></div><div className="v">1h 12</div></div>
            </div>
          </div>

          <div className="acuity-card">
            <h3>Active Alerts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <div style={{ display: "flex", gap: 10, padding: 10, background: "#ffe7eb", borderRadius: 12 }}>
                <span style={{ color: "var(--bad)", fontWeight: 700 }}>●</span>
                <div><b>STEMI Activation</b><div style={{ color: "var(--ink-soft)", marginTop: 2 }}>Bed 14 · Cath lab notified · 4 min ago</div></div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: 10, background: "#fff3df", borderRadius: 12 }}>
                <span style={{ color: "var(--warn)", fontWeight: 700 }}>●</span>
                <div><b>Sepsis Bundle Due</b><div style={{ color: "var(--ink-soft)", marginTop: 2 }}>Bed 22 · 28 min remaining</div></div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: 10, background: "#e6efff", borderRadius: 12 }}>
                <span style={{ color: "var(--info)", fontWeight: 700 }}>●</span>
                <div><b>Stroke Alert Inbound</b><div style={{ color: "var(--ink-soft)", marginTop: 2 }}>CT bay reserved · 18 min ETA</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
