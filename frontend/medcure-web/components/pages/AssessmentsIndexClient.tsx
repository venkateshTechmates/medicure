"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";
import type { Assessment, PatientSummary } from "@/lib/types";

interface KindMeta { id: string; label: string; tool: string; }
const KINDS: KindMeta[] = [
  { id: "admission",    label: "Admission",     tool: "n/a"     },
  { id: "shift",        label: "Shift",         tool: "n/a"     },
  { id: "pain",         label: "Pain",          tool: "numeric" },
  { id: "fall-risk",    label: "Fall risk",     tool: "morse"   },
  { id: "braden",       label: "Braden",        tool: "braden"  },
  { id: "vte-risk",     label: "VTE risk",      tool: "padua"   },
  { id: "restraint",    label: "Restraints",    tool: "n/a"     },
  { id: "suicide-risk", label: "Suicide risk",  tool: "columbia"},
];

function riskPill(risk: string): "good" | "warn" | "bad" {
  if (risk === "high" || risk === "very-high") return "bad";
  if (risk === "moderate") return "warn";
  return "good";
}

function patientName(a: Assessment) {
  if (a.patient) return `${a.patient.firstName} ${a.patient.lastName}`;
  return `Patient #${a.patientId}`;
}

export default function AssessmentsIndexClient() {
  const router = useRouter();
  const [rows, setRows] = useState<Assessment[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [pickerKind, setPickerKind] = useState<string>("admission");
  const [pickerPatient, setPickerPatient] = useState<number | "">("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Assessment[]>("/api/assessments?take=100")
      .then(r => setRows(r))
      .catch(() => setRows([]))
      .finally(() => setLoaded(true));
    api<PatientSummary[]>("/api/patients?take=50")
      .then(setPatients)
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => filter ? rows.filter(r => r.kind === filter) : rows,
    [rows, filter]
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) m[r.kind] = (m[r.kind] || 0) + 1;
    return m;
  }, [rows]);

  const highCount = rows.filter(r => r.risk === "high" || r.risk === "very-high").length;

  function startNew() {
    const q = new URLSearchParams({ kind: pickerKind });
    if (pickerPatient !== "") q.set("patientId", String(pickerPatient));
    router.push(`/assessments/new?${q.toString()}`);
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Nursing · §11.O</span>
          <h1 className="h1">Assessments</h1>
          <div className="meta">
            {loaded ? rows.length : "…"} total · {highCount} elevated risk · Morse · Braden · Padua · Columbia
          </div>
        </div>
        <div className="toolbar" style={{ gap: 6 }}>
          <select value={pickerKind} onChange={e => setPickerKind(e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)" }}>
            {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <select value={pickerPatient} onChange={e => setPickerPatient(e.target.value === "" ? "" : Number(e.target.value))} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--line)" }}>
            <option value="">— select patient —</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
          </select>
          <button className="btn primary" onClick={startNew}>+ New assessment <span className="arrow">→</span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Low</div><div className="num">{rows.filter(r => r.risk === "low").length}</div><div className="delta">No action</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Moderate</div><div className="num">{rows.filter(r => r.risk === "moderate").length}</div><div className="delta">Monitor</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>High</div><div className="num">{rows.filter(r => r.risk === "high").length}</div><div className="delta">Intervene</div></div>
        <div className="stat-card"><div className="lbl"><span className="si r">●</span>Very high</div><div className="num">{rows.filter(r => r.risk === "very-high").length}</div><div className="delta">Bundle now</div></div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0" }}>
        <button
          className={`btn ${filter === "" ? "primary" : ""}`}
          onClick={() => setFilter("")}
        >
          All <span style={{ marginLeft: 6, opacity: .7 }}>{rows.length}</span>
        </button>
        {KINDS.map(k => (
          <button
            key={k.id}
            className={`btn ${filter === k.id ? "primary" : ""}`}
            onClick={() => setFilter(k.id)}
          >
            {k.label} <span style={{ marginLeft: 6, opacity: .7 }}>{counts[k.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="list-card">
        <div className="lh"><h3>Recent assessments</h3><span className="muted">{filtered.length}</span></div>
        {filtered.length === 0 && (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>
            {loaded ? "No assessments yet — pick a kind above and start a new one." : "Loading…"}
          </div>
        )}
        {filtered.map(a => {
          const pill = riskPill(a.risk);
          const kindLabel = KINDS.find(k => k.id === a.kind)?.label ?? a.kind;
          return (
            <Link key={a.id} href={`/assessments/${a.id}`} className="list-row" style={{ textDecoration: "none", color: "inherit" }}>
              <div className={`ic ${pill === "bad" ? "crit" : pill === "warn" ? "warn" : "info"}`}>📝</div>
              <div>
                <div className="nm">{patientName(a)} · {kindLabel}</div>
                <div className="sub">
                  Tool: {a.tool} · {fmtDate(a.createdAt)} {fmtTime(a.createdAt)}
                  {a.notes ? ` · ${a.notes.slice(0, 60)}` : ""}
                </div>
              </div>
              <span className="muted">Score {a.score}</span>
              <span className={`pill ${pill}`}><span className="pdot" />{a.risk}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
