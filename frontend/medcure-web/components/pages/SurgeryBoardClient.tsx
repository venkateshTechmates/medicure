"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";

interface Case { or: number; start: number; end: number; cls: string; ttl: string; sub: string; }

const CASES: Case[] = [
  { or: 1, start: 0,  end: 2.5, cls: "ev-blue",   ttl: "Lap chole",            sub: "Dr. Achebe · 90m" },
  { or: 1, start: 3,  end: 6,   cls: "ev-green",  ttl: "Inguinal hernia",      sub: "Dr. Patel" },
  { or: 1, start: 7,  end: 10,  cls: "ev-pink",   ttl: "Mastectomy",           sub: "Dr. Park · est 3h" },
  { or: 2, start: 0,  end: 5,   cls: "ev-purple", ttl: "Total hip arthroplasty", sub: "Dr. Vega · est 5h" },
  { or: 2, start: 6,  end: 8,   cls: "ev-amber",  ttl: "Colonoscopy",          sub: "Dr. Park" },
  { or: 3, start: 1,  end: 4,   cls: "ev-pink",   ttl: "CABG x3",              sub: "Dr. Vasquez · ETA 11:30" },
  { or: 3, start: 5,  end: 9,   cls: "ev-blue",   ttl: "Aortic valve replacement", sub: "Dr. Vasquez" },
  { or: 4, start: 0.5, end: 2.5, cls: "ev-green", ttl: "Tonsillectomy",        sub: "Dr. Achebe (Peds)" },
  { or: 4, start: 3,  end: 5,   cls: "ev-blue",   ttl: "Adenoidectomy",        sub: "Dr. Patel" },
  { or: 4, start: 6,  end: 8,   cls: "ev-amber",  ttl: "Myringotomy",          sub: "Dr. Patel" },
  { or: 5, start: 2,  end: 7,   cls: "ev-purple", ttl: "Spinal fusion L4-L5",  sub: "Dr. Mendez · 5h" },
  { or: 6, start: 0,  end: 3,   cls: "ev-pink",   ttl: "Cholecystectomy",      sub: "Dr. Vega" },
  { or: 6, start: 4,  end: 7,   cls: "ev-amber",  ttl: "Appendectomy",         sub: "Dr. Park" },
  { or: 7, start: 1,  end: 3,   cls: "ev-blue",   ttl: "Cataract bilat",       sub: "Dr. Tanaka" },
  { or: 7, start: 4,  end: 6,   cls: "ev-blue",   ttl: "Cataract",             sub: "Dr. Tanaka" },
  { or: 8, start: 0,  end: 2,   cls: "ev-green",  ttl: "C-section scheduled",  sub: "Dr. Mendez · OB" },
  { or: 8, start: 3,  end: 5,   cls: "ev-pink",   ttl: "Hysterectomy",         sub: "Dr. Mendez" },
];

const HOURS = ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];

export default function SurgeryBoardClient() {
  const totalHours = HOURS.length;
  const colWidth = 1 / totalHours;
  const nowHour = 4.6; // ~11:36 AM
  const [procedures, setProcedures] = useState<Appointment[]>([]);

  useEffect(() => {
    api<Appointment[]>("/api/appointments?type=Procedure&take=50")
      .then(setProcedures).catch(() => setProcedures([]));
  }, []);

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Operating room · 8-OR Gantt</span>
          <h1 className="h1">Surgery board</h1>
          <div className="meta">{procedures.length || 17} cases scheduled · {procedures.filter(p => p.status === "checked-in").length || 4} in progress · 92% on-time · turnover 28 min avg</div>
        </div>
        <div className="toolbar">
          <button className="btn">Today</button>
          <button className="btn">Tomorrow</button>
          <Link href="/schedule" className="btn primary">+ Schedule case <span className="arrow">→</span></Link>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>Cases today</div><div className="num">{procedures.length || 17}</div><div className="delta">8 ORs running</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>On-time start</div><div className="num">92%</div><div className="delta">3/17 delayed</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Turnover</div><div className="num">28<span style={{ fontSize: 14, color: "var(--ink-mute)" }}>m</span></div><div className="delta">target 30 m</div></div>
        <div className="stat-card"><div className="lbl"><span className="si">●</span>In progress</div><div className="num">4</div><div className="delta">live</div></div>
      </div>

      <div className="gantt">
        <div className="gantt-grid">
          <div />
          {HOURS.map(h => <div key={h} className="hdr">{h}:00</div>)}
          {[1, 2, 3, 4, 5, 6, 7, 8].map(orNum => (
            <RowFor key={orNum} orNum={orNum} cases={CASES.filter(c => c.or === orNum)} colWidth={colWidth} totalHours={totalHours} nowHour={orNum === 1 ? nowHour : null} />
          ))}
        </div>
      </div>

      {procedures.length > 0 && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h2>Live procedure schedule · /api/appointments?type=Procedure</h2>
          <table className="table" style={{ marginTop: 10 }}>
            <thead><tr><th>Time</th><th>Patient</th><th>Provider</th><th>Status</th></tr></thead>
            <tbody>
              {procedures.map(p => (
                <tr key={p.id}>
                  <td><b>{new Date(p.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</b></td>
                  <td>{p.patient ? `${p.patient.fullName} · ${p.patient.mrn}` : "—"}</td>
                  <td className="muted">{p.providerName}</td>
                  <td><span className="pill info"><span className="pdot" />{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function RowFor({ orNum, cases, colWidth, totalHours, nowHour }: { orNum: number; cases: Case[]; colWidth: number; totalHours: number; nowHour: number | null }) {
  return (
    <>
      <div className="or">OR-{orNum}</div>
      <div className="gantt-row" style={{ gridColumn: `2 / ${totalHours + 2}` }}>
        {cases.map((c, i) => {
          const left = (c.start / totalHours) * 100;
          const width = ((c.end - c.start) / totalHours) * 100;
          return (
            <div key={i} className={`gantt-bar ${c.cls}`} style={{ left: `${left}%`, width: `${width}%` }}>
              {c.ttl}
              <div className="sub">{c.sub}</div>
            </div>
          );
        })}
        {nowHour !== null && <div className="gantt-now" style={{ left: `${(nowHour / totalHours) * 100}%` }} />}
      </div>
    </>
  );
}
