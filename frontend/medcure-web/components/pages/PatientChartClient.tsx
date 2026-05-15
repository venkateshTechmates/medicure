"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";
import type { Assessment, LabResult, Note, Order, PatientDetail, Vital } from "@/lib/types";
import BreakGlassModal from "@/components/BreakGlassModal";
import CalculatorButton from "@/components/CalculatorButton";

const TABS = [
  { id: "summary",     label: "Summary",     ct: "" },
  { id: "vitals",      label: "Vitals",      ct: "24h" },
  { id: "assessments", label: "Assessments", ct: "" },
  { id: "notes",       label: "Notes",       ct: "" },
  { id: "orders",   label: "Orders",      ct: "" },
  { id: "meds",     label: "Medications", ct: "" },
  { id: "labs",     label: "Labs",        ct: "" },
  { id: "imaging",  label: "Imaging",     ct: "" },
  { id: "documents",label: "Documents",   ct: "" },
  { id: "problems", label: "Problems",    ct: "" },
  { id: "allergies",label: "Allergies",   ct: "" },
  { id: "encounters",label: "Encounters", ct: "" },
  { id: "billing", label: "Billing",      ct: "" },
  { id: "timeline", label: "Timeline",    ct: "" },
];

export default function PatientChartClient() {
  const { mrn } = useParams<{ mrn: string }>();
  const [p, setP] = useState<PatientDetail | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [meds, setMeds] = useState<Order[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [tab, setTab] = useState("summary");
  const [needsBreakGlass, setNeedsBreakGlass] = useState(false);

  useEffect(() => {
    if (!mrn) return;
    if (typeof window !== "undefined") {
      // Mock care-team check: every patient is on team unless flag 'notCareTeam:<mrn>' is set.
      const notOnTeam = localStorage.getItem(`notCareTeam:${mrn}`) === "1";
      const acked = localStorage.getItem(`careTeam:${mrn}`) === "1";
      if (notOnTeam && !acked) setNeedsBreakGlass(true);
    }
    api<PatientDetail>(`/api/patients/${mrn}`).then(pd => {
      setP(pd);
      api<Assessment[]>(`/api/assessments?patientId=${pd.id}&take=50`).then(setAssessments).catch(() => {});
    }).catch(() => {});
    api<Vital[]>(`/api/patients/${mrn}/vitals`).then(setVitals).catch(() => {});
    api<Order[]>(`/api/patients/${mrn}/meds`).then(setMeds).catch(() => {});
    api<LabResult[]>(`/api/patients/${mrn}/labs`).then(setLabs).catch(() => {});
    api<Note[]>(`/api/patients/${mrn}/notes`).then(setNotes).catch(() => {});
    if (typeof window !== "undefined") {
      const h = location.hash.slice(1);
      if (h && TABS.some(t => t.id === h)) setTab(h);
    }
  }, [mrn]);

  if (!p) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;
  if (needsBreakGlass) {
    return (
      <BreakGlassModal
        patientId={p.id}
        patientName={p.fullName}
        mrn={p.mrn}
        onAcknowledged={() => {
          if (typeof window !== "undefined") localStorage.setItem(`careTeam:${mrn}`, "1");
          setNeedsBreakGlass(false);
        }}
      />
    );
  }
  const v = vitals[0];

  const counts: Record<string, number> = {
    vitals: vitals.length,
    assessments: assessments.length,
    notes: notes.length,
    orders: meds.length,
    meds: meds.length,
    labs: labs.length,
    problems: p.problems.length,
    allergies: p.allergies.length,
  };

  return (
    <>
      <div className="pt-header">
        <div className="pic" style={{ backgroundImage: `url(${p.avatarUrl})` }} />
        <div>
          <div className="nm">{p.fullName}</div>
          <div className="meta">
            <span><b>MRN</b> {p.mrn}</span>
            <span><b>{p.age} yrs</b> · {p.sex}</span>
            <span><b>Wt</b> {p.weightKg} kg · <b>Ht</b> {p.heightCm} cm</span>
            <span><b>Ward</b> {p.ward} · {p.bed}</span>
            <span><b>Attending</b> {p.attendingName}</span>
            <span><b>RN</b> {p.primaryRn}</span>
            <span><b>Code</b> {p.codeStatus}</span>
            <span><b>Insurance</b> {p.insurance}</span>
          </div>
        </div>
        <div className="alerts">
          {p.allergies.slice(0, 2).map(a => (
            <span key={a.id} className={`ah-pill ${a.severity === "severe" ? "" : a.severity === "moderate" ? "warn" : "info"}`}>⚠ {a.substance}</span>
          ))}
          {p.problems.slice(0, 1).map(pb => <span key={pb.id} className="ah-pill info">{pb.description}</span>)}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <CalculatorButton context={{ weightKg: p.weightKg, heightCm: p.heightCm, age: p.age, sex: p.sex }} />
          <Link href="/cpoe" className="btn">Quick actions ▾</Link>
          <Link href="/discharge" className="btn primary">Start discharge</Link>
        </div>
      </div>

      <div className="layout">
        <div className="side-tabs">
          {TABS.map(t => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => { setTab(t.id); if (typeof window !== "undefined") location.hash = t.id; }}>
              <span>{t.label}</span>
              {(counts[t.id] || t.ct) && <span className="ct">{counts[t.id] || t.ct}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tab === "summary" && (
            <>
              <div className="card panel">
                <h2>Summary</h2>
                <div className="sub">{Math.max(1, Math.floor((Date.now() - new Date(p.admittedAt).getTime()) / 86_400_000))}-day admission · {p.problems[0]?.icdCode ?? "—"} {p.problems[0]?.description ?? ""}</div>

                <div className="summary-grid">
                  <div className="info-block">
                    <h4>Active problems</h4>
                    {p.problems.slice(0, 4).map(pb => (
                      <div key={pb.id} className="pl-row">
                        <div><div className="nm">{pb.description}</div><div className="sub">Onset {fmtDate(pb.onset)} · {pb.type}</div></div>
                        <div className="code">{pb.icdCode}</div>
                      </div>
                    ))}
                    {p.problems.length === 0 && <div className="muted" style={{ fontSize: 12 }}>None recorded</div>}
                  </div>

                  <div className="info-block">
                    <h4>Vitals snapshot</h4>
                    {v ? (
                      <>
                        <InfoRow k="HR"   v={`${v.hr} bpm`} kind="good" />
                        <InfoRow k="BP"   v={`${v.sbp}/${v.dbp}`} kind="good" />
                        <InfoRow k="SpO₂" v={`${v.spo2}% RA`} kind={v.spo2 < 92 ? "bad" : "good"} />
                        <InfoRow k="RR"   v={`${v.rr}`} kind="good" />
                        <InfoRow k="T"    v={`${v.tempC} °C`} />
                        <InfoRow k="Pain" v={`${v.pain ?? 0}/10`} />
                      </>
                    ) : <div className="muted" style={{ fontSize: 12 }}>No vitals recorded</div>}
                  </div>
                </div>

                <div className="info-block" style={{ marginTop: 12 }}>
                  <h4>SpO₂ · last 24 hrs</h4>
                  <div className="vit-chart">
                    <svg viewBox="0 0 600 70" preserveAspectRatio="none">
                      <line x1="0" y1="35" x2="600" y2="35" stroke="#ebedf1" strokeDasharray="3,3" />
                      <path fill="rgba(39,194,107,.14)" stroke="#27c26b" strokeWidth="2"
                        d={spo2Path(vitals)} />
                    </svg>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-mute)", marginTop: 4 }}>
                    <span>{spo2Min(vitals)}% lowest</span><span>{vitals[0]?.spo2 ?? "—"}% current</span>
                  </div>
                </div>

                <div className="summary-grid" style={{ marginTop: 12 }}>
                  <div className="info-block">
                    <h4>Active medications · {meds.length}</h4>
                    {meds.slice(0, 4).map(m => (
                      <div className="med-row" key={m.id}>
                        <div className="ic">{m.name.slice(0, 2)}</div>
                        <div><div className="nm">{m.name} {m.dose}</div><div className="sub">{m.route} · {m.frequency}</div></div>
                        <span className={`pill ${m.status === "verified" ? "good" : m.status === "draft" ? "warn" : "info"}`}><span className="pdot" />{m.status}</span>
                      </div>
                    ))}
                    <Link href="/emar" className="btn" style={{ marginTop: 6, width: "100%", justifyContent: "center" }}>View eMAR →</Link>
                  </div>

                  <div className="info-block">
                    <h4>Latest results</h4>
                    {labs.slice(0, 4).map(l => (
                      <InfoRow key={l.id} k={`${l.panel} · ${l.testName}`} v={`${l.value} ${l.units}`} flag={l.flag} />
                    ))}
                    <Link href="/labs" className="btn" style={{ marginTop: 6, width: "100%", justifyContent: "center" }}>View labs →</Link>
                  </div>
                </div>
              </div>

              <div className="card panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h2 style={{ margin: 0 }}>Recent notes</h2>
                  <Link href="/note-composer" className="btn primary">+ New note</Link>
                </div>
                {notes.slice(0, 3).map(n => (
                  <div className="note" key={n.id}>
                    <div className="head">
                      <span><span className={`note-pill ${n.type === "Nursing" ? "nursing" : n.type === "Consult" ? "consult" : ""}`}>{n.type}</span> {n.authorName}</span>
                      <span>{fmtDate(n.createdAt)} · {fmtTime(n.createdAt)} · {n.signed ? "✓ Signed" : "Unsigned"}</span>
                    </div>
                    <div className="ttl">{n.type} note</div>
                    <div className="body">{n.content}</div>
                  </div>
                ))}
                {notes.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No notes yet</div>}
              </div>
            </>
          )}

          {tab === "vitals" && <VitalsTab vitals={vitals} />}
          {tab === "assessments" && <AssessmentsTab assessments={assessments} patientId={p.id} />}
          {tab === "meds" && <MedsTab meds={meds} />}
          {tab === "orders" && <MedsTab meds={meds} />}
          {tab === "labs" && <LabsTab labs={labs} />}
          {tab === "notes" && <NotesTab notes={notes} />}
          {tab === "problems" && <ProblemsTab p={p} />}
          {tab === "allergies" && <AllergiesTab p={p} />}
          {!["summary", "vitals", "assessments", "meds", "orders", "labs", "notes", "problems", "allergies"].includes(tab) && (
            <div className="card panel"><h2>{TABS.find(t => t.id === tab)?.label}</h2><div className="muted" style={{ fontSize: 13 }}>Coming soon — backend endpoint in development.</div></div>
          )}
        </div>

        {/* RIGHT RAIL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 110 }}>
          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Care team</div>
            <CareRow name={`Dr. ${p.attendingName.replace("Dr. ", "")}`} role="Attending" on />
            <CareRow name={`RN ${p.primaryRn.replace("RN ", "")}`} role="Primary RN" on />
            <CareRow name="PharmD Cole" role="Pharmacy" on />
            <CareRow name="RT Singh" role="Resp therapist" on={false} />
          </div>

          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
              Active alerts <span style={{ color: "var(--ink-mute)", fontWeight: 500, fontSize: 11 }}>{p.allergies.length + p.problems.length}</span>
            </div>
            {p.allergies.map(a => (
              <div key={a.id} style={{ padding: 10, background: "#fff3df", border: "1px solid #ffb84d", borderRadius: 10, marginBottom: 6, fontSize: 11, color: "#a05a00" }}>
                <b>Allergy: {a.substance}</b><br />{a.reaction} · {a.severity}
              </div>
            ))}
            {p.problems.slice(0, 2).map(pb => (
              <div key={pb.id} style={{ padding: 10, background: "#e6efff", border: "1px solid #3a86ff", borderRadius: 10, marginBottom: 6, fontSize: 11, color: "#1a4fb3" }}>
                <b>{pb.description}</b><br />{pb.icdCode}
              </div>
            ))}
          </div>

          <div className="card panel">
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Recent timeline</div>
            <div className="tl">
              {meds.slice(0, 2).map(m => (
                <div key={`m-${m.id}`} className="tl-item med">
                  <div className="t">{m.signedAt ? fmtTime(m.signedAt) : "—"}</div>
                  <div className="h">{m.name} {m.status}</div>
                  <div className="b">{m.orderedByName}</div>
                </div>
              ))}
              {labs.slice(0, 2).map(l => (
                <div key={`l-${l.id}`} className="tl-item lab">
                  <div className="t">{fmtTime(l.resultedAt)}</div>
                  <div className="h">{l.testName}: {l.value} {l.units}</div>
                  <div className="b">{l.flag}</div>
                </div>
              ))}
              {notes.slice(0, 1).map(n => (
                <div key={`n-${n.id}`} className="tl-item">
                  <div className="t">{fmtTime(n.createdAt)}</div>
                  <div className="h">{n.type} note signed</div>
                  <div className="b">{n.authorName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ k, v, kind, flag }: { k: string; v: string; kind?: "good" | "warn" | "bad"; flag?: string }) {
  let pillKind = kind;
  if (flag) pillKind = flag === "critical" ? "bad" : flag === "normal" ? "good" : "warn";
  return (
    <div className="info-row">
      <span className="k">{k}</span>
      <span className="v">{v} {pillKind && <span className={`pill ${pillKind}`}><span className="pdot" />{flag ?? "WNL"}</span>}</span>
    </div>
  );
}
function CareRow({ name, role, on }: { name: string; role: string; on: boolean }) {
  return (
    <div className="care-row">
      <div className="pic" style={{ backgroundImage: `url(https://i.pravatar.cc/80?u=${encodeURIComponent(name)})` }} />
      <div style={{ flex: 1 }}>
        <div className="nm">{name}</div>
        <div className="role">{role}</div>
      </div>
      <span className={`pill ${on ? "good" : ""} on`}><span className="pdot" />{on ? "On" : "Off"}</span>
    </div>
  );
}
function VitalsTab({ vitals }: { vitals: Vital[] }) {
  return (
    <div className="card panel">
      <h2>Vitals</h2>
      <div className="sub">Most recent first</div>
      <table className="table" style={{ marginTop: 10 }}>
        <thead><tr><th>When</th><th>HR</th><th>BP</th><th>SpO₂</th><th>RR</th><th>Temp</th><th>Pain</th><th>By</th></tr></thead>
        <tbody>{vitals.map(v => (
          <tr key={v.id}>
            <td>{fmtDate(v.recordedAt)} {fmtTime(v.recordedAt)}</td>
            <td><b>{v.hr}</b></td><td><b>{v.sbp}/{v.dbp}</b></td><td><b>{v.spo2}%</b></td>
            <td>{v.rr}</td><td>{v.tempC}°C</td><td>{v.pain ?? "—"}</td><td className="muted">{v.recordedBy}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function MedsTab({ meds }: { meds: Order[] }) {
  return (
    <div className="card panel">
      <h2>Medications</h2>
      <div className="sub">{meds.length} active</div>
      {meds.map(m => (
        <div className="med-row" key={m.id}>
          <div className="ic">{m.name.slice(0, 2)}</div>
          <div><div className="nm">{m.name} {m.dose}</div><div className="sub">{m.route} · {m.frequency} · {m.indication}</div></div>
          <span className={`pill ${m.status === "verified" ? "good" : m.status === "draft" ? "warn" : "info"}`}><span className="pdot" />{m.status}</span>
        </div>
      ))}
    </div>
  );
}
function LabsTab({ labs }: { labs: LabResult[] }) {
  return (
    <div className="card panel">
      <h2>Labs</h2>
      <table className="table" style={{ marginTop: 10 }}>
        <thead><tr><th>Test</th><th>Value</th><th>Range</th><th>Flag</th><th>Resulted</th></tr></thead>
        <tbody>{labs.map(l => (
          <tr key={l.id}>
            <td><b>{l.testName}</b><br /><span className="muted" style={{ fontSize: 11 }}>{l.panel}</span></td>
            <td><b>{l.value}</b> {l.units}</td>
            <td className="muted">{l.refRange}</td>
            <td><span className={`pill ${l.flag === "critical" ? "bad" : l.flag === "normal" ? "good" : "warn"}`}><span className="pdot" />{l.flag}</span></td>
            <td className="muted">{fmtDate(l.resultedAt)} {fmtTime(l.resultedAt)}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function NotesTab({ notes }: { notes: Note[] }) {
  return (
    <div className="card panel">
      <h2>Notes</h2>
      {notes.map(n => (
        <div key={n.id} className="note">
          <div className="head">
            <span><span className={`note-pill ${n.type === "Nursing" ? "nursing" : n.type === "Consult" ? "consult" : ""}`}>{n.type}</span> {n.authorName}</span>
            <span>{fmtDate(n.createdAt)} · {fmtTime(n.createdAt)} · {n.signed ? "✓ Signed" : "Unsigned"}</span>
          </div>
          <div className="body">{n.content}</div>
        </div>
      ))}
    </div>
  );
}
function ProblemsTab({ p }: { p: PatientDetail }) {
  return (
    <div className="card panel">
      <h2>Problems</h2>
      {p.problems.map(pb => (
        <div className="pl-row" key={pb.id}>
          <div><div className="nm">{pb.description}</div><div className="sub">Onset {fmtDate(pb.onset)} · {pb.type}</div></div>
          <div className="code">{pb.icdCode}</div>
        </div>
      ))}
    </div>
  );
}
function AssessmentsTab({ assessments, patientId }: { assessments: Assessment[]; patientId: number }) {
  const riskCls = (r: string) => r === "high" || r === "very-high" ? "bad" : r === "moderate" ? "warn" : "good";
  return (
    <div className="card panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Nursing assessments</h2>
        <Link href={`/assessments/new?kind=admission&patientId=${patientId}`} className="btn primary">+ New assessment</Link>
      </div>
      {assessments.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No assessments recorded yet.</div>}
      {assessments.length > 0 && (
        <table className="table" style={{ marginTop: 6 }}>
          <thead><tr><th>When</th><th>Kind</th><th>Tool</th><th>Score</th><th>Risk</th><th>Notes</th></tr></thead>
          <tbody>{assessments.map(a => (
            <tr key={a.id}>
              <td>{fmtDate(a.createdAt)} {fmtTime(a.createdAt)}</td>
              <td><b>{a.kind}</b></td>
              <td className="muted">{a.tool}</td>
              <td><b>{a.score}</b></td>
              <td><span className={`pill ${riskCls(a.risk)}`}><span className="pdot" />{a.risk}</span></td>
              <td className="muted" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>{a.notes}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
function AllergiesTab({ p }: { p: PatientDetail }) {
  return (
    <div className="card panel">
      <h2>Allergies</h2>
      {p.allergies.length === 0 && <div className="muted" style={{ fontSize: 13 }}>No known allergies.</div>}
      {p.allergies.map(a => (
        <div className="pl-row" key={a.id}>
          <div><div className="nm">{a.substance}</div><div className="sub">Reaction: {a.reaction}</div></div>
          <span className={`pill ${a.severity === "severe" ? "bad" : a.severity === "moderate" ? "warn" : "info"}`}><span className="pdot" />{a.severity}</span>
        </div>
      ))}
    </div>
  );
}
function spo2Path(vitals: Vital[]) {
  if (vitals.length === 0) return "M0,35 L600,35 L600,70 L0,70 Z";
  const pts = vitals.slice(0, 24).reverse();
  const step = 600 / Math.max(1, pts.length - 1);
  const points = pts.map((v, i) => `${i * step},${70 - ((v.spo2 - 85) / 15) * 60}`);
  return `M ${points.join(" L ")} L 600,70 L 0,70 Z`;
}
function spo2Min(vitals: Vital[]) {
  if (vitals.length === 0) return "—";
  return Math.min(...vitals.map(v => v.spo2));
}
