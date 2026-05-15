"use client";
import { useEffect, useState } from "react";
import { getUser, getActiveTenant } from "@/lib/auth";
import { api } from "@/lib/api";
import { getPreferredTheme, setTheme, type Theme } from "@/lib/theme";
import type { Tenant, User } from "@/lib/types";

const SECTIONS = [
  { id: "profile",      icon: "👤", label: "Profile" },
  { id: "security",     icon: "⚷", label: "Security & 2FA" },
  { id: "notifications",icon: "🔔", label: "Notifications" },
  { id: "preferences",  icon: "⚙", label: "Preferences" },
  { id: "integrations", icon: "🔗", label: "Integrations" },
  { id: "billing",      icon: "💳", label: "Billing & seats" },
  { id: "audit",        icon: "📋", label: "Audit log" },
  { id: "danger",       icon: "⚠", label: "Danger zone" },
];

export default function SettingsClient() {
  const [u, setU] = useState<User | null>(null);
  const [t, setT] = useState<Tenant | null>(null);
  const [active, setActive] = useState("profile");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [profile, setProfile] = useState({ fullName: "", title: "", specialty: "", npi: "", licenseState: "OH" });
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    twoFA: false, sessionTimeout: true, emailNotif: true, pageNotif: true, smsNotif: false,
    auditPing: true, autoSign: false, darkMode: false, compactView: true,
  });

  useEffect(() => {
    const user = getUser();
    setU(user);
    setT(getActiveTenant());
    if (user) {
      setProfile({
        fullName: user.fullName,
        title: user.title,
        specialty: user.specialty,
        npi: "",
        licenseState: "OH"
      });
    }
    const t = (typeof document !== "undefined" && (document.documentElement.dataset.theme as Theme)) || getPreferredTheme();
    setToggles(s => ({ ...s, darkMode: t === "dark" }));
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Theme>).detail;
      if (detail === "light" || detail === "dark") {
        setToggles(s => ({ ...s, darkMode: detail === "dark" }));
      }
    }
    window.addEventListener("medcure-theme-change", onChange as EventListener);
    return () => window.removeEventListener("medcure-theme-change", onChange as EventListener);
  }, []);
  const toggle = (k: string) => setToggles(s => {
    const next = { ...s, [k]: !s[k] };
    if (k === "darkMode") {
      setTheme(next.darkMode ? "dark" : "light");
    }
    return next;
  });

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const updated = await api<User>("/api/auth/me", { method: "PATCH", body: JSON.stringify(profile) });
      setU(updated);
      const auth = JSON.parse(localStorage.getItem("medcure-auth") ?? "{}");
      auth.user = updated;
      localStorage.setItem("medcure-auth", JSON.stringify(auth));
      setMsg("✓ Profile saved");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 3000);
    }
  }

  if (!u) return <div className="muted" style={{ padding: 40 }}>Loading…</div>;

  return (
    <>
      <div className="head">
        <div>
          <span className="eyebrow">Account · {t?.name ?? "—"}</span>
          <h1 className="h1">Settings</h1>
          <div className="meta">{u.fullName} · {u.email} · {u.title}{u.specialty ? ` · ${u.specialty}` : ""}</div>
        </div>
        <div className="toolbar">
          {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "var(--good)" : "var(--bad)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn">Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-side">
          <h4>Account</h4>
          {SECTIONS.slice(0, 4).map(s => (
            <button key={s.id} className={`lk ${active === s.id ? "active" : ""}`} onClick={() => setActive(s.id)}>
              <span className="ic">{s.icon}</span>{s.label}
            </button>
          ))}
          <h4>Workspace</h4>
          {SECTIONS.slice(4).map(s => (
            <button key={s.id} className={`lk ${active === s.id ? "active" : ""}`} onClick={() => setActive(s.id)}>
              <span className="ic">{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        <div>
          {active === "profile" && (
            <div className="set-section">
              <h3>Profile</h3>
              <div className="sub-r">How you appear to colleagues and patients.</div>
              <div className="grid-2">
                <div className="cpoe-field"><label>Full name</label><input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} /></div>
                <div className="cpoe-field"><label>Email</label><input value={u.email} disabled /></div>
                <div className="cpoe-field"><label>Title</label><input value={profile.title} onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} /></div>
                <div className="cpoe-field"><label>Specialty</label><input value={profile.specialty} onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))} /></div>
                <div className="cpoe-field"><label>NPI</label><input value={profile.npi} onChange={e => setProfile(p => ({ ...p, npi: e.target.value }))} /></div>
                <div className="cpoe-field"><label>License state</label><input value={profile.licenseState} onChange={e => setProfile(p => ({ ...p, licenseState: e.target.value }))} /></div>
                <div className="cpoe-field"><label>DEA</label><input defaultValue="BD1234567" /></div>
                <div className="cpoe-field"><label>Pager</label><input defaultValue="x4421" /></div>
              </div>
            </div>
          )}

          {active === "security" && (
            <>
              <div className="set-section">
                <h3>Security &amp; 2FA</h3>
                <div className="sub-r">Protect access to PHI.</div>
                <div className="set-row">
                  <div><div className="nm">Two-factor authentication</div><div className="desc">Required for SSO bypass and elevated actions</div></div>
                  <button className={`toggle ${toggles.twoFA ? "on" : ""}`} onClick={() => toggle("twoFA")} />
                </div>
                <div className="set-row">
                  <div><div className="nm">Session timeout (15 min)</div><div className="desc">Auto-lock after inactivity per HIPAA policy</div></div>
                  <button className={`toggle ${toggles.sessionTimeout ? "on" : ""}`} onClick={() => toggle("sessionTimeout")} />
                </div>
                <div className="set-row">
                  <div><div className="nm">Hard sign-out at end of shift</div><div className="desc">Force re-auth at shift change</div></div>
                  <button className={`toggle ${toggles.autoSign ? "on" : ""}`} onClick={() => toggle("autoSign")} />
                </div>
              </div>
              <div className="set-section">
                <h3>Active sessions</h3>
                {[
                  { dev: "Mac · Chrome · Cincinnati", t: "now",    cur: true },
                  { dev: "iPhone · Safari · iOS 18",  t: "2h ago", cur: false },
                  { dev: "Windows · Edge · Hospital", t: "3d ago", cur: false },
                ].map((s, i) => (
                  <div key={i} className="set-row">
                    <div><div className="nm">{s.dev}</div><div className="desc">last activity {s.t}{s.cur ? " · this session" : ""}</div></div>
                    {s.cur ? <span className="pill good"><span className="pdot" />Current</span> : <button className="btn">Revoke</button>}
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "notifications" && (
            <div className="set-section">
              <h3>Notifications</h3>
              <div className="sub-r">Control how Medcure pages and emails reach you.</div>
              {[
                ["Email digests",            "Daily digest of patients, results, denials", "emailNotif"],
                ["Pager (clinical alerts)",  "STEMI, sepsis, code activations",            "pageNotif"],
                ["SMS (after-hours)",        "Outside scheduled shift",                    "smsNotif"],
                ["Audit ping",               "Email when records I touched are accessed",  "auditPing"],
              ].map(([nm, desc, key]) => (
                <div key={key} className="set-row">
                  <div><div className="nm">{nm}</div><div className="desc">{desc}</div></div>
                  <button className={`toggle ${toggles[key] ? "on" : ""}`} onClick={() => toggle(key)} />
                </div>
              ))}
            </div>
          )}

          {active === "preferences" && (
            <div className="set-section">
              <h3>Preferences</h3>
              <div className="sub-r">Tune the app to your workflow.</div>
              <div className="set-row">
                <div><div className="nm">Compact data tables</div><div className="desc">Tighter rows for dense charts</div></div>
                <button className={`toggle ${toggles.compactView ? "on" : ""}`} onClick={() => toggle("compactView")} />
              </div>
              <div className="set-row">
                <div><div className="nm">Dark mode (Telemetry only)</div><div className="desc">Cardiac monitoring uses dark theme</div></div>
                <button className={`toggle ${toggles.darkMode ? "on" : ""}`} onClick={() => toggle("darkMode")} />
              </div>
              <div className="set-row">
                <div><div className="nm">Default landing page</div><div className="desc">Where you land after login</div></div>
                <select className="btn"><option>Dashboard</option><option>Patients</option><option>Inbox</option><option>ED</option></select>
              </div>
              <div className="set-row">
                <div><div className="nm">Time format</div><div className="desc">12h or 24h clock</div></div>
                <select className="btn"><option>24-hour</option><option>12-hour</option></select>
              </div>
            </div>
          )}

          {active === "integrations" && (
            <div className="set-section">
              <h3>Integrations</h3>
              <div className="sub-r">Connect external systems.</div>
              {[
                ["Lab system (LIS)",          "Cerner Millennium",      "good"],
                ["Imaging (RIS/PACS)",        "Sectra",                  "good"],
                ["Pharmacy (Pyxis)",          "BD Pyxis · 4 stations",  "good"],
                ["HIE — state",               "OneHealthPort",          "warn"],
                ["Eligibility (X12 270/271)", "Change Healthcare",      "good"],
                ["Telehealth",                "Doxy.me",                "warn"],
              ].map(([nm, vendor, st], i) => (
                <div key={i} className="set-row">
                  <div><div className="nm">{nm}</div><div className="desc">{vendor}</div></div>
                  <span className={`pill ${st}`}><span className="pdot" />{st === "good" ? "Connected" : "Configure"}</span>
                </div>
              ))}
            </div>
          )}

          {active === "billing" && (
            <div className="set-section">
              <h3>Billing &amp; seats</h3>
              <div className="sub-r">Subscription and provider seats.</div>
              <div className="grid-3">
                <div className="info-block"><h4>Plan</h4><div className="bill-total" style={{ fontSize: 28 }}>Hospital</div><div className="muted" style={{ fontSize: 11 }}>Enterprise tier</div></div>
                <div className="info-block"><h4>Seats</h4><div className="bill-total" style={{ fontSize: 28 }}>1,240</div><div className="muted" style={{ fontSize: 11 }}>1,180 in use</div></div>
                <div className="info-block"><h4>Renewal</h4><div className="bill-total" style={{ fontSize: 28 }}>Mar 2026</div><div className="muted" style={{ fontSize: 11 }}>auto-renew on</div></div>
              </div>
            </div>
          )}

          {active === "audit" && (
            <div className="set-section">
              <h3>Audit log</h3>
              <div className="sub-r">Every action you take is recorded for HIPAA compliance.</div>
              {[
                ["10:14", "Order signed",     "Albuterol HFA · Albert Smith"],
                ["10:02", "Patient chart",    "Maria Hernandez (read)"],
                ["09:48", "Lab acknowledged", "Lactate 4.8 · Maria Hernandez"],
                ["09:30", "Login",            "Mac · Chrome · IP 10.4.x"],
              ].map(([t, a, d], i) => (
                <div key={i} className="set-row">
                  <div><div className="nm">{t} · {a}</div><div className="desc">{d}</div></div>
                  <span className="muted" style={{ fontSize: 11 }}>kept 7 yrs</span>
                </div>
              ))}
            </div>
          )}

          {active === "danger" && (
            <div className="set-section" style={{ background: "#fff7f8", border: "1px solid #ffe1e7" }}>
              <h3 style={{ color: "#b3263d" }}>Danger zone</h3>
              <div className="sub-r">Account-level destructive actions.</div>
              <div className="set-row">
                <div><div className="nm">Sign out of all sessions</div><div className="desc">Revoke all tokens across all devices</div></div>
                <button className="btn danger">Sign out everywhere</button>
              </div>
              <div className="set-row">
                <div><div className="nm">Leave organization</div><div className="desc">Remove yourself from {t?.name ?? "this org"}</div></div>
                <button className="btn danger">Leave</button>
              </div>
              <div className="set-row">
                <div><div className="nm">Delete account</div><div className="desc">Permanent · 90-day grace · admin approval</div></div>
                <button className="btn danger">Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
