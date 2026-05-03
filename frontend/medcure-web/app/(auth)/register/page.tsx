"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

const STEPS = ["You", "Organization", "Role", "Confirm"];

const ROLES = [
  { code: "MD", name: "Physician", sub: "MD/DO · CPOE", ic: "🩺" },
  { code: "RN", name: "Nurse", sub: "eMAR · vitals", ic: "💉" },
  { code: "RPh", name: "Pharmacist", sub: "Verify · dispense", ic: "💊" },
  { code: "Tech", name: "Lab tech", sub: "Specimens · results", ic: "🧪" },
  { code: "Reg", name: "Registration", sub: "Admit · ED check-in", ic: "📋" },
  { code: "Bill", name: "Billing", sub: "Coding · claims", ic: "💵" },
  { code: "Admin", name: "Admin", sub: "Tenant · users", ic: "🛠" },
  { code: "Med", name: "Med student", sub: "Read-only", ic: "🎓" },
  { code: "Vol", name: "Volunteer", sub: "Limited", ic: "🤝" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [orgMode, setOrgMode] = useState<"join" | "create">("join");
  const [data, setData] = useState({
    fullName: "",
    email: "",
    password: "",
    mobile: "",
    npi: "",
    title: "MD",
    specialty: "Internal Medicine",
    licenseState: "OH",
    orgName: "Bayfront General",
    orgLocation: "Cincinnati, OH",
    role: "MD",
    consentTos: false,
    consentHipaa: false,
    consentMarketing: false,
  });
  const set = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) => setData(d => ({ ...d, [k]: v }));

  function passwordStrength() {
    const p = data.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  function nextDisabled() {
    if (step === 0) return !data.fullName || !data.email || data.password.length < 6;
    if (step === 1) return !data.orgName;
    if (step === 2) return !data.role;
    if (step === 3) return !(data.consentTos && data.consentHipaa);
    return false;
  }

  async function submit() {
    setBusy(true); setErr(null);
    try {
      const r = await api<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: data.fullName, email: data.email, password: data.password,
          title: data.title, specialty: data.specialty, npi: data.npi,
          licenseState: data.licenseState, orgName: data.orgName,
          orgLocation: data.orgLocation, role: data.role,
        }),
      });
      saveAuth(r);
      router.push("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Registration failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="reg-shell">
      <div className="reg-brand">
        <div>
          <div className="logo-r">⚕ Medcure</div>
          <h2>Hospital information,<br />reimagined.</h2>
          <p className="lede">Join 12,000+ clinicians using Medcure to coordinate care across CPOE, pharmacy, eMAR, labs, and the bed board — in one calm interface.</p>
          <div className="feat-list">
            <div className="feat"><div className="ic">🩺</div><div><div className="ft">Closed-loop CPOE</div><div className="fs">Order → verify → administer with one scan</div></div></div>
            <div className="feat"><div className="ic">📊</div><div><div className="ft">Real-time bed board</div><div className="fs">Live capacity across wards, ED, and PACU</div></div></div>
            <div className="feat"><div className="ic">🧪</div><div><div className="ft">Lab + radiology in one queue</div><div className="fs">Critical results paged within 4 minutes</div></div></div>
            <div className="feat"><div className="ic">🔒</div><div><div className="ft">HIPAA + SOC 2 + HITRUST</div><div className="fs">Tenant-isolated, audit-logged, encrypted</div></div></div>
          </div>
        </div>
        <div className="footer-r">© Medcure Health 2026 · v4.2.1 · Built with care in Cincinnati</div>
      </div>

      <div className="reg-content">
        <div className="reg-stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`st-r ${i === step ? "act" : ""} ${i < step ? "done" : ""}`}>
              <div className="num-r">{i < step ? "✓" : i + 1}</div>
              <div className="lb-r">{s}</div>
            </div>
          ))}
        </div>

        <div className="reg-form">
          {step === 0 && (
            <>
              <h3>Tell us about you</h3>
              <div className="sub-r">We use this to build your provider profile and verify credentials.</div>
              <div className="reg-grid2">
                <div className="reg-field"><label>Full name</label><input value={data.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Dr. Jane Smith" /></div>
                <div className="reg-field"><label>Title</label>
                  <select value={data.title} onChange={e => set("title", e.target.value)}>
                    <option>MD</option><option>DO</option><option>RN</option><option>NP</option><option>PA</option><option>RPh</option><option>Tech</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="reg-field"><label>Work email</label><input type="email" value={data.email} onChange={e => set("email", e.target.value)} placeholder="jane@bayfront.health" /></div>
              <div className="reg-grid2">
                <div className="reg-field"><label>Mobile</label><input value={data.mobile} onChange={e => set("mobile", e.target.value)} placeholder="+1 (513) 555-0142" /></div>
                <div className="reg-field"><label>NPI (if applicable)</label><input value={data.npi} onChange={e => set("npi", e.target.value)} placeholder="1234567890" /></div>
              </div>
              <div className="reg-field">
                <label>Password</label>
                <input type="password" value={data.password} onChange={e => set("password", e.target.value)} placeholder="At least 8 characters" />
                <div className="strength">
                  <i className={passwordStrength() >= 1 ? "on" : ""} />
                  <i className={passwordStrength() >= 2 ? "on" : ""} />
                  <i className={passwordStrength() >= 3 ? "on" : ""} />
                </div>
                <div className="hint-r">Use 8+ chars · mix of letters, digits, symbols</div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3>Organization</h3>
              <div className="sub-r">Join an existing tenant or stand up a new one for your facility.</div>
              <div className="org-toggle">
                <button className={orgMode === "join" ? "act-o" : ""} onClick={() => setOrgMode("join")}>Join existing</button>
                <button className={orgMode === "create" ? "act-o" : ""} onClick={() => setOrgMode("create")}>Create new</button>
              </div>
              {orgMode === "join" && data.email.endsWith("@bayfront.health") && (
                <div className="invite-card">
                  <div className="ti">✓ Auto-detected: Bayfront General</div>
                  <div className="sb">Your domain matches an existing tenant — you&apos;ll be added with provider access pending admin approval.</div>
                </div>
              )}
              <div className="reg-grid2">
                <div className="reg-field"><label>Organization name</label><input value={data.orgName} onChange={e => set("orgName", e.target.value)} /></div>
                <div className="reg-field"><label>Location</label><input value={data.orgLocation} onChange={e => set("orgLocation", e.target.value)} /></div>
              </div>
              <div className="reg-grid2">
                <div className="reg-field"><label>Department</label>
                  <select><option>Cardiology</option><option>Internal Medicine</option><option>Emergency</option><option>Pediatrics</option><option>OB/GYN</option><option>Surgery</option></select>
                </div>
                <div className="reg-field"><label>Bed count</label>
                  <select><option>&lt; 50</option><option>50–200</option><option>200–500</option><option>500+</option></select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Pick your role</h3>
              <div className="sub-r">This determines your default workflow and permissions. Admins can adjust later.</div>
              <div className="role-grid">
                {ROLES.map(r => (
                  <div key={r.code} className={`role ${data.role === r.code ? "act-r" : ""}`} onClick={() => set("role", r.code)}>
                    <div className="ic-r">{r.ic}</div>
                    <div className="nm-r">{r.name}</div>
                    <div className="sb-r">{r.sub}</div>
                  </div>
                ))}
              </div>
              <div className="reg-grid2">
                <div className="reg-field"><label>Specialty</label><input value={data.specialty} onChange={e => set("specialty", e.target.value)} /></div>
                <div className="reg-field"><label>License state</label>
                  <select value={data.licenseState} onChange={e => set("licenseState", e.target.value)}>
                    <option>OH</option><option>NY</option><option>CA</option><option>TX</option><option>FL</option><option>IL</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3>Review &amp; confirm</h3>
              <div className="sub-r">A summary of what we&apos;re creating. You can edit any field after sign-in.</div>
              <div className="review-list">
                <div className="rrow"><span className="k-r">Name</span><span className="v-r">{data.fullName || "—"}</span></div>
                <div className="rrow"><span className="k-r">Email</span><span className="v-r">{data.email || "—"}</span></div>
                <div className="rrow"><span className="k-r">Title · Specialty</span><span className="v-r">{data.title} · {data.specialty}</span></div>
                <div className="rrow"><span className="k-r">NPI · License</span><span className="v-r">{data.npi || "—"} · {data.licenseState}</span></div>
                <div className="rrow"><span className="k-r">Organization</span><span className="v-r">{data.orgName} · {data.orgLocation}</span></div>
                <div className="rrow"><span className="k-r">Role</span><span className="v-r">{ROLES.find(r => r.code === data.role)?.name}</span></div>
              </div>
              <label className="check-row">
                <input type="checkbox" checked={data.consentTos} onChange={e => set("consentTos", e.target.checked)} />
                <span>I agree to the Medcure Terms of Service and Acceptable Use Policy.</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={data.consentHipaa} onChange={e => set("consentHipaa", e.target.checked)} />
                <span>I acknowledge the HIPAA Business Associate addendum and PHI handling guidelines.</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={data.consentMarketing} onChange={e => set("consentMarketing", e.target.checked)} />
                <span>Send me product updates and clinical workflow tips. (optional)</span>
              </label>
            </>
          )}

          {err && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 10, fontWeight: 700 }}>{err}</div>}

          <div className="btn-row-r">
            {step > 0
              ? <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <Link href="/sign-in" className="btn">Sign in instead</Link>}
            <div style={{ flex: 1 }} />
            {step < STEPS.length - 1
              ? <button className="btn primary" onClick={() => setStep(s => s + 1)} disabled={nextDisabled()}>Continue →</button>
              : <button className="btn primary" onClick={submit} disabled={busy || nextDisabled()}>{busy ? "Creating account…" : "Create account →"}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
