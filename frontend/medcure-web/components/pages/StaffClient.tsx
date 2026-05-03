"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StaffMember } from "@/lib/types";

export default function StaffClient() {
  const [rows, setRows] = useState<StaffMember[]>([]);
  useEffect(() => { api<StaffMember[]>("/api/staff").then(setRows).catch(() => {}); }, []);

  const active = rows.filter(s => s.status === "active").length;
  const onCall = rows.reduce((s, r) => s + r.onCallHours, 0);

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">Directory · This organization</div>
          <h1 className="h1">Staff</h1>
          <div className="meta">{rows.length} providers · {active} active · {onCall} on-call hours scheduled</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search by name, role, specialty…" />
          </div>
          <button className="btn primary">Onboard staff <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="lbl"><span className="si">●</span>Total staff</div><div className="num">{rows.length}</div><div className="delta">all roles</div></div>
        <div className="stat-card"><div className="lbl"><span className="si g">●</span>Active</div><div className="num">{active}</div><div className="delta">scheduled</div></div>
        <div className="stat-card"><div className="lbl"><span className="si b">●</span>On-call</div><div className="num">{onCall}h</div><div className="delta">total this week</div></div>
        <div className="stat-card"><div className="lbl"><span className="si y">●</span>Open shifts</div><div className="num">3</div><div className="delta">unfilled</div></div>
      </div>

      <table className="table">
        <thead><tr><th>Name</th><th>Role</th><th>Specialty</th><th>Patients</th><th>Inbox</th><th>On-call</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.userId}>
              <td>
                <div className="name-cell">
                  <div className="pic" style={{ backgroundImage: s.avatarUrl ? `url(${s.avatarUrl})` : undefined }} />
                  <div><div className="nm">{s.fullName}</div><div className="mrn">{s.email}</div></div>
                </div>
              </td>
              <td><span className="pill info"><span className="pdot" />{s.title || s.role}</span></td>
              <td>{s.specialty}</td>
              <td>{s.patientsCount}</td>
              <td>{s.inboxCount}</td>
              <td>{s.onCallHours}h</td>
              <td><span className={`pill ${s.status === "active" ? "good" : s.status === "pending" ? "warn" : "info"}`}><span className="pdot" />{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
