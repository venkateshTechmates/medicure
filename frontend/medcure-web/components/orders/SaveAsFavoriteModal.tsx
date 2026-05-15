"use client";
import { useEffect, useState } from "react";

// PRD §14.C — small modal launched from a CPOE order row to save the order as a favorite.

export interface SaveFavoriteInput {
  name: string;
  orderType: string;
  dose: string;
  route: string;
  frequency: string;
  indication: string;
  notes: string;
}

interface Props {
  open: boolean;
  initial: Partial<SaveFavoriteInput>;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (input: SaveFavoriteInput) => void;
}

export default function SaveAsFavoriteModal({ open, initial, busy, error, onClose, onSave }: Props) {
  const [name, setName] = useState(initial.name ?? "");
  const [orderType, setOrderType] = useState(initial.orderType ?? "Medication");
  const [dose, setDose] = useState(initial.dose ?? "");
  const [route, setRoute] = useState(initial.route ?? "");
  const [frequency, setFrequency] = useState(initial.frequency ?? "");
  const [indication, setIndication] = useState(initial.indication ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");

  useEffect(() => {
    if (open) {
      setName(initial.name ?? "");
      setOrderType(initial.orderType ?? "Medication");
      setDose(initial.dose ?? "");
      setRoute(initial.route ?? "");
      setFrequency(initial.frequency ?? "");
      setIndication(initial.indication ?? "");
      setNotes(initial.notes ?? "");
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save as favorite"
      style={{
        position: "fixed", inset: 0, background: "rgba(14,17,22,.55)",
        display: "grid", placeItems: "center", zIndex: 1000, padding: 20,
      }}
      onClick={() => !busy && onClose()}
    >
      <div
        className="card"
        style={{ maxWidth: 480, width: "100%", padding: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>⭐ Save as favorite</div>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 14 }}>
          Re-use this order on any patient. Saves to your account, this tenant only.
        </div>

        <div className="cpoe-field" style={{ marginBottom: 8 }}>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Albuterol PRN" />
        </div>
        <div className="cpoe-field" style={{ marginBottom: 8 }}>
          <label>Order type</label>
          <select value={orderType} onChange={e => setOrderType(e.target.value)}>
            <option>Medication</option>
            <option>Lab</option>
            <option>Imaging</option>
            <option>Nursing</option>
            <option>Consult</option>
            <option>Diet</option>
          </select>
        </div>
        <div className="field-row" style={{ marginBottom: 8 }}>
          <div className="cpoe-field"><label>Dose</label><input value={dose} onChange={e => setDose(e.target.value)} /></div>
          <div className="cpoe-field"><label>Route</label><input value={route} onChange={e => setRoute(e.target.value)} /></div>
          <div className="cpoe-field"><label>Frequency</label><input value={frequency} onChange={e => setFrequency(e.target.value)} /></div>
        </div>
        <div className="cpoe-field" style={{ marginBottom: 8 }}>
          <label>Indication</label>
          <input value={indication} onChange={e => setIndication(e.target.value)} />
        </div>
        <div className="cpoe-field" style={{ marginBottom: 8 }}>
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && (
          <div style={{ background: "#ffe7eb", color: "#b3263d", padding: 8, borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" disabled={busy} onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={busy || !name.trim()}
            onClick={() => onSave({ name: name.trim(), orderType, dose, route, frequency, indication, notes })}
          >
            {busy ? "Saving…" : "Save favorite"}
          </button>
        </div>
      </div>
    </div>
  );
}
