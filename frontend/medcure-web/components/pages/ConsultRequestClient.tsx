"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ConsultRequest, PatientSummary } from "@/lib/types";

const SPECIALTIES = [
  { ic: "♥", nm: "Cardiology",     sub: "Dr. M. Cole on call",   resp: "~12 min" },
  { ic: "⚯", nm: "Pulmonology",    sub: "Dr. K. Reza on call",   resp: "~18 min" },
  { ic: "𝛂", nm: "Nephrology",     sub: "Dr. P. Singh",          resp: "~45 min", slow: true },
  { ic: "★", nm: "Infectious Disease", sub: "Dr. A. Lopez",      resp: "~22 min" },
  { ic: "⏧", nm: "GI / hepatology", sub: "Dr. R. Park",          resp: "~30 min" },
  { ic: "⚿", nm: "Neurology",      sub: "Dr. C. Vega",           resp: "~1 hr",  slow: true },
  { ic: "⚛", nm: "Endocrinology",  sub: "Dr. L. Mendez",         resp: "~25 min" },
  { ic: "✚", nm: "Surgery",        sub: "Dr. T. Achebe",         resp: "~15 min" },
];

const URGENCIES = [
  { nm: "Stat",    sub: "Bedside < 15 min · phone" },
  { nm: "Urgent",  sub: "Same day · text + page" },
  { nm: "Routine", sub: "Within 24 hrs · inbox" },
];

export default function ConsultRequestClient() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [recent, setRecent] = useState<ConsultRequest[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [spec, setSpec] = useState("Cardiology");
  const [urg, setUrg] = useState("Urgent");
  const [reason, setReason] = useState("Eval & recommendations on diuresis strategy and rate-control optimization in CHF exac on background AFib.");
  const [question, setQuestion] = useState("Continue Lasix gtt vs convert to bumetanide PO? Optimize beta-blocker?");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const list = await api<ConsultRequest[]>("/api/consults?take=20").catch(() => [] as ConsultRequest[]);
    setRecent(list);
  }
  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
    refresh();
  }, []);

  async function page() {
    if (!pat) { setMsg("Pick a patient"); return; }
    setBusy(true); setMsg(null);
    try {
      await api("/api/consults", { method: "POST", body: JSON.stringify({
        patientId: pat, fromService: "Hospitalist", toService: spec,
        toProvider: SPECIALTIES.find(s => s.nm === spec)?.sub ?? "",
        reason, question, urgency: urg
      }) });
      setMsg(`✓ Consult paged to ${spec}`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Page failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  const me = patients.find(p => p.id === pat);

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Request consult</h1>
          <div className="meta">New inpatient consult · choose specialty, frame the question, page the consultant</div>
        </div>
        <div className="toolbar">
          <button className="btn">Cancel</button>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn primary" onClick={page} disabled={busy}>{busy ? "Paging…" : "Page consultant →"}</button>
        </div>
      </div>

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=faces)" }} />
        <div style={{ flex: 1 }}>
          <div className="nm">{me ? `${me.fullName} · MRN ${me.mrn}` : "Select patient"}</div>
          <div className="meta">
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
          </div>
        </div>
        <div><span className="pill warn"><span className="pdot" />Watcher</span></div>
      </div>

      <div className="cpoe-grid">
        <div>
          <div className="card panel">
            <h2>1 · Specialty</h2>
            <div className="sub">Average response time shown · live availability from on-call schedule</div>
            <div className="order-types" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {SPECIALTIES.map(s => (
                <div key={s.nm} className={`ot ${spec === s.nm ? "active" : ""}`} onClick={() => setSpec(s.nm)}>
                  <div className="ic" style={{ background: "#0e1116" }}>{s.ic}</div>
                  <div className="nm">{s.nm}</div>
                  <div className="sub">{s.sub}</div>
                  {s.resp && <div className="sub" style={{ color: s.slow ? "var(--bad)" : "var(--good)", fontWeight: 700, marginTop: 4 }}>{s.resp}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>2 · Urgency</h2>
            <div className="sub">Determines pager / phone routing &amp; SLA</div>
            <div className="order-types" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {URGENCIES.map(u => (
                <div key={u.nm} className={`ot ${urg === u.nm ? "active" : ""}`} onClick={() => setUrg(u.nm)}>
                  <div className="nm" style={{ marginTop: 0 }}>{u.nm}</div>
                  <div className="sub">{u.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>3 · Frame the question</h2>
            <div className="sub">Single-question consults get faster, better answers. Be specific.</div>
            <div className="cpoe-field"><label>Reason for consult (one sentence)</label><input value={reason} onChange={e => setReason(e.target.value)} /></div>
            <div className="cpoe-field"><label>Specific question(s)</label><textarea rows={3} value={question} onChange={e => setQuestion(e.target.value)} /></div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0 }}>Recent consults</h2>
              <span className="muted" style={{ fontSize: 11 }}>{recent.length}</span>
            </div>
            {recent.slice(0, 8).map(c => (
              <div key={c.id} className="bill-row">
                <span className="k">{c.toService} · {c.urgency}</span>
                <span className="v">
                  <span className={`pill ${c.status === "Completed" ? "good" : c.status === "Pending" ? "warn" : "info"}`}>
                    <span className="pdot" />{c.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="cart">
          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Summary</div>
            <div className="bill-row"><span className="k">Patient</span><span className="v">{me ? me.fullName : "—"}</span></div>
            <div className="bill-row"><span className="k">Specialty</span><span className="v">{spec}</span></div>
            <div className="bill-row"><span className="k">Urgency</span><span className="v">{urg}</span></div>
            <div className="bill-row"><span className="k">SLA</span><span className="v" style={{ color: "var(--good)" }}>~ same day</span></div>
            <button className="btn primary" style={{ width: "100%", marginTop: 10, justifyContent: "center" }} onClick={page} disabled={busy}>
              {busy ? "Paging…" : "Page consultant →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
