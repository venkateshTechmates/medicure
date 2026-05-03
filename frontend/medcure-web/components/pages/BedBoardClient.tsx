"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WardWithBeds } from "@/lib/types";

interface DemoBed { lbl: string; pt: string; stat?: string; los?: string; cls?: string; iso?: string; }
interface DemoFloor { name: string; meta: string; sub: string; beds: DemoBed[]; }

const DEMO_FLOORS: DemoFloor[] = [
  {
    name: "ICU · 4 East", meta: "12 beds · 11 occ · 1 avail · 1 iso · ratio 1:2",
    sub: "Charge: RN K. Lin · Attending: Dr. Mendez · Avg LOS 4.2d",
    beds: [
      { lbl: "ICU-01", pt: "Sepsis · F/79",        stat: "Dr. Mendez",   los: "LOS 2d 4h",  cls: "crit" },
      { lbl: "ICU-02", pt: "CHF · M/68",           stat: "Dr. Mendez",   los: "LOS 5d",     cls: "occ" },
      { lbl: "ICU-03", pt: "Post-op AAA · M/74",   stat: "Dr. Vega",     los: "LOS 1d",     cls: "occ" },
      { lbl: "ICU-04", pt: "ARDS · MRSA · M/52",   stat: "Dr. Mendez",   los: "LOS 8d",     cls: "iso", iso: "ISO" },
      { lbl: "ICU-05", pt: "DKA · F/41",           stat: "Dr. Park",     los: "LOS 1d 12h", cls: "occ" },
      { lbl: "ICU-06", pt: "CVA · F/65",           stat: "Neuro consult", los: "LOS 3d",    cls: "occ" },
      { lbl: "ICU-07", pt: "Resp failure · M/71",  stat: "Vent · Dr. Mendez", los: "LOS 6d", cls: "occ" },
      { lbl: "ICU-08", pt: "Pancreatitis · M/49",  stat: "Dr. Park",     los: "LOS 2d",     cls: "occ" },
      { lbl: "ICU-09", pt: "Liver fail · F/62",    stat: "GI consult",   los: "LOS 4d",     cls: "occ" },
      { lbl: "ICU-10", pt: "Trauma · M/24",        stat: "Trauma svc",   los: "LOS 18h",    cls: "occ" },
      { lbl: "ICU-11", pt: "→ Step-down",          stat: "Transfer 14:00", los: "LOS 3d",   cls: "disp" },
      { lbl: "ICU-12", pt: "Available",            stat: "Last clean 11:42", los: "Ready",  cls: "empty" },
    ],
  },
  {
    name: "CCU · 4 West", meta: "8 beds · 7 occ · 1 reserved · ratio 1:2",
    sub: "Charge: RN J. Park · Attending: Dr. Vasquez · Tele continuous",
    beds: [
      { lbl: "CCU-01", pt: "Post-PCI · M/64",     stat: "Dr. Park · STEMI",     los: "LOS 4h",  cls: "crit" },
      { lbl: "CCU-02", pt: "CHF exac · M/71",     stat: "Dr. Vasquez",          los: "LOS 2d",  cls: "occ" },
      { lbl: "CCU-03", pt: "A-fib · F/58",        stat: "Cardioversion AM",     los: "LOS 1d",  cls: "occ" },
      { lbl: "CCU-04", pt: "Reserved",             stat: "ED · STEMI inbound",   los: "Hold 14:00", cls: "held" },
      { lbl: "CCU-05", pt: "SVT · M/45",          stat: "Dr. Vasquez",          los: "LOS 18h", cls: "occ" },
      { lbl: "CCU-06", pt: "CABG day 1 · M/67",   stat: "CT surg",              los: "LOS 1d",  cls: "occ" },
      { lbl: "CCU-07", pt: "Endocarditis · F/38", stat: "ID consult",           los: "LOS 6d",  cls: "occ" },
      { lbl: "CCU-08", pt: "→ Tele step-dn",       stat: "Discharge 16:00",      los: "LOS 4d",  cls: "disp" },
    ],
  },
  {
    name: "Med-Surg · 3 South", meta: "32 beds · 28 occ · 2 avail · 1 cleaning · 1 board · ratio 1:5",
    sub: "Charge: RN T. Singh · Attending pool: 4 hospitalists",
    beds: [
      { lbl: "M-01", pt: "Pneumonia · M/72", stat: "Day 4", los: "3d 14h", cls: "occ" },
      { lbl: "M-02", pt: "UTI · F/84",        stat: "Day 2", los: "1d 8h",  cls: "occ" },
      { lbl: "M-03", pt: "C.diff · M/68",     stat: "Contact iso", los: "5d", cls: "iso", iso: "CDIFF" },
      { lbl: "M-04", pt: "CHF · F/77",        stat: "Day 3", los: "2d 22h", cls: "occ" },
      { lbl: "M-05", pt: "→ Discharge",        stat: "Awaiting transport", los: "3d", cls: "disp" },
      { lbl: "M-06", pt: "DM ulcer · F/61",   stat: "Wound care", los: "4d", cls: "occ" },
      { lbl: "M-07", pt: "Cleaning",          stat: "EVS · 12 min", los: "Ready 14:30", cls: "cleaning" },
      { lbl: "M-08", pt: "Cholecyst · F/52",  stat: "Pre-op", los: "22h", cls: "occ" },
      { lbl: "M-09", pt: "Hyponat · M/79",    stat: "Endo consult", los: "2d", cls: "occ" },
      { lbl: "M-10", pt: "Pneumo · M/65",     stat: "Day 3", los: "2d 6h", cls: "occ" },
      { lbl: "M-11", pt: "PE · F/44",          stat: "Day 2", los: "1d 14h", cls: "occ" },
      { lbl: "M-12", pt: "Available",         stat: "Ready", cls: "empty" },
      { lbl: "M-13", pt: "Cellulitis · M/55", stat: "IV abx", los: "2d", cls: "occ" },
      { lbl: "M-14", pt: "GI bleed · M/70",   stat: "GI consult", los: "1d", cls: "occ" },
      { lbl: "M-15", pt: "Influenza · M/45",  stat: "Droplet iso", los: "1d 12h", cls: "iso", iso: "FLU" },
      { lbl: "M-16", pt: "Migraine · F/33",   stat: "Obs", los: "10h", cls: "occ" },
      { lbl: "M-17", pt: "→ SNF",              stat: "Transfer 13:00", los: "7d", cls: "disp" },
      { lbl: "M-18", pt: "Sepsis · F/69",     stat: "Day 5", los: "4d", cls: "occ" },
      { lbl: "M-19", pt: "Anemia · F/82",     stat: "Tx complete", los: "1d", cls: "occ" },
      { lbl: "M-20", pt: "CKD AKI · M/74",    stat: "Nephro", los: "3d", cls: "occ" },
      { lbl: "M-21", pt: "Bac. arthritis · F/50", stat: "Ortho consult", los: "2d", cls: "occ" },
      { lbl: "M-22", pt: "Vertigo · F/68",    stat: "Day 1", los: "14h", cls: "occ" },
      { lbl: "M-23", pt: "Available",         stat: "Ready", cls: "empty" },
      { lbl: "M-24", pt: "Asthma · M/58",     stat: "Day 1", los: "10h", cls: "occ" },
      { lbl: "M-25 · BOARD", pt: "From ED",   stat: "Awaiting M-surg bed", los: "3h 18m", cls: "board" },
      { lbl: "M-26", pt: "Pancreatitis · M/52", stat: "Day 2", los: "1d 10h", cls: "occ" },
      { lbl: "M-27", pt: "SBO · F/76",         stat: "NG tube", los: "3d", cls: "occ" },
      { lbl: "M-28", pt: "PNA · M/82",         stat: "Day 4", los: "3d 8h", cls: "occ" },
      { lbl: "M-29", pt: "DM exac · M/61",    stat: "Day 1", los: "12h", cls: "occ" },
      { lbl: "M-30", pt: "UTI/AKI · F/89",    stat: "PT consult", los: "4d", cls: "occ" },
      { lbl: "M-31", pt: "Lac · M/41",         stat: "Obs post-fall", los: "8h", cls: "occ" },
      { lbl: "M-32", pt: "CKD · F/75",         stat: "HD scheduled", los: "2d", cls: "occ" },
    ],
  },
  {
    name: "Pediatrics · 5 North", meta: "16 beds · 12 occ · 4 avail · ratio 1:4",
    sub: "Charge: RN A. Brooks · 2 isolation rooms available",
    beds: [
      { lbl: "P-01", pt: "Asthma · F/6",       stat: "Day 2", los: "1d 18h", cls: "occ" },
      { lbl: "P-02", pt: "RSV · M/2",           stat: "Day 4", los: "3d 6h",  cls: "occ" },
      { lbl: "P-03", pt: "RSV · F/8mo",        stat: "Droplet iso", los: "2d", cls: "iso", iso: "RSV" },
      { lbl: "P-14 · YOU", pt: "Albert Smith · 9", stat: "Asthma · day 3", los: "2d 18h", cls: "iso" },
      { lbl: "P-05", pt: "→ Discharge",         stat: "15:00 · seizure", los: "4d", cls: "disp" },
      { lbl: "P-06", pt: "Gastro · F/4",        stat: "IV fluids", los: "1d", cls: "occ" },
      { lbl: "P-07", pt: "Available",           stat: "Ready", cls: "empty" },
      { lbl: "P-08", pt: "Sickle crisis · M/12", stat: "Pain ctrl", los: "3d", cls: "occ" },
      { lbl: "P-09", pt: "PNA · F/7",           stat: "Day 2", los: "1d 14h", cls: "occ" },
      { lbl: "P-10", pt: "Available",           stat: "Ready", cls: "empty" },
      { lbl: "P-11", pt: "DKA · M/14",          stat: "PICU stepdn", los: "1d 22h", cls: "occ" },
      { lbl: "P-12", pt: "Bronchiolitis · M/1", stat: "Day 2", los: "1d 6h", cls: "occ" },
      { lbl: "P-13", pt: "UTI · F/3",           stat: "IV abx", los: "14h", cls: "occ" },
      { lbl: "P-04", pt: "Cleaning",            stat: "EVS · 8m", los: "Ready 14:20", cls: "cleaning" },
      { lbl: "P-15", pt: "Available",           stat: "Held for ED", cls: "empty" },
      { lbl: "P-16", pt: "Available",           stat: "Ready", cls: "empty" },
    ],
  },
];

