"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import StatusPill from "@/components/StatusPill";

interface CdsRule {
  id: number;
  ruleKey: string;
  name: string;
  family: string;
  severity: string;
  enabled: boolean;
  message: string;
  threshold: string;
}

interface FatigueRow {
  ruleKey: string;
  fires: number;
  overrides: number;
  overrideRate: number;
}

const FAMILIES = [
  "all",
  "drug-drug",
  "drug-allergy",
  "drug-disease",
  "dose-range",
  "duplicate",
  "beers",
  "pregnancy",
  "indication",
  "formulary",
];

const SEVERITIES = ["info", "warn", "hard-stop"];

function sevKind(sev: string): "good" | "warn" | "bad" | "info" {
  if (sev === "hard-stop") return "bad";
  if (sev === "warn") return "warn";
  return "info";
}

export default function CdsRulesClient() {
  const [rules, setRules] = useState<CdsRule[]>([]);
  const [fatigue, setFatigue] = useState<FatigueRow[]>([]);
  const [familyFilter, setFamilyFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const [rs, ft] = await Promise.all([
        api<CdsRule[]>("/api/cds/rules"),
        api<FatigueRow[]>("/api/cds/fatigue"),
      ]);
      setRules(rs);
      setFatigue(ft);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => { load(); }, []);

  const fatigueByKey = useMemo(() => {
    const m = new Map<string, FatigueRow>();
    for (const r of fatigue) m.set(r.ruleKey, r);
    return m;
  }, [fatigue]);

  const filtered = familyFilter === "all" ? rules : rules.filter(r => r.family === familyFilter);

  async function patch(id: number, body: { enabled?: boolean; severity?: string }) {
    setBusyId(id); setErr(null);
    try {
      const updated = await api<CdsRule>(`/api/cds/rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setRules(rs => rs.map(r => (r.id === id ? updated : r)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="bc-bar">
        <span className="bc-link">Admin</span>
        <span>›</span>
        <span className="bc-cur">CDS rules</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">CDS Rules</h1>
          <div className="meta">
            {rules.length} configured · {rules.filter(r => r.enabled).length} active · trailing-30-day fire counts
          </div>
        </div>
        <div className="toolbar">
          <select
            value={familyFilter}
            onChange={e => setFamilyFilter(e.target.value)}
            style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 999, padding: "8px 14px", fontWeight: 600, fontSize: 13 }}
          >
            {FAMILIES.map(f => (
              <option key={f} value={f}>{f === "all" ? "All families" : f}</option>
            ))}
          </select>
          <a className="btn" href="/admin/cds-fatigue">Fatigue report →</a>
        </div>
      </div>

      {err && (
        <div style={{ background: "#ffe7eb", color: "#b3263d", padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          {err}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f4f6f9", color: "var(--ink-mute)", textTransform: "uppercase", fontSize: 11, letterSpacing: ".04em" }}>
              <th style={{ textAlign: "left", padding: "12px 18px" }}>Rule</th>
              <th style={{ textAlign: "left", padding: "12px 12px" }}>Family</th>
              <th style={{ textAlign: "left", padding: "12px 12px" }}>Severity</th>
              <th style={{ textAlign: "left", padding: "12px 12px" }}>Enabled</th>
              <th style={{ textAlign: "right", padding: "12px 12px" }}>Fires (30d)</th>
              <th style={{ textAlign: "right", padding: "12px 18px" }}>Overrides (30d)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "var(--ink-mute)" }}>No rules in this family.</td></tr>
            )}
            {filtered.map(r => {
              const f = fatigueByKey.get(r.ruleKey);
              return (
                <tr key={r.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 18px" }}>
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{r.ruleKey}</div>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span className="pill">{r.family}</span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <select
                      value={r.severity}
                      disabled={busyId === r.id}
                      onChange={e => patch(r.id, { severity: e.target.value })}
                      style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 10px", fontWeight: 600, fontSize: 12 }}
                    >
                      {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span style={{ marginLeft: 8 }}>
                      <StatusPill kind={sevKind(r.severity)}>{r.severity}</StatusPill>
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        disabled={busyId === r.id}
                        onChange={e => patch(r.id, { enabled: e.target.checked })}
                      />
                      <span style={{ fontSize: 12, color: r.enabled ? "var(--good)" : "var(--ink-mute)", fontWeight: 600 }}>
                        {r.enabled ? "On" : "Off"}
                      </span>
                    </label>
                  </td>
                  <td style={{ padding: "12px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {f?.fires ?? 0}
                  </td>
                  <td style={{ padding: "12px 18px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {f?.overrides ?? 0}
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
