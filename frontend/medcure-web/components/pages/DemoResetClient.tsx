"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// PRD §14.X — admin UI to wipe & reseed mutable demo data and to drop in a canned scenario.

interface ResetResponse {
  tenantId: number;
  counts: Record<string, number>;
}

interface ScenarioResponse {
  scenario: string;
  patientId: number | null;
  edArrivalId: number | null;
  orderIds: number[];
  url: string;
}

const SCENARIOS: { id: string; title: string; body: string }[] = [
  { id: "sepsis",        title: "Sepsis",         body: "Drops one inpatient with elevated NEWS2 vitals and an active 7-order sepsis bundle." },
  { id: "chest-pain-ed", title: "ED Chest Pain",  body: "Adds an ED arrival with chest pain, EMS, ESI 2; pending troponin order." },
];

export default function DemoResetClient() {
  const router = useRouter();
  const [busyReset, setBusyReset] = useState(false);
  const [busyScenario, setBusyScenario] = useState<string | null>(null);
  const [reset, setReset] = useState<ResetResponse | null>(null);
  const [scenario, setScenario] = useState<ScenarioResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function doReset() {
    if (confirmText !== "RESET") { setErr('Type "RESET" to confirm.'); return; }
    setBusyReset(true); setErr(null); setReset(null); setScenario(null);
    try {
      const res = await api<ResetResponse>("/api/demo/reset", { method: "POST" });
      setReset(res);
      setConfirmText("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusyReset(false);
    }
  }

  async function runScenario(name: string) {
    setBusyScenario(name); setErr(null); setScenario(null);
    try {
      const res = await api<ScenarioResponse>(`/api/demo/scenario/${name}`, { method: "POST" });
      setScenario(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scenario failed");
    } finally {
      setBusyScenario(null);
    }
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Demo reset</h1>
          <div className="meta">Admin · §14.X · Wipes mutable demo data for this tenant and reseeds a small baseline.</div>
        </div>
      </div>

      <div className="cpoe-grid" style={{ marginTop: 16 }}>
        <div>
          <div className="card panel">
            <h2>Reset tenant demo data</h2>
            <div className="sub">
              Deletes patients, orders, vitals, labs, notes, messages, claims, ED arrivals, favorites, audit, etc.
              Users, tenants, and tenant memberships are preserved. The operation is idempotent.
            </div>

            <div className="cpoe-field" style={{ marginTop: 12 }}>
              <label>Type <b>RESET</b> to confirm</label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="RESET"
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn primary"
                onClick={doReset}
                disabled={busyReset || confirmText !== "RESET"}
              >
                {busyReset ? "Resetting…" : "Wipe & reseed"}
              </button>
            </div>

            {reset && (
              <div style={{ marginTop: 14, background: "#e6f8ec", color: "#1a8a48", padding: 10, borderRadius: 8, fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>✓ Tenant {reset.tenantId} reset.</div>
                <table className="table" style={{ fontSize: 11, width: "100%" }}>
                  <thead><tr><th>Entity</th><th style={{ textAlign: "right" }}>Count</th></tr></thead>
                  <tbody>
                    {Object.entries(reset.counts).map(([k, v]) => (
                      <tr key={k}><td>{k}</td><td style={{ textAlign: "right" }}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card panel">
            <h2>Canned scenarios</h2>
            <div className="sub">Drops a small synthetic clinical scenario into the current tenant.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {SCENARIOS.map(s => (
                <div key={s.id} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4, marginBottom: 8 }}>{s.body}</div>
                  <button
                    className="btn"
                    disabled={busyScenario === s.id}
                    onClick={() => runScenario(s.id)}
                  >
                    {busyScenario === s.id ? "Loading…" : `Load ${s.title}`}
                  </button>
                </div>
              ))}
            </div>

            {scenario && (
              <div style={{ marginTop: 14, background: "#eaf3ff", color: "#0a6cf0", padding: 10, borderRadius: 8, fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Scenario "{scenario.scenario}" loaded</div>
                <div>Patient #{scenario.patientId ?? "—"} · {scenario.orderIds.length} order{scenario.orderIds.length === 1 ? "" : "s"} created.</div>
                <button
                  className="btn primary"
                  style={{ marginTop: 8 }}
                  onClick={() => router.push(scenario.url)}
                >
                  Open → {scenario.url}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {err && (
        <div style={{ marginTop: 14, background: "#ffe7eb", color: "#b3263d", padding: 10, borderRadius: 8, fontSize: 12 }}>
          {err}
        </div>
      )}
    </>
  );
}
