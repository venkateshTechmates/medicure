"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clearAuth, getUser } from "@/lib/auth";

export default function LogoutClient() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const u = getUser();
    if (u) setUser({ fullName: u.fullName, email: u.email });
    clearAuth();
  }, []);

  useEffect(() => {
    if (seconds <= 0) { router.push("/sign-in"); return; }
    const id = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, router]);

  return (
    <div className="logout-page">
      <div className="logout-card">
        <div className="badge">✓</div>
        <h2>Signed out</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 18, marginTop: 4 }}>
          {user ? `Goodbye, ${user.fullName}.` : "Your session has ended."} Local cache cleared, audit log written, and any draft notes saved.
        </p>
        <div style={{ background: "#fafbfc", borderRadius: 12, padding: 14, fontSize: 12, color: "var(--ink-soft)", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Session length</span><b>4h 12m</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Patients accessed</span><b>14</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Orders signed</span><b>22</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span>Notes filed</span><b>3</b></div>
        </div>
        <Link href="/sign-in" className="btn primary" style={{ width: "100%", justifyContent: "center" }}>
          Sign back in <span className="arrow">→</span>
        </Link>
        <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>Auto-redirect to lock screen in <b>{seconds}</b>s</div>
      </div>
    </div>
  );
}
