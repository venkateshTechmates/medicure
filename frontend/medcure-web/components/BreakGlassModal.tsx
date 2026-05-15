"use client";
import { useState } from "react";
import { api } from "@/lib/api";

const REASONS: { code: string; label: string }[] = [
  { code: "emergency-care",   label: "Emergency care" },
  { code: "cover-on-call",    label: "Cover / on-call" },
  { code: "prior-encounter",  label: "Prior encounter" },
  { code: "quality-review",   label: "Quality review" },
  { code: "legal-request",    label: "Legal request" },
];

type Props = {
  patientId: number;
  patientName?: string;
  mrn?: string;
  onAcknowledged: () => void;
};

export default function BreakGlassModal({ patientId, patientName, mrn, onAcknowledged }: Props) {
  const [code, setCode] = useState<string>(REASONS[0].code);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState<string | null>(null);

  async function acknowledge() {
    if (!text.trim()) { setErr("Please provide a brief reason."); return; }
    setBusy(true); setErr(null);
    try {
      await api("/api/audit/break-glass", {
        method: "POST",
        body: JSON.stringify({ patientId, reasonCode: code, reasonText: text.trim() }),
      });
      onAcknowledged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to record acknowledgement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bg-title"
      style={{
        position: "fixed", inset: 0, background: "rgba(15,18,28,.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <div
        className="card panel"
        style={{ width: 480, maxWidth: "94vw", padding: 22, background: "var(--surface, #fff)" }}
      >
        <div id="bg-title" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            display: "inline-flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
            borderRadius: 8, background: "#fff3df", color: "#a05a00", fontSize: 18,
          }}>!</span>
          <h2 style={{ margin: 0, fontSize: 18 }}>Break-glass access</h2>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
          {patientName ? `${patientName}${mrn ? " (MRN " + mrn + ")" : ""} is not on your care-team list.` : "This patient is not on your care-team list."}
          {" "}Accessing this chart will be logged and reviewed.
        </div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reason code</label>
        <select
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{ width: "100%", padding: 8, border: "1px solid #d6d9e0", borderRadius: 8, marginBottom: 12 }}
        >
          {REASONS.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Additional detail</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Brief clinical reason for access"
          rows={3}
          style={{ width: "100%", padding: 8, border: "1px solid #d6d9e0", borderRadius: 8, marginBottom: 8 }}
        />

        {err && <div style={{ color: "#b3263d", fontSize: 12, marginBottom: 8 }}>{err}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            className="btn primary"
            onClick={acknowledge}
            disabled={busy}
          >
            {busy ? "Recording..." : "Acknowledge and access"}
          </button>
        </div>
      </div>
    </div>
  );
}
