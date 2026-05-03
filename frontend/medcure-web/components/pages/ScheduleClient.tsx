"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PatientSummary } from "@/lib/types";

const VTYPES = [
  { n: "New consult", d: "60 min" },
  { n: "Follow-up",   d: "30 min" },
  { n: "Procedure",   d: "90 min · stress test" },
  { n: "Telehealth",  d: "20 min · video" },
  { n: "Pre-op",      d: "45 min" },
  { n: "Imaging",     d: "30 min" },
];

const PROVIDERS = [
  { n: "Dr. Hae-jin Park",   r: "Cardiology",       npi: "1457809321", next: "Tue 11/12 · 11:00", pic: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop&crop=faces" },
  { n: "Dr. Aanya Patel",    r: "Cardiology",       npi: "1456712224", next: "Wed 11/13 · 09:30", pic: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=120&h=120&fit=crop&crop=faces" },
  { n: "Dr. Marcus Cheng",   r: "Cardiology · IC",  npi: "1454412345", next: "Mon 11/11 · 14:30", pic: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&crop=faces" },
  { n: "Dr. Sofia Mendez",   r: "Cardiology",       npi: "1453398212", next: "Thu 11/14 · 10:15", pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces" },
];

const SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

export default function ScheduleClient() {
  const router = useRouter();
  const [vtype, setVtype] = useState("Follow-up");
  const [provider, setProvider] = useState("Dr. Hae-jin Park");
  const [day, setDay] = useState(12);
  const [slot, setSlot] = useState("11:00");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [pat, setPat] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api<PatientSummary[]>("/api/patients?take=20").then(rows => {
      setPatients(rows);
      if (rows.length) setPat(rows[0].id);
    }).catch(() => {});
  }, []);

  const me = patients.find(p => p.id === pat);
  const dur = vtype === "Procedure" ? 90 : vtype === "New consult" ? 60 : vtype === "Pre-op" ? 45 : vtype === "Imaging" ? 30 : 30;

  async function confirm() {
    if (!pat) { setMsg("Pick a patient"); return; }
    setBusy(true); setMsg(null);
    try {
      const [hh, mm] = slot.split(":").map(Number);
      const start = new Date();
      start.setMonth(10); start.setDate(day); start.setHours(hh, mm, 0, 0);
      await api("/api/appointments", { method: "POST", body: JSON.stringify({
        patientId: pat,
        providerName: provider,
        type: vtype,
        startAt: start.toISOString(),
        durationMin: dur,
        status: "scheduled",
        notes: ""
      }) });
      setMsg("✓ Appointment booked");
      setTimeout(() => router.push("/appointments"), 700);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Booking failed");
    } finally { setBusy(false); }
  }

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const d = i - 4; // Nov 2024 starts on Friday
    if (d < 1 || d > 30) cells.push({ n: "", cls: "other" });
    else {
      const cls = [10, 24, 28].includes(d) ? "full" : [3, 4, 11, 18, 25].includes(d) ? "some" : "lots";
      cells.push({ n: d, cls, av: cls === "full" ? "0" : cls === "some" ? "3" : "8" });
    }
  }

  return (
    <>
      <div className="bc-bar">
        <a className="bc-link" href="/appointments">Appointments</a>
        <span>›</span>
        <span className="bc-cur">New appointment · {me?.fullName ?? "—"}</span>
      </div>

      <div className="head">
        <div>
          <h1 className="h1">Schedule appointment</h1>
          <div className="meta" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pat ?? ""} onChange={e => setPat(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: 6 }}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} · {p.mrn}</option>)}
            </select>
            <span>· auto-checks insurance, conflicts, prep</span>
          </div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn" onClick={() => router.back()}>Cancel</button>
          <button className="btn primary" onClick={confirm} disabled={busy}>{busy ? "Booking…" : "Confirm & send →"}</button>
        </div>
      </div>

      <div className="steps">
        {[
          { lbl: "Patient",      sub: "Aria Chen",          done: true },
          { lbl: "Visit type",   sub: vtype,                done: true },
          { lbl: "Provider · slot", sub: "Choose time",     active: true },
          { lbl: "Prep & forms", sub: "EKG, fasting" },
          { lbl: "Confirm · notify", sub: "SMS + email" },
        ].map((s, i) => (
          <div key={i} className={`step-card ${s.done ? "done" : ""} ${s.active ? "active-step" : ""}`}>
            <div className="num">{s.done ? "✓" : i + 1}</div>
            <div><div className="nm">{s.lbl}</div><div className="sub">{s.sub}</div></div>
          </div>
        ))}
      </div>

      <div className="sched-layout">
        <div>
          <div className="wiz-panel">
            <h3>Visit type</h3>
            <div className="types">
              {VTYPES.map(v => (
                <div key={v.n} className={`vtype ${vtype === v.n ? "selected" : ""}`} onClick={() => setVtype(v.n)}>
                  <div className="n">{v.n}</div>
                  <div className="d">{v.d}{vtype === v.n ? " · selected" : ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="wiz-panel">
            <h3>Provider</h3>
            <div className="prov-grid">
              {PROVIDERS.map(p => (
                <div key={p.n} className={`prov ${provider === p.n ? "selected" : ""}`} onClick={() => setProvider(p.n)}>
                  <div className="pic" style={{ backgroundImage: `url(${p.pic})` }} />
                  <div>
                    <div className="nm">{p.n}</div>
                    <div className="role">{p.r}</div>
                    <div className="meta"><span>NPI {p.npi}</span><span>Next: {p.next}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="wiz-panel">
            <div className="cal-nav">
              <div className="m">November 2024</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button>‹</button>
                <button>›</button>
              </div>
            </div>
            <div className="cal">
              {dayNames.map((d, i) => <div key={i} className="dh">{d}</div>)}
              {cells.map((c, i) => (
                <div key={i} className={`day ${c.cls} ${day === c.n ? "selected" : ""}`} onClick={() => c.n && c.cls !== "full" && c.cls !== "other" && setDay(c.n as number)}>
                  <div className="n">{c.n}</div>
                  {c.av && <div className="av">{c.av} open</div>}
                </div>
              ))}
            </div>
            <div className="slots">
              {SLOTS.map((s, i) => (
                <div key={s} className={`slot ${slot === s ? "selected" : ""} ${i === 5 || i === 11 ? "taken" : ""}`} onClick={() => i !== 5 && i !== 11 && setSlot(s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="summary-sticky">
          <div className="conf">
            <div className="l">Selected slot</div>
            <div className="when">{slot}</div>
            <div className="who">Tue · Nov {day}, 2024</div>
            <div className="where">with {provider}</div>
          </div>

          <div className="card panel">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Booking summary</div>
            <div className="bill-row"><span className="k">Patient</span><span className="v">{me?.fullName ?? "—"}</span></div>
            <div className="bill-row"><span className="k">Visit type</span><span className="v">{vtype}</span></div>
            <div className="bill-row"><span className="k">Provider</span><span className="v">{provider}</span></div>
            <div className="bill-row"><span className="k">Duration</span><span className="v">{dur} min</span></div>
            <div className="bill-row"><span className="k">Insurance</span><span className="v" style={{ color: "var(--good)" }}>✓ Verified</span></div>
            <div className="bill-row"><span className="k">Auth</span><span className="v" style={{ color: "var(--good)" }}>Not required</span></div>
            <div className="bill-row"><span className="k">Copay</span><span className="v">$30</span></div>
            <button className="btn primary" onClick={confirm} disabled={busy} style={{ width: "100%", marginTop: 14, justifyContent: "center" }}>
              {busy ? "Booking…" : "Confirm & send →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
