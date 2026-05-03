"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/fmt";
import type { Order } from "@/lib/types";

const AUDIT = [
  { t: "10:14 today", h: "Order entered",       b: "Dr. Achebe · CPOE" },
  { t: "10:14 today", h: "CDS alerts triggered", b: "1 warn (therapeutic duplication)" },
  { t: "10:16 today", h: "Order signed",         b: "Dr. Achebe · attestation captured" },
  { t: "10:18 today", h: "Routed to pharmacy",   b: "Auto · queued for verification" },
];

export default function OrderDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);

  useEffect(() => { if (id) api<Order>(`/api/orders/${id}`).then(setO).catch(() => {}); }, [id]);

  async function act(path: string) {
    await api(`/api/orders/${id}/${path}`, { method: "POST" });
    api<Order>(`/api/orders/${id}`).then(setO);
  }

  if (!o) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/cpoe">Orders</a><span>›</span>
        <span className="bc-cur">{o.name}</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Order detail</span>
          <h1 className="h1">{o.name}</h1>
          <div className="meta">
            {o.dose} · {o.route} · {o.frequency} · indication: {o.indication || "—"}
          </div>
        </div>
        <div className="toolbar">
          <span className={`pill ${o.status === "verified" ? "good" : o.status === "draft" ? "warn" : o.status === "administered" ? "info" : ""}`}>
            <span className="pdot" />{o.status}
          </span>
          {o.status === "draft" && <button className="btn primary" onClick={() => act("sign")}>Sign</button>}
          {o.status === "signed" && <button className="btn primary" onClick={() => act("verify")}>Verify (pharmacist)</button>}
          {o.status === "verified" && <button className="btn primary" onClick={() => act("administer")}>Administer</button>}
        </div>
      </div>

      <div className="bill-grid">
        <div>
          <div className="card panel">
            <h2>Order details</h2>
            <div className="grid-2">
              <div className="info-block">
                <h4>Medication</h4>
                <div className="bill-row"><span className="k">Drug</span><span className="v">{o.name}</span></div>
                <div className="bill-row"><span className="k">Dose</span><span className="v">{o.dose}</span></div>
                <div className="bill-row"><span className="k">Route</span><span className="v">{o.route}</span></div>
                <div className="bill-row"><span className="k">Frequency</span><span className="v">{o.frequency}</span></div>
                <div className="bill-row"><span className="k">Duration</span><span className="v">{o.duration ?? "—"}</span></div>
              </div>
              <div className="info-block">
                <h4>Routing &amp; status</h4>
                <div className="bill-row"><span className="k">Ordered by</span><span className="v">{o.orderedByName}</span></div>
                <div className="bill-row"><span className="k">Signed</span><span className="v">{o.signedAt ? `${fmtDate(o.signedAt)} ${fmtTime(o.signedAt)}` : "—"}</span></div>
                <div className="bill-row"><span className="k">Verified by</span><span className="v">{o.verifiedByName ?? "—"}</span></div>
                <div className="bill-row"><span className="k">Verified at</span><span className="v">{o.verifiedAt ? `${fmtDate(o.verifiedAt)} ${fmtTime(o.verifiedAt)}` : "—"}</span></div>
                <div className="bill-row"><span className="k">Priority</span><span className="v">{o.priority}</span></div>
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Clinical decision support</h2>
            <div className="cds info">
              <div className="t">ℹ Pediatric dose verified</div>
              For 31 kg patient · {o.dose} is within recommended pediatric range. No adjustment needed.
            </div>
            <div className="cds warn">
              <div className="t">⚠ Therapeutic duplication</div>
              Patient already has active <b>{o.name}</b> on med list. Consider canceling existing Rx before signing this order.
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Replace existing</button>
                <button className="btn" style={{ fontSize: 11, padding: "6px 10px" }}>Override with reason</button>
              </div>
            </div>
            <div className="cds info">
              <div className="t">ℹ Allergy check</div>
              No interaction with documented allergies. Safe to administer.
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Audit trail</h2>
            <div className="tl">
              {AUDIT.map((e, i) => (
                <div key={i} className="tl-item">
                  <div className="t">{e.t}</div>
                  <div className="h">{e.h}</div>
                  <div className="b">{e.b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Cost &amp; supply</div>
            <div className="bill-row"><span className="k">Per dose</span><span className="v">$8.40</span></div>
            <div className="bill-row"><span className="k">Per day</span><span className="v">$50.40</span></div>
            <div className="bill-row"><span className="k">Course total</span><span className="v">$352.80</span></div>
            <div className="bill-row"><span className="k">Insurance</span><span className="v" style={{ color: "var(--good)" }}>✓ Covered</span></div>
            <div className="bill-row"><span className="k">Pharmacy stock</span><span className="v" style={{ color: "var(--good)" }}>14 on hand</span></div>
            <div className="bill-row"><span className="k">Turnaround</span><span className="v">~ 25 min</span></div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Patient context</div>
            <div className="bill-row"><span className="k">HR</span><span className="v">96 bpm</span></div>
            <div className="bill-row"><span className="k">BP</span><span className="v">118/76</span></div>
            <div className="bill-row"><span className="k">Temp</span><span className="v">36.9 °C</span></div>
            <div className="bill-row"><span className="k">Lactate</span><span className="v">1.2 mmol/L</span></div>
            <div className="bill-row"><span className="k">qSOFA</span><span className="v">0</span></div>
            <div className="bill-row"><span className="k">CrCl</span><span className="v">92 mL/min</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
