"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";

interface UpcomingNext { id: number; scheduledAt: string; durationMin: number; room: string; providerName: string; status: string; patient: { id: number; mrn: string; fullName: string; avatarUrl: string } | null; }

const PROVIDER_FILTERS = [
  { dot: "sw-blue",   name: "Dr. Mireille Achebe", count: 14 },
  { dot: "sw-pink",   name: "Dr. Hae-jin Park",    count: 9 },
  { dot: "sw-green",  name: "Lab — D. Voss",       count: 12 },
  { dot: "sw-amber",  name: "Dr. Iqbal Tanaka",    count: 7 },
  { dot: "sw-purple", name: "Surgery — OR-2",      count: 5 },
];

interface DemoEv { col: number; cls: string; top: string; height: string; t: string; p?: string; }
const DEMO_WEEK: DemoEv[] = [
  { col: 0, cls: "ev-blue",   top: "6%",  height: "14%", t: "Albert Smith",   p: "Consult · Dr. Achebe" },
  { col: 0, cls: "ev-pink",   top: "38%", height: "12%", t: "N. Whitfield",   p: "Cardio · Park" },
  { col: 0, cls: "ev-amber",  top: "64%", height: "10%", t: "M. Reyes",       p: "Follow-up" },
  { col: 1, cls: "ev-green",  top: "10%", height: "8%",  t: "Lab · CBC" },
  { col: 1, cls: "ev-blue",   top: "26%", height: "16%", t: "Adison K.",      p: "Pediatric" },
  { col: 1, cls: "ev-purple", top: "54%", height: "22%", t: "Lap. Chole",     p: "OR-2 · 90 min" },
  { col: 2, cls: "ev-blue",   top: "14%", height: "12%", t: "J. Okafor",      p: "New patient" },
  { col: 2, cls: "ev-pink",   top: "36%", height: "10%", t: "ECHO · Park" },
  { col: 2, cls: "ev-green",  top: "52%", height: "10%", t: "MRI L-spine" },
  { col: 2, cls: "ev-amber",  top: "72%", height: "10%", t: "Telehealth" },
  { col: 3, cls: "ev-amber",  top: "6%",  height: "10%", t: "Post-op check" },
  { col: 3, cls: "ev-blue",   top: "24%", height: "14%", t: "Lin Chen",       p: "Annual" },
  { col: 3, cls: "ev-pink",   top: "50%", height: "14%", t: "Stress test" },
  { col: 3, cls: "ev-green",  top: "74%", height: "8%",  t: "A1C draw" },
  { col: 4, cls: "ev-blue",   top: "4%",  height: "14%", t: "Albert Smith",   p: "11:30 · Consult" },
  { col: 4, cls: "ev-amber",  top: "22%", height: "12%", t: "Adison · 12:30", p: "Follow-up" },
  { col: 4, cls: "ev-pink",   top: "42%", height: "18%", t: "R. Vasquez",     p: "Cardiology · Park" },
  { col: 4, cls: "ev-green",  top: "66%", height: "10%", t: "Lab · Lipid panel" },
  { col: 4, cls: "ev-purple", top: "82%", height: "14%", t: "Pre-op clearance" },
];

