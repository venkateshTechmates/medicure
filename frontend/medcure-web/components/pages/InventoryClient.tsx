"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtMoney } from "@/lib/fmt";
import type { InventoryItem } from "@/lib/types";

export default function InventoryClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  useEffect(() => { api<InventoryItem[]>("/api/inventory").then(setItems).catch(() => {}); }, []);

  const lowStock = items.filter(i => i.onHand < i.parLevel).length;
  const expiringSoon = items.filter(i => i.expiresAt && new Date(i.expiresAt).getTime() - Date.now() < 60 * 86400000).length;
  const totalValue = items.reduce((s, i) => s + i.onHand * Number(i.unitCost), 0);

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Stock · Pharmacy & supply</div>
          <h1 className="h1">Inventory</h1>
          <div className="meta">{items.length} SKUs tracked · {lowStock} below par · {expiringSoon} expiring &lt; 60 d</div>
        </div>
        <div className="toolbar">
          <button className="btn">Auto-replenish</button>
          <button className="btn primary">New PO <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si">●</span>SKUs</div><div className="num">{items.length}</div><div className="delta">tracked</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Low stock</div><div className="num">{lowStock}</div><div className="delta">below par level</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Expiring</div><div className="num">{expiringSoon}</div><div className="delta">within 60 days</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Inventory value</div><div className="num">{fmtMoney(totalValue)}</div><div className="delta">at cost</div></div>
      </div>

      <table className="table">
        <thead><tr><th>Item</th><th>NDC / SKU</th><th>On hand</th><th>Par</th><th>Location</th><th>Lot · Expires</th><th>Unit cost</th></tr></thead>
        <tbody>
          {items.map(i => {
            const ratio = i.parLevel ? i.onHand / i.parLevel : 1;
            const kind: "good" | "warn" | "bad" = ratio < 0.4 ? "bad" : ratio < 1 ? "warn" : "good";
            return (
              <tr key={i.id}>
                <td><b>{i.name}</b><br /><span className="muted" style={{ fontSize: 11 }}>{i.category}</span></td>
                <td className="muted" style={{ fontSize: 11 }}>{i.ndc}<br />{i.sku}</td>
                <td><span className={`pill ${kind}`}><span className="pdot" />{i.onHand}</span></td>
                <td>{i.parLevel}</td>
                <td className="muted">{i.location}</td>
                <td className="muted" style={{ fontSize: 11 }}>{i.lotNumber} · {i.expiresAt ? fmtDate(i.expiresAt) : "—"}</td>
                <td>{fmtMoney(Number(i.unitCost))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