const FILTERS = ["All wards", "ICU", "CCU", "Med-surg", "Peds", "L&D", "Step-down", "Surgical"];

export default function BedBoardClient() {
  const [serverWards, setServerWards] = useState<WardWithBeds[]>([]);
  const [filter, setFilter] = useState("All wards");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const rows = await api<WardWithBeds[]>("/api/bed-board").catch(() => [] as WardWithBeds[]);
    setServerWards(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function cycleBedStatus(bedId: number, current: string) {
    const next = current === "empty" ? "cleaning"
              : current === "cleaning" ? "occ"
              : current === "occ" ? "discharge"
              : current === "discharge" ? "empty"
              : "empty";
    setBusy(true);
    try {
      await api(`/api/bed-board/beds/${bedId}`, { method: "PATCH", body: JSON.stringify({ status: next, patientId: null }) });
      await refresh();
    } finally { setBusy(false); }
  }

  const totalBeds = serverWards.reduce((s, w) => s + w.beds.length, 0) || 184;
  const occupied = serverWards.reduce((s, w) => s + w.beds.filter(b => b.status === "occ").length, 0) || 156;

  const floors = DEMO_FLOORS.filter(f => filter === "All wards" || f.name.toLowerCase().startsWith(filter.toLowerCase().slice(0, 3)));

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Bed Board</h1>
          <div className="meta">Live · {totalBeds} beds · 8 wards · drag to reassign</div>
        </div>
        <div className="toolbar">
          <button className="btn">Run optimizer</button>
          <button className="btn">Forecast (6h)</button>
          <button className="btn dark">+ Reserve bed</button>
        </div>
      </div>

      <div className="bb-kpis">
        <div className="bb-kpi"><div className="l">Total beds</div><div className="v">{totalBeds}</div></div>
        <div className="bb-kpi"><div className="l">Occupied</div><div className="v">{occupied}</div><div className="delta">{Math.round((occupied / totalBeds) * 100)}% capacity</div></div>
        <div className="bb-kpi"><div className="l">Available</div><div className="v">14</div><div className="delta" style={{ color: "var(--good)" }}>↑ 3 since 1h</div></div>
        <div className="bb-kpi"><div className="l">Cleaning</div><div className="v">8</div><div className="delta">avg 38 min</div></div>
        <div className="bb-kpi"><div className="l">Held</div><div className="v">6</div><div className="delta">surgery, ED</div></div>
        <div className="bb-kpi"><div className="l">ED boarding</div><div className="v" style={{ color: "var(--bad)" }}>4</div><div className="delta" style={{ color: "var(--bad)" }}>longest 6h</div></div>
        <div className="bb-kpi"><div className="l">Discharges today</div><div className="v">22</div><div className="delta">12 by noon</div></div>
      </div>

      <div className="demand">
        <div className="blk"><div className="l">Inbound (next 6h)</div><div className="v">11</div><div className="sub">3 ED admits · 5 OR · 3 direct</div></div>
        <div className="blk"><div className="l">Discharges (next 6h)</div><div className="v">8</div><div className="sub">5 attending-cleared · 3 pending</div></div>
        <div className="blk"><div className="l">Net delta</div><div className="v" style={{ color: "#ff8b9a" }}>+3</div><div className="sub">capacity tightening · prep huddle</div></div>
        <div className="blk"><div className="l">Crisis threshold</div><div className="v" style={{ color: "#27c26b" }}>14 beds</div><div className="sub">currently above · safe</div></div>
      </div>

      <div className="bb-filters">
        {FILTERS.map(f => (
          <button key={f} className={`filt ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="bb-legend">
          <span><i style={{ background: "#0e1116" }} />Occupied</span>
          <span><i style={{ background: "#fff", border: "2px dashed #d4d8df" }} />Available</span>
          <span><i style={{ background: "#fef9d7" }} />Iso</span>
          <span><i style={{ background: "#dff7e7" }} />Discharge today</span>
          <span><i style={{ background: "#e6efff" }} />Cleaning</span>
          <span><i style={{ background: "#f0e7ff" }} />Held</span>
          <span><i style={{ background: "#a05a00" }} />ED boarding</span>
        </div>
      </div>

      {/* Live wards from API */}
      {serverWards.map(w => {
        const occ = w.beds.filter(b => b.status === "occ").length;
        return (
          <div className="floor" key={w.id}>
            <h3>
              {w.name} · {w.code}
              <span className="ct">{w.beds.length} beds · {occ} occ · {w.beds.length - occ} avail · ratio {w.nurseRatio}</span>
            </h3>
            <div className="sub">Avg LOS {w.avgLos.toFixed(1)}d · click any bed to cycle status</div>
            <div className="bed-grid">
              {w.beds.map(b => (
                <button
                  key={b.id}
                  className={`bed-tile ${b.status === "occ" ? "occ" : b.status === "cleaning" ? "cleaning" : b.status === "iso" ? "iso" : b.status === "held" ? "held" : b.status === "boarding" ? "board" : b.status === "discharge" ? "disp" : "empty"}`}
                  onClick={() => cycleBedStatus(b.id, b.status)}
                  disabled={busy}
                  style={{ cursor: busy ? "wait" : "pointer", border: "0", textAlign: "left", padding: 10 }}
                >
                  <div className="lbl">{b.bedNumber}</div>
                  <div className="pt">{b.status === "empty" ? "Available" : b.status === "occ" ? `Patient #${b.patientId ?? "—"}` : b.status}</div>
                  <div className="stat">{b.status}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Demo floors (rich detail) shown below live wards for visual reference */}
      <h3 className="h2" style={{ marginTop: 20, marginBottom: 12 }}>Reference layout</h3>
      {floors.map(f => (
        <div className="floor" key={f.name}>
          <h3>{f.name} <span className="ct">{f.meta}</span></h3>
          <div className="sub">{f.sub}</div>
          <div className="bed-grid">
            {f.beds.map((b, i) => (
              <div key={i} className={`bed-tile ${b.cls ?? ""}`}>
                {b.iso && <div className="iso-flag">{b.iso}</div>}
                <div className="lbl">{b.lbl}{b.cls === "crit" && <span style={{ color: "#ff4d6b" }}>●</span>}</div>
                <div className="pt">{b.pt}</div>
                {b.stat && <div className="stat">{b.stat}</div>}
                {b.los && <div className="los">{b.los}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
