"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface ResetResponse { sent: boolean; email: string; expiresInMinutes: number; demoToken?: string | null }

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<ResetResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await api<ResetResponse>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      setResp(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="auth-card">
      <span className="eyebrow">Recover access</span>
      <h1 className="h1">Forgot password.</h1>
      <p className="muted" style={{ fontSize: 14, marginTop: 4, marginBottom: 22 }}>
        We&apos;ll send a reset link valid for 30 minutes.
      </p>
      {!resp ? (
        <form onSubmit={submit}>
          <div className="field"><label>Email or username</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {err && <div style={{ color: "var(--bad)", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
          <button className="btn primary" type="submit" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      ) : (
        <div style={{ background: "#e6f8ec", padding: 14, borderRadius: 12, fontSize: 13, color: "#1a8a48" }}>
          ✓ Reset link sent to <b>{resp.email}</b>. Valid for {resp.expiresInMinutes} minutes.
          {resp.demoToken && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#1a8a48", fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
              Demo token: {resp.demoToken}
            </div>
          )}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 12 }}>
        Remembered? <Link href="/sign-in" style={{ fontWeight: 700 }}>Sign in</Link>
      </div>
    </div>
  );
}