const REQUESTS = [
  { name: "Marisol Reyes",    sub: "Follow-up · Tue 9:30",       pic: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces" },
  { name: "Tomás Bauer",      sub: "New patient · Wed 11:00",    pic: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces" },
  { name: "Kayode Adeyemi",   sub: "Telehealth · Thu 2:15",      pic: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces" },
  { name: "Priya Iyer",       sub: "Cardio referral · Fri 10:00", pic: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&h=120&fit=crop&crop=faces" },
];

export default function AppointmentsClient() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await api<Appointment[]>("/api/appointments").catch(() => [] as Appointment[]);
    setRows(data);
  }
  useEffect(() => { refresh(); }, []);

  async function patchStatus(id: number, status: string) {
    setBusy(true);
    try {
      await api(`/api/appointments/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await refresh();
    } finally { setBusy(false); }
  }

  const nextUp = rows.find(a => a.status !== "cancelled" && a.status !== "completed") ?? rows[0];

  const dayNames = ["M","T","W","T","F","S","S"];
  // mini-cal cells: Apr 27 (Mon) start, May highlighted on day 2
  const cells: { label: string | number; cls: string }[] = [];
  for (let i = 0; i < 42; i++) {
    const day = i - 4; // -4 = Mon Apr 27 relative to May 1 (which is day=1)
    let label: string | number = "";
    let cls = "d";
    if (day < 1) {
      const aprDay = 30 + day;
      label = aprDay > 0 ? aprDay : "";
      cls += " muted";
    } else if (day > 31) {
      label = day - 31; cls += " muted";
    } else {
      label = day;
    }
    if (day === 2) cls += " cur";
    if ([5, 8, 12, 15, 19, 22, 26].includes(day)) cls += " has";
    cells.push({ label, cls });
  }

  return (
    <>
      <div className="head">
        <div>
          <h1 className="h1">Appointments</h1>
          <div className="meta">Week of Apr 27 – May 03, 2026 · {rows.length || 47} scheduled · 6 pending</div>
        </div>
        <div className="toolbar">
          <div className="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search patient or doctor..." />
          </div>
          <button className="btn primary">+ New Appointment <span className="arrow"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg></span></button>
        </div>
      </div>

      <div className="appt-grid">
        {/* LEFT — mini calendar + filters */}
        <div className="card mini-cal">
          <div className="mc-head">
            <div className="mc-title">May 2026</div>
            <div className="mc-nav"><button>‹</button><button>›</button></div>
          </div>
          <div className="mc-grid">
            {dayNames.map((d, i) => <div key={`dn${i}`} className="dn">{d}</div>)}
            {cells.map((c, i) => <div key={i} className={c.cls}>{c.label}</div>)}
          </div>
          <div className="appt-legend">
            <div className="lr"><span className="sw sw-blue" /> General Consultation</div>
            <div className="lr"><span className="sw sw-pink" /> Cardiology</div>
            <div className="lr"><span className="sw sw-green" /> Lab / Imaging</div>
            <div className="lr"><span className="sw sw-amber" /> Follow-up</div>
            <div className="lr"><span className="sw sw-purple" /> Surgery</div>
          </div>
          <div className="provider-filters">
            {PROVIDER_FILTERS.map(p => (
              <div className="f" key={p.name}>
                <div className="l"><span className={`dot-sw ${p.dot}`} />{p.name}</div>
                <span className="c">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — week schedule */}
        <div className="card schedule-card">
          <div className="sched-head">
            <div style={{ fontWeight: 700 }}>Week View</div>
            <div className="sched-tabs"><button className="t">Day</button><button className="t active">Week</button><button className="t">Month</button></div>
          </div>
          <div className="day-col-head">
            <div />
            <div className="dh"><div>MON</div><div className="dnum">27</div></div>
            <div className="dh"><div>TUE</div><div className="dnum">28</div></div>
            <div className="dh"><div>WED</div><div className="dnum">29</div></div>
            <div className="dh"><div>THU</div><div className="dnum">30</div></div>
            <div className="dh today"><div>FRI</div><div className="dnum">02</div></div>
          </div>
          <div className="timeline">
            <div className="hours">
              <div className="hh">8 AM</div><div className="hh">9 AM</div><div className="hh">10 AM</div>
              <div className="hh">11 AM</div><div className="hh">12 PM</div><div className="hh">1 PM</div><div className="hh">2 PM</div>
            </div>
            {[0, 1, 2, 3, 4].map(c => (
              <div className="day-col" key={c}>
                {c === 4 && <div className="now-line" style={{ top: "18%" }} />}
                {DEMO_WEEK.filter(e => e.col === c).map((e, i) => (
                  <div key={i} className={`ev ${e.cls}`} style={{ top: e.top, height: e.height }}>
                    <div className="t">{e.t}</div>
                    {e.p && <div className="p">{e.p}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Next up / Requests / Today's load */}
        <div className="right-col">
          <div className="card next-up">
            <div className="nu-title">
              <div style={{ fontWeight: 700 }}>Next up</div>
              <span className="pill good"><span className="pdot" />In 12 min</span>
            </div>
            <div className="nu-card">
              <div className="who">
                <div className="pic" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces)" }} />
                <div><div className="nm">Albert Smith</div><div className="sub">08 yrs · MRN 4421-08</div></div>
              </div>
              <div className="when">
                <span><b>11:30 AM</b> · 30 min</span>
                <span style={{ color: "var(--ink-mute)" }}>Room 204</span>
              </div>
              <div className="nu-actions">
                <button className="ghost" onClick={() => nextUp && patchStatus(nextUp.id, "cancelled")} disabled={busy || !nextUp}>Reschedule</button>
                <button onClick={() => nextUp && patchStatus(nextUp.id, "checked-in")} disabled={busy || !nextUp}>{busy ? "…" : "Check in"}</button>
              </div>
            </div>
          </div>

          <div className="card req-list">
            <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              Pending Requests <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>6</span>
            </div>
            {REQUESTS.map(r => (
              <div className="req" key={r.name}>
                <div className="l">
                  <div className="pic" style={{ backgroundImage: `url(${r.pic})` }} />
                  <div><div className="nm">{r.name}</div><div className="sub">{r.sub}</div></div>
                </div>
                <div className="a">
                  <button className="ok">✓</button>
                  <button className="no">✕</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Today&apos;s load</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-mute)", marginBottom: 6 }}>
              <span>0%</span><span>74%</span><span>100%</span>
            </div>
            <div style={{ height: 10, background: "#f4f6f9", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: "74%", height: "100%", background: "linear-gradient(90deg,#27c26b,#ffb84d)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>Booked</span><b>23</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>No-shows</span><b style={{ color: "var(--bad)" }}>2</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12 }}>
              <span style={{ color: "var(--ink-soft)" }}>Walk-ins</span><b>4</b>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
