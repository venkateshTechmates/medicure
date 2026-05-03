"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Immunization } from "@/lib/types";

const FALLBACK = [
  { vaccine: "DTaP",        doseSeries: "5/5",  administered: "2022-08-14", manufacturer: "Sanofi", lotNumber: "DT-501",  site: "L deltoid", administeredBy: "RN J. Park", status: "completed", id: 0, patientId: 0, route: "IM", notes: "" },
  { vaccine: "MMR",         doseSeries: "2/2",  administered: "2018-07-02", manufacturer: "Merck",  lotNumber: "MR-220",  site: "R deltoid", administeredBy: "RN Brooks",  status: "completed", id: 0, patientId: 0, route: "IM", notes: "" },
  { vaccine: "Influenza",   doseSeries: "Annual", administered: "2024-10-12", manufacturer: "Sanofi", lotNumber: "FL-2024", site: "L deltoid", administeredBy: "RN Brooks",  status: "completed", id: 0, patientId: 0, route: "IM", notes: "" },
  { vaccine: "COVID-19",    doseSeries: "Booster", administered: "2024-09-08", manufacturer: "Pfizer", lotNumber: "BNT-XK", site: "R deltoid", administeredBy: "RN J. Park", status: "completed", id: 0, patientId: 0, route: "IM", notes: "" },
  { vaccine: "HPV",         doseSeries: "0/3",  administered: "",           manufacturer: "—",      lotNumber: "—",       site: "—",         administeredBy: "—",            status: "due",       id: 0, patientId: 0, route: "IM", notes: "" },
] as Immunization[];

export default function ImmunizationsClient() {
  const [rows, setRows] = useState<Immunization[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Immunization[]>("/api/immunizations?take=50")
      .then(r => setRows(r.length ? r : FALLBACK))
      .catch(() => setRows(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  const completed = rows.filter(r => r.status === "completed").length;
  const due       = rows.filter(r => r.status === "due" || r.status === "refused").length;
  const lastShot  = rows.find(r => r.status === "completed");

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Clinical · Vaccination history</span>
          <h1 className="h1">Immunizations</h1>
          <div className="meta">{rows.length} vaccines tracked · {completed} up-to-date · {due} due · CDC schedule</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print record</button>
          <button className="btn primary">+ Record dose <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Up to date</div><div className="num">{completed}</div><div className="delta">Complete series</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Due</div><div className="num">{due}</div><div className="delta">Recommended</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Schedule</div><div className="num">CDC</div><div className="delta">All ages</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Last dose</div><div className="num">{lastShot?.administered ? new Date(lastShot.administered).toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" }) : "—"}</div><div className="delta">{lastShot?.vaccine ?? ""}</div></div>
      </div>

      <div className="list-card">
        <div className="lh"><h3>Immunization record</h3><span className="muted">{loaded ? rows.length : "…"}</span></div>
        {rows.map((v, i) => {
          const isDue = v.status === "due";
          const isRefused = v.status === "refused";
          const cls = isDue ? "warn" : isRefused ? "bad" : "good";
          const label = isDue ? "Due" : isRefused ? "Refused" : "Up to date";
          return (
            <div key={v.id || i} className="list-row">
              <div className={`ic ${cls}`}>💉</div>
              <div>
                <div className="nm">{v.vaccine}</div>
                <div className="sub">
                  {v.administered ? `Last dose: ${new Date(v.administered).toLocaleDateString()}` : "Not administered"}
                  {v.manufacturer && v.manufacturer !== "—" ? ` · ${v.manufacturer}` : ""}
                  {v.lotNumber && v.lotNumber !== "—" ? ` · Lot ${v.lotNumber}` : ""}
                  {v.site && v.site !== "—" ? ` · ${v.site}` : ""}
                </div>
              </div>
              <span className="muted">{v.doseSeries}</span>
              <span className={`pill ${cls}`}><span className="pdot" />{label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
