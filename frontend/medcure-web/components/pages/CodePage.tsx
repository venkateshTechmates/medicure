"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import type { CodeEvent } from "@/lib/types";

const STEMI_STEPS = [
  "Bedside arrival",
  "EKG obtained (≤10 min)",
  "Cards paged",
  "Cath lab activated",
  "ASA + Heparin given",
  "Transfer to cath lab",
  "Wire crossed",
  "Balloon up (door-to-balloon)",
];

const BLUE_STEPS = [
  "Bedside arrival",
  "Airway secured",
  "Compressions started",
  "First defibrillation",
  "Epi 1 mg IV",
  "Rhythm check",
  "ROSC",
  "Post-arrest care",
];

interface TimelineEntry { at: string; label: string; done: boolean }

export default function CodePage({ kind }: { kind: "STEMI" | "Blue" }) {
  const [event, setEvent] = useState<CodeEvent | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [stepBusy, setStepBusy] = useState<string | null>(null);
  const [resolveBusy, setResolveBusy] = useState(false);
  const [recentCodes, setRecentCodes] = useState<CodeEvent[]>([]);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  async function loadRecent() {
    const list = await api<CodeEvent[]>(`/api/codes?kind=${kind}&take=10`).catch(() => [] as CodeEvent[]);
    setRecentCodes(list);
  }
  useEffect(() => { loadRecent(); }, [kind]);

  // Tick the elapsed counter while activated
  useEffect(() => {
    if (event && event.status === "active") {
      const start = new Date(event.activatedAt).getTime();
      tickRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [event]);

  async function activate() {
    const ev = await api<CodeEvent>("/api/codes/activate", { method: "POST", body: JSON.stringify({
      kind, location: kind === "STEMI" ? "ED Bay 4" : "ICU-2"
    }) });
    setEvent(ev);
    setSeconds(0);
    await loadRecent();
  }

  async function logStep(label: string) {
    if (!event) return;
    setStepBusy(label);
    try {
      const ev = await api<CodeEvent>(`/api/codes/${event.id}/step`, { method: "POST", body: JSON.stringify({ label }) });
      setEvent(ev);
    } finally { setStepBusy(null); }
  }

  async function resolve(outcome: string) {
    if (!event) return;
    setResolveBusy(true);
    try {
      await api(`/api/codes/${event.id}/resolve`, { method: "POST", body: JSON.stringify({ outcome }) });
      setEvent(null);
      setSeconds(0);
      await loadRecent();
    } finally { setResolveBusy(false); }
  }

  const goal = kind === "STEMI" ? 90 * 60 : 0;
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const steps = kind === "STEMI" ? STEMI_STEPS : BLUE_STEPS;
  const timeline: TimelineEntry[] = event ? JSON.parse(event.timelineJson || "[]") : [];
  const completed = new Set(timeline.map(t => t.label));

  return (
    <>
      <PageHeader
        eyebrow={event ? "Live activation · in progress" : "Activation panel"}
        title={`Code ${kind}`}
        sub={kind === "STEMI" ? "Door-to-balloon goal: 90 minutes." : "Adult resuscitation."}
        actions={
          event
            ? <StatusPill kind="bad">ACTIVATED</StatusPill>
            : <button className="btn primary" onClick={activate}>Activate Code {kind} →</button>
        }
      />

      {event && (
        <>
          <div className="card" style={{ textAlign: "center", padding: 40, background: "#0e1116", color: "#fff", borderRadius: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: "#9aa0ad" }}>Elapsed since activation</div>
            <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 110, lineHeight: 1, marginTop: 8, letterSpacing: "-0.02em", color: kind === "STEMI" && seconds > goal ? "#ff4d6b" : "#ffd633" }}>{mm}:{ss}</div>
            {kind === "STEMI" && (
              <div style={{ fontSize: 13, marginTop: 8, color: "#9aa0ad" }}>
                Goal {goal / 60} min · {seconds < goal ? `${Math.floor((goal - seconds) / 60)}m to go` : `${Math.floor((seconds - goal) / 60)}m past goal`}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#9aa0ad", marginTop: 12 }}>
              Activated by {event.activatedBy} · {event.location} · {new Date(event.activatedAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Steps</h2>
            <div className="grid-2" style={{ marginTop: 10 }}>
              {steps.map((label, i) => {
                const done = completed.has(label);
                return (
                  <button
                    key={label}
                    className="btn"
                    disabled={done || stepBusy === label}
                    onClick={() => logStep(label)}
                    style={{
                      padding: "12px 14px",
                      justifyContent: "flex-start",
                      background: done ? "#dff7e7" : "#fafbfc",
                      border: `1px solid ${done ? "#27c26b" : "var(--line)"}`,
                      color: done ? "#1a8a48" : "var(--ink)",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: 999, background: done ? "#27c26b" : "var(--ink-mute)", color: "#fff", display: "inline-grid", placeItems: "center", fontSize: 11, marginRight: 10 }}>
                      {done ? "✓" : i + 1}
                    </span>
                    {label}
                    {stepBusy === label && <span className="muted" style={{ marginLeft: "auto", fontSize: 11 }}>logging…</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Live timeline · {timeline.length} events</h2>
            {timeline.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < timeline.length - 1 ? "1px dashed var(--line)" : "none", fontSize: 13 }}>
                <span><b style={{ fontFamily: "JetBrains Mono, monospace", marginRight: 12 }}>{new Date(e.at).toLocaleTimeString()}</b> {e.label}</span>
                <span className="pill good"><span className="pdot" />done</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn primary" onClick={() => resolve("ROSC")} disabled={resolveBusy}>{resolveBusy ? "Resolving…" : "Resolve · ROSC"}</button>
            <button className="btn" onClick={() => resolve("Transferred")} disabled={resolveBusy}>Transferred</button>
            <button className="btn" onClick={() => resolve("Deceased")} disabled={resolveBusy}>Deceased</button>
            <button className="btn" onClick={() => resolve("False alarm")} disabled={resolveBusy}>False alarm</button>
          </div>
        </>
      )}

      {!event && (
        <div className="card panel" style={{ marginTop: 14 }}>
          <h2>Recent {kind} codes ({recentCodes.length})</h2>
          {recentCodes.length === 0 && <div className="muted" style={{ fontSize: 12 }}>No previous {kind} activations recorded.</div>}
          {recentCodes.map(c => {
            const ms = c.resolvedAt ? new Date(c.resolvedAt).getTime() - new Date(c.activatedAt).getTime() : Date.now() - new Date(c.activatedAt).getTime();
            const min = Math.floor(ms / 60000);
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, padding: "10px 0", borderBottom: "1px dashed var(--line)", alignItems: "center", fontSize: 13 }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{new Date(c.activatedAt).toLocaleString()}</span>
                <span>{c.location} · activated by {c.activatedBy}</span>
                <span className="muted">{min}m</span>
                <span className={`pill ${c.status === "active" ? "bad" : c.outcome === "ROSC" ? "good" : "info"}`}>
                  <span className="pdot" />{c.status === "active" ? "ACTIVE" : c.outcome || "resolved"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
