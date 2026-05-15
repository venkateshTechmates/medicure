"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PortalShell from "@/components/PortalShell";
import StatusPill from "@/components/StatusPill";
import { api, getUser } from "@/lib/api";
import type { Appointment, LabResult, MessageThread } from "@/lib/types";

type Bucket = { kind: "loading" } | { kind: "error"; msg: string } | { kind: "ok" };

function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
}

export default function DashboardPage() {
  return (
    <PortalShell>
      <Dashboard />
    </PortalShell>
  );
}

function Dashboard() {
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [state, setState] = useState<Bucket>({ kind: "loading" });
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const u = getUser<{ fullName?: string; email?: string }>();
    setName(u?.fullName?.split(" ")[0] || u?.email || "there");

    let cancelled = false;
    (async () => {
      try {
        const [a, l, t] = await Promise.allSettled([
          api<Appointment[]>("/api/appointments?take=10"),
          api<LabResult[]>("/api/labs?take=10"),
          api<MessageThread[]>("/api/messages/threads"),
        ]);
        if (cancelled) return;
        if (a.status === "fulfilled" && Array.isArray(a.value)) setAppts(a.value);
        if (l.status === "fulfilled" && Array.isArray(l.value)) setLabs(l.value);
        if (t.status === "fulfilled" && Array.isArray(t.value)) setThreads(t.value);
        setState({ kind: "ok" });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", msg: e instanceof Error ? e.message : "Failed to load." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcoming = [...appts]
    .filter((a) => !a.startsAt || new Date(a.startsAt).getTime() >= Date.now() - 86400000)
    .slice(0, 2);
  const recentLabs = labs.slice(0, 3);
  const unread = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);

  return (
    <>
      <section className="card hero stack" style={{ marginBottom: 22 }}>
        <span className="eyebrow">Your health, at a glance</span>
        <h1 className="h1">Hello, {name}.</h1>
        <p className="lede" style={{ maxWidth: 640 }}>
          Welcome to your MedCure portal. Review what is next, what your care team has shared, and what needs your attention.
        </p>
        <div className="row" style={{ gap: 10, marginTop: 8 }}>
          <Link className="btn dark" href="/appointments">View appointments</Link>
          <Link className="btn" href="/messages">Open messages</Link>
        </div>
      </section>

      {state.kind === "error" ? <div className="card" style={{ marginBottom: 18 }}><div className="error">{state.msg}</div></div> : null}

      <section className="grid-3">
        <div className="card stack">
          <div className="row between">
            <span className="eyebrow">Upcoming appointments</span>
            <Link href="/appointments" className="muted">View all →</Link>
          </div>
          {state.kind === "loading" ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : upcoming.length === 0 ? (
            <p className="muted">No upcoming visits scheduled.</p>
          ) : (
            upcoming.map((a) => (
              <div key={a.id} className="stack" style={{ gap: 4, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 700 }}>{a.type || "Visit"}</div>
                <div className="muted">{fmtDate(a.startsAt)}</div>
                {a.providerName ? <div className="muted">with {a.providerName}</div> : null}
                {a.status ? <div><StatusPill status={a.status} /></div> : null}
              </div>
            ))
          )}
        </div>

        <div className="card stack">
          <div className="row between">
            <span className="eyebrow">Recent labs</span>
            <Link href="/labs" className="muted">View all →</Link>
          </div>
          {state.kind === "loading" ? (
            <div className="skeleton" style={{ height: 80 }} />
          ) : recentLabs.length === 0 ? (
            <p className="muted">No recent results.</p>
          ) : (
            recentLabs.map((l) => (
              <div key={l.id} className="stack" style={{ gap: 4, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 700 }}>{l.testName || l.name || "Lab"}</div>
                <div className="muted">{fmtDate(l.resultedAt || l.observedAt || l.collectedAt)}</div>
                <div className="row" style={{ gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{l.resultValue || l.value || "—"} {l.unit || ""}</span>
                  {l.status ? <StatusPill status={l.status} /> : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card warm stack">
          <span className="eyebrow">Unread messages</span>
          <div className="h1" style={{ fontSize: 80, marginTop: 4 }}>{unread}</div>
          <p className="muted">
            {unread === 0
              ? "You are all caught up. We will let you know when your care team replies."
              : `You have ${unread} unread ${unread === 1 ? "message" : "messages"} from your care team.`}
          </p>
          <Link href="/messages" className="btn primary" style={{ alignSelf: "flex-start", marginTop: 4 }}>
            Open inbox
          </Link>
        </div>
      </section>
    </>
  );
}
