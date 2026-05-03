"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/fmt";
import type { PatientDetail } from "@/lib/types";

export default function PatientProfileClient() {
  const { mrn } = useParams<{ mrn: string }>();
  const [p, setP] = useState<PatientDetail | null>(null);
  useEffect(() => { if (mrn) api<PatientDetail>(`/api/patients/${mrn}`).then(setP).catch(() => {}); }, [mrn]);

  if (!p) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;

  return (
    <>
      <div className="bc-bar">
        <Link className="bc-link" href="/patients">Patients</Link><span>›</span>
        <Link className="bc-link" href={`/patients/${p.mrn}`}>{p.fullName}</Link><span>›</span>
        <span className="bc-cur">Profile</span>
      </div>

      <div className="head">
        <div>
          <span className="eyebrow">Demographics &amp; insurance</span>
          <h1 className="h1">Patient profile</h1>
          <div className="meta">{p.fullName} · MRN {p.mrn} · last verified today</div>
        </div>
        <div className="toolbar">
          <button className="btn">Print face sheet</button>
          <Link href={`/patients/${p.mrn}`} className="btn primary">Open chart →</Link>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="av" style={{ backgroundImage: `url(${p.avatarUrl})` }} />
          <div className="nm">{p.fullName}</div>
          <div className="mrn">{p.mrn}</div>
          <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <span className={`pill ${p.status}`}><span className="pdot" />{p.status === "good" ? "Stable" : p.status === "warn" ? "Watcher" : "Critical"}</span>
            <span className="pill">{p.codeStatus}</span>
          </div>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)", textAlign: "left" }}>
            <div className="bill-row"><span className="k">Age</span><span className="v">{p.age} y · {p.sex}</span></div>
            <div className="bill-row"><span className="k">Wt</span><span className="v">{p.weightKg} kg</span></div>
            <div className="bill-row"><span className="k">Ht</span><span className="v">{p.heightCm} cm</span></div>
            <div className="bill-row"><span className="k">Ward</span><span className="v">{p.ward} / {p.bed}</span></div>
            <div className="bill-row"><span className="k">Attending</span><span className="v">{p.attendingName}</span></div>
            <div className="bill-row"><span className="k">Primary RN</span><span className="v">{p.primaryRn}</span></div>
            <div className="bill-row"><span className="k">Admitted</span><span className="v">{fmtDate(p.admittedAt)}</span></div>
          </div>
        </div>

        <div>
          <div className="card panel">
            <h2>Demographics</h2>
            <div className="grid-2">
              <div className="info-block">
                <h4>Identity</h4>
                <div className="bill-row"><span className="k">Legal name</span><span className="v">{p.fullName}</span></div>
                <div className="bill-row"><span className="k">Preferred name</span><span className="v">{p.fullName.split(" ")[0]}</span></div>
                <div className="bill-row"><span className="k">DOB</span><span className="v">{fmtDate(new Date(Date.now() - p.age * 365 * 86400000).toISOString())}</span></div>
                <div className="bill-row"><span className="k">Sex</span><span className="v">{p.sex}</span></div>
                <div className="bill-row"><span className="k">Pronouns</span><span className="v">{p.sex === "F" ? "she/her" : "he/him"}</span></div>
                <div className="bill-row"><span className="k">Marital</span><span className="v">Single</span></div>
              </div>
              <div className="info-block">
                <h4>Contact</h4>
                <div className="bill-row"><span className="k">Phone</span><span className="v">{p.phone || "—"}</span></div>
                <div className="bill-row"><span className="k">Email</span><span className="v">{p.fullName.toLowerCase().replace(" ", ".")}@example.com</span></div>
                <div className="bill-row"><span className="k">Address</span><span className="v">{p.address || "142 Elm St, Cincinnati OH"}</span></div>
                <div className="bill-row"><span className="k">Emergency contact</span><span className="v">Eric (spouse)</span></div>
                <div className="bill-row"><span className="k">EC phone</span><span className="v">+1 (513) 555-0188</span></div>
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Insurance &amp; financial</h2>
            <div className="grid-2">
              <div className="info-block">
                <h4>Primary insurance</h4>
                <div className="bill-row"><span className="k">Payer</span><span className="v">{p.insurance || "Aetna PPO"}</span></div>
                <div className="bill-row"><span className="k">Plan</span><span className="v">Open Choice Gold</span></div>
                <div className="bill-row"><span className="k">Member ID</span><span className="v">W42117809</span></div>
                <div className="bill-row"><span className="k">Group</span><span className="v">812044</span></div>
                <div className="bill-row"><span className="k">Eligibility</span><span className="v" style={{ color: "var(--good)" }}>✓ Verified</span></div>
              </div>
              <div className="info-block">
                <h4>Financial</h4>
                <div className="bill-row"><span className="k">Account balance</span><span className="v">$401.80</span></div>
                <div className="bill-row"><span className="k">Last statement</span><span className="v">Jan 20</span></div>
                <div className="bill-row"><span className="k">Payment plan</span><span className="v">None</span></div>
                <div className="bill-row"><span className="k">Financial assistance</span><span className="v" style={{ color: "var(--ink-mute)" }}>Not enrolled</span></div>
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Clinical history snapshot</h2>
            <div className="grid-2">
              <div className="info-block">
                <h4>Active problems</h4>
                {p.problems.length === 0 && <div className="muted" style={{ fontSize: 12 }}>None recorded</div>}
                {p.problems.slice(0, 4).map(pr => (
                  <div key={pr.id} className="problem-pill">
                    <div><div className="nm">{pr.description}</div><div className="sub">since {fmtDate(pr.onset)}</div></div>
                    <span className="code">{pr.icdCode}</span>
                  </div>
                ))}
              </div>
              <div className="info-block">
                <h4>Allergies</h4>
                {p.allergies.length === 0 && <div className="muted" style={{ fontSize: 12 }}>NKA</div>}
                {p.allergies.slice(0, 4).map(a => (
                  <div key={a.id} className="problem-pill">
                    <div><div className="nm">{a.substance}</div><div className="sub">{a.reaction}</div></div>
                    <span className={`pill ${a.severity === "severe" ? "bad" : a.severity === "moderate" ? "warn" : "info"}`}><span className="pdot" />{a.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>Consent &amp; advanced directives</h2>
            <div className="grid-3">
              <div className="info-block"><h4>HIPAA</h4><div className="bill-total" style={{ fontSize: 22, color: "var(--good)" }}>✓ On file</div></div>
              <div className="info-block"><h4>Treatment consent</h4><div className="bill-total" style={{ fontSize: 22, color: "var(--good)" }}>✓ Signed</div></div>
              <div className="info-block"><h4>Living will</h4><div className="bill-total" style={{ fontSize: 22, color: "var(--ink-mute)" }}>—</div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
