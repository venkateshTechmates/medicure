"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDateShort } from "@/lib/fmt";
import type { PatientSummary, PinnedPatient, RecentPatient } from "@/lib/types";

type TabKind = "all" | "mine" | "pinned" | "recent";

export default function PatientsListClient() {
  const [rows, setRows] = useState<PatientSummary[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKind>("all");
  const [pinned, setPinned] = useState<PinnedPatient[]>([]);
  const [recents, setRecents] = useState<RecentPatient[]>([]);

  const pinnedMrns = useMemo(() => new Set(pinned.map(p => p.mrn)), [pinned]);

  useEffect(() => {
    api<PinnedPatient[]>("/api/pinned").then(setPinned).catch(() => setPinned([]));
    api<RecentPatient[]>("/api/recents").then(setRecents).catch(() => setRecents([]));
  }, []);

  useEffect(() => {
    if (tab === "pinned" || tab === "recent") return; // those use their own data sources
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tab === "mine") params.set("scope", "mine");
    api<PatientSummary[]>(`/api/patients?${params}`).then(setRows).catch(() => {});
  }, [q, tab]);

  async function togglePin(mrn: string) {
    if (pinnedMrns.has(mrn)) {
      await api(`/api/pinned/${encodeURIComponent(mrn)}`, { method: "DELETE" }).catch(() => {});
    } else {
      await api(`/api/pinned/${encodeURIComponent(mrn)}`, { method: "POST" }).catch(() => {});
    }
    const fresh = await api<PinnedPatient[]>("/api/pinned").catch(() => []);
    setPinned(fresh);
  }

  // Adapter — surface pinned/recent results as PatientSummary-like rows.
  const displayRows: PatientSummary[] = useMemo(() => {
    if (tab === "pinned") {
      return pinned.map(p => ({
        id: p.id, mrn: p.mrn, fullName: p.fullName, age: 0, sex: "",
        status: p.status, ward: p.ward, bed: p.bed, attendingName: "",
        admittedAt: p.pinnedAt, avatarUrl: p.avatarUrl,
      }));
    }
    if (tab === "recent") {
      return recents.map(p => ({
        id: p.id, mrn: p.mrn, fullName: p.fullName, age: 0, sex: "",
        status: p.status, ward: p.ward, bed: p.bed, attendingName: "",
        admittedAt: p.viewedAt, avatarUrl: p.avatarUrl,
      }));
    }
    return rows;
  }, [tab, rows, pinned, recents]);

  const total    = displayRows.length;
  const critical = displayRows.filter(p => p.status === "bad").length;
  const watching = displayRows.filter(p => p.status === "warn").length;
  const stable   = displayRows.filter(p => p.status === "good").length;

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Clinical · Active census</div>
          <h1 className="h1">Patients</h1>
          <div className="meta">{total} admitted · {critical} critical · {watching} watching — last update just now</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search by MRN, name, DOB, phone…" value={q} onChange={e => setQ(e.target.value)} />
            <span style={{ color: "var(--ink-mute)", fontSize: 11, fontWeight: 600 }}>⌘K</span>
          </div>
          <button className="btn">
            Filters
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          </button>
          <Link href="/admit" className="btn primary">
            Admit Patient
            <span className="arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
            </span>
          </Link>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 12 }}>
        {(["all", "mine", "pinned", "recent"] as TabKind[]).map(k => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
            {k === "all" ? "All" : k === "mine" ? "Mine" : k === "pinned" ? `Pinned (${pinned.length})` : `Recent (${recents.length})`}
          </button>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="lbl"><span className="si">●</span>Total</div>
          <div className="num">{total}</div>
          <div className="delta"><span className="up">▲ 4.2%</span> vs yesterday</div>
        </div>
        <div className="stat-card">
          <div className="lbl"><span className="si y">●</span>Critical</div>
          <div className="num">{critical}</div>
          <div className="delta">requires attention</div>
        </div>
        <div className="stat-card">
          <div className="lbl"><span className="si b">●</span>Watching</div>
          <div className="num">{watching}</div>
          <div className="delta">monitor closely</div>
        </div>
        <div className="stat-card">
          <div className="lbl"><span className="si g">●</span>Stable</div>
          <div className="num">{stable}</div>
          <div className="delta">avg LOS 3.4 days</div>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr><th /><th>Patient</th><th>Ward</th><th>Status</th><th>Vitals</th><th>Attending</th><th>Admitted</th><th /></tr>
        </thead>
        <tbody>
          {displayRows.map(p => {
            const isPinned = pinnedMrns.has(p.mrn);
            return (
              <tr key={`${p.mrn}-${p.id}`}>
                <td style={{ width: 32 }}>
                  <button
                    title={isPinned ? "Unpin" : "Pin"}
                    onClick={() => togglePin(p.mrn)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, cursor: "pointer",
                      border: "1px solid var(--line)", background: isPinned ? "var(--accent)" : "#fafbfc",
                      display: "grid", placeItems: "center",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </td>
                <td>
                  <Link href={`/patients/${p.mrn}`} className="name-cell">
                    <div className="pic" style={{ backgroundImage: `url(${p.avatarUrl})` }} />
                    <div>
                      <div className="nm">{p.fullName}</div>
                      <div className="mrn">{p.mrn}{p.age ? ` · ${p.age} yrs` : ""}</div>
                    </div>
                  </Link>
                </td>
                <td>{p.ward} · {p.bed}</td>
                <td><span className={`pill ${p.status}`}><span className="pdot" />{labelFor(p.status)}</span></td>
                <td>
                  <span className="vital-mini"><span className="v">{p.hr ?? "—"}</span><span className="l">HR</span></span>{" "}
                  <span className="vital-mini"><span className="v">{p.sbp ? `${p.sbp}/${p.dbp}` : "—"}</span><span className="l">BP</span></span>{" "}
                  <span className="vital-mini"><span className="v">{p.spo2 ?? "—"}%</span><span className="l">SpO₂</span></span>
                </td>
                <td>{p.attendingName}</td>
                <td style={{ color: "var(--ink-mute)" }}>{fmtDateShort(p.admittedAt)}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/patients/${p.mrn}`}><button title="Chart"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></button></Link>
                    <Link href="/messages"><button title="Message"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button></Link>
                    <button title="More"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function labelFor(status: string) {
  switch (status) {
    case "good": return "Stable";
    case "warn": return "Watch";
    case "bad":  return "Critical";
    default:     return status;
  }
}
