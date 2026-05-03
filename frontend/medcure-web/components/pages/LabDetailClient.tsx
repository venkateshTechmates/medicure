"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";
import type { LabResult } from "@/lib/types";

interface Analyte { test: string; v: string; unit: string; ref: string; flag: "norm" | "high" | "low" | "crit" }

const HEMATOLOGY: Analyte[] = [
  { test: "WBC",          v: "11.2", unit: "K/uL",  ref: "4.0–11.0",   flag: "high" },
  { test: "RBC",          v: "4.78", unit: "M/uL",  ref: "4.20–5.40",  flag: "norm" },
  { test: "Hemoglobin",   v: "13.4", unit: "g/dL",  ref: "12.0–15.0",  flag: "norm" },
  { test: "Hematocrit",   v: "39.8", unit: "%",     ref: "36.0–46.0",  flag: "norm" },
  { test: "MCV",          v: "82.4", unit: "fL",    ref: "80.0–96.0",  flag: "norm" },
  { test: "Platelets",    v: "280",  unit: "K/uL",  ref: "150–450",     flag: "norm" },
  { test: "MPV",          v: "9.4",  unit: "fL",    ref: "7.5–11.5",   flag: "norm" },
];

const DIFF: Analyte[] = [
  { test: "Neutrophils %",  v: "78", unit: "%", ref: "40–70", flag: "high" },
  { test: "Lymphocytes %",  v: "16", unit: "%", ref: "20–45", flag: "low"  },
  { test: "Monocytes %",    v: "4",  unit: "%", ref: "2–10",   flag: "norm" },
  { test: "Eosinophils %",  v: "2",  unit: "%", ref: "0–4",    flag: "norm" },
  { test: "Basophils %",    v: "0",  unit: "%", ref: "0–2",    flag: "norm" },
];

const CHAIN = [
  { t: "07:42", h: "Specimen drawn",       b: "RN Brooks · 2× lavender + 1× SST" },
  { t: "07:48", h: "Tube station 4-East",  b: "Auto-routed · pneumatic" },
  { t: "07:54", h: "Lab received",         b: "Hematology · auto-loaded" },
  { t: "08:02", h: "Analyzer run",         b: "Sysmex XN-9000 · CBC + diff" },
  { t: "08:08", h: "Auto-validated",       b: "All values within autoverification rules" },
  { t: "08:12", h: "Resulted",             b: "Released to chart · Dr. Patel notified" },
];

function flagPill(flag: string) {
  return flag === "crit" ? <span className="pill bad"><span className="pdot" />Critical</span>
       : flag === "high" ? <span className="pill warn"><span className="pdot" />High</span>
       : flag === "low"  ? <span className="pill info"><span className="pdot" />Low</span>
                          : <span className="pill good"><span className="pdot" />Normal</span>;
}

function rangeBar(a: Analyte) {
  const m = a.ref.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);
  if (!m) return null;
  const lo = parseFloat(m[1]), hi = parseFloat(m[2]);
  const v = parseFloat(a.v);
  const min = Math.min(lo * 0.6, v * 0.7);
  const max = Math.max(hi * 1.4, v * 1.3);
  const range = max - min || 1;
  const normalLeft = ((lo - min) / range) * 100;
  const normalWidth = ((hi - lo) / range) * 100;
  const pos = Math.max(0, Math.min(100, ((v - min) / range) * 100));
  const cls = a.flag === "crit" || a.flag === "high" ? "high" : a.flag === "low" ? "low" : "";
  return (
    <div className={`ref-bar ${cls}`} style={{ width: 110 }}>
      <div className="normal" style={{ left: `${normalLeft}%`, width: `${normalWidth}%` }} />
      <div className="marker" style={{ left: `calc(${pos}% - 6px)` }} />
    </div>
  );
}

