"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatusPill from "@/components/StatusPill";
import type { StatusKind } from "@/lib/types";

type TransitionType = "admission" | "transfer" | "discharge";
type ActionType = "" | "continue" | "hold" | "modify" | "stop" | "new";

interface ReconLine {
  id: number;
  reconciliationId: number;
  drugName: string;
  dose: string;
  route: string;
  frequency: string;
  source: string;       // home | inpatient | prior
  action: ActionType;
  actionReason: string;
  newDose: string;
}

interface ReconHeader {
  id: number;
  encounterId: number;
  patientId: number;
  transitionType: TransitionType;
  status: string;          // draft | completed | blocked
  performedByUserId?: number | null;
  completedAt?: string | null;
  notes: string;
}

interface ReconResponse {
  header: ReconHeader | null;
  lines: ReconLine[];
}

const TABS: { id: TransitionType; label: string }[] = [
  { id: "admission", label: "Admission"  },
  { id: "transfer",  label: "Transfer"   },
  { id: "discharge", label: "Discharge"  },
];

const ACTIONS: { id: ActionType; label: string }[] = [
  { id: "",         label: "—"        },
  { id: "continue", label: "Continue" },
  { id: "hold",     label: "Hold"     },
  { id: "modify",   label: "Modify"   },
  { id: "stop",     label: "Stop"     },
  { id: "new",      label: "New"      },
];

function statusKind(s: string | undefined): StatusKind {
  if (s === "completed") return "good";
  if (s === "blocked")   return "bad";
  return "warn"; // draft / unknown
}

