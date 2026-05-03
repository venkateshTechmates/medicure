"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PatientSummary } from "@/lib/types";

interface PatientCard { mrn: string; n: string; age: number; sex: string; bed: string; sev: "U" | "W" | "S"; dx: string; task: string[]; aware: string; }

const SEV: Record<"U" | "W" | "S", { lbl: string; cls: string }> = {
  U: { lbl: "Unstable", cls: "bad" },
  W: { lbl: "Watcher", cls: "warn" },
  S: { lbl: "Stable", cls: "good" },
};

const FALLBACK: PatientCard[] = [
  { mrn: "08401",  n: "Maria Hernandez", age: 64, sex: "F", bed: "ICU-2 / 04",  sev: "U", dx: "Sepsis · ARDS",       task: ["Lactate q4h", "Norepi titrate to MAP > 65", "Repeat blood cx if T > 38.5"], aware: "Watch for: rising vasopressor needs, peri-arrest." },
  { mrn: "08410",  n: "James Liu",       age: 67, sex: "M", bed: "CCU / 12",    sev: "S", dx: "STEMI · post-PCI",    task: ["Tele monitor", "Continue DAPT", "PT eval AM"], aware: "Watch for: chest pain, ST changes." },
  { mrn: "08305",  n: "Robert Kim",      age: 71, sex: "M", bed: "ICU-2 / 07",  sev: "W", dx: "Post-op CABG",         task: ["Drain output q2h", "Pain control", "Wean vent if SBT pass"], aware: "Watch for: arrhythmia, bleeding." },
  { mrn: "4421-08",n: "Albert Smith",    age: 9,  sex: "M", bed: "Peds-2 / 14", sev: "S", dx: "Asthma exac · day 3",  task: ["Albuterol q4h PRN", "DC tomorrow if stable"], aware: "Watch for: increasing wheeze, accessory muscle use." },
];

const TASK_BY_STATUS: Record<string, string[]> = {
  bad:  ["Repeat critical labs q4h", "Titrate vasopressor to MAP > 65", "Reassess airway"],
  warn: ["Tele monitor", "Reassess pain q4h", "Out of bed AM"],
  good: ["Continue current plan", "Discharge planning round AM"],
};
const AWARE_BY_STATUS: Record<string, string> = {
  bad:  "Watch for: hemodynamic decline, peri-arrest, sepsis bundle deviation.",
  warn: "Watch for: trending vitals out of range, missed med doses.",
  good: "Watch for: any change requiring escalation.",
};

export default function SignoutClient() {
  const [patients, setPatients] = useState<PatientCard[]>(FALLBACK);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const live = await api<PatientSummary[]>("/api/patients?take=200").catch(() => [] as PatientSummary[]);
      // Pick critical/watcher/stable mix
      const sorted = [...live].sort((a, b) => {
        const score = (s: string) => s === "bad" ? 0 : s === "warn" ? 1 : 2;
        return score(a.status) - score(b.status);
      });
      const top = sorted.slice(0, 4);
      if (top.length === 0) return;
      setPatients(top.map(p => {
        const sev = p.status === "bad" ? "U" : p.status === "warn" ? "W" : "S";
        return {
          mrn: p.mrn,
          n: p.fullName,
          age: p.age,
          sex: p.sex,
          bed: `${p.ward} / ${p.bed}`,
          sev,
          dx: p.attendingName,
          task: TASK_BY_STATUS[p.status] ?? TASK_BY_STATUS.good,
          aware: AWARE_BY_STATUS[p.status] ?? AWARE_BY_STATUS.good,
        };
      }));
    })();
  }, []);

  const allConfirmed = patients.length > 0 && patients.every(p => confirmed[p.mrn]);

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">End of shift · I-PASS</span>
          <h1 className="h1">Sign-out</h1>
          <div className="meta">7 AM-7 PM → night team · Dr. M. Drobo → Dr. K. Vega · {patients.length} patients · expected 18:30 read-back</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print huddle sheet</button>
          <button className="btn primary" disabled={!allConfirmed}>Complete hand-off <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="card panel" style={{ marginBottom: 14 }}>
        <h2>I-PASS framework</h2>
        <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Illness severity · Patient summary · Action list · Situation awareness · Synthesis (read-back)</div>
        <div className="grid-4" style={{ marginTop: 12 }}>
          {[
            { k: "I", n: "Illness",            desc: "Stable / Watcher / Unstable" },
            { k: "P", n: "Patient summary",    desc: "1-liner + course" },
            { k: "A", n: "Action list",        desc: "What to do tonight" },
            { k: "S", n: "Situation awareness", desc: "What if scenarios" },
          ].map(s => (
            <div key={s.k} className="info-block" style={{ background: "#fafbfc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0e1116", color: "#fff", display: "grid", placeItems: "center", fontFamily: "Instrument Serif", fontSize: 18 }}>{s.k}</div>
                <div style={{ fontWeight: 800 }}>{s.n}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {patients.map(p => (
        <div className="card panel" key={p.mrn} style={{ marginBottom: 12 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {p.n}
                <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}> · {p.age} y · {p.sex} · {p.bed} · MRN {p.mrn}</span>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{p.dx}</div>
            </div>
            <span className={`pill ${SEV[p.sev].cls}`}><span className="pdot" />{SEV[p.sev].lbl}</span>
          </div>
          <div className="grid-3">
            <div className="info-block">
              <h4>Action list</h4>
              {p.task.map((t, i) => <div key={i} style={{ fontSize: 12, padding: "6px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>☐ {t}</div>)}
            </div>
            <div className="info-block">
              <h4>Situation awareness</h4>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>{p.aware}</div>
            </div>
            <div className="info-block">
              <h4>Synthesis (read-back)</h4>
              <textarea rows={3} placeholder="Receiving provider reads back..." style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: 8, fontSize: 12, fontFamily: "Plus Jakarta Sans" }} />
              <label style={{ display: "flex", gap: 6, fontSize: 11, marginTop: 6 }}>
                <input type="checkbox" checked={!!confirmed[p.mrn]} onChange={e => setConfirmed(c => ({ ...c, [p.mrn]: e.target.checked }))} />
                Read-back confirmed
              </label>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
