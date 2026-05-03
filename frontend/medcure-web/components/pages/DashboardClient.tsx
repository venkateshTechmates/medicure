"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtAge, fmtTime, fmtDateShort } from "@/lib/fmt";
import type { DashboardData } from "@/lib/types";
import AnatomyFigure from "@/components/AnatomyFigure";
import HeartGauge from "@/components/HeartGauge";
import CardioBars from "@/components/CardioBars";
import Ruler from "@/components/Ruler";

export default function DashboardClient() {
  const [d, setD] = useState<DashboardData | null>(null);

  useEffect(() => { api<DashboardData>("/api/dashboard").then(setD).catch(() => {}); }, []);

  const a0 = d?.upcomingAppointments?.[0];
  const a1 = d?.upcomingAppointments?.[1];

  return (
    <div className="dash-grid">
      <div>
        <h1 className="dash-h1">Medical<br />Dashboard</h1>

        <div className="vitals">
          <div className="vital">
            <div className="top">
              <div className="ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/></svg>
              </div>
              <span className="pill good"><span className="pdot"/>Normal</span>
            </div>
            <h4>Blood Status</h4>
            <div className="num">130<small>/80</small></div>
            <svg className="spark" viewBox="0 0 160 38" preserveAspectRatio="none">
              <polyline fill="none" stroke="#ff4d6b" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
                points="0,22 12,22 18,22 24,8 30,30 36,12 42,28 48,22 60,22 70,22 78,18 84,26 90,14 96,28 102,22 120,22 140,22 160,22" />
            </svg>
          </div>

          <div className="vital">
            <div className="top">
              <div className="ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/></svg>
              </div>
              <span className="pill good"><span className="pdot"/>Normal</span>
            </div>
            <h4>Hemoglobin Level</h4>
            <div className="num">19.3<small>/ gdl</small></div>
            <svg className="spark" viewBox="0 0 160 38" preserveAspectRatio="none">
              <path fill="none" stroke="#0e1116" strokeWidth="1.4" strokeLinecap="round"
                d="M0,28 C20,28 30,20 50,20 S80,30 100,18 130,8 160,18" />
              <circle cx="100" cy="18" r="3" fill="#ff4d6b" />
            </svg>
          </div>
        </div>

        <div className="appointments">
          <Appt appt={a0} fallbackTime="11:30 AM" fallbackDate="01/20" fallbackName="Albert Smith" fallbackAge="08 years old" />
          <Appt appt={a1} fallbackTime="12:30 PM" fallbackDate="01/20" fallbackName="Adison" fallbackAge="06 years old" />
        </div>

        <div className="cta-row">
          <Link className="ico-circle" href="/messages" aria-label="send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-11 11"/><path d="m22 2-7 20-4-9-9-4z"/></svg>
          </Link>
          <Link className="ico-circle" href="/messages" aria-label="call">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </Link>
          <Link className="book" href="/schedule">
            Book an Appointment
            <span className="arrow-circle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
            </span>
          </Link>
        </div>
      </div>

      <div>
        <div className="stage">
          <div className="zoom">
            <button className="icon-btn" aria-label="zoom in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
            </button>
            <button className="icon-btn" aria-label="recenter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9V5a2 2 0 0 1 2-2h4"/><path d="M21 9V5a2 2 0 0 0-2-2h-4"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/><circle cx="12" cy="12" r="2"/></svg>
            </button>
            <button className="icon-btn" aria-label="zoom out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8 11h6"/></svg>
            </button>
          </div>

          <div className="figure-wrap">
            <AnatomyFigure />
            <div className="pin" style={{ top: "32%", left: "60%" }}><span className="pdot" />Protein Clamp</div>
            <div className="pin b" style={{ top: "42%", left: "32%" }}><span className="pdot" />Between Bases</div>
            <div className="pin" style={{ top: "50%", left: "62%" }}><span className="pdot" />Major Grove</div>
            <div className="pin b" style={{ top: "64%", left: "28%" }}><span className="pdot" />Minor Grove</div>
          </div>
          <Ruler />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="vital" style={{ padding: "14px 14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: 12, fontWeight: 600 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "#fde7eb", color: "#e15670", display: "grid", placeItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12z"/></svg>
                </span>
                Blood Glucose
              </div>
              <span style={{ color: "var(--ink-mute)" }}>⋯</span>
            </div>
            <div className="num">98<span style={{ fontFamily: "Plus Jakarta Sans", fontSize: 18, color: "#9aa0ad", fontWeight: 600 }}>/56</span></div>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-mute)" }}>
              <span style={{ color: "var(--good)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--good)" }} />Good
              </span>
            </div>
          </div>

          <div className="vital" style={{ padding: "14px 14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", fontSize: 12, fontWeight: 600 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "#fde7eb", color: "#e15670", display: "grid", placeItems: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </span>
                Heart Rate
              </div>
              <span style={{ color: "var(--ink-mute)" }}>⋯</span>
            </div>
            <div className="num">108<span style={{ fontFamily: "Plus Jakarta Sans", fontSize: 14, color: "#9aa0ad", fontWeight: 600 }}>/Bpm</span></div>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-mute)" }}>
              <span style={{ color: "var(--good)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 50, background: "var(--good)" }} />Good
              </span>
            </div>
          </div>
        </div>

        <HeartGauge bpm={80} />
        <CardioBars />

        {d && (
          <div className="card tight">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Live KPIs · {d.totalPatients} patients</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)" }}>
              <span>{d.critical} critical · {d.warn} watching</span>
              <span>{d.criticalLabs} crit labs unack</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
              <span>{d.appointmentsToday} appts today</span>
              <span>{d.edActive} ED active</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Appt({ appt, fallbackTime, fallbackDate, fallbackName, fallbackAge }: {
  appt?: DashboardData["upcomingAppointments"][0];
  fallbackTime: string; fallbackDate: string; fallbackName: string; fallbackAge: string;
}) {
  const time = appt ? fmtTime(appt.scheduledAt) : fallbackTime;
  const date = appt ? fmtDateShort(appt.scheduledAt) : fallbackDate;
  const name = appt?.patient?.fullName ?? fallbackName;
  const age = appt?.patient?.dateOfBirth ? `${fmtAge(appt.patient.dateOfBirth)} years old` : fallbackAge;
  const pic = appt?.patient?.avatarUrl ?? "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&crop=faces";
  const href = appt?.patient ? `/patients/${appt.patient.mrn}` : "#";
  return (
    <Link className="appt" href={href}>
      <div className="head">
        <div>
          <div className="time">{time}</div>
          <div className="date">{date}</div>
        </div>
        <span style={{ color: "var(--ink-mute)" }}>⋯</span>
      </div>
      <div className="who">
        <div className="pic" style={{ backgroundImage: `url(${pic})` }} />
        <div>
          <div className="name">{name}</div>
          <div className="sub">{age}</div>
        </div>
      </div>
    </Link>
  );
}
