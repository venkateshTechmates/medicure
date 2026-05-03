"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Method = "app" | "sms" | "backup";

export default function TwoFactorPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("app");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setD(i: number, v: string) {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = ch; setDigits(next);
    if (ch && i < 5) refs.current[i + 1]?.focus();
  }
  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }
  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  async function verify() {
    setBusy(true); setErr(null);
    const code = digits.join("");
    if (code.length < 6) { setErr("Enter all 6 digits"); setBusy(false); return; }
    await new Promise(r => setTimeout(r, 500));
    router.push("/");
  }

  return (
    <div className="tfa-shell">
      <div className="tfa-card">
        <div className="logo-t">⚕ Medcure</div>
        <h2>Verify your identity.</h2>
        <p className="sub-t">
          {method === "app" && "Enter the 6-digit code from your authenticator app."}
          {method === "sms" && "Enter the 6-digit code we just sent to your mobile."}
          {method === "backup" && "Enter one of your unused backup codes."}
        </p>
        <div className="otp-row" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              value={d}
              onChange={e => setD(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              autoFocus={i === 0}
            />
          ))}
        </div>
        {err && <div style={{ color: "var(--bad)", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <button className="btn primary" style={{ width: "100%" }} onClick={verify} disabled={busy}>
          {busy ? "Verifying…" : "Verify & continue"}
        </button>
        <div className="tfa-method-toggle">
          <button className={method === "app" ? "act-t" : ""} onClick={() => setMethod("app")}>📱 Authenticator</button>
          <button className={method === "sms" ? "act-t" : ""} onClick={() => setMethod("sms")}>💬 SMS</button>
          <button className={method === "backup" ? "act-t" : ""} onClick={() => setMethod("backup")}>🔑 Backup</button>
        </div>
        <div className="resend">
          Didn&apos;t get a code? <a>Resend</a> · <Link href="/sign-in">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
