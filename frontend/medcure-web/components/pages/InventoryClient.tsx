"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtMoney } from "@/lib/fmt";
import type { InventoryItem } from "@/lib/types";

const OPEN_POS = [
  { id: "PO-44218", vendor: "McKesson",     items: "Heparin, Epi, Cefazolin",   amount: 8442,  eta: "ETA tomorrow", etaGood: true },
  { id: "PO-44217", vendor: "Cardinal",     items: "PPE, gloves, gowns",         amount: 3180,  eta: "ETA Mon",      etaGood: false },
  { id: "PO-44215", vendor: "BD",           items: "Insulin syringes, lancets",  amount: 1924,  eta: "ETA Wed",      etaGood: false },
  { id: "PO-44210", vendor: "Henry Schein", items: "Lab reagents",               amount: 642,   eta: "Delivered",    etaGood: true },
];

const EXPIRING = [
  { days: 3,  label: "Vancomycin 1g · Lot V0440",    sub: "22 vials · $1,420",  urgent: true },
  { days: 8,  label: "Propofol 200mg · Lot P9911",   sub: "14 vials · $682",    urgent: true },
  { days: 14, label: "Heparin · Lot H8744",          sub: "38 vials · $1,892",  urgent: false },
  { days: 21, label: "Tetanus toxoid · Lot T2104",   sub: "52 doses · $2,184",  urgent: false },
  { days: 28, label: "Influenza vax · Lot F5520",    sub: "68 doses · $2,210",  urgent: false },
];

type Tab = "all" | "low" | "expiring" | "transit";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}

