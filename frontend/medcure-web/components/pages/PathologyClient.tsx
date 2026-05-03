"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Specimen } from "@/lib/types";

export default function PathologyClient() {
  const [rows, setRows] = useState<Specimen[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const list = await api<Specimen[]>("/api/specimens?take=50").catch(() => [] as Specimen[]);
    setRows(list);
  }
  useEffect(() => { refresh(); }, []);

  async function advance(id: number) {
    setBusy(id);
    try {
      await api(`/api/specimens/${id}/advance`, { method: "POST" });
      await refresh();
    } finally { setBusy(null); }
  }

  const final = rows.filter(s => s.status === "Final" || s.status === "Reported").length;
  const tat = 36;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Pathology · sign-out queue</span>
          <h1 className="h1">Pathology</h1>
          <div className="meta">{rows.length} specimens in pipeline · {final} finals · TAT median {tat} hrs</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print labels</button>
          <button className="btn primary">+ Accession <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Active cases</div><div className="num">{rows.length}</div><div className="delta">in pipeline</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Final</div><div className="num">{final}</div><div className="delta">signed-out</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>TAT median</div><div className="num">{tat}<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>h</span></div><div className="delta">target ≤ 48h</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>STAT</div><div className="num">{rows.filter(s => s.priority === "Stat").length}</div><div className="delta">priority</div></div>
      </div>

      <table className="table">
        <thead><tr><th>Accession</th><th>Type</th><th>Source</th><th>Collected by</th><th>Status</th><th /></tr></thead>
        <tbody>
          {rows.map(s => {
            const cls = s.status === "Final" || s.status === "Reported" ? "good" : s.status === "Pending" ? "info" : "warn";
            return (
              <tr key={s.id}>
                <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>P-{2400 + s.id}</b></td>
                <td><b>{s.type}</b></td>
                <td className="muted">{s.location}</td>
                <td className="muted">{s.collectedBy}</td>
                <td><span className={`pill ${cls}`}><span className="pdot" />{s.status}</span></td>
                <td>
                  <button className="btn" onClick={() => advance(s.id)} disabled={busy === s.id || s.status === "Reported"}>
                    {busy === s.id ? "…" : "Advance →"}
                  </button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: 12 }}>No specimens in queue.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
