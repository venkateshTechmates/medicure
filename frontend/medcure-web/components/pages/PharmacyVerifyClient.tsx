"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

const RIGHTS = ["Right patient", "Right drug", "Right dose", "Right route", "Right time", "Right indication", "Right monitoring", "Allergy check"];

export default function PharmacyVerifyClient() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const [o, setO] = useState<Order | null>(null);
  const [checks, setChecks] = useState<boolean[]>(RIGHTS.map(() => false));
  useEffect(() => { if (orderId) api<Order>(`/api/orders/${orderId}`).then(setO).catch(() => {}); }, [orderId]);

  async function verify() {
    if (!checks.every(Boolean)) return;
    await api(`/api/orders/${orderId}/verify`, { method: "POST" });
    router.push("/pharmacy");
  }

  if (!o) return <div className="muted">Loading…</div>;

  return (
    <>
      <Breadcrumbs crumbs={[{ label: "Pharmacy", href: "/pharmacy" }, { label: "Verify" }]} />
      <div className="card" style={{ marginBottom: 14 }}>
        <h1 className="h2">{o.name}</h1>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {o.dose} · {o.route} · {o.frequency} · Indication: {o.indication}
        </div>
        <div style={{ marginTop: 8 }}><StatusPill kind={o.priority === "Stat" ? "bad" : o.priority === "Urgent" ? "warn" : "info"}>{o.priority}</StatusPill></div>
      </div>

      <div className="card">
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>7-rights verification</h3>
        {RIGHTS.map((r, i) => (
          <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
            <input type="checkbox" checked={checks[i]} onChange={e => setChecks(c => c.map((v, j) => j === i ? e.target.checked : v))} />
            <span style={{ fontWeight: 600 }}>{r}</span>
          </label>
        ))}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <button className="btn primary" disabled={!checks.every(Boolean)} onClick={verify}>Verify &amp; dispense</button>
          <button className="btn">Hold / clarify</button>
          <button className="btn danger">Reject</button>
        </div>
      </div>
    </>
  );
}
