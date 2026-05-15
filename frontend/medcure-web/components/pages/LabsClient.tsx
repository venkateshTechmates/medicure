"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, downloadFile } from "@/lib/api";
import { fmtTime } from "@/lib/fmt";
import type { LabResult } from "@/lib/types";

const FILTERS: [string, string][] = [["", "All"], ["critical", "Critical"], ["high", "Abnormal"], ["normal", "Normal"]];

export default function LabsClient() {
  const [rows, setRows] = useState<LabResult[]>([]);
  const [flag, setFlag] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (flag) params.set("flag", flag);
    api<LabResult[]>(`/api/labs?${params}`).then(setRows).catch(() => {});
  }, [flag]);

  const total    = rows.length;
  const critical = rows.filter(l => l.flag === "critical");
  const pending  = 18; // demo

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Diagnostics · Recent results</div>
          <h1 className="h1">Labs</h1>
          <div className="meta">{total} resulted today · {critical.length} critical · {pending} pending — LIS connected</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input placeholder="Search by patient or test" />
          </div>
          <button className="btn">Last 24h <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m6 9 6 6 6-6" /></svg></button>
          <button className="btn" onClick={() => downloadFile("/api/exports/labs.csv", "labs.csv")}>Export CSV</button>
          <button className="btn primary">Order Lab <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span></button>
        </div>
      </div>

      <div className="labs-grid">
        <div>
          <div className="labs-stat-row">
            <SparkStat label="Hemoglobin" value="14.2" unit="g/dL" delta={<><b className="up">▲ 0.3</b> vs prev</>} color="#e15670" path="M2 22 L14 18 L26 20 L38 12 L50 14 L62 8 L78 10" iconPath={<><path d="M12 2v6m0 0a4 4 0 0 1 4 4c0 4-4 10-4 10s-4-6-4-10a4 4 0 0 1 4-4z" /></>} />
            <SparkStat label="Glucose"     value="98"   unit="mg/dL" delta={<>Within range</>} color="#3a86ff" path="M2 14 L14 18 L26 12 L38 16 L50 10 L62 14 L78 12" iconPath={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} />
            <SparkStat label="WBC"         value="7.4"  unit="×10⁹/L" delta={<><b className="up">▼ 0.6</b></>} color="#27c26b" path="M2 8 L14 14 L26 10 L38 18 L50 14 L62 20 L78 22" iconPath={<><path d="M3 12h4l3-9 4 18 3-9h4" /></>} />
            <SparkStat label="Creatinine"  value="1.4"  unit="mg/dL" delta={<><b className="dn">▲ 0.2</b> elevated</>} color="#c98a00" path="M2 22 L14 20 L26 16 L38 14 L50 12 L62 8 L78 6" iconPath={<><path d="M12 2 L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6z" /></>} />
          </div>

          <div className="labs-panels">
            <div className="labs-panel">
              <h3>Test Distribution <span className="more-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></span></h3>
              <div className="donut">
                <svg className="donut-svg" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#f4f6f9" strokeWidth="6" />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#0e1116" strokeWidth="6" strokeDasharray="38 100" strokeDashoffset="25" strokeLinecap="round" />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#ffe26b" strokeWidth="6" strokeDasharray="28 100" strokeDashoffset="-13" strokeLinecap="round" />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#3a86ff" strokeWidth="6" strokeDasharray="20 100" strokeDashoffset="-41" strokeLinecap="round" />
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="#e15670" strokeWidth="6" strokeDasharray="14 100" strokeDashoffset="-61" strokeLinecap="round" />
                  <text x="21" y="20" textAnchor="middle" fontFamily="Instrument Serif" fontSize="9" fill="#0e1116">{total || 418}</text>
                  <text x="21" y="26" textAnchor="middle" fontSize="3" fill="#9aa0ad" fontFamily="Plus Jakarta Sans" fontWeight="600">total</text>
                </svg>
                <div className="donut-info">
                  <div><span style={{ color: "#0e1116" }}>●</span> Hematology · <b>38%</b></div>
                  <div><span style={{ color: "#ffe26b" }}>●</span> Chemistry · <b>28%</b></div>
                  <div><span style={{ color: "#3a86ff" }}>●</span> Microbiology · <b>20%</b></div>
                  <div><span style={{ color: "#e15670" }}>●</span> Coagulation · <b>14%</b></div>
                </div>
              </div>
            </div>

            <div className="labs-panel">
              <h3>Turnaround Time <span className="more-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></span></h3>
              <div className="tat-chart">
                <svg viewBox="0 0 320 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="tat-g1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#ffe26b" stopOpacity=".9" />
                      <stop offset="1" stopColor="#ffe26b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g stroke="#ebedf1" strokeDasharray="2 4">
                    <line x1="0" y1="40" x2="320" y2="40" />
                    <line x1="0" y1="80" x2="320" y2="80" />
                    <line x1="0" y1="120" x2="320" y2="120" />
                  </g>
                  <path d="M0 100 L40 80 L80 90 L120 60 L160 70 L200 40 L240 55 L280 30 L320 45 L320 160 L0 160 Z" fill="url(#tat-g1)" />
                  <path d="M0 100 L40 80 L80 90 L120 60 L160 70 L200 40 L240 55 L280 30 L320 45" fill="none" stroke="#0e1116" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  <g fontFamily="Plus Jakarta Sans" fontSize="9" fill="#9aa0ad">
                    <text x="0"   y="155">Mon</text><text x="50"  y="155">Tue</text><text x="100" y="155">Wed</text>
                    <text x="150" y="155">Thu</text><text x="200" y="155">Fri</text><text x="250" y="155">Sat</text>
                    <text x="300" y="155">Sun</text>
                  </g>
                  <circle cx="200" cy="40" r="4" fill="#0e1116" />
                  <rect x="178" y="14" width="58" height="20" rx="6" fill="#0e1116" />
                  <text x="207" y="27" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="Plus Jakarta Sans" fontWeight="700">28 min</text>
                </svg>
              </div>
              <div className="tat-legend">
                <div className="lk"><span className="sw" style={{ background: "#0e1116" }} />Avg TAT (min)</div>
                <div className="lk"><span className="muted">Target ≤ 45 min</span></div>
              </div>
            </div>
          </div>

          <div className="results-card">
            <div className="results-head">
              <h3 style={{ margin: 0, fontFamily: "Instrument Serif, serif", fontWeight: 400, fontSize: 24 }}>Recent Results</h3>
              <div className="subnav">
                {FILTERS.map(([v, l]) => (
                  <button key={v} className={flag === v ? "active" : ""} onClick={() => setFlag(v)}>{l}</button>
                ))}
              </div>
            </div>
            <table>
              <thead><tr><th>Patient</th><th>Test</th><th>Value</th><th>Range</th><th>Released</th><th /></tr></thead>
              <tbody>
                {rows.slice(0, 12).map(l => (
                  <ResultRow key={l.id} l={l} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="labs-side">
          <div className="critical-card">
            <div className="head-row">
              <span className="head-dot" />
              <h3>Critical Alerts</h3>
            </div>
            <div className="sub2">Auto-paged · awaiting acknowledgement</div>
            {critical.slice(0, 3).map(l => (
              <div className="crit-item" key={l.id}>
                <div className="dot" />
                <div style={{ flex: 1 }}>
                  <div className="nm">
                    {l.patient ? `${l.patient.firstName} ${l.patient.lastName}` : "—"}
                    <span style={{ fontWeight: 600, color: "#bdc3cf", fontSize: 11 }}>{fmtTime(l.resultedAt)}</span>
                  </div>
                  <div className="v">{l.testName} <b style={{ color: "var(--bad)" }}>{l.value}</b> {l.units} · ref {l.refRange}</div>
                </div>
              </div>
            ))}
            {critical.length === 0 && (
              <>
                <DemoCrit name="Maria Hernandez" tm="11:02" test="Lactate" v="4.8" units="mmol/L" ref="≤ 2.0" />
                <DemoCrit name="Robert Kim"      tm="10:48" test="Troponin I" v="0.42" units="ng/mL" ref="≤ 0.04" />
                <DemoCrit name="James Liu"       tm="10:15" test="Potassium"  v="6.3" units="mmol/L" ref="3.5–5.0" />
              </>
            )}
            <button className="ack-btn">Acknowledge All</button>
          </div>

          <div className="pending-card">
            <h3>Pending Collection</h3>
            <PendingRow pic="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces" name="Priya Shah"    pt="CBC + BMP · Maternity 3"        badge="STAT"    cls="stat" />
            <PendingRow pic="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces" name="Daniel Owusu"  pt="Lipid panel · Neuro 7"         badge="Routine" cls="routine" />
            <PendingRow pic="https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&h=120&fit=crop&crop=faces" name="Sarah Johnson" pt="Blood culture x2 · Surg 5"     badge="STAT"    cls="stat" />
            <PendingRow pic="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces" name="Albert Smith"  pt="Hemoglobin recheck"            badge="Pre-DC"  cls="predc" />
          </div>
        </div>
      </div>
    </>
  );
}

function SparkStat({ label, value, unit, delta, color, path, iconPath }: { label: string; value: string; unit: string; delta: React.ReactNode; color: string; path: string; iconPath: React.ReactNode }) {
  return (
    <div className="labs-stat">
      <div className="lbl">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2">{iconPath}</svg>
        {label}
      </div>
      <div className="num">{value}<span className="unit">{unit}</span></div>
      <div className="delta">{delta}</div>
      <svg className="spark-tile" viewBox="0 0 80 30" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d={path} /></svg>
    </div>
  );
}

function ResultRow({ l }: { l: LabResult }) {
  const flagPill = l.flag === "critical" ? <span className="pill bad"><span className="pdot" />Critical</span>
                : l.flag === "high"     ? <span className="pill bad"><span className="pdot" />High</span>
                : l.flag === "low"      ? <span className="pill info"><span className="pdot" />Low</span>
                                        : <span className="pill good"><span className="pdot" />Normal</span>;
  const v = parseFloat(l.value);
  const [lo, hi] = parseRange(l.refRange);
  const min = Math.min(lo * 0.5, v * 0.8, lo);
  const max = Math.max(hi * 1.4, v * 1.2, hi);
  const range = max - min || 1;
  const normalLeft  = ((lo - min) / range) * 100;
  const normalWidth = ((hi - lo) / range) * 100;
  const pos = Math.max(0, Math.min(100, ((v - min) / range) * 100));
  const cls = l.flag === "high" || l.flag === "critical" ? "high" : l.flag === "low" ? "low" : "";
  return (
    <tr onClick={() => { if (typeof window !== "undefined") location.href = `/labs/${l.id}`; }}>
      <td><b>{l.patient ? `${l.patient.firstName} ${l.patient.lastName}` : "—"}</b><div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{l.patient?.mrn ?? ""}</div></td>
      <td>{l.testName}</td>
      <td><span className="res-flag" style={{ color: cls === "high" ? "var(--bad)" : cls === "low" ? "var(--info)" : "var(--ink)" }}>{l.value} <span style={{ color: "var(--ink-mute)", fontWeight: 500, fontSize: 11 }}>{l.units}</span></span></td>
      <td>
        <div className={`ref-bar ${cls}`}>
          <div className="normal" style={{ left: `${normalLeft}%`, width: `${normalWidth}%` }} />
          <div className="marker" style={{ left: `calc(${pos}% - 6px)` }} />
        </div>
      </td>
      <td className="muted">{fmtTime(l.resultedAt)}</td>
      <td>{flagPill}</td>
    </tr>
  );
}

function parseRange(refRange: string): [number, number] {
  const m = refRange.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  return [0, 1];
}

function DemoCrit({ name, tm, test, v, units, ref }: { name: string; tm: string; test: string; v: string; units: string; ref: string }) {
  return (
    <div className="crit-item">
      <div className="dot" />
      <div style={{ flex: 1 }}>
        <div className="nm">{name} <span style={{ fontWeight: 600, color: "#bdc3cf", fontSize: 11 }}>{tm}</span></div>
        <div className="v">{test} <b style={{ color: "var(--bad)" }}>{v}</b> {units} · ref {ref}</div>
      </div>
    </div>
  );
}
function PendingRow({ pic, name, pt, badge, cls }: { pic: string; name: string; pt: string; badge: string; cls: string }) {
  return (
    <div className="pending-row">
      <div className="av" style={{ backgroundImage: `url(${pic})` }} />
      <div><div className="nm">{name}</div><div className="pt">{pt}</div></div>
      <span className={`badge ${cls}`}>{badge}</span>
    </div>
  );
}
