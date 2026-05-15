"use client";
import { useEffect, useState } from "react";
import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { api } from "@/lib/api";
import type { Claim } from "@/lib/types";

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return s;
  }
}

function money(n: number | undefined) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function StatementsPage() {
  return (
    <PortalShell>
      <Statements />
    </PortalShell>
  );
}

function Statements() {
  const [items, setItems] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Claim[]>("/api/billing/claims?take=20");
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

  const totalDue = items.reduce((sum, c) => {
    const amt = c.amount ?? c.totalAmount ?? 0;
    return sum + amt * 0.2;
  }, 0);

  return (
    <>
      <header className="head">
        <div>
          <span className="eyebrow">Billing</span>
          <h1 className="h1">Statements & bills</h1>
          <p className="meta">Estimated patient responsibility (about 20% of total billed).</p>
        </div>
        <div className="card warm" style={{ minWidth: 220 }}>
          <div className="eyebrow">Estimated balance</div>
          <div className="h2" style={{ marginTop: 4 }}>{money(totalDue)}</div>
        </div>
      </header>

      {err ? <div className="card"><div className="error">{err}</div></div> : null}
      {loading ? <div className="card"><div className="skeleton" style={{ height: 120 }} /></div> : null}

      {!loading && items.length === 0 && !err ? (
        <div className="card"><p className="muted">No statements available.</p></div>
      ) : null}

      {!loading && items.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Service date</th>
              <th>Payer</th>
              <th>Total billed</th>
              <th>You owe (est.)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const total = c.amount ?? c.totalAmount ?? 0;
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.claimNumber || `#${c.id}`}</td>
                  <td>{fmtDate(c.serviceDate)}</td>
                  <td>{c.payer || "—"}</td>
                  <td>{money(total)}</td>
                  <td style={{ fontWeight: 700 }}>{money(total * 0.2)}</td>
                  <td>{c.status ? <StatusPill status={c.status} /> : <span className="muted">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </>
  );
}
