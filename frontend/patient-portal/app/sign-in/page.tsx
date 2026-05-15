"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@medcure.health");
  const [password, setPassword] = useState("demo123!");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await api<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(res.token, res.user);
      router.replace("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card stack">
        <div className="row" style={{ gap: 12 }}>
          <span className="logo-mark" style={{ width: 44, height: 44, fontSize: 24 }}>M</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>MedCure</div>
            <div className="eyebrow">Patient Portal</div>
          </div>
        </div>

        <h1 className="h2" style={{ marginTop: 8 }}>Welcome back.</h1>
        <p className="lede" style={{ marginTop: -4 }}>
          Sign in to view your appointments, lab results, bills, and messages from your care team.
        </p>

        <form className="stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err ? <div className="error">{err}</div> : null}
          <button type="submit" className="btn primary" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 8 }}>
          Demo: <strong>demo@medcure.health</strong> / <strong>demo123!</strong>
        </p>
      </div>
    </main>
  );
}
