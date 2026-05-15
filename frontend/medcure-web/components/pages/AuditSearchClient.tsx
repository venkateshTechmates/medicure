"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";

interface AuditRow {
  id: number;
  userId?: number | null;
  action: string;
  resource: string;
  detail: string;
  at: string;
  kind: string;
  reason: string;
  targetPatientId?: number | null;
}

const KIND_OPTIONS = [
  { v: "",                    l: "Any" },
  { v: "break_glass",         l: "Break-glass" },
  { v: "order_modified",      l: "Order modified" },
  { v: "order_discontinued",  l: "Order discontinued" },
  { v: "order_verbal_entered",l: "Verbal order entered" },
  { v: "order_cosigned",      l: "Order cosigned" },
];

export default function AuditSearchClient() {
  const [userId, setUserId]       = useState("");
  const [patientId, setPatientId] = useState("");
  const [kind, setKind]           = useState("");
  const [fromUtc, setFromUtc]     = useState("");
  const [toUtc, setToUtc]         = useState("");
  const [rows, setRows]           = useState<AuditRow[]>([]);
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);
  const [total, setTotal]         = useState<number | null>(null);

  async function runSearch() {
    setBusy(true); setErr(null);
    const qs = new URLSearchParams();
    if (userId)    qs.set("userId", userId);
    if (patientId) qs.set("patientId", patientId);
    if (kind)      qs.set("kind", kind);
    if (fromUtc)   qs.set("fromUtc", new Date(fromUtc).toISOString());
    if (toUtc)     qs.set("toUtc", new Date(toUtc).toISOString());
    qs.set("take", "200");
    try {
      const data = await api<AuditRow[]>(`/api/audit/search?${qs.toString()}`);
      setRows(data);
      setTotal(data.length);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Search failed.");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const header = ["id", "at", "userId", "kind", "targetPatientId", "action", "resource", "reason", "detail"];
    const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
    const lines = [
      header.join(","),
      ...rows.map(r => [
        r.id,
        r.at,
        r.userId ?? "",
        r.kind,
        r.targetPatientId ?? "",
        escape(r.action),
        escape(r.resource),
        escape(r.reason),
        escape(r.detail),
      ].join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-search-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Admin · Compliance</span>
          <h1 className="h1">Audit search</h1>
          <div className="meta">
            Search audit log across users, patients, kinds, and date ranges.
            {total !== null && ` · ${total} result${total === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</button>
          <button className="btn primary" onClick={runSearch} disabled={busy}>
            {busy ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <div className="card panel" style={{ marginBottom: 14 }}>
        <h2>Filters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 8 }}>
          <Field label="User ID">
            <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g. 42" style={inp} />
          </Field>
          <Field label="Patient ID">
            <input value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="e.g. 7" style={inp} />
          </Field>
          <Field label="Kind">
            <select value={kind} onChange={e => setKind(e.target.value)} style={inp}>
              {KIND_OPTIONS.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
            </select>
          </Field>
          <Field label="From (UTC)">
            <input type="datetime-local" value={fromUtc} onChange={e => setFromUtc(e.target.value)} style={inp} />
          </Field>
          <Field label="To (UTC)">
            <input type="datetime-local" value={toUtc} onChange={e => setToUtc(e.target.value)} style={inp} />
          </Field>
        </div>
        {err && <div style={{ color: "#b3263d", fontSize: 12, marginTop: 8 }}>{err}</div>}
      </div>

      <div className="card panel">
        <h2>Results</h2>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Kind</th>
              <th>Target patient</th>
              <th>Reason</th>
              <th>IP / source</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="muted" style={{ padding: 18, textAlign: "center" }}>
                {busy ? "Searching..." : "No results yet. Set filters and search."}
              </td></tr>
            )}
            {rows.map(r => {
              const isBG = r.kind === "break_glass";
              const rowStyle = isBG
                ? { background: "#fff3f5", borderLeft: "3px solid #b3263d" }
                : undefined;
              return (
                <tr key={r.id} style={rowStyle}>
                  <td>{fmtDate(r.at)} {fmtTime(r.at)}</td>
                  <td>{r.userId ?? "-"}</td>
                  <td>
                    <span className={`pill ${isBG ? "bad" : "info"}`}>
                      <span className="pdot" />{r.kind || r.action}
                    </span>
                  </td>
                  <td>{r.targetPatientId ?? "-"}</td>
                  <td>{r.reason || "-"}</td>
                  <td className="muted">{r.detail || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: 8, border: "1px solid #d6d9e0", borderRadius: 8, fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
