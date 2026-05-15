"use client";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
}

export default function AppointmentsPage() {
  return (
    <PortalShell>
      <Appointments />
    </PortalShell>
  );
}

function Appointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Appointment[]>("/api/appointments?take=20");
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
          <span className="eyebrow">Care schedule</span>
          <h1 className="h1">Appointments</h1>
          <p className="meta">Your upcoming and recent visits.</p>
        </div>
      </header>

      {err ? <div className="card"><div className="error">{err}</div></div> : null}
      {loading ? <div className="card"><div className="skeleton" style={{ height: 120 }} /></div> : null}

      {!loading && items.length === 0 && !err ? (
        <div className="card"><p className="muted">No appointments yet.</p></div>
      ) : null}

      {!loading && items.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Provider</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{fmtDate(a.startsAt)}</td>
                <td>{a.type || "—"}</td>
                <td>{a.providerName || "—"}</td>
                <td>{a.location || "—"}</td>
                <td>{a.status ? <StatusPill status={a.status} /> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
