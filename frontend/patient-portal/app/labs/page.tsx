"use client";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { api } from "@/lib/api";
import type { LabResult } from "@/lib/types";

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return s;
  }
}

export default function LabsPage() {
  return (
    <PortalShell>
      <Labs />
    </PortalShell>
  );
}

function Labs() {
  const [items, setItems] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<LabResult[]>("/api/labs?take=20");
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="head">
        <div>
          <span className="eyebrow">Diagnostics</span>
          <h1 className="h1">Lab results</h1>
          <p className="meta">Your most recent laboratory and diagnostic results.</p>
        </div>
      </header>

      {err ? <div className="card"><div className="error">{err}</div></div> : null}
      {loading ? <div className="card"><div className="skeleton" style={{ height: 120 }} /></div> : null}

      {!loading && items.length === 0 && !err ? (
        <div className="card"><p className="muted">No lab results available.</p></div>
      ) : null}

      {!loading && items.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Result</th>
              <th>Reference</th>
              <th>Resulted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.testName || l.name || "—"}</td>
                <td>
                  {l.resultValue || l.value || "—"} {l.unit || ""}
                </td>
                <td className="muted">{l.referenceRange || "—"}</td>
                <td>{fmtDate(l.resultedAt || l.observedAt || l.collectedAt)}</td>
                <td>{l.status ? <StatusPill status={l.status} /> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
