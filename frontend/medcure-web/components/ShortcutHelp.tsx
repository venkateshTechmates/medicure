"use client";
import { useEffect } from "react";

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "/",        label: "Focus universal search" },
  { keys: "⌘K / Ctrl+K", label: "Open command palette" },
  { keys: "g p",      label: "Go to Patients" },
  { keys: "g i",      label: "Go to Inbasket" },
  { keys: "g o",      label: "Go to Overview" },
  { keys: "g l",      label: "Go to Labs" },
  { keys: "g m",      label: "Go to Messages" },
  { keys: "g a",      label: "Go to Appointments" },
  { keys: "g h",      label: "Go to Pharmacy" },
  { keys: "g e",      label: "Go to ED" },
  { keys: "g s",      label: "Go to Settings" },
  { keys: "n",        label: "New note" },
  { keys: "?",        label: "Show this help" },
  { keys: "Esc",      label: "Close overlay" },
];

export default function ShortcutHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.55)", zIndex: 1100,
               display: "grid", placeItems: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: 460, maxWidth: "92vw", padding: 0, boxShadow: "0 30px 80px -20px rgba(14,17,22,0.5)", overflow: "hidden" }}
      >
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Keyboard shortcuts</div>
          <kbd style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#f4f6f9", border: "1px solid var(--line)" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight: "70vh", overflowY: "auto", padding: 8 }}>
          {SHORTCUTS.map(s => (
            <div key={s.keys} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", borderRadius: 6,
            }}>
              <span style={{ fontSize: 13 }}>{s.label}</span>
              <kbd style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5,
                            background: "#f4f6f9", border: "1px solid var(--line)",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
