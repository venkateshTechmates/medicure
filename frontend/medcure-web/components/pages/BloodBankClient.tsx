"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InventoryItem } from "@/lib/types";

const REQUESTS = [
  { pat: "Maria Hernandez", mrn: "08401", typ: "1u PRBC",     ind: "Active GIB · Hgb 6.4",  sp: "T&S done",       cls: "warn" },
  { pat: "James Liu",       mrn: "08410", typ: "2u PRBC",     ind: "Cardiac · Hgb 7.2",     sp: "Cross-matched",   cls: "good" },
  { pat: "Robert Kim",      mrn: "08305", typ: "1u Platelets", ind: "Plt 18 · pre-procedure", sp: "Issued",         cls: "good" },
  { pat: "Sarah Johnson",   mrn: "08440", typ: "1u FFP",      ind: "INR 4.2 · pre-op",       sp: "Awaiting consent", cls: "warn" },
];

export default function BloodBankClient() {
  const [inv, setInv] = useState<InventoryItem[]>([]);

  useEffect(() => {
    api<InventoryItem[]>("/api/inventory?take=200")
      .then(rows => setInv(rows.filter(i => /blood|prbc|platelet|ffp|plasma|cryo|O-pos|O-neg|A-pos|B-pos|AB-/i.test(i.name) || i.category === "Blood")))
      .catch(() => setInv([]));
  }, []);

  const find = (re: RegExp) => inv.find(i => re.test(i.name));

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Lab · Blood bank</span>
          <h1 className="h1">Blood bank</h1>
          <div className="meta">{REQUESTS.length} active requests · {inv.length} blood products tracked · stock-on-hand from inventory</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print refrigerator log</button>
          <button className="btn primary">+ New request <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>O-neg</div><div className="num">{find(/O-neg|O neg/i)?.onHand ?? 14}</div><div className="delta">target 12+</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>O-pos</div><div className="num">{find(/O-pos|O pos/i)?.onHand ?? 28}</div><div className="delta">stock</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Platelets</div><div className="num">{find(/platelet/i)?.onHand ?? 8}</div><div className="delta">unit-day</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>FFP</div><div className="num">{find(/FFP|plasma/i)?.onHand ?? 22}</div><div className="delta">stock</div></div>
      </div>

      <div className="card panel">
        <h2>Active requests</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead><tr><th>Patient</th><th>Product</th><th>Indication</th><th>Status</th><th /></tr></thead>
          <tbody>
            {REQUESTS.map((r, i) => (
              <tr key={i}>
                <td><b>{r.pat}</b><br /><span className="muted" style={{ fontSize: 11 }}>{r.mrn}</span></td>
                <td><b>{r.typ}</b></td>
                <td>{r.ind}</td>
                <td><span className={`pill ${r.cls}`}><span className="pdot" />{r.sp}</span></td>
                <td><button className="btn primary" style={{ fontSize: 11, padding: "6px 10px" }}>Issue →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ marginTop: 14 }}>
        <h2>Today's transfusions</h2>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="info-block">
            <h4>Transfusion log</h4>
            {[
              ["12:14", "Maria H. · 1u PRBC", "Brooks RN"],
              ["10:02", "Robert K. · 1u Platelets", "Foster RN"],
              ["08:45", "James L. · 1u PRBC", "Brooks RN"],
              ["06:30", "Sarah J. · 1u FFP", "Foster RN"],
            ].map(([t, e, by]) => (
              <div key={t} style={{ fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                <b>{t}</b> · {e} <span className="muted">· {by}</span>
              </div>
            ))}
          </div>
          <div className="info-block">
            <h4>Reaction monitoring</h4>
            <div style={{ fontSize: 12, padding: "6px 0" }}>● 0 acute reactions today</div>
            <div style={{ fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line)" }}>● Vital sign protocol q15 min × 1h</div>
            <div style={{ fontSize: 12, padding: "6px 0", borderTop: "1px solid var(--line)" }}>● 2 nurses sign at issue + bedside</div>
          </div>
        </div>
      </div>
    </>
  );
}
