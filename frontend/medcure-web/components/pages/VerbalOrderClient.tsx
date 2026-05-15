"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";
import type { Order } from "@/lib/types";

export default function VerbalOrderClient() {
  const [patientId, setPatientId]     = useState("");
  const [drugName, setDrugName]       = useState("");
  const [dose, setDose]               = useState("");
  const [route, setRoute]             = useState("PO");
  const [frequency, setFrequency]     = useState("");
  const [indication, setIndication]   = useState("");
  const [orderingMdId, setOrderingMdId] = useState("");
  const [busy, setBusy]               = useState(false);
  const [err, setErr]                 = useState<string | null>(null);
  const [ok, setOk]                   = useState<string | null>(null);
  const [pending, setPending]         = useState<Order[]>([]);

  async function loadPending() {
    try {
      const rows = await api<Order[]>(`/api/orders?status=verbal-pending-cosign&take=50`);
      setPending(rows);
    } catch { setPending([]); }
  }

  useEffect(() => { loadPending(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(null);
    try {
      const body = {
        patientId: Number(patientId),
        drugName, dose, route, frequency, indication,
        orderingMdId: Number(orderingMdId),
      };
      const created = await api<Order>("/api/orders/verbal", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setOk(`Verbal order #${created.id} recorded. Awaiting MD cosign within 24h.`);
      setDrugName(""); setDose(""); setFrequency(""); setIndication("");
      loadPending();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to record verbal order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">CPOE · Nursing</span>
          <h1 className="h1">Verbal / telephone order</h1>
          <div className="meta">Record an order received verbally; the ordering MD must cosign within 24 hours.</div>
        </div>
        <div className="toolbar">
          <Link href="/cpoe" className="btn">Back to CPOE</Link>
        </div>
      </div>

      <div className="bill-grid">
        <div>
          <form className="card panel" onSubmit={submit}>
            <h2>New verbal order</h2>
            <div className="grid-2" style={{ marginTop: 8 }}>
              <Field label="Patient ID *">
                <input value={patientId} onChange={e => setPatientId(e.target.value)} required style={inp} />
              </Field>
              <Field label="Ordering MD (user ID) *">
                <input value={orderingMdId} onChange={e => setOrderingMdId(e.target.value)} required style={inp} />
              </Field>
              <Field label="Drug *">
                <input value={drugName} onChange={e => setDrugName(e.target.value)} required style={inp} />
              </Field>
              <Field label="Dose *">
                <input value={dose} onChange={e => setDose(e.target.value)} required style={inp} />
              </Field>
              <Field label="Route">
                <select value={route} onChange={e => setRoute(e.target.value)} style={inp}>
                  {["PO", "IV", "IM", "SC", "PR", "TOP", "INH"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Frequency">
                <input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. q6h" style={inp} />
              </Field>
              <Field label="Indication">
                <input value={indication} onChange={e => setIndication(e.target.value)} style={inp} />
              </Field>
            </div>
            {err && <div style={{ color: "#b3263d", fontSize: 12, marginTop: 4 }}>{err}</div>}
            {ok  && <div style={{ color: "var(--good, #27c26b)", fontSize: 12, marginTop: 4 }}>{ok}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Saving..." : "Record verbal order"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="card panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Pending cosign</div>
              <span className="muted" style={{ fontSize: 12 }}>{pending.length}</span>
            </div>
            {pending.length === 0 && <div className="muted" style={{ fontSize: 12 }}>No pending verbal orders.</div>}
            {pending.map(o => (
              <Link href={`/orders/${o.id}`} key={o.id} className="med-row" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="ic">{o.name.slice(0, 2)}</div>
                <div>
                  <div className="nm">{o.name} {o.dose}</div>
                  <div className="sub">{o.route} · {o.frequency} · {o.signedAt ? fmtDate(o.signedAt) : fmtTime(o.createdAt ?? "")}</div>
                </div>
                <span className="pill warn"><span className="pdot" />pending cosign</span>
              </Link>
            ))}
          </div>
        </div>
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
