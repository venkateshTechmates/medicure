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
  const [modOpen, setModOpen] = useState(false);
  const [dcOpen, setDcOpen]   = useState(false);

  useEffect(() => { if (id) api<Order>(`/api/orders/${id}`).then(setO).catch(() => {}); }, [id]);

  async function act(path: string) {
    await api(`/api/orders/${id}/${path}`, { method: "POST" });
    api<Order>(`/api/orders/${id}`).then(setO);
  }

  function reload() { if (id) api<Order>(`/api/orders/${id}`).then(setO).catch(() => {}); }

  if (!o) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;

  const canAmend = o.status === "signed" || o.status === "verified";

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
          <span className={`pill ${o.status === "verified" ? "good" : o.status === "draft" ? "warn" : o.status === "administered" ? "info" : o.status === "discontinued" ? "bad" : ""}`}>
            <span className="pdot" />{o.status}
          </span>
          {o.status === "draft" && <button className="btn primary" onClick={() => act("sign")}>Sign</button>}
          {o.status === "signed" && <button className="btn primary" onClick={() => act("verify")}>Verify (pharmacist)</button>}
          {o.status === "verified" && <button className="btn primary" onClick={() => act("administer")}>Administer</button>}
          {o.status === "verbal-pending-cosign" && <button className="btn primary" onClick={() => act("cosign")}>Cosign</button>}
          {canAmend && <button className="btn" onClick={() => setModOpen(true)}>Modify</button>}
          {canAmend && <button className="btn" onClick={() => setDcOpen(true)}>Discontinue</button>}
        </div>
      </div>

      {modOpen && (
        <ModifyModal id={Number(id)} order={o} onClose={() => setModOpen(false)} onSaved={() => { setModOpen(false); reload(); }} />
      )}
      {dcOpen && (
        <DiscontinueModal id={Number(id)} onClose={() => setDcOpen(false)} onSaved={() => { setDcOpen(false); reload(); }} />
      )}

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

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(15,18,28,.55)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900,
};
const dlg: React.CSSProperties = {
  width: 480, maxWidth: "94vw", padding: 22, background: "#fff",
};
const inp: React.CSSProperties = {
  width: "100%", padding: 8, border: "1px solid #d6d9e0", borderRadius: 8, fontSize: 13, marginBottom: 10,
};

function ModifyModal({
  id, order, onClose, onSaved,
}: { id: number; order: Order; onClose: () => void; onSaved: () => void }) {
  const [dose, setDose]           = useState(order.dose ?? "");
  const [frequency, setFrequency] = useState(order.frequency ?? "");
  const [route, setRoute]         = useState(order.route ?? "");
  const [notes, setNotes]         = useState(order.notes ?? "");
  const [reason, setReason]       = useState("");
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) { setErr("Reason is required."); return; }
    setBusy(true); setErr(null);
    try {
      const updates: Record<string, string> = {};
      if (dose      !== order.dose)      updates.dose      = dose;
      if (frequency !== order.frequency) updates.frequency = frequency;
      if (route     !== order.route)     updates.route     = route;
      if (notes     !== order.notes)     updates.notes     = notes;
      await api(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ updates, reason: reason.trim() }),
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Modify failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <div className="card panel" style={dlg}>
        <h2 style={{ margin: "0 0 10px 0" }}>Modify order</h2>
        <label style={lbl}>Dose</label>
        <input value={dose} onChange={e => setDose(e.target.value)} style={inp} />
        <label style={lbl}>Route</label>
        <input value={route} onChange={e => setRoute(e.target.value)} style={inp} />
        <label style={lbl}>Frequency</label>
        <input value={frequency} onChange={e => setFrequency(e.target.value)} style={inp} />
        <label style={lbl}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
        <label style={lbl}>Reason for change *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} />
        {err && <div style={{ color: "#b3263d", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}

function DiscontinueModal({
  id, onClose, onSaved,
}: { id: number; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) { setErr("Reason is required."); return; }
    setBusy(true); setErr(null);
    try {
      await api(`/api/orders/${id}/discontinue`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Discontinue failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" style={overlay}>
      <div className="card panel" style={dlg}>
        <h2 style={{ margin: "0 0 10px 0" }}>Discontinue order</h2>
        <div className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
          The order will be marked as discontinued and removed from the active list.
        </div>
        <label style={lbl}>Reason *</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} />
        {err && <div style={{ color: "#b3263d", fontSize: 12, marginBottom: 8 }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={busy}>{busy ? "Submitting..." : "Discontinue"}</button>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 };
