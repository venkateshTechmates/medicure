"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { fmtTime } from "@/lib/fmt";
import StatusPill from "@/components/StatusPill";

type Folder = "results" | "messages" | "cosign" | "refills" | "staff" | "documents" | "consults";

interface InbasketItem {
  id: number;
  folder: Folder;
  patientId: number | null;
  patientName: string;
  title: string;
  subtitle: string;
  priority: "urgent" | "normal";
  createdAt: string;
  sourceType: string;
  sourceId: number;
}

interface Counts {
  results: number;
  messages: number;
  cosign: number;
  refills: number;
  staff: number;
  documents: number;
  consults: number;
  total: number;
}

const FOLDERS: { id: Folder; label: string }[] = [
  { id: "results",   label: "Results" },
  { id: "messages",  label: "Messages" },
  { id: "cosign",    label: "Cosign" },
  { id: "refills",   label: "Refills" },
  { id: "staff",     label: "Staff" },
  { id: "documents", label: "Documents" },
  { id: "consults",  label: "Consults" },
];

const EMPTY_COUNTS: Counts = { results: 0, messages: 0, cosign: 0, refills: 0, staff: 0, documents: 0, consults: 0, total: 0 };

export default function InbasketClient() {
  const [folder, setFolder] = useState<Folder>("results");
  const [items, setItems] = useState<InbasketItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const [delegOpen, setDelegOpen] = useState(false);
  const [deleg, setDeleg] = useState({ delegateUserId: "", folders: "results,messages,cosign", fromUtc: "", toUtc: "" });

  async function refreshCounts() {
    const c = await api<Counts>("/api/inbasket/counts").catch(() => EMPTY_COUNTS);
    setCounts(c);
  }

  async function refreshList(f: Folder) {
    const rows = await api<InbasketItem[]>(`/api/inbasket?folder=${f}`).catch(() => [] as InbasketItem[]);
    setItems(rows);
    if (rows.length > 0) {
      setActiveId(prev => rows.find(r => r.id === prev) ? prev : rows[0].id);
    } else {
      setActiveId(null);
    }
  }

  useEffect(() => { refreshCounts(); }, []);
  useEffect(() => { refreshList(folder); setReason(""); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [folder]);

  const active = useMemo(() => items.find(i => i.id === activeId) ?? null, [items, activeId]);

  async function act(action: "ack" | "complete" | "delegate" | "dismiss") {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/api/inbasket/${active.folder}/${active.sourceId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, reason }),
      });
      setReason("");
      await Promise.all([refreshList(folder), refreshCounts()]);
    } finally { setBusy(false); }
  }

  async function submitDelegate() {
    if (!deleg.delegateUserId || !deleg.fromUtc || !deleg.toUtc) return;
    setBusy(true);
    try {
      await api("/api/inbasket/delegate", {
        method: "POST",
        body: JSON.stringify({
          delegateUserId: Number(deleg.delegateUserId),
          folders: deleg.folders,
          fromUtc: new Date(deleg.fromUtc).toISOString(),
          toUtc: new Date(deleg.toUtc).toISOString(),
        }),
      });
      setDelegOpen(false);
      setDeleg({ delegateUserId: "", folders: "results,messages,cosign", fromUtc: "", toUtc: "" });
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Unified Inbasket</span>
          <h1 className="h1">Inbox</h1>
          <div className="meta">
            {counts.total} pending items · {counts.results} critical results · {counts.cosign} awaiting cosign
          </div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => { refreshList(folder); refreshCounts(); }}>Refresh</button>
          <button className="btn primary" onClick={() => setDelegOpen(true)}>
            Delegate <span className="arrow">→</span>
          </button>
        </div>
      </div>

      {delegOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(14,17,22,0.5)", zIndex: 999, display: "grid", placeItems: "center" }} onClick={() => setDelegOpen(false)}>
          <div className="card panel" onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 22, width: 460, maxWidth: "90vw" }}>
            <h2 style={{ marginTop: 0 }}>Out-of-office delegation</h2>
            <div className="cpoe-field"><label>Delegate user ID</label>
              <input value={deleg.delegateUserId} onChange={e => setDeleg(d => ({ ...d, delegateUserId: e.target.value }))} placeholder="e.g. 4" />
            </div>
            <div className="cpoe-field"><label>Folders (comma-separated)</label>
              <input value={deleg.folders} onChange={e => setDeleg(d => ({ ...d, folders: e.target.value }))} placeholder="results,messages,cosign" />
            </div>
            <div className="cpoe-field"><label>From (UTC)</label>
              <input type="datetime-local" value={deleg.fromUtc} onChange={e => setDeleg(d => ({ ...d, fromUtc: e.target.value }))} />
            </div>
            <div className="cpoe-field"><label>To (UTC)</label>
              <input type="datetime-local" value={deleg.toUtc} onChange={e => setDeleg(d => ({ ...d, toUtc: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn" onClick={() => setDelegOpen(false)}>Cancel</button>
              <div style={{ flex: 1 }} />
              <button className="btn primary" onClick={submitDelegate} disabled={busy || !deleg.delegateUserId || !deleg.fromUtc || !deleg.toUtc}>
                {busy ? "Saving…" : "Save delegation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, alignItems: "start" }}>
        {/* LEFT RAIL — folders */}
        <div className="card panel" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {FOLDERS.map(f => {
            const n = (counts as unknown as Record<Folder, number>)[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={`pill ${folder === f.id ? "info" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  border: "none",
                  background: folder === f.id ? "#eef3ff" : "transparent",
                  color: folder === f.id ? "#1f3a93" : "var(--ink, #0e1116)",
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{f.label}</span>
                {n > 0 && (
                  <span style={{
                    minWidth: 22, height: 20, padding: "0 6px",
                    background: folder === f.id ? "#1f3a93" : "#dde3ee",
                    color: folder === f.id ? "#fff" : "#0e1116",
                    borderRadius: 10, display: "grid", placeItems: "center",
                    fontSize: 11, fontWeight: 700,
                  }}>{n}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* CENTER + RIGHT */}
        <div className="inbox-grid" style={{ gridTemplateColumns: "1fr 380px" }}>
          {/* CENTER list */}
          <div className="inbox-list">
            {items.length === 0 && (
              <div className="muted" style={{ padding: 30, textAlign: "center", fontSize: 13 }}>
                Nothing in {folder}.
              </div>
            )}
            {items.map(it => (
              <div
                key={it.id}
                className={`inbox-row ${activeId === it.id ? "active" : ""} ${it.priority === "urgent" ? "crit" : ""}`}
                onClick={() => setActiveId(it.id)}
              >
                <div className="av" style={{
                  background: it.priority === "urgent" ? "#ffe7eb" : "#eef3ff",
                  color: it.priority === "urgent" ? "#b3263d" : "#1f3a93",
                  display: "grid", placeItems: "center", fontWeight: 700,
                }}>
                  {it.priority === "urgent" ? "!" : it.folder[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="top">
                    <div className="nm" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {it.patientName || it.title}
                    </div>
                    <div className="tm">{fmtTime(it.createdAt)}</div>
                  </div>
                  <div className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <b>{it.title}</b> · {it.subtitle}
                  </div>
                </div>
                <StatusPill kind={it.priority === "urgent" ? "bad" : "info"}>{it.priority}</StatusPill>
              </div>
            ))}
          </div>

          {/* RIGHT detail */}
          {active ? (
            <div className="card panel">
              <div className="row between" style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <h2 style={{ margin: 0 }}>{active.title}</h2>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {active.patientName ? `${active.patientName} · ` : ""}
                    {active.sourceType} #{active.sourceId} · {fmtTime(active.createdAt)}
                  </div>
                </div>
                <StatusPill kind={active.priority === "urgent" ? "bad" : "info"}>{active.priority}</StatusPill>
              </div>

              <div className="muted" style={{ fontSize: 13, marginBottom: 14, whiteSpace: "pre-wrap" }}>
                {active.subtitle}
              </div>

              <div className="cpoe-field" style={{ marginTop: 14 }}>
                <label>Action note (optional)</label>
                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Document the action taken on this item…" />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={() => act("ack")} disabled={busy}>
                  {busy ? "Working…" : "Ack"}
                </button>
                <button className="btn" onClick={() => act("complete")} disabled={busy}>Complete</button>
                <button className="btn" onClick={() => act("delegate")} disabled={busy}>Delegate</button>
                <button className="btn" onClick={() => act("dismiss")} disabled={busy}>Dismiss</button>
                {active.patientId && (
                  <a className="btn" href={`/patients/${active.patientId}`}>Open chart</a>
                )}
              </div>
            </div>
          ) : (
            <div className="card panel">
              <div className="muted" style={{ padding: 40, textAlign: "center" }}>All caught up.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
