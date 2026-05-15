"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import StatusPill from "@/components/StatusPill";
import ConsentModal from "@/components/ConsentModal";
import type { Consent, ConsentKind, ConsentStatus, PatientSummary, StatusKind } from "@/lib/types";

const KINDS: { id: ConsentKind | ""; label: string }[] = [
  { id: "", label: "All kinds" },
  { id: "treatment", label: "Treatment" },
  { id: "procedure", label: "Procedure" },
  { id: "photo", label: "Photo" },
  { id: "research", label: "Research" },
  { id: "hipaa", label: "HIPAA" },
];

const STATUSES: { id: ConsentStatus | ""; label: string }[] = [
  { id: "", label: "All statuses" },
  { id: "draft", label: "Draft" },
  { id: "signed", label: "Signed" },
  { id: "revoked", label: "Revoked" },
  { id: "expired", label: "Expired" },
];

function statusKind(s: string): StatusKind {
  if (s === "signed") return "good";
  if (s === "revoked" || s === "expired") return "bad";
  if (s === "draft") return "warn";
  return "info";
}

export default function ConsentsClient() {
  const [rows, setRows] = useState<Consent[]>([]);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [patientId, setPatientId] = useState<number | "">("");
  const [kind, setKind] = useState<ConsentKind | "">("");
  const [status, setStatus] = useState<ConsentStatus | "">("");
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<Consent | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const q = new URLSearchParams();
    if (patientId !== "") q.set("patientId", String(patientId));
    if (kind) q.set("kind", kind);
    if (status) q.set("status", status);
    const list = await api<Consent[]>(`/api/consents?${q.toString()}`).catch(() => [] as Consent[]);
    setRows(list);
    setLoaded(true);
  }

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=100").then(setPatients).catch(() => {});
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [patientId, kind, status]);

  const patientLookup = useMemo(() => {
    const m = new Map<number, PatientSummary>();
    for (const p of patients) m.set(p.id, p);
    return m;
  }, [patients]);

  async function revoke(c: Consent) {
    const reason = window.prompt("Reason for revocation?");
    if (!reason) return;
    setBusyId(c.id);
    try {
      await api(`/api/consents/${c.id}/revoke`, { method: "POST", body: JSON.stringify({ reason }) });
      await load();
    } finally { setBusyId(null); }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Compliance · §14.O</span>
          <h1 className="h1">Consents</h1>
          <div className="meta">
            {loaded ? rows.length : "…"} consents · treatment · procedure · photo · research · HIPAA
          </div>
        </div>
      </div>

      <div className="card panel" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={patientId} onChange={e => setPatientId(e.target.value === "" ? "" : Number(e.target.value))} style={{ padding: "6px 10px", borderRadius: 6 }}>
            <option value="">All patients</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
          </select>
          <select value={kind} onChange={e => setKind(e.target.value as ConsentKind | "")} style={{ padding: "6px 10px", borderRadius: 6 }}>
            {KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as ConsentStatus | "")} style={{ padding: "6px 10px", borderRadius: 6 }}>
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card panel" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Kind</th>
              <th>Title</th>
              <th>Status</th>
              <th>Signed</th>
              <th>Witness</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => {
              const p = patientLookup.get(c.patientId);
              return (
                <tr key={c.id}>
                  <td>{p ? `${p.fullName} · ${p.mrn}` : `Patient #${c.patientId}`}</td>
                  <td style={{ textTransform: "capitalize" }}>{c.kind}</td>
                  <td>{c.title}</td>
                  <td><StatusPill kind={statusKind(c.status)}>{c.status}</StatusPill></td>
                  <td>{c.signedAt ? new Date(c.signedAt).toLocaleString() : "—"}</td>
                  <td>{c.requiredWitness ? (c.witnessName || "Required") : "—"}</td>
                  <td>
                    {c.status === "draft" && (
                      <button className="btn primary" onClick={() => setOpen(c)} disabled={busyId === c.id}>Sign</button>
                    )}
                    {c.status === "signed" && (
                      <button className="btn" onClick={() => revoke(c)} disabled={busyId === c.id}>{busyId === c.id ? "…" : "Revoke"}</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {loaded && rows.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-mute)", padding: 30 }}>No consents match filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && <ConsentModal consent={open} onClose={() => setOpen(null)} onSigned={() => load()} />}
    </>
  );
}
