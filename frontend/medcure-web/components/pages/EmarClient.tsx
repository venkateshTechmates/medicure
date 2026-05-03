"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

type CellState = "" | "given" | "late" | "held" | "refused" | "scheduled" | "due" | "now-cell" | "prn";
interface MedRow { name: string; sub: string; cells: { state: CellState; label?: string }[]; }

const HOURS: { label: string; cls?: string }[] = [
  { label: "12a" }, { label: "1" }, { label: "2" }, { label: "3" },
  { label: "4" },   { label: "5" }, { label: "6" }, { label: "7" },
  { label: "8" },   { label: "9" }, { label: "10" }, { label: "11" },
  { label: "12p" }, { label: "1•now", cls: "now" }, { label: "2" }, { label: "3" },
  { label: "4" },   { label: "5" }, { label: "6" }, { label: "7" },
  { label: "8" },   { label: "9" }, { label: "10" }, { label: "11" },
];

function blank(): { state: CellState; label?: string }[] { return Array.from({ length: 24 }, () => ({ state: "" as CellState })); }
function set(cells: { state: CellState; label?: string }[], h: number, state: CellState, label?: string) { cells[h] = { state, label }; return cells; }

const ROWS: MedRow[] = [
  (() => {
    const c = blank();
    set(c, 4, "given", "04:00");
    set(c, 8, "given", "08:02");
    set(c, 12, "given", "12:00");
    set(c, 13, "now-cell", "●");
    set(c, 16, "scheduled", "16:00");
    set(c, 20, "scheduled", "20:00");
    return { name: "Albuterol HFA 90 mcg", sub: "2 puffs · q4h scheduled · INH", cells: c };
  })(),
  (() => {
    const c = blank();
    set(c, 0, "given", "00:14");
    set(c, 6, "late", "06:42");
    set(c, 12, "given", "12:00");
    set(c, 18, "scheduled", "18:00");
    return { name: "Methylprednisolone IV 40 mg", sub: "q6h · IV · over 30 min", cells: c };
  })(),
  (() => {
    const c = blank();
    set(c, 8, "given", "08:14");
    set(c, 20, "scheduled", "20:00");
    return { name: "Fluticasone 50 mcg nasal", sub: "2 sprays each nostril · BID", cells: c };
  })(),
  (() => {
    const c = blank();
    set(c, 8, "given", "08:18");
    return { name: "Cetirizine 5 mg", sub: "PO daily AM", cells: c };
  })(),
  (() => {
    const c: { state: CellState; label?: string }[] = HOURS.map(() => ({ state: "prn" as CellState, label: "P" }));
    set(c, 8, "given", "07:48");
    return { name: "Acetaminophen 325 mg", sub: "q6h PRN · fever or pain · max 4/24h", cells: c };
  })(),
  (() => {
    const c: { state: CellState; label?: string }[] = HOURS.map(() => ({ state: "prn" as CellState, label: "P" }));
    set(c, 5, "refused", "refused");
    return { name: "Ondansetron 2 mg IV", sub: "q8h PRN · nausea", cells: c };
  })(),
  (() => {
    const c = blank();
    set(c, 2, "given", "02:00");
    set(c, 8, "held", "held");
    set(c, 16, "given", "16:08");
    set(c, 22, "scheduled", "22:00");
    return { name: "Heparin SC 5000 U", sub: "q8h · DVT ppx · SC", cells: c };
  })(),
];