export default function LabDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [l, setL] = useState<LabResult | null>(null);
  useEffect(() => { if (id) api<LabResult>(`/api/labs/${id}`).then(setL).catch(() => {}); }, [id]);

  async function ack() {
    await api(`/api/labs/${id}/ack`, { method: "POST" });
    setL(p => p ? { ...p, acknowledged: true } : p);
  }

  if (!l) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/labs">Labs</a><span>›</span>
        <span className="bc-cur">{l.panel} · {l.testName}</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Lab · {l.panel} panel</span>
          <h1 className="h1">{l.testName}</h1>
          <div className="meta">
            {l.patient ? `${l.patient.firstName} ${l.patient.lastName} · MRN ${l.patient.mrn} · ` : ""}
            resulted {fmtDate(l.resultedAt)} {fmtTime(l.resultedAt)} by {l.resultedBy}
          </div>
        </div>
        <div className="toolbar">
          <button className="btn">Print</button>
          <button className="btn">Compare prior</button>
          {!l.acknowledged && l.flag !== "normal" && <button className="btn primary" onClick={ack}>Acknowledge ✓</button>}
          {l.acknowledged && <span className="pill good"><span className="pdot" />Acknowledged</span>}
        </div>
      </div>

      <div className="bill-grid">
        <div>
          <div className="card panel">
            <h2>This result</h2>
            <div className="grid-3">
              <div className="vital"><h4>Value</h4><div className="num">{l.value}<small> {l.units}</small></div></div>
              <div className="vital"><h4>Reference</h4><div className="num" style={{ fontSize: 22 }}>{l.refRange}</div></div>
              <div className="vital"><h4>Flag</h4><div style={{ marginTop: 8 }}>{flagPill(l.flag === "critical" ? "crit" : l.flag === "high" ? "high" : l.flag === "low" ? "low" : "norm")}</div></div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Hematology — full panel</h2>
            <table className="table" style={{ marginTop: 10 }}>
              <thead><tr><th>Analyte</th><th>Value</th><th>Range</th><th>Bar</th><th>Flag</th></tr></thead>
              <tbody>
                {HEMATOLOGY.map((a, i) => (
                  <tr key={i}>
                    <td><b>{a.test}</b></td>
                    <td><b>{a.v}</b> <span className="muted">{a.unit}</span></td>
                    <td className="muted">{a.ref}</td>
                    <td>{rangeBar(a)}</td>
                    <td>{flagPill(a.flag)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Differential</h2>
            <table className="table" style={{ marginTop: 10 }}>
              <thead><tr><th>Cell type</th><th>%</th><th>Range</th><th>Flag</th></tr></thead>
              <tbody>
                {DIFF.map((a, i) => (
                  <tr key={i}>
                    <td><b>{a.test}</b></td>
                    <td><b>{a.v}</b> {a.unit}</td>
                    <td className="muted">{a.ref}</td>
                    <td>{flagPill(a.flag)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>7-day trend</h2>
            <svg viewBox="0 0 600 140" style={{ width: "100%", height: 140 }}>
              <g stroke="#ebedf1" strokeDasharray="2 4">
                <line x1="0" y1="35" x2="600" y2="35" />
                <line x1="0" y1="70" x2="600" y2="70" />
                <line x1="0" y1="105" x2="600" y2="105" />
              </g>
              <path d="M 20 90 L 110 84 L 200 78 L 290 64 L 380 58 L 470 50 L 560 38" fill="none" stroke="#0e1116" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {[20, 110, 200, 290, 380, 470, 560].map((x, i) => (
                <circle key={i} cx={x} cy={[90, 84, 78, 64, 58, 50, 38][i]} r="3" fill="#0e1116" />
              ))}
              <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#9aa0ad">
                <text x="20" y="130">Mon</text><text x="110" y="130">Tue</text><text x="200" y="130">Wed</text>
                <text x="290" y="130">Thu</text><text x="380" y="130">Fri</text><text x="470" y="130">Sat</text>
                <text x="560" y="130">Sun</text>
              </g>
            </svg>
          </div>
        </div>

        <div>
          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Order details</div>
            <div className="bill-row"><span className="k">Order ID</span><span className="v">L-{l.id.toString().padStart(7, "0")}</span></div>
            <div className="bill-row"><span className="k">Specimen</span><span className="v">Whole blood · EDTA</span></div>
            <div className="bill-row"><span className="k">Collected</span><span className="v">07:42</span></div>
            <div className="bill-row"><span className="k">Received</span><span className="v">07:54</span></div>
            <div className="bill-row"><span className="k">Resulted</span><span className="v">{fmtTime(l.resultedAt)}</span></div>
            <div className="bill-row"><span className="k">TAT</span><span className="v" style={{ color: "var(--good)" }}>30 min</span></div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Chain of custody</div>
            <div className="tl">
              {CHAIN.map((e, i) => (
                <div key={i} className="tl-item">
                  <div className="t">{e.t}</div>
                  <div className="h">{e.h}</div>
                  <div className="b">{e.b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Recommended follow-up</div>
            <div className="info-block" style={{ background: "#fff7f8", borderColor: "#ffe1e7" }}>
              <h4 style={{ color: "#b3263d" }}>WBC elevation with neutrophil predominance</h4>
              <div style={{ fontSize: 12 }}>Consider blood culture x2, CRP, procalcitonin, source identification.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
