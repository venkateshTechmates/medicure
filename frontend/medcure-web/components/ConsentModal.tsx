"use client";
import { useRef, useState } from "react";
import SignaturePad, { SignaturePadHandle } from "@/components/SignaturePad";
import { api } from "@/lib/api";
import type { Consent } from "@/lib/types";

interface Props {
  consent: Consent;
  onClose: () => void;
  onSigned?: (c: Consent) => void;
}

export default function ConsentModal({ consent, onClose, onSigned }: Props) {
  const padPatient = useRef<SignaturePadHandle>(null);
  const padWitness = useRef<SignaturePadHandle>(null);
  const [ack, setAck] = useState(false);
  const [patientName, setPatientName] = useState(consent.signedByPatientName ?? "");
  const [witnessName, setWitnessName] = useState(consent.witnessName ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!ack) { setErr("Please acknowledge that you have read and understood."); return; }
    if (!patientName.trim()) { setErr("Patient name is required."); return; }
    if (padPatient.current?.isEmpty()) { setErr("Patient signature is required."); return; }
    if (consent.requiredWitness) {
      if (!witnessName.trim()) { setErr("Witness name is required."); return; }
      if (padWitness.current?.isEmpty()) { setErr("Witness signature is required."); return; }
    }

    setBusy(true);
    try {
      const signed = await api<Consent>(`/api/consents/${consent.id}/sign`, {
        method: "POST",
        body: JSON.stringify({
          signedByPatientName: patientName,
          signatureDataUrl: padPatient.current?.getDataUrl() ?? "",
          witnessName: consent.requiredWitness ? witnessName : null,
          witnessSignatureDataUrl: consent.requiredWitness ? padWitness.current?.getDataUrl() : null,
        }),
      });
      onSigned?.(signed);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card panel"
        style={{ width: "min(720px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0 }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{consent.title}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", textTransform: "capitalize" }}>{consent.kind} consent</div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div style={{ overflow: "auto", padding: 18 }}>
          <div style={{ fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: 8, padding: 12, background: "var(--surface, #fff)", maxHeight: 200, overflow: "auto" }}>
            {consent.bodyText}
          </div>

          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "12px 0", fontSize: 13 }}>
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />
            <span>I have read and understood this consent. I have had the opportunity to ask questions and they have been answered to my satisfaction.</span>
          </label>

          <div className="cpoe-field">
            <label>Patient full name</label>
            <input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Type full legal name" />
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Patient signature</div>
            <SignaturePad ref={padPatient} ariaLabel="Patient signature" />
            <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" type="button" onClick={() => padPatient.current?.clear()}>Clear</button>
            </div>
          </div>

          {consent.requiredWitness && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Witness</div>
              <div className="cpoe-field">
                <label>Witness full name</label>
                <input value={witnessName} onChange={e => setWitnessName(e.target.value)} placeholder="Witness name" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Witness signature</div>
              <SignaturePad ref={padWitness} ariaLabel="Witness signature" />
              <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" type="button" onClick={() => padWitness.current?.clear()}>Clear</button>
              </div>
            </div>
          )}

          {err && <div style={{ marginTop: 12, fontSize: 12, color: "var(--bad)" }}>{err}</div>}
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? "Signing…" : "Sign consent"}</button>
        </div>
      </div>
    </div>
  );
}