export default function EmarClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const rows = await api<Order[]>("/api/orders?type=Medication&status=verified").catch(() => [] as Order[]);
    setOrders(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function giveDose() {
    if (!orders.length) { setMsg("No verified orders ready to administer"); return; }
    setBusy(true); setMsg(null);
    try {
      const next = orders[0];
      await api(`/api/orders/${next.id}/administer`, { method: "POST" });
      setMsg(`✓ ${next.name} given · scan verified`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Administration failed");
    } finally { setBusy(false); setTimeout(() => setMsg(null), 4000); }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">eMAR</h1>
          <div className="meta">Electronic Medication Administration Record · last 24 hrs · {orders.length} live orders</div>
        </div>
        <div className="toolbar">
          <button className="btn">+ PRN dose</button>
          <button className="btn">Hold</button>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn dark" onClick={giveDose} disabled={busy}>📷 {busy ? "Giving…" : "Scan to administer"}</button>
        </div>
      </div>

      <div className="emar-ctx">
        <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces)" }} />
        <div>
          <div className="nm">Albert Smith · MRN 4421-08</div>
          <div className="meta">
            <span><b>Wt</b> 31 kg</span>
            <span><b>Ward</b> Peds-2 · Bed 14</span>
            <span><b>Allergies</b> Penicillin, Peanuts</span>
            <span><b>Primary RN</b> Brooks</span>
            <span><b>Code</b> Full</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span className="pill bad"><span className="pdot" />PCN</span>
          <span className="pill warn"><span className="pdot" />Asthma</span>
        </div>
      </div>

      <div className="emar-controls">
        <div className="seg">
          <button className="o">Last 8h</button>
          <button className="o active">Last 24h</button>
          <button className="o">7d</button>
          <button className="o">All</button>
        </div>
        <div className="emar-legend">
          <span><i style={{ background: "#27c26b" }} />Given</span>
          <span><i style={{ background: "#ffb84d" }} />Late</span>
          <span><i style={{ background: "#ffe26b" }} />Due now</span>
          <span><i style={{ background: "#e6efff" }} />Scheduled</span>
          <span><i style={{ background: "#9aa0ad" }} />Held</span>
          <span><i style={{ background: "#ff4d6b" }} />Refused</span>
          <span><i style={{ border: "1px dashed var(--line)", background: "transparent" }} />PRN</span>
        </div>
      </div>

      <div className="emar-table">
        <div className="emar-grid">
          <div />
          {HOURS.map((h, i) => (
            <div key={i} className={`h-head ${h.cls ?? ""}`}>{h.label}</div>
          ))}
          {ROWS.map((r, ri) => (
            <RowCells key={ri} row={r} />
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start", marginTop: 14 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Administration log · today</div>
            <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>12 doses given · 1 late · 1 held · 1 refused</span>
          </div>
          <div className="log-card">
            <div><b>13:00</b> · <span style={{ color: "#a05a00" }}>DUE</span> · Albuterol HFA 90 mcg · 2 puffs INH</div>
            <div><b>12:00</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Methylpred 40 mg IV · over 30 min · <span className="muted">Brooks RN · scan ✓</span></div>
            <div><b>12:00</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Albuterol HFA 90 mcg · 2 puffs INH · <span className="muted">Brooks RN · scan ✓</span></div>
            <div><b>08:18</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Cetirizine 5 mg PO · <span className="muted">Brooks RN</span></div>
            <div><b>08:14</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Fluticasone 2 sprays each nostril · <span className="muted">Brooks RN</span></div>
            <div><b>08:02</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Albuterol HFA 90 mcg · 2 puffs INH · <span className="muted">Brooks RN · scan ✓</span></div>
            <div><b>07:48</b> · <span style={{ color: "var(--good)" }}>GIVEN PRN</span> · Acetaminophen 325 mg PO · indication: fever 38.4 · <span className="muted">Brooks RN</span></div>
            <div><b>06:42</b> · <span style={{ color: "#a05a00" }}>LATE 42m</span> · Methylpred 40 mg IV · cause: IV access lost, restarted · <span className="muted">Brooks RN</span></div>
            <div><b>05:30</b> · <span style={{ color: "#5b6272" }}>REFUSED</span> · Ondansetron 2 mg IV · pt declined, no nausea · <span className="muted">Foster RN</span></div>
            <div><b>04:00</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Albuterol HFA 90 mcg · 2 puffs INH · <span className="muted">Foster RN · scan ✓</span></div>
            <div><b>02:00</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Heparin SC 5000 U · L flank · <span className="muted">Foster RN</span></div>
            <div><b>00:14</b> · <span style={{ color: "var(--good)" }}>GIVEN</span> · Methylpred 40 mg IV · <span className="muted">Foster RN · scan ✓</span></div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Due now &amp; soon</div>
            <div className="due-card">
              <div className="nm-d">⏰ Albuterol HFA · DUE NOW</div>
              <div className="sub-d">2 puffs INH · scheduled 13:00 · 2 min ago</div>
              <div className="cta">
                <button className="btn primary" style={{ fontSize: 11, padding: "6px 10px" }} onClick={giveDose} disabled={busy}>{busy ? "Giving…" : "Scan & give"}</button>
                <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Hold</button>
              </div>
            </div>
            <div className="due-card" style={{ background: "#fff", borderColor: "var(--line)" }}>
              <div className="nm-d" style={{ color: "var(--ink)" }}>⏱ Methylpred 40 mg IV</div>
              <div className="sub-d" style={{ color: "var(--ink-mute)" }}>scheduled 18:00 · in 4h 58m</div>
            </div>
            <div className="due-card" style={{ background: "#fff", borderColor: "var(--line)" }}>
              <div className="nm-d" style={{ color: "var(--ink)" }}>⏱ Fluticasone</div>
              <div className="sub-d" style={{ color: "var(--ink-mute)" }}>scheduled 20:00 · in 6h 58m</div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, background: "#0e1116", color: "#fff", textAlign: "center" }}>
            <div style={{ fontWeight: 700 }}>Scan medication</div>
            <div style={{ fontFamily: "monospace", fontSize: 36, letterSpacing: 4, color: "#ffd633", margin: "12px 0" }}>‖|‖|‖|‖|‖</div>
            <div style={{ fontSize: 11, color: "#9aa0ad" }}>Hold barcode under reader</div>
          </div>
        </div>
      </div>
    </>
  );
}

function RowCells({ row }: { row: MedRow }) {
  return (
    <>
      <div className="med-cell">
        <div className="nm">{row.name}</div>
        <div className="sub">{row.sub}</div>
      </div>
      {row.cells.map((c, i) => (
        <div key={i} className={`dose-cell ${c.state}`}>{c.label ?? ""}</div>
      ))}
    </>
  );
}
