"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";

const SERIES = [
  { id: 1, ttl: "Localizer",        frames: "3 frames" },
  { id: 2, ttl: "Axial · soft tissue", frames: "142 frames" },
  { id: 3, ttl: "Coronal MIP",      frames: "84 frames" },
  { id: 4, ttl: "Sagittal",         frames: "120 frames" },
  { id: 5, ttl: "Lung window",      frames: "142 frames" },
  { id: 6, ttl: "Bone window",      frames: "142 frames" },
];

export default function ImagingClient() {
  const [active, setActive] = useState(2);
  const [frame, setFrame] = useState(67);
  const [studies, setStudies] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const rows = await api<Order[]>("/api/orders?type=Imaging&take=20").catch(() => [] as Order[]);
    setStudies(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function signRead() {
    if (!studies.length) { setMsg("No imaging orders pending"); return; }
    setBusy(true); setMsg(null);
    try {
      const next = studies.find(s => s.status !== "completed") ?? studies[0];
      await api(`/api/orders/${next.id}/complete`, { method: "POST" });
      setMsg(`✓ ${next.name} read & signed`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sign failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  const current = studies[0];

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Imaging · DICOM viewer · {studies.length} studies</span>
          <h1 className="h1">{current?.name ?? "CT Chest w/ Contrast"}</h1>
          <div className="meta">{current?.indication ?? "—"} · accession A{current?.id ?? "4421"} · ordered by {current?.orderedByName ?? "Dr. Okafor"} · status {current?.status ?? "ordered"}</div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn">Compare prior</button>
          <button className="btn">Download</button>
          <button className="btn primary" onClick={signRead} disabled={busy}>{busy ? "Signing…" : "Read & sign →"}</button>
        </div>
      </div>

      <div className="dicom-shell">
        <div className="dicom-side">
          <h4>Series</h4>
          {SERIES.map(s => (
            <div key={s.id} className={`series-row ${active === s.id ? "active" : ""}`} onClick={() => setActive(s.id)}>
              <div className="thumb-d">📷</div>
              <div>
                <div className="ttl">{s.ttl}</div>
                <div className="ct-frames">{s.frames}</div>
              </div>
            </div>
          ))}
          <h4 style={{ marginTop: 14 }}>Tools</h4>
          {["W/L window", "Pan / zoom", "Length", "Cobb angle", "ROI", "MPR", "MIP"].map(t => (
            <div key={t} className="series-row"><div className="thumb-d">🛠</div><div className="ttl">{t}</div></div>
          ))}
        </div>

        <div>
          <div className="viewer">
            <div className="dicom-img" />
            <div className="viewer-tools">
              {["W/L", "+", "−", "↻", "↔", "⊕"].map(t => <button key={t}>{t}</button>)}
            </div>
            <div className="viewer-info">
              <span>Series {active} · Frame {frame}/142</span>
              <span>WL 40 / WW 400 · Soft tissue</span>
              <span>Acc A4421 · CT Chest</span>
            </div>
          </div>
          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Frame slider</h2>
            <input type="range" min={1} max={142} value={frame} onChange={e => setFrame(+e.target.value)} style={{ width: "100%" }} />
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Slice {frame} of 142 · {(frame * 1.25).toFixed(2)} mm</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card panel">
            <h2>Findings</h2>
            <div className="cpoe-field"><label>Lungs</label><textarea rows={3} defaultValue="Bilateral lower-lobe ground-glass opacities with septal thickening. No focal consolidation. No pneumothorax." /></div>
            <div className="cpoe-field"><label>Mediastinum</label><textarea rows={2} defaultValue="No lymphadenopathy. Heart size normal." /></div>
            <div className="cpoe-field"><label>Impression</label><textarea rows={3} defaultValue="Findings consistent with multifocal pneumonia / ARDS pattern. Correlate with clinical picture." /></div>
          </div>

          <div className="side-card-sm">
            <h4>Order details</h4>
            <div className="info-row"><span className="k">Indication</span><span className="v">SOB, hypoxia</span></div>
            <div className="info-row"><span className="k">Contrast</span><span className="v">100 mL Omnipaque</span></div>
            <div className="info-row"><span className="k">Tech</span><span className="v">D. Park CT</span></div>
            <div className="info-row"><span className="k">Acquired</span><span className="v">09:42</span></div>
            <div className="info-row"><span className="k">Status</span><span className="v"><span className="pill warn"><span className="pdot" />Awaiting read</span></span></div>
          </div>
        </div>
      </div>
    </>
  );
}
