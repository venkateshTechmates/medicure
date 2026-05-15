"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import type { PatientSummary } from "@/lib/types";

type KindId =
  | "admission" | "shift" | "pain" | "fall-risk"
  | "braden" | "vte-risk" | "restraint" | "suicide-risk";

const KIND_LABELS: Record<KindId, string> = {
  admission: "Admission",
  shift: "Shift",
  pain: "Pain",
  "fall-risk": "Fall risk (Morse)",
  braden: "Braden",
  "vte-risk": "VTE risk (Padua)",
  restraint: "Restraints",
  "suicide-risk": "Suicide risk (Columbia)",
};

const KIND_TOOLS: Record<KindId, string> = {
  admission: "n/a",
  shift: "n/a",
  pain: "numeric",
  "fall-risk": "morse",
  braden: "braden",
  "vte-risk": "padua",
  restraint: "n/a",
  "suicide-risk": "columbia",
};

// ── Morse Fall Scale (max 125) ────────────────────────────────────
const MORSE_Q: { key: string; label: string; opts: { v: number; t: string }[] }[] = [
  { key: "history",     label: "History of falling (within 3 months)", opts: [{ v: 0, t: "No" }, { v: 25, t: "Yes" }] },
  { key: "secondaryDx", label: "Secondary diagnosis",                  opts: [{ v: 0, t: "No" }, { v: 15, t: "Yes" }] },
  { key: "aid",         label: "Ambulatory aid",                       opts: [{ v: 0, t: "None / bed rest / wheelchair / nurse" }, { v: 15, t: "Crutches / cane / walker" }, { v: 30, t: "Furniture" }] },
  { key: "iv",          label: "IV or saline lock",                    opts: [{ v: 0, t: "No" }, { v: 20, t: "Yes" }] },
  { key: "gait",        label: "Gait",                                 opts: [{ v: 0, t: "Normal / bedrest / immobile" }, { v: 10, t: "Weak" }, { v: 20, t: "Impaired" }] },
  { key: "mental",      label: "Mental status",                        opts: [{ v: 0, t: "Oriented to own ability" }, { v: 15, t: "Overestimates / forgets limitations" }] },
];

// ── Braden subscales (each 1–4, friction 1–3; sum 6–23) ───────────
const BRADEN_SUBS: { key: string; label: string; max: number }[] = [
  { key: "sensory",   label: "Sensory perception", max: 4 },
  { key: "moisture",  label: "Moisture",           max: 4 },
  { key: "activity",  label: "Activity",           max: 4 },
  { key: "mobility",  label: "Mobility",           max: 4 },
  { key: "nutrition", label: "Nutrition",          max: 4 },
  { key: "friction",  label: "Friction & shear",   max: 3 },
];

// ── Padua VTE risk (selected weights) ─────────────────────────────
const PADUA_ITEMS: { key: string; label: string; pts: number }[] = [
  { key: "activeCancer",     label: "Active cancer",                                  pts: 3 },
  { key: "previousVte",      label: "Previous VTE (excluding superficial)",           pts: 3 },
  { key: "reducedMobility",  label: "Reduced mobility (≥3 days)",                     pts: 3 },
  { key: "thrombophilia",    label: "Known thrombophilic condition",                  pts: 3 },
  { key: "recentTrauma",     label: "Recent (≤1 mo) trauma or surgery",               pts: 2 },
  { key: "elderly",          label: "Elderly age (≥70)",                              pts: 1 },
  { key: "heartFailure",     label: "Heart and/or respiratory failure",               pts: 1 },
  { key: "miStroke",         label: "Acute MI or ischemic stroke",                    pts: 1 },
  { key: "infection",        label: "Acute infection / rheumatologic disorder",       pts: 1 },
  { key: "obesity",          label: "Obesity (BMI ≥30)",                              pts: 1 },
  { key: "hormonalTherapy",  label: "Ongoing hormonal therapy",                       pts: 1 },
];

function riskPill(risk: string): "good" | "warn" | "bad" {
  if (risk === "high" || risk === "very-high") return "bad";
  if (risk === "moderate") return "warn";
  return "good";
}

function computeRisk(kind: KindId, score: number): string {
  switch (kind) {
    case "fall-risk":   return score >= 45 ? "high" : score >= 25 ? "moderate" : "low";
    case "braden":      return score <= 12 ? "very-high" : score <= 14 ? "high" : score <= 18 ? "moderate" : "low";
    case "pain":        return score >= 7 ? "high" : score >= 4 ? "moderate" : "low";
    case "vte-risk":    return score >= 4 ? "high" : "low";
    case "suicide-risk":return score >= 15 ? "very-high" : score >= 10 ? "high" : score >= 5 ? "moderate" : "low";
    default:            return "low";
  }
}

