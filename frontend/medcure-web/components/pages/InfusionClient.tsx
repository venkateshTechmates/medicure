"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

export default function InfusionClient() {
  const [rows, setRows] = useState<Order[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  async function refresh() {
    const list = await api<Order[]>("/api/orders?type=Medication&take=100").catch(() => [] as Order[]);
    setRows(list.filter(o => /IV/i.test(o.route)));
  }
  useEffect(() => { refresh(); }, []);

  async function admin(id: number) {
    setBusy(id);
    try {
      await api(`/api/orders/${id}/administer`, { method: "POST" });
      await refresh();
    } finally { setBusy(null); }
  }

  const active     = rows.filter(o => o.status === "verified" || o.status === "administered");
  const scheduled  = rows.filter(o => o.status === "signed" || o.status === "draft");
  const completed  = rows.filter(o => o.status === "completed" || o.status === "administered");
  const reactions  = 0;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Specialty · Infusion suite</span>
          <h1 className="h1">Infusion</h1>
          <div className="meta">{rows.length} IV orders today · {active.length} active · {scheduled.length} scheduled · {reactions} reactions</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print schedule</button>
          <button className="btn primary">+ Schedule <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Today</div><div className="num">{rows.length}</div><div className="delta">IV orders</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Active</div><div className="num">{active.length}</div><div className="delta">running now</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Scheduled</div><div className="num">{scheduled.length}</div><div className="delta">awaiting setup</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Done</div><div className="num">{completed.length}</div><div className="delta">today</div></div>
      </div>

      <div className="card panel">
        <h2>Today&apos;s infusions</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Time</th><th>Drug</th><th>Dose</th><th>Indication</th><th>Provider</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.map(o => {
              const cls = o.status === "completed" ? "good" : o.status === "administered" ? "good" : o.status === "verified" ? "good" : o.status === "signed" ? "info" : "warn";
              const t = o.startAt ?? o.signedAt ?? o.createdAt;
              return (
                <tr key={o.id}>
                  <td><b>{t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</b></td>
                  <td><b>{o.name}</b></td>
                  <td>{o.dose}</td>
                  <td className="muted">{o.indication}</td>
                  <td className="muted">{o.orderedByName}</td>
                  <td><span className={`pill ${cls}`}><span className="pdot" />{o.status}</span></td>
                  <td>
                    {o.status === "verified" && <button className="btn" onClick={() => admin(o.id)} disabled={busy === o.id}>{busy === o.id ? "…" : "Administer"}</button>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={7} className="muted" style={{ textAlign: "center", padding: 12 }}>No IV infusions scheduled.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
