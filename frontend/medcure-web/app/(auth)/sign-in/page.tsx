"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@medcure.health");
  const [password, setPassword] = useState("demo123!");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await api<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      saveAuth(r);
      router.push("/");
    } catch {
      setErr("Email or password is incorrect.");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-shell">
      <div className="brand-panel">
        <div className="brand-top">
          <div className="logo"><span className="mark">M</span> Medcure</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>
            New here? <Link href="/register" style={{ color: "#fff", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,.4)", marginLeft: 4 }}>Create account →</Link>
          </div>
        </div>

        <div className="brand-quote">
          <div className="eyebrow">Hospital information system</div>
          <h1>Care, <em>orchestrated.</em><br />Across every shift.</h1>
          <p>One sign-in connects you to every patient, order, lab, and conversation across your hospital network — from ED triage to discharge follow-up.</p>

          <div className="stat-strip">
            <div><div className="v">1.2M</div><div className="l">patients managed</div></div>
            <div><div className="v">340</div><div className="l">connected hospitals</div></div>
            <div><div className="v">99.99%</div><div className="l">uptime · 12 mo</div></div>
          </div>

          <div className="org-strip" style={{ marginTop: 32 }}>
            <span>Trusted by:</span>
            <b>Mercy Health</b><b>St. Olive&apos;s</b><b>Northcare</b><b>Aurora Med</b><b>Riverside</b>
          </div>
        </div>

        <div className="brand-bottom">
          <span>© 2026 Medcure Health · v4.18.2</span>
          <div>
            <a href="#">Status</a><a href="#">Privacy</a><a href="#">Help</a>
          </div>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-head">
          <h2>Welcome back.</h2>
          <div className="sub">Sign in to continue. Don&apos;t have an account? <Link href="/register">Create one</Link></div>
        </div>

        <div className="org-detect">
          <div className="o-pic">M</div>
          <div>
            <div className="o-nm">Mercy Health · Main campus</div>
            <div className="o-meta">mercy.medcure.health · You signed in from this device before</div>
          </div>
          <Link href="/tenant-selector" className="switch">Switch ↘</Link>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Work email</label>
            <div className="input-wrap">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
              </span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="hint"><span className="dot" /> Verified · @medcure.health domain</div>
          </div>

          <div className="field">
            <label>Password</label>
            <div className="input-wrap">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" className="toggle-pw" onClick={() => setShowPw(s => !s)}>{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>

          <div className="row">
            <label className="check"><input type="checkbox" defaultChecked /> Keep me signed in for 8 hrs</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--ink)", fontWeight: 700 }}>Forgot password?</Link>
          </div>

          {err && <div style={{ background: "#ffe7eb", color: "#b3263d", padding: 10, borderRadius: 10, fontSize: 12, marginBottom: 12 }}>{err}</div>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to Medcure"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>

        <div className="divider">or continue with single sign-on</div>

        <div className="sso-grid">
          <Link href="/two-factor" className="sso-btn"><span className="lg" style={{ background: "#4285f4" }}>G</span> Google Workspace</Link>
          <Link href="/two-factor" className="sso-btn"><span className="lg" style={{ background: "#0078d4" }}>⊞</span> Microsoft 365</Link>
          <Link href="/two-factor" className="sso-btn"><span className="lg" style={{ background: "#000" }}>◐</span> Okta SSO</Link>
          <Link href="/two-factor" className="sso-btn"><span className="lg" style={{ background: "#ff4d6b" }}>⚷</span> SAML SSO</Link>
        </div>

        <div className="trust">
          <span className="t">HIPAA</span><span className="t">SOC 2 Type II</span><span className="t">ISO 27001</span><span className="t">HITRUST CSF</span>
        </div>

        <div className="footer-note">
          By signing in, you agree to Medcure&apos;s <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.<br />
          This system contains PHI. Unauthorized access is prohibited and audited.
        </div>

        <div style={{ marginTop: 18, padding: 12, background: "#f4f6f9", borderRadius: 10, fontSize: 11, color: "var(--ink-soft)", textAlign: "center" }}>
          Demo: <code>demo@medcure.health</code> / <code>demo123!</code>
        </div>
      </div>
    </div>
  );
}