export default function AssessmentFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const rawKind = (sp.get("kind") as KindId) || "admission";
  const kind: KindId = (KIND_LABELS[rawKind] ? rawKind : "admission");
  const initialPatientId = sp.get("patientId");

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [patientId, setPatientId] = useState<number | "">(initialPatientId ? Number(initialPatientId) : "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Morse
  const [morse, setMorse] = useState<Record<string, number>>({
    history: 0, secondaryDx: 0, aid: 0, iv: 0, gait: 0, mental: 0
  });

  // Braden
  const [braden, setBraden] = useState<Record<string, number>>({
    sensory: 3, moisture: 3, activity: 3, mobility: 3, nutrition: 3, friction: 2
  });

  // Pain
  const [painLevel, setPainLevel] = useState(0);
  const [painLocation, setPainLocation] = useState("");
  const [painCharacter, setPainCharacter] = useState("sharp");

  // Padua VTE
  const [padua, setPadua] = useState<Record<string, boolean>>({});

  // Free-form (admission / shift / restraint / suicide-risk)
  const [freeForm, setFreeForm] = useState("");
  const [suicideScore, setSuicideScore] = useState(0);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=100")
      .then(setPatients)
      .catch(() => {});
  }, []);

  const score = useMemo(() => {
    switch (kind) {
      case "fall-risk":
        return Object.values(morse).reduce((a, b) => a + b, 0);
      case "braden":
        return Object.values(braden).reduce((a, b) => a + b, 0);
      case "pain":
        return painLevel;
      case "vte-risk":
        return PADUA_ITEMS.reduce((sum, it) => sum + (padua[it.key] ? it.pts : 0), 0);
      case "suicide-risk":
        return suicideScore;
      default:
        return 0;
    }
  }, [kind, morse, braden, painLevel, padua, suicideScore]);

  const risk = computeRisk(kind, score);

  function details(): Record<string, unknown> {
    switch (kind) {
      case "fall-risk": return { ...morse };
      case "braden":    return { ...braden };
      case "pain":      return { level: painLevel, location: painLocation, character: painCharacter };
      case "vte-risk":  return { ...padua };
      case "suicide-risk": return { score: suicideScore, narrative: freeForm };
      default:          return { narrative: freeForm };
    }
  }

  async function save() {
    if (patientId === "" || !patientId) { setMsg("Select a patient first."); return; }
    setBusy(true); setMsg(null);
    try {
      await api(`/api/assessments/${kind}`, {
        method: "POST",
        body: JSON.stringify({
          patientId,
          tool: KIND_TOOLS[kind],
          score,
          detailsJson: JSON.stringify(details()),
          notes,
        }),
      });
      setMsg("✓ Saved");
      setTimeout(() => router.push("/assessments"), 600);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/assessments">Assessments</a><span>›</span>
        <span className="bc-cur">New · {KIND_LABELS[kind]}</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Nursing · {KIND_TOOLS[kind]}</span>
          <h1 className="h1">{KIND_LABELS[kind]}</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={patientId} onChange={e => setPatientId(e.target.value === "" ? "" : Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              <option value="">— pick patient —</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
          </div>
        </div>
        <div className="toolbar">
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Score</span>
          <span className="pill"><b>{score}</b></span>
          <span className={`pill ${riskPill(risk)}`}><span className="pdot" />{risk}</span>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save →"}</button>
        </div>
      </div>

      <div className="card panel">
        {kind === "fall-risk" && <MorseForm value={morse} onChange={setMorse} />}
        {kind === "braden"    && <BradenForm value={braden} onChange={setBraden} />}
        {kind === "pain"      && (
          <PainForm
            level={painLevel} onLevel={setPainLevel}
            location={painLocation} onLocation={setPainLocation}
            character={painCharacter} onCharacter={setPainCharacter}
          />
        )}
        {kind === "vte-risk"  && <PaduaForm value={padua} onChange={setPadua} />}
        {kind === "suicide-risk" && (
          <SuicideForm score={suicideScore} onScore={setSuicideScore} narrative={freeForm} onNarrative={setFreeForm} />
        )}
        {(kind === "admission" || kind === "shift" || kind === "restraint") && (
          <FreeFormSection kind={kind} value={freeForm} onChange={setFreeForm} />
        )}

        <div className="cpoe-field" style={{ marginTop: 16 }}>
          <label>Additional notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Optional clinical narrative — interventions, patient response, plan." />
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────
function MorseForm({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  return (
    <>
      <h2>Morse Fall Scale</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Score 0–125 · ≥45 high risk · 25–44 moderate · 0–24 low</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {MORSE_Q.map(q => (
          <div key={q.key} className="info-block">
            <h4>{q.label}</h4>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {q.opts.map(o => (
                <button
                  key={o.v + o.t}
                  className={`btn ${value[q.key] === o.v ? "primary" : ""}`}
                  onClick={() => onChange({ ...value, [q.key]: o.v })}
                >
                  {o.t} <span style={{ marginLeft: 6, opacity: .7 }}>+{o.v}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BradenForm({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  return (
    <>
      <h2>Braden Scale</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>Sum 6–23 · ≤12 very-high · 13–14 high · 15–18 moderate · ≥19 low</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
        {BRADEN_SUBS.map(s => (
          <div key={s.key} className="info-block">
            <h4>{s.label}</h4>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {Array.from({ length: s.max }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`btn ${value[s.key] === n ? "primary" : ""}`}
                  onClick={() => onChange({ ...value, [s.key]: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PainForm({
  level, onLevel, location, onLocation, character, onCharacter,
}: {
  level: number; onLevel: (v: number) => void;
  location: string; onLocation: (v: string) => void;
  character: string; onCharacter: (v: string) => void;
}) {
  return (
    <>
      <h2>Pain — numeric 0–10</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>0–3 low · 4–6 moderate · 7–10 high</div>
      <div className="pain-scale" style={{ marginTop: 12 }}>
        {Array.from({ length: 11 }).map((_, n) => (
          <button key={n} className={level === n ? "active" : ""} onClick={() => onLevel(n)}>{n}</button>
        ))}
      </div>
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="cpoe-field">
          <label>Location</label>
          <input value={location} onChange={e => onLocation(e.target.value)} placeholder="e.g. RUQ, chest, generalized" />
        </div>
        <div className="cpoe-field">
          <label>Character</label>
          <select value={character} onChange={e => onCharacter(e.target.value)}>
            <option value="sharp">Sharp</option>
            <option value="dull">Dull</option>
            <option value="throbbing">Throbbing</option>
            <option value="burning">Burning</option>
            <option value="cramping">Cramping</option>
          </select>
        </div>
      </div>
    </>
  );
}

function PaduaForm({ value, onChange }: { value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  return (
    <>
      <h2>Padua VTE risk</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>≥4 = high risk · consider prophylaxis</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {PADUA_ITEMS.map(it => (
          <label key={it.key} className="info-block" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={!!value[it.key]}
              onChange={e => onChange({ ...value, [it.key]: e.target.checked })}
            />
            <span style={{ flex: 1 }}>{it.label}</span>
            <span className="muted">+{it.pts}</span>
          </label>
        ))}
      </div>
    </>
  );
}

function SuicideForm({
  score, onScore, narrative, onNarrative,
}: {
  score: number; onScore: (v: number) => void;
  narrative: string; onNarrative: (v: string) => void;
}) {
  return (
    <>
      <h2>Suicide risk — Columbia / PHQ-9</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>0–4 low · 5–9 moderate · 10–14 high · ≥15 very-high</div>
      <div className="cpoe-field" style={{ marginTop: 12 }}>
        <label>Total score (PHQ-9 / Columbia)</label>
        <input type="number" min={0} max={27} value={score} onChange={e => onScore(Number(e.target.value) || 0)} />
      </div>
      <div className="cpoe-field">
        <label>Clinical narrative</label>
        <textarea value={narrative} onChange={e => onNarrative(e.target.value)} rows={6} placeholder="Ideation, intent, plan, prior attempts, protective factors, safety plan." />
      </div>
    </>
  );
}

function FreeFormSection({ kind, value, onChange }: { kind: KindId; value: string; onChange: (v: string) => void }) {
  const labels: Record<string, { title: string; hint: string }> = {
    admission: { title: "Admission assessment", hint: "Reason for admission, history, ROS, baseline functional status, social history, advanced directives." },
    shift:     { title: "Shift assessment",     hint: "Head-to-toe findings, lines/drains/airways, safety review, patient/family communication, plan for shift." },
    restraint: { title: "Restraint q2h check",   hint: "Indication, type, alternatives tried, neurovascular check, skin integrity, hydration/toileting, attempts to discontinue." },
  };
  const meta = labels[kind] ?? { title: KIND_LABELS[kind], hint: "" };
  return (
    <>
      <h2>{meta.title}</h2>
      <div className="sub" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{meta.hint}</div>
      <div className="cpoe-field" style={{ marginTop: 12 }}>
        <label>Narrative</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={10} placeholder="Document findings here…" />
      </div>
    </>
  );
}
