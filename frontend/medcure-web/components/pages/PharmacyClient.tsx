"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { InventoryItem, Order } from "@/lib/types";

interface DemoRx { pic: string; name: string; mrn: string; med: string; dose: string; doc: string; ago: string; tm: string; pillCls: string; pillTxt: string; btnTxt: string; btnWarn?: boolean; }
const DEMO_RX: DemoRx[] = [
  { pic: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces", name: "Albert Smith",     mrn: "MRN 4421-08", med: "Amoxicillin 500mg",  dose: "3× daily · 7 days", doc: "Dr. Achebe", ago: "2 min ago", tm: "10:04 AM", pillCls: "warn", pillTxt: "Med",  btnTxt: "Verify" },
  { pic: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=faces", name: "Priya Iyer",       mrn: "MRN 7710-22", med: "Warfarin 5mg",        dose: "⚠ INR check",       doc: "Dr. Park",   ago: "5 min",     tm: "10:01 AM", pillCls: "bad",  pillTxt: "High", btnTxt: "Review", btnWarn: true },
  { pic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces", name: "Tomás Bauer",      mrn: "MRN 9988-15", med: "Metformin 1000mg",    dose: "2× daily",          doc: "Dr. Tanaka", ago: "9 min",     tm: "9:57 AM",  pillCls: "",     pillTxt: "Std",  btnTxt: "Verify" },
  { pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces", name: "Kayode Adeyemi",   mrn: "MRN 3320-04", med: "Lisinopril 10mg",     dose: "Once daily",        doc: "Dr. Achebe", ago: "12 min",    tm: "9:54 AM",  pillCls: "",     pillTxt: "Std",  btnTxt: "Verify" },
  { pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces", name: "Marisol Reyes",    mrn: "MRN 6633-91", med: "Oxycodone 5mg",       dose: "⚠ Schedule II · PMP", doc: "Dr. Park", ago: "15 min",    tm: "9:51 AM",  pillCls: "bad",  pillTxt: "Ctrl", btnTxt: "PMP", btnWarn: true },
  { pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces", name: "Lin Chen",         mrn: "MRN 1102-77", med: "Levothyroxine 75mcg", dose: "Once daily",        doc: "Dr. Tanaka", ago: "22 min",    tm: "9:44 AM",  pillCls: "",     pillTxt: "Std",  btnTxt: "Verify" },
  { pic: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=120&h=120&fit=crop&crop=faces", name: "Naomi Whitfield",  mrn: "MRN 8801-44", med: "Atorvastatin 40mg",   dose: "QHS",               doc: "Dr. Park",   ago: "28 min",    tm: "9:38 AM",  pillCls: "",     pillTxt: "Std",  btnTxt: "Verify" },
];

const STOCK_DEMO = [
  { nm: "Epinephrine 1mg",  pct: 8,  detail: "4",   color: "#ff4d6b" },
  { nm: "Heparin 5,000U",   pct: 18, detail: "12",  color: "#ff4d6b" },
  { nm: "Insulin glargine", pct: 34, detail: "22",  color: "#ffb84d" },
  { nm: "Albuterol HFA",    pct: 42, detail: "31",  color: "#ffb84d" },
  { nm: "Cefazolin 1g",     pct: 58, detail: "88",  color: "#27c26b" },
  { nm: "Acetaminophen",    pct: 71, detail: "612", color: "#27c26b" },
];

const TOP_MEDS = [
  { ic: "Lp", nm: "Lisinopril 10mg",   sub: "ACE inhibitor · oral",  v: "218", delta: "+9%",  pos: true },
  { ic: "Mt", nm: "Metformin 1000mg",  sub: "Antidiabetic · oral",   v: "196", delta: "+4%",  pos: true },
  { ic: "At", nm: "Atorvastatin 40mg", sub: "Statin · oral",         v: "174", delta: "−1%",  pos: false },
  { ic: "Am", nm: "Amoxicillin 500mg", sub: "Antibiotic · oral",     v: "144", delta: "+11%", pos: true },
  { ic: "Lv", nm: "Levothyroxine 75",  sub: "Thyroid · oral",        v: "132", delta: "+2%",  pos: true },
];

export default function PharmacyClient() {
  const [queue, setQueue] = useState<Order[]>([]);
  const [inv, setInv] = useState<InventoryItem[]>([]);

  useEffect(() => {
    api<Order[]>("/api/pharmacy/queue").then(setQueue).catch(() => {});
    api<InventoryItem[]>("/api/pharmacy/inventory").then(setInv).catch(() => {});
  }, []);

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Pharmacy</h1>
          <div className="meta">{queue.length || 12} prescriptions awaiting verification · 4 drug-interaction alerts</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search Rx, drug or NDC..." />
          </div>
          <button className="btn primary">+ New Rx <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">Rx</span>Filled today</div><div className="num">142</div><div className="delta"><b className="up">+12%</b> vs yesterday</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">⏱</span>In queue</div><div className="num">{queue.length || 12}</div><div className="delta"><b className="dn">+3</b> last hour</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">⚠</span>Interactions</div><div className="num">4</div><div className="delta">2 critical · 2 moderate</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">💬</span>Counsel pending</div><div className="num">7</div><div className="delta">Avg 4 min wait</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, alignItems: "start" }}>
        <div>
          <div className="card rx-queue">
            <div className="qh">
              <div style={{ fontWeight: 700 }}>Verification Queue</div>
              <div className="q-tabs">
                <button className="t active">New (12)</button>
                <button className="t">In progress (5)</button>
                <button className="t">Ready (28)</button>
                <button className="t">All</button>
              </div>
            </div>
            <div className="rx-th">
              <div /><div>Patient</div><div>Drug</div><div>Doctor</div><div>Submitted</div><div>Priority</div><div />
            </div>
            {DEMO_RX.map((r, i) => (
              <div className="rx-row" key={i}>
                <div className="pic" style={{ backgroundImage: `url(${r.pic})` }} />
                <div><div className="nm">{r.name}</div><div className="sub">{r.mrn}</div></div>
                <div><div className="med">{r.med}</div><div className="dose">{r.dose}</div></div>
                <div className="doc">{r.doc}</div>
                <div><div className="doc">{r.ago}</div><div className="dose">{r.tm}</div></div>
                <span className={`pill ${r.pillCls}`}><span className="pdot" />{r.pillTxt}</span>
                <Link href="/pharmacy/verify/1"><button className={r.btnWarn ? "warn-btn" : ""}>{r.btnTxt}</button></Link>
              </div>
            ))}
          </div>

          <div className="card interaction" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>Active Interaction Alerts</div>
              <span className="pill bad"><span className="pdot" />4 active</span>
            </div>
            <div className="ix-row bad">
              <div className="l"><b>Warfarin + Bactrim — Priya Iyer</b>Major bleeding risk. Consider alternative or reduce warfarin 25%; recheck INR in 48h.</div>
              <span className="sev">CRITICAL</span>
            </div>
            <div className="ix-row bad">
              <div className="l"><b>Tramadol + Sertraline — A. Drobo Jr.</b>Serotonin syndrome risk. Avoid combination.</div>
              <span className="sev">CRITICAL</span>
            </div>
            <div className="ix-row">
              <div className="l"><b>Metformin + Contrast — T. Bauer</b>Hold metformin 48h after contrast study.</div>
              <span className="sev mod">MODERATE</span>
            </div>
            <div className="ix-row">
              <div className="l"><b>Lisinopril + KCl — K. Adeyemi</b>Monitor potassium; risk of hyperkalemia.</div>
              <span className="sev mod">MODERATE</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card stock-mini">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Inventory low</div>
              <Link href="/inventory" style={{ fontSize: 11, color: "var(--ink-mute)" }}>View all →</Link>
            </div>
            {(inv.length ? inv.filter(i => i.onHand < i.parLevel).slice(0, 6).map(i => {
              const pct = Math.round((i.onHand / Math.max(1, i.parLevel)) * 100);
              const color = pct < 20 ? "#ff4d6b" : pct < 50 ? "#ffb84d" : "#27c26b";
              return { nm: i.name, pct, detail: String(i.onHand), color };
            }) : STOCK_DEMO).map((s, idx) => (
              <div className="stock-row" key={idx}>
                <div className="nm">{s.nm}</div>
                <div className="stock-bar"><div className="fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
                <div className="pct">{s.pct}% · {s.detail}</div>
              </div>
            ))}
          </div>

          <div className="card top-meds">
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Top dispensed · this week</div>
            {TOP_MEDS.map((m, i) => (
              <div className="tm-row" key={i}>
                <div className="l">
                  <div className="ic">{m.ic}</div>
                  <div><div className="nm">{m.nm}</div><div className="sub">{m.sub}</div></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{m.v}</div>
                  <div className="sub" style={{ color: m.pos ? "var(--good)" : "var(--ink-mute)" }}>{m.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cs-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700 }}>Controlled substances</div>
              <span className="pill" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
                <span className="pdot" style={{ background: "#ff4d6b" }} />Audit due
              </span>
            </div>
            <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 36, letterSpacing: "-0.02em", lineHeight: 1 }}>
              14<span style={{ fontSize: 14, fontFamily: "Plus Jakarta Sans", color: "#9aa0ad", fontWeight: 600 }}> Sch II</span>
            </div>
            <div style={{ fontSize: 12, color: "#9aa0ad", marginTop: 6 }}>Last reconciliation 03:14 PM · A. Drobo</div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="btn" style={{ background: "#fff", color: "#0e1116", flex: 1, justifyContent: "center" }}>Witness count</button>
              <button className="btn" style={{ background: "rgba(255,255,255,.12)", color: "#fff", flex: 1, justifyContent: "center" }}>PMP query</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