export default function InventoryClient() {
  const [items, setItems]   = useState<InventoryItem[]>([]);
  const [cat, setCat]       = useState<string>("All items");
  const [loc, setLoc]       = useState<string | null>(null);
  const [tab, setTab]       = useState<Tab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api<InventoryItem[]>("/api/inventory?take=200").then(setItems).catch(() => {});
  }, []);

  const lowStock    = items.filter(i => i.onHand < i.parLevel);
  const expiringSoon = items.filter(i => i.expiresAt && new Date(i.expiresAt).getTime() - Date.now() < 30 * 86400000);
  const totalValue  = items.reduce((s, i) => s + i.onHand * Number(i.unitCost), 0);

  // Build category counts
  const catCounts: Record<string, number> = { "All items": items.length };
  items.forEach(i => { catCounts[i.category] = (catCounts[i.category] ?? 0) + 1; });
  const categories = ["All items", ...Object.keys(catCounts).filter(k => k !== "All items")];

  const locCounts: Record<string, number> = {};
  items.forEach(i => { locCounts[i.location] = (locCounts[i.location] ?? 0) + 1; });
  const locations = Object.keys(locCounts);

  // Filter
  let visible = items;
  if (cat !== "All items") visible = visible.filter(i => i.category === cat);
  if (loc) visible = visible.filter(i => i.location === loc);
  if (search) visible = visible.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.ndc.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));
  if (tab === "low")      visible = visible.filter(i => i.onHand < i.parLevel);
  if (tab === "expiring") visible = visible.filter(i => i.expiresAt && new Date(i.expiresAt).getTime() - Date.now() < 30 * 86400000);

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Stock · Pharmacy &amp; supply</div>
          <h1 className="h1">Inventory</h1>
          <div className="meta">{items.length} SKUs tracked · {lowStock.length} below par · {expiringSoon.length} expiring &lt; 30 d</div>
        </div>
        <div className="toolbar">
          <button className="btn">Auto-replenish</button>
          <button className="btn primary">New PO <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">📦</span>Total SKUs</div><div className="num">{items.length}</div><div className="delta">tracked</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">⚠</span>Below par</div><div className="num">{lowStock.length}</div><div className="delta">below par level</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">⏰</span>Expiring 30d</div><div className="num">{expiringSoon.length}</div><div className="delta">within 30 days</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">$</span>Inventory value</div><div className="num">{fmtMoney(totalValue)}</div><div className="delta">at cost</div></div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 320px", gap: 18, alignItems: "start" }}>

        {/* Left: Categories + Locations */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Categories</div>
          {categories.map(c => (
            <div
              key={c}
              onClick={() => { setCat(c); setLoc(null); }}
              style={{
                display: "flex", justifyContent: "space-between", padding: "10px 12px",
                borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: cat === c && !loc ? "#0e1116" : undefined,
                color: cat === c && !loc ? "#fff" : "var(--ink-soft)",
              }}
            >
              <span>{c}</span>
              <span style={{ fontSize: 11, color: cat === c && !loc ? "#9aa0ad" : "var(--ink-mute)" }}>{catCounts[c] ?? 0}</span>
            </div>
          ))}

          <div style={{ fontWeight: 700, margin: "18px 0 8px", fontSize: 13 }}>Locations</div>
          {locations.map(l => (
            <div
              key={l}
              onClick={() => { setLoc(loc === l ? null : l); setCat("All items"); }}
              style={{
                display: "flex", justifyContent: "space-between", padding: "10px 12px",
                borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: loc === l ? "#0e1116" : undefined,
                color: loc === l ? "#fff" : "var(--ink-soft)",
              }}
            >
              <span>{l}</span>
              <span style={{ fontSize: 11, color: loc === l ? "#9aa0ad" : "var(--ink-mute)" }}>{locCounts[l]}</span>
            </div>
          ))}
        </div>

        {/* Center: Items table */}
        <div>
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontWeight: 700 }}>{cat === "All items" && !loc ? "All Items" : cat !== "All items" ? cat : loc}</div>
                <div className="searchbox" style={{ fontSize: 12 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                  <input placeholder="Search item, NDC, SKU…" value={search} onChange={e => setSearch(e.target.value)} style={{ fontSize: 12 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, background: "#f4f6f9", borderRadius: 999, padding: 4 }}>
                {(["all", "low", "expiring", "transit"] as Tab[]).map((t, idx) => {
                  const labels = ["All", `Below par (${lowStock.length})`, `Expiring (${expiringSoon.length})`, "In transit"];
                  return (
                    <button key={t} onClick={() => setTab(t)} style={{
                      padding: "6px 12px", borderRadius: 999, border: 0, cursor: "pointer", fontSize: 11, fontWeight: 600,
                      background: tab === t ? "#fff" : "transparent",
                      color: tab === t ? "var(--ink)" : "var(--ink-soft)",
                      boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,.06)" : "none",
                    }}>{labels[idx]}</button>
                  );
                })}
              </div>
            </div>

            {/* Column headers */}
            <div style={{ padding: "10px 20px 6px", display: "grid", gridTemplateColumns: "36px 1.5fr 0.9fr 0.9fr 0.8fr 1fr 90px", gap: 12, fontSize: 10, color: "var(--ink-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div /><div>Item</div><div>On hand</div><div>Par level</div><div>Location</div><div>Stock</div><div />
            </div>

            {/* Item rows */}
            {visible.map(i => {
              const ratio = i.parLevel ? i.onHand / i.parLevel : 1;
              const pct   = Math.min(Math.round(ratio * 100), 100);
              const barColor = ratio < 0.4 ? "#ff4d6b" : ratio < 1 ? "#ffb84d" : "#27c26b";
              const pctColor = ratio < 0.4 ? "var(--bad)" : ratio < 1 ? "#a05a00" : "var(--good)";
              const needsPO  = ratio < 0.4;
              const unit = i.category?.toLowerCase().includes("fluid") ? "bags" : i.category?.toLowerCase().includes("ppe") ? "boxes" : "units";

              return (
                <div key={i.id} style={{ display: "grid", gridTemplateColumns: "36px 1.5fr 0.9fr 0.9fr 0.8fr 1fr 90px", gap: 12, padding: "14px 20px", borderTop: "1px solid var(--line)", alignItems: "center", fontSize: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f4f6f9", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 12, color: "var(--ink-soft)" }}>{initials(i.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{i.ndc || i.sku} · Lot {i.lotNumber}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, letterSpacing: "-0.01em" }}>{i.onHand}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{unit}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>Par {i.parLevel}</div>
                    <div style={{ fontSize: 11, color: pctColor }}>{pct}%</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{i.location}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#f4f6f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: barColor }} />
                    </div>
                  </div>
                  <button style={{ padding: "8px 12px", borderRadius: 999, border: 0, background: needsPO ? "var(--accent)" : "#0e1116", color: needsPO ? "var(--ink)" : "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 11, cursor: "pointer", width: "100%" }}>
                    {needsPO ? "PO" : "Order"}
                  </button>
                </div>
              );
            })}
            {visible.length === 0 && (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>No items match the current filter.</div>
            )}
          </div>
        </div>

        {/* Right: POs + Expiring + Auto-replenish */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Open POs */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Open POs</div>
              <span className="pill info"><span className="pdot" />3 in transit</span>
            </div>
            {OPEN_POS.map(po => (
              <div key={po.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{po.id} · {po.vendor}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{po.items}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtMoney(po.amount)}</div>
                  <div style={{ fontSize: 11, color: po.etaGood ? "var(--good)" : "var(--ink-mute)" }}>{po.eta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Expiring soon */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Expiring soon</div>
              <span className="pill warn"><span className="pdot" />$8.4K at risk</span>
            </div>
            {EXPIRING.map(ex => (
              <div key={ex.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: ex.urgent ? "#ffe7eb" : "#fff3df", color: ex.urgent ? "#b3263d" : "#a05a00", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{ex.days}d</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{ex.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{ex.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Auto-replenish */}
          <div className="card" style={{ padding: 18, background: "#0e1116", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Auto-replenish</div>
              <span className="pill" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}><span className="pdot" style={{ background: "#27c26b" }} />On</span>
            </div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {lowStock.length}<span style={{ fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#9aa0ad", fontWeight: 600 }}> SKUs</span>
            </div>
            <div style={{ fontSize: 12, color: "#9aa0ad", marginTop: 6 }}>Last reorder run · 6:00 AM today</div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "9px 14px", borderRadius: 999, border: 0, background: "#fff", color: "#0e1116", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Configure</button>
              <button style={{ flex: 1, padding: "9px 14px", borderRadius: 999, border: 0, background: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Run now</button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
