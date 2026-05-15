"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatusPill from "@/components/StatusPill";

interface FatigueRow {
  ruleKey: string;
  name: string;
  family: string;
  severity: string;
  fires: number;
  overrides: number;
  overrideRate: number; // 0..1
}

const FATIGUE_THRESHOLD = 0.7;

function sevKind(sev: string): "good" | "warn" | "bad" | "info" {
  if (sev === "hard-stop") return "bad";
  if (sev === "warn") return "warn";
  return "info";
}

export default function CdsFatigueClient() {
  const [rows, setRows] = useState<FatigueRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<FatigueRow[]>("/api/cds/fatigue")
      .then(setRows)
      .catch(e => setErr(e instanceof Error ? e.message : "Load failed"));
  }, []);

  const maxFires = Math.max(1, ...rows.map(r => r.fires));
  const fatigued = rows.filter(r => r.overrideRate > FATIGUE_THRESHOLD && r.fires > 0);

  return (
    <>
      <div className="bc-bar">
        <span className="bc-link">Admin</span>
        <span>›</span>
        <span className="bc-cur">CDS fatigue</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">CDS Alert Fatigue</h1>
          <div className="meta">
            Trailing 30 days · {rows.length} rules tracked · {fatigued.length} above {Math.round(FATIGUE_THRESHOLD * 100)}% override rate
          </div>
        </div>
        <div className="toolbar">
          <a className="btn" href="/admin/cds-rules">← Manage rules</a>
        </div>
      </div>

      {err && (
        <div style={{ background: "#ffe7eb", color: "#b3263d", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          {err}
        </div>
      )}

      {fatigued.length > 0 && (
        <div className="card" style={{ marginBottom: 14, background: "#fff3df", borderLeft: "4px solid #ffb84d" }}>
          <div style={{ fontWeight: 700, color: "#a05a00", marginBottom: 6 }}>
            ⚠ Alert fatigue detected on {fatigued.length} rule{fatigued.length === 1 ? "" : "s"}
          </div>
          <div style={{ fontSize: 12, color: "#a05a00" }}>
            Override rate &gt; {Math.round(FATIGUE_THRESHOLD * 100)}% suggests these rules are being routinely dismissed — consider tightening thresholds or downgrading severity.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f4f6f9", color: "var(--ink-mute)", textTransform: "uppercase", fontSize: 11, letterSpacing: ".04em" }}>
              <th style={{ textAlign: "left", padding: "12px 18px" }}>Rule</th>
              <th style={{ textAlign: "left", padding: "12px 12px" }}>Family</th>
              <th style={{ textAlign: "left", padding: "12px 12px" }}>Severity</th>
              <th style={{ textAlign: "right", padding: "12px 12px" }}>Fires</th>
              <th style={{ textAlign: "right", padding: "12px 12px" }}>Overrides</th>
              <th style={{ textAlign: "left", padding: "12px 18px", width: "30%" }}>Override rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "var(--ink-mute)" }}>No data yet.</td></tr>
            )}
            {rows.map(r => {
              const pct = Math.round(r.overrideRate * 100);
              const fatigueRow = r.overrideRate > FATIGUE_THRESHOLD && r.fires > 0;
              const firesPct = Math.round((r.fires / maxFires) * 100);
              return (
                <tr key={r.ruleKey} style={{
                  borderTop: "1px solid var(--line)",
                  background: fatigueRow ? "#fff8ec" : undefined,
                }}>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{r.ruleKey}</div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span className="pill">{r.family}</span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <StatusPill kind={sevKind(r.severity)}>{r.severity}</StatusPill>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <div style={{
                        background: "#e6efff",
                        height: 6, width: 60, borderRadius: 3, overflow: "hidden",
                      }}>
                        <div style={{ background: "#1a4fb3", height: "100%", width: `${firesPct}%` }} />
                      </div>
                      <span>{r.fires}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {r.overrides}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        background: "#f4f6f9",
                        height: 8, flex: 1, borderRadius: 4, overflow: "hidden",
                      }}>
                        <div style={{
                          background: fatigueRow ? "#ff4d6b" : pct > 40 ? "#ffb84d" : "#27c26b",
                          height: "100%", width: `${pct}%`,
                          transition: "width .3s",
                        }} />
                      </div>
                      <span style={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 700,
                        color: fatigueRow ? "#b3263d" : "var(--ink-soft)",
                        minWidth: 42,
                        textAlign: "right",
                      }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
