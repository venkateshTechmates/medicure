"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

function tatMins(o: Order) {
  const ts = o.signedAt ?? o.createdAt ?? new Date().toISOString();
  const start = new Date(ts).getTime();
  return Math.round((Date.now() - start) / 60000);
}

export default function RadiologyClient() {
  const [studies, setStudies] = useState<Order[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const rows = await api<Order[]>("/api/orders?type=Imaging&take=50").catch(() => [] as Order[]);
    setStudies(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function read(id: number) {
    setBusy(id);
    try {
      await api(`/api/orders/${id}/complete`, { method: "POST" });
      await refresh();
    } finally { setBusy(null); }
  }

  const pending = studies.filter(s => s.status === "signed" || s.status === "verified");
  const stat    = studies.filter(s => s.priority === "Stat");
  const reading = studies.filter(s => s.status !== "completed").length;
  const meanTat = pending.length ? Math.round(pending.reduce((s, x) => s + tatMins(x), 0) / pending.length) : 38;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Radiology · worklist</span>
          <h1 className="h1">Radiology</h1>
          <div className="meta">{studies.length} studies · {stat.length} STAT · {reading} awaiting read · TAT median {meanTat} min</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Accession, MRN, modality" />
          </div>
          <Link href="/cpoe" className="btn primary">+ Order imaging <span className="arrow">→</span></Link>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Studies</div><div className="num">{studies.length}</div><div className="delta">live worklist</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>STAT</div><div className="num">{stat.length}</div><div className="delta">in queue</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Awaiting read</div><div className="num">{reading}</div><div className="delta">target ≤ 60 min</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>TAT median</div><div className="num">{meanTat}<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>m</span></div><div className="delta">target ≤ 60 m</div></div>
      </div>

      <table className="table">
        <thead><tr><th>Accession</th><th>Study</th><th>Indication</th><th>Ordered by</th><th>TAT</th><th>Status</th><th /></tr></thead>
        <tbody>
          {studies.map(s => {
            const cls = s.status === "completed" ? "good" : s.priority === "Stat" ? "bad" : "warn";
            const lbl = s.status === "completed" ? "Final" : s.priority === "Stat" ? "STAT" : "Awaiting read";
            return (
              <tr key={s.id}>
                <td><b style={{ fontFamily: "JetBrains Mono, monospace" }}>A{4400 + s.id}</b></td>
                <td><b>{s.name}</b></td>
                <td className="muted">{s.indication}</td>
                <td className="muted">{s.orderedByName}</td>
                <td className="muted" style={{ fontFamily: "JetBrains Mono, monospace" }}>{tatMins(s)}m</td>
                <td><span className={`pill ${cls}`}><span className="pdot" />{lbl}</span></td>
                <td>
                  {s.status === "completed"
                    ? <Link href="/imaging" className="btn">Open →</Link>
                    : <button className="btn" onClick={() => read(s.id)} disabled={busy === s.id}>{busy === s.id ? "Reading…" : "Read"}</button>}
                </td>
              </tr>
            );
          })}
          {studies.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 20 }}>No imaging studies in queue.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
