"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { resolveTokens, type TokenContext } from "@/lib/noteTokens";
import TemplatePicker from "@/components/notes/TemplatePicker";
import SmartPhraseAutocomplete from "@/components/notes/SmartPhraseAutocomplete";
import type {
  NoteTemplate, SmartPhrase, NoteDraft, NoteAddendum, Note,
  PatientDetail, Vital, Order, Allergy, Problem,
} from "@/lib/types";

const NOTE_TYPES = ["Progress", "SOAP", "H&P", "Procedure", "Discharge", "Consult", "Nursing"];

export default function NoteComposerClient() {
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState("Progress");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [phrases, setPhrases] = useState<SmartPhrase[]>([]);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [vitals, setVitals] = useState<Vital | null>(null);
  const [meds, setMeds] = useState<Order[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [author, setAuthor] = useState<string>("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [signedNote, setSignedNote] = useState<Note | null>(null);
  const [addendumOpen, setAddendumOpen] = useState(false);
  const [addendumBody, setAddendumBody] = useState("");
  const [addenda, setAddenda] = useState<NoteAddendum[]>([]);

  // Bootstrap: pick a patient (first available), load context, templates, phrases, draft.
  useEffect(() => {
    (async () => {
      try {
        const patients = await api<{ id: number; mrn: string }[]>("/api/patients?take=1");
        if (!patients.length) { setErr("No patients available"); return; }
        const pid = patients[0].id;
        const mrn = patients[0].mrn;
        const [pDetail, tList, pList] = await Promise.all([
          api<PatientDetail>(`/api/patients/${encodeURIComponent(mrn)}`),
          api<NoteTemplate[]>("/api/note-templates"),
          api<SmartPhrase[]>("/api/smart-phrases"),
        ]);
        setPatient(pDetail);
        setAllergies(pDetail.allergies as Allergy[]);
        setProblems(pDetail.problems as Problem[]);
        setTemplates(tList);
        setPhrases(pList);

        const user = typeof window !== "undefined" ? localStorage.getItem("medcure_user") : null;
        if (user) {
          try { setAuthor((JSON.parse(user) as { fullName?: string }).fullName ?? ""); } catch {}
        }

        const [vList, oList] = await Promise.all([
          api<Vital[]>(`/api/vitals?patientId=${pid}&take=1`).catch(() => []),
          api<Order[]>(`/api/orders?patientId=${pid}&take=50`).catch(() => []),
        ]);
        setVitals(vList[0] ?? null);
        setMeds(oList.filter(o => o.orderType === "Medication" && !o.discontinuedAt && o.status !== "cancelled"));

        // Why: pre-fill body from any existing draft.
        try {
          const draft = await api<NoteDraft | null>(`/api/notes/draft?patientId=${pid}&type=${encodeURIComponent(type)}`);
          if (draft && draft.body) {
            setBody(draft.body);
            setDraftId(draft.id);
          }
        } catch {}
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load context");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user switches type, fetch draft for that type.
  useEffect(() => {
    if (!patient) return;
    (async () => {
      try {
        const draft = await api<NoteDraft | null>(`/api/notes/draft?patientId=${patient.id}&type=${encodeURIComponent(type)}`);
        if (draft) { setBody(draft.body || ""); setDraftId(draft.id); }
        else { setDraftId(null); }
      } catch {}
    })();
  }, [type, patient]);

  const tokenCtx: TokenContext = useMemo(() => ({
    patient: patient ? {
      firstName: (patient as PatientDetail & { firstName?: string }).firstName,
      lastName: (patient as PatientDetail & { lastName?: string }).lastName,
      fullName: patient.fullName,
      mrn: patient.mrn,
      sex: patient.sex,
      age: patient.age,
    } : null,
    vitals: vitals ? { hr: vitals.hr, sbp: vitals.sbp, dbp: vitals.dbp, spo2: vitals.spo2, rr: vitals.rr, tempC: vitals.tempC, recordedAt: vitals.recordedAt } : null,
    meds: meds.map(m => ({ name: m.name, dose: m.dose, route: m.route, frequency: m.frequency })),
    allergies: allergies.map(a => ({ substance: a.substance, reaction: a.reaction, severity: a.severity })),
    problems: problems.map(p => ({ description: p.description, icdCode: p.icdCode })),
    author,
    today: new Date().toISOString().slice(0, 10),
  }), [patient, vitals, meds, allergies, problems, author]);

  const preview = useMemo(() => resolveTokens(body, tokenCtx), [body, tokenCtx]);

  // Autosave: every 10s while body changes, and explicit on blur.
  const saveDraft = useCallback(async () => {
    if (!patient) return;
    if (signedNote) return; // Why: once signed, no more drafts on the same body.
    try {
      const saved = await api<NoteDraft>("/api/notes/draft", {
        method: "POST",
        body: JSON.stringify({ noteId: null, patientId: patient.id, type, body }),
      });
      setDraftId(saved.id);
      setSavedAt(new Date());
    } catch (e) {
      // Why: autosave failures are non-fatal; user can still sign.
    }
  }, [patient, type, body, signedNote]);

  useEffect(() => {
    if (!patient) return;
    const id = setInterval(() => { saveDraft(); }, 10000);
    return () => clearInterval(id);
  }, [patient, saveDraft]);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "";
    const s = Math.max(0, Math.floor((Date.now() - savedAt.getTime()) / 1000));
    if (s < 60) return `Saved ${s}s ago`;
    return `Saved ${Math.floor(s / 60)}m ago`;
  }, [savedAt]);

  // Why: tick every 5s to update savedLabel staleness display.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  function applyTemplate(t: NoteTemplate) {
    setTemplateId(t.id);
    setBody(prev => (prev && prev.trim().length > 0 ? prev + "\n\n" : "") + t.body);
  }

  async function onSign() {
    if (!patient) return;
    setBusy(true); setErr(null);
    try {
      // Why: ask server to render tokens canonically before signing.
      const rendered = await api<{ body: string }>("/api/notes/render", {
        method: "POST",
        body: JSON.stringify({ patientId: patient.id, body }),
      });
      const note = await api<Note>("/api/notes", {
        method: "POST",
        body: JSON.stringify({
          patientId: patient.id,
          type,
          content: rendered.body,
          signed: true,
        }),
      });
      setSignedNote(note);
      setDraftId(null);
      const list = await api<NoteAddendum[]>(`/api/notes/${note.id}/addenda`).catch(() => []);
      setAddenda(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign failed");
    } finally { setBusy(false); }
  }

  async function onSaveDraftClick() {
    setBusy(true); setErr(null);
    try { await saveDraft(); }
    finally { setBusy(false); }
  }

  async function submitAddendum() {
    if (!signedNote) return;
    if (!addendumBody.trim()) { setAddendumOpen(false); return; }
    setBusy(true); setErr(null);
    try {
      const a = await api<NoteAddendum>(`/api/notes/${signedNote.id}/addendum`, {
        method: "POST",
        body: JSON.stringify({ body: addendumBody }),
      });
      setAddenda(prev => [...prev, a]);
      setAddendumBody("");
      setAddendumOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Addendum failed");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Compose note</h1>
          <div className="meta">{patient ? `${patient.fullName} · MRN ${patient.mrn}` : "Loading…"}</div>
        </div>
        <div className="toolbar">
          {savedLabel && <span className="save-status">{savedLabel}</span>}
          {err && <span style={{ color: "var(--bad)", fontSize: 12 }}>{err}</span>}
          <button className="btn" onClick={onSaveDraftClick} disabled={busy || !!signedNote}>Save draft</button>
          <button className="btn primary" onClick={onSign} disabled={busy || !!signedNote || !patient}>
            {signedNote ? "Signed" : busy ? "Saving…" : "Sign & file"}
          </button>
        </div>
      </div>

      <div className="emar-ctx">
        <div>
          <div className="nm">{patient ? `${patient.fullName} · MRN ${patient.mrn} · ${patient.age} yo ${patient.sex}` : ""}</div>
          <div className="meta">
            <span><b>Author</b> {author || "—"}</span>
            <span><b>Type</b> {type}</span>
            {signedNote && <span><b>Signed</b> {new Date(signedNote.signedAt || "").toLocaleString()}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span className={`pill ${signedNote ? "good" : "warn"}`}><span className="pdot" />{signedNote ? "Signed" : "Draft"}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, margin: "12px 0", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 12 }}>
          Note type:&nbsp;
          <select value={type} onChange={e => setType(e.target.value)} disabled={!!signedNote}>
            {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <TemplatePicker
          templates={templates}
          type={type}
          value={templateId}
          onSelect={applyTemplate}
        />
        <span style={{ fontSize: 11, color: "var(--ink-mute, #666)" }}>
          Tip: type <code>.</code> to insert a smart phrase. Tokens like <code>@name@</code>, <code>@meds@</code>, <code>@allergies@</code> are resolved on save.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="editor-card">
          <textarea
            ref={taRef}
            className="note-body"
            value={body}
            disabled={!!signedNote}
            onChange={e => setBody(e.target.value)}
            onBlur={() => saveDraft()}
            placeholder="Begin typing your note…"
            style={{
              width: "100%",
              minHeight: 420,
              padding: 12,
              fontFamily: "var(--mono, ui-monospace, monospace)",
              fontSize: 13,
              border: "1px solid var(--line, #ddd)",
              borderRadius: 6,
              resize: "vertical",
              whiteSpace: "pre-wrap",
            }}
          />
          <SmartPhraseAutocomplete
            textareaRef={taRef}
            phrases={phrases}
            value={body}
            onChange={setBody}
          />
        </div>

        <div className="editor-card" style={{ padding: 12, background: "var(--surface, #fafafa)", border: "1px solid var(--line, #eee)", borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Live preview</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--mono, ui-monospace, monospace)", fontSize: 13, margin: 0 }}>
            {preview || <span style={{ color: "var(--ink-mute, #999)" }}>Preview will appear here…</span>}
          </pre>
        </div>
      </div>

      {signedNote && (
        <div style={{ marginTop: 16 }}>
          <div className="head" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Addenda</h3>
            <button className="btn" onClick={() => setAddendumOpen(v => !v)}>
              {addendumOpen ? "Cancel" : "Add addendum"}
            </button>
          </div>

          {addendumOpen && (
            <div style={{ marginBottom: 12 }}>
              <textarea
                value={addendumBody}
                onChange={e => setAddendumBody(e.target.value)}
                placeholder="Addendum text…"
                style={{ width: "100%", minHeight: 100, padding: 8, border: "1px solid var(--line, #ddd)", borderRadius: 6, fontSize: 13 }}
              />
              <div style={{ marginTop: 6, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn primary" onClick={submitAddendum} disabled={busy || !addendumBody.trim()}>Sign addendum</button>
              </div>
            </div>
          )}

          {addenda.length === 0
            ? <div style={{ color: "var(--ink-mute, #888)", fontSize: 12 }}>No addenda.</div>
            : addenda.map(a => (
                <div key={a.id} className="card" style={{ padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--ink-mute, #666)" }}>
                    <b>{a.authorName}</b> · {new Date(a.signedAt).toLocaleString()}
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0", fontSize: 13 }}>{a.body}</pre>
                </div>
              ))}
        </div>
      )}
    </>
  );
}