export default function MedReconciliationClient({ encounterId }: { encounterId: string }) {
  const encId = Number(encounterId);

  const [tab, setTab] = useState<TransitionType>("admission");
  const [header, setHeader] = useState<ReconHeader | null>(null);
  const [lines, setLines]   = useState<ReconLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg]   = useState<string | null>(null);

  // Hash-routed tabs: #admission / #transfer / #discharge
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const h = location.hash.slice(1) as TransitionType;
      if (h && TABS.some(t => t.id === h)) setTab(h);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const load = useCallback(async () => {
    if (!encId) return;
    setLoading(true);
    try {
      const r = await api<ReconResponse>(`/api/med-rec/${encId}?transitionType=${tab}`);
      setHeader(r.header);
      setLines(r.lines || []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [encId, tab]);

  useEffect(() => { load(); }, [load]);

  function changeTab(next: TransitionType) {
    setTab(next);
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#${next}`);
    }
  }

  async function ensureHeader(): Promise<ReconHeader | null> {
    if (header) return header;
    // Create an empty draft so the user can add lines.
    setBusy(true);
    try {
      const created = await api<{ header: ReconHeader; lines: ReconLine[] }>("/api/med-rec", {
        method: "POST",
        body: JSON.stringify({
          encounterId: encId,
          patientId: 0,
          transitionType: tab,
          lines: [],
          notes: "",
        }),
      });
      setHeader(created.header);
      setLines(created.lines || []);
      return created.header;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not start reconciliation");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function patchLine(id: number, patch: Partial<Pick<ReconLine, "action" | "actionReason" | "newDose">>) {
    // optimistic
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } as ReconLine : l));
    try {
      await api<ReconLine>(`/api/med-rec/lines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
      await load();
    }
  }

  async function addNewMed() {
    const h = await ensureHeader();
    if (!h) return;
    setBusy(true);
    try {
      // Re-POST a single line by recreating; easier: create the line via a fresh recon-with-single-line create
      // Actually we need a per-line create. We'll just re-create header with the new line included — instead use
      // PATCH endpoint design: there's no POST line endpoint, but we can leverage the create endpoint by
      // calling it with merged lines. Simpler: append by issuing a new create with combined lines + delete old?
      // To keep it correct, call the PATCH on a freshly created blank line by reusing create with current list.
      const merged = [
        ...lines.map(l => ({
          drugName: l.drugName, dose: l.dose, route: l.route, frequency: l.frequency,
          source: l.source, action: l.action, actionReason: l.actionReason, newDose: l.newDose,
        })),
        { drugName: "New medication", dose: "", route: "", frequency: "", source: "home", action: "new" as ActionType, actionReason: "", newDose: "" },
      ];
      const created = await api<{ header: ReconHeader; lines: ReconLine[] }>("/api/med-rec", {
        method: "POST",
        body: JSON.stringify({
          encounterId: encId,
          patientId: h.patientId,
          transitionType: tab,
          lines: merged,
          notes: h.notes,
        }),
      });
      setHeader(created.header);
      setLines(created.lines || []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Add med failed");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!header) return;
    setBusy(true); setMsg(null);
    try {
      const updated = await api<ReconHeader>(`/api/med-rec/${header.id}/complete`, { method: "POST" });
      setHeader(updated);
      setMsg("Reconciliation completed");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not complete");
    } finally {
      setBusy(false);
    }
  }

  const allReconciled = lines.length > 0 && lines.every(l => l.action && l.action.length > 0);
  const isComplete = header?.status === "completed";

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/patients">Patients</a><span>›</span>
        <a className="bc-link" href={`/patients`}>Encounter {encId}</a><span>›</span>
        <span className="bc-cur">Medication reconciliation</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Clinical · Patient safety</span>
          <h1 className="h1">Medication reconciliation</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>Encounter <b>#{encId}</b></span>
            <span>·</span>
            <StatusPill kind={statusKind(header?.status)}>{header?.status ?? "not started"}</StatusPill>
            {header?.completedAt && <span>· completed {new Date(header.completedAt).toLocaleString()}</span>}
          </div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("block") ? "var(--bad)" : "var(--good)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={addNewMed} disabled={busy || isComplete}>+ Add new med</button>
          <button
            className="btn primary"
            disabled={busy || isComplete || !header || !allReconciled}
            onClick={complete}
            title={!allReconciled ? "All lines must have an action" : ""}
          >
            {busy ? "Working…" : "Complete reconciliation"}
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 14, marginBottom: 14 }}>
        {TABS.map(t => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={(e) => { e.preventDefault(); changeTab(t.id); }}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="card panel">
        <div className="lh">
          <h3>Medication lines</h3>
          <span className="muted">{lines.length} · {lines.filter(l => l.action).length} reconciled</span>
        </div>

        {loading && <div className="muted" style={{ padding: 20 }}>Loading…</div>}
        {!loading && lines.length === 0 && (
          <div className="muted" style={{ padding: 30, textAlign: "center" }}>
            No medication lines yet. Click <b>+ Add new med</b> to begin.
          </div>
        )}

        {lines.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Drug</th>
                <th>Dose</th>
                <th>Route</th>
                <th>Frequency</th>
                <th>Source</th>
                <th>Action</th>
                <th>Reason / New dose</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id}>
                  <td><b>{l.drugName}</b></td>
                  <td>{l.dose || "—"}</td>
                  <td>{l.route || "—"}</td>
                  <td>{l.frequency || "—"}</td>
                  <td><span className="pill info"><span className="pdot" />{l.source}</span></td>
                  <td>
                    <select
                      value={l.action}
                      disabled={isComplete}
                      onChange={(e) => patchLine(l.id, { action: e.target.value as ActionType })}
                      style={{ padding: "4px 6px", borderRadius: 6 }}
                    >
                      {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </td>
                  <td style={{ minWidth: 240 }}>
                    <input
                      type="text"
                      placeholder={l.action === "modify" ? "New dose…" : "Reason (optional)"}
                      value={l.action === "modify" ? l.newDose : l.actionReason}
                      disabled={isComplete}
                      onChange={(e) => {
                        if (l.action === "modify") patchLine(l.id, { newDose: e.target.value });
                        else patchLine(l.id, { actionReason: e.target.value });
                      }}
                      style={{ padding: "4px 8px", borderRadius: 6, width: "100%" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!allReconciled && lines.length > 0 && !isComplete && (
        <div className="cds warn" style={{ marginTop: 14 }}>
          <div className="t">⚠ Unreconciled lines</div>
          All lines must have an action before the reconciliation can be completed.
        </div>
      )}
    </>
  );
}
