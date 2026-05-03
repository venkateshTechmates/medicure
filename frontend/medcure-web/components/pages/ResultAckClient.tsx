"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtTime } from "@/lib/fmt";
import type { LabResult } from "@/lib/types";

type Filter = "All" | "Critical" | "Abnormal";

export default function ResultAckClient() {
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("Critical");
  const [actionNote, setActionNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const all = await api<LabResult[]>("/api/labs?take=200").catch(() => [] as LabResult[]);
    const flagged = all.filter(l => !l.acknowledged && l.flag !== "normal");
    setLabs(flagged);
    if (flagged.length && (activeId === null || !flagged.find(l => l.id === activeId))) setActiveId(flagged[0].id);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = labs.filter(l =>
    filter === "All" ? true :
    filter === "Critical" ? l.flag === "critical" :
    (l.flag === "high" || l.flag === "low")
  );

  const sel = filtered.find(l => l.id === activeId) ?? filtered[0];

  async function ack() {
    if (!sel) return;
    setBusy(true);
    try {
      await api(`/api/labs/${sel.id}/ack`, { method: "POST" });
      setActionNote("");
      await refresh();
    } finally { setBusy(false); }
  }
  async function ackAll() {
    setBusy(true);
    try {
      await Promise.all(filtered.map(l => api(`/api/labs/${l.id}/ack`, { method: "POST" })));
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Inbox · Result acknowledgement</span>
          <h1 className="h1">Result ack</h1>
          <div className="meta">
            {labs.length} unread results · {labs.filter(l => l.flag === "critical").length} critical · auto-page in 30 min if unack
          </div>
        </div>
        <div className="toolbar">
          <div className="subnav">
            {(["All", "Critical", "Abnormal"] as Filter[]).map(f => (
              <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <button className="btn primary" onClick={ackAll} disabled={busy || filtered.length === 0}>
            Acknowledge all <span className="arrow">→</span>
          </button>
        </div>
      </div>

      <div className="inbox-grid">
        <div className="inbox-list">
          {filtered.length === 0 && (
            <div className="muted" style={{ padding: 30, textAlign: "center", fontSize: 13 }}>
              No unacknowledged {filter.toLowerCase()} results
            </div>
          )}
          {filtered.map(l => (
            <div key={l.id} className={`inbox-row ${activeId === l.id ? "active" : ""} ${l.flag === "critical" ? "crit" : ""}`} onClick={() => setActiveId(l.id)}>
              <div className="av" style={{
                background: l.flag === "critical" ? "#ffe7eb" : l.flag === "high" || l.flag === "low" ? "#fff3df" : "#e6f8ec",
                display: "grid", placeItems: "center",
                color: l.flag === "critical" ? "#b3263d" : l.flag === "high" || l.flag === "low" ? "#a05a00" : "#1a8a48",
                fontWeight: 700,
              }}>
                {l.flag === "critical" ? "!" : l.flag === "high" ? "↑" : l.flag === "low" ? "↓" : "✓"}
              </div>
              <div style={{ flex: 1 }}>
                <div className="top">
                  <div className="nm">{l.patient ? `${l.patient.firstName} ${l.patient.lastName}` : "—"}</div>
                  <div className="tm">{fmtTime(l.resultedAt)}</div>
                </div>
                <div className="sub">
                  <b>{l.testName}</b> · <span className="v">{l.value} {l.units}</span> · ref {l.refRange}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sel ? (
          <div className="card panel">
            <div className="row between" style={{ marginBottom: 14 }}>
              <div>
                <h2>{sel.testName}</h2>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {sel.patient ? `${sel.patient.firstName} ${sel.patient.lastName} · MRN ${sel.patient.mrn} · ` : ""}resulted {fmtTime(sel.resultedAt)} by {sel.resultedBy}
                </div>
              </div>
              <span className={`pill ${sel.flag === "critical" ? "bad" : sel.flag === "normal" ? "good" : "warn"}`}>
                <span className="pdot" />{sel.flag}
              </span>
            </div>

            <div className="grid-3">
              <div className="vital"><h4>Result</h4><div className="num">{sel.value}<small> {sel.units}</small></div></div>
              <div className="vital"><h4>Reference</h4><div className="num" style={{ fontSize: 22 }}>{sel.refRange}</div></div>
              <div className="vital"><h4>Panel</h4><div className="num" style={{ fontSize: 22 }}>{sel.panel}</div></div>
            </div>

            <div className="cpoe-field" style={{ marginTop: 14 }}>
              <label>Action note (optional)</label>
              <textarea rows={3} value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder="Document any follow-up action taken on this result..." />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn primary" onClick={ack} disabled={busy}>
                {busy ? "Acknowledging…" : "Acknowledge & close"}
              </button>
              <button className="btn">Forward to colleague</button>
              {sel.patient && (
                <a className="btn" href={`/patients/${sel.patient.mrn}`}>Open patient chart</a>
              )}
            </div>
          </div>
        ) : (
          <div className="card panel">
            <div className="muted" style={{ padding: 40, textAlign: "center" }}>All caught up.</div>
          </div>
        )}
      </div>
    </>
  );
}
