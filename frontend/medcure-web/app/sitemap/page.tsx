import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";

const groups: { title: string; gsub: string; items: { ttl: string; href: string; tag: string; desc: string }[] }[] = [
  {
    title: "Core navigation", gsub: "Top-level surfaces in the global tab bar.",
    items: [
      { ttl: "Dashboard",     href: "/",             tag: "Home",  desc: "Daily overview — vitals, today's appointments, KPIs." },
      { ttl: "Patients",      href: "/patients",     tag: "Index", desc: "Searchable roster — vitals, ward, MRN." },
      { ttl: "Appointments",  href: "/appointments", tag: "Index", desc: "Day & week views, provider schedules." },
      { ttl: "Labs",          href: "/labs",         tag: "Index", desc: "All ordered labs — pending, resulted, critical flags." },
      { ttl: "Pharmacy",      href: "/pharmacy",     tag: "Index", desc: "Verification queue, formulary, dispensing." },
      { ttl: "Billing",       href: "/billing",      tag: "Index", desc: "Claims, denials, AR aging, payer mix." },
      { ttl: "Inventory",     href: "/inventory",    tag: "Index", desc: "Drug & supply inventory, par levels, expiring lots." },
      { ttl: "Staff",         href: "/staff",        tag: "Index", desc: "Provider directory, on-call, schedules." },
      { ttl: "ED",            href: "/ed",           tag: "Index", desc: "ED dashboard — door-to-doc, ESI mix, boarders." },
      { ttl: "Documents",     href: "/documents",    tag: "Index", desc: "Notes, scans, consent forms, attachments." },
      { ttl: "Messages",      href: "/messages",     tag: "Index", desc: "Secure messaging." },
      { ttl: "Settings",      href: "/settings",     tag: "Index", desc: "Profile, integrations, security." },
    ]
  },
  {
    title: "Patient record", gsub: "Everything under a single MRN.",
    items: [
      { ttl: "Patient chart",   href: "/patients", tag: "Detail", desc: "13-tab chart — vitals, meds, labs, notes, problems." },
    ]
  },
  {
    title: "Orders & results", gsub: "CPOE, pharmacy, eMAR, labs.",
    items: [
      { ttl: "CPOE",            href: "/cpoe",      tag: "Index",  desc: "All orders awaiting sign — meds, labs, imaging." },
      { ttl: "eMAR",            href: "/emar",      tag: "Detail", desc: "Medication admin record." },
      { ttl: "Result ack",      href: "/result-ack",tag: "Detail", desc: "Inbox of unread results." },
      { ttl: "Specimen tracking", href: "/specimen-tracking", tag: "Detail", desc: "Phlebotomy & lab logistics." },
    ]
  },
  {
    title: "Inpatient & OR", gsub: "Bed board, surgery, imaging.",
    items: [
      { ttl: "Bed board",       href: "/bed-board",     tag: "Detail", desc: "Live floor plan." },
      { ttl: "Imaging / PACS",  href: "/imaging",       tag: "Detail", desc: "DICOM viewer + worklist." },
      { ttl: "Surgery board",   href: "/surgery-board", tag: "Detail", desc: "8-OR Gantt." },
      { ttl: "OR case",         href: "/or-case",       tag: "Detail", desc: "Single OR case." },
      { ttl: "ICU flowsheet",   href: "/icu-flowsheet", tag: "Detail", desc: "Critical care flowsheet." },
      { ttl: "Telemetry",       href: "/telemetry",     tag: "Detail", desc: "Live multi-patient ECG." },
    ]
  },
  {
    title: "Emergency", gsub: "Triage, live track, code activations.",
    items: [
      { ttl: "ED Live",   href: "/ed/live",      tag: "Detail", desc: "Live ED bedboard." },
      { ttl: "Triage",    href: "/triage",       tag: "Flow",   desc: "Vitals capture, ESI assignment." },
      { ttl: "Code STEMI",href: "/code-stemi",   tag: "Alert",  desc: "STEMI activation timer." },
      { ttl: "Code Blue", href: "/code-blue",    tag: "Alert",  desc: "Adult resuscitation." },
    ]
  },
  {
    title: "Workflows", gsub: "Wizard-style flows.",
    items: [
      { ttl: "Admit",       href: "/admit",          tag: "Flow", desc: "Demographics → bed → consent." },
      { ttl: "Discharge",   href: "/discharge",      tag: "Flow", desc: "Disposition → med rec → instructions." },
      { ttl: "Schedule",    href: "/schedule",       tag: "Flow", desc: "5-step booking." },
      { ttl: "Note composer", href: "/note-composer",tag: "Flow", desc: "SOAP / H&P notes." },
      { ttl: "Consult request", href: "/consult-request", tag: "Flow", desc: "Specialty consult routing." },
      { ttl: "Transfer request", href: "/transfer-request", tag: "Flow", desc: "Inter-ward transfer." },
      { ttl: "Sign-out · I-PASS", href: "/signout",  tag: "Flow", desc: "End-of-shift hand-off." },
    ]
  },
  {
    title: "Clinical", gsub: "Bedside & care coordination.",
    items: [
      { ttl: "Vitals entry", href: "/vitals-entry", tag: "Flow", desc: "Nurse charting." },
      { ttl: "Care plan",    href: "/care-plan",    tag: "Detail", desc: "Active problem list with goals." },
      { ttl: "Allergy mgmt", href: "/allergy-management", tag: "Detail", desc: "Allergy management." },
      { ttl: "Immunizations", href: "/immunizations", tag: "Detail", desc: "Vaccination history." },
      { ttl: "Clinic visit",  href: "/clinic-visit", tag: "Detail", desc: "Office visit documentation." },
      { ttl: "Pathology",     href: "/pathology", tag: "Detail", desc: "Surgical specimens." },
      { ttl: "Blood bank",    href: "/blood-bank", tag: "Detail", desc: "Type & screen, crossmatch." },
      { ttl: "Dialysis",      href: "/dialysis", tag: "Detail", desc: "HD/PD flowsheet." },
      { ttl: "Infusion",      href: "/infusion", tag: "Detail", desc: "Infusion scheduling." },
    ]
  },
  {
    title: "Billing", gsub: "Revenue cycle.",
    items: [
      { ttl: "Eligibility",      href: "/eligibility",      tag: "Detail", desc: "Real-time payer check." },
      { ttl: "Charge capture",   href: "/charge-capture",   tag: "Detail", desc: "Provider charges & coding." },
      { ttl: "Payment posting",  href: "/payment-posting",  tag: "Detail", desc: "ERA/EOB posting." },
      { ttl: "Patient statement", href: "/patient-statement", tag: "Detail", desc: "Patient balance statements." },
      { ttl: "Claim detail",     href: "/claim-detail",     tag: "Detail", desc: "Single claim view." },
      { ttl: "Denial management", href: "/denial-mgmt",     tag: "Detail", desc: "Top denials & appeals." },
    ]
  },
  {
    title: "Auth & access", gsub: "Identity & multi-tenancy.",
    items: [
      { ttl: "Sign in",         href: "/sign-in",         tag: "Auth", desc: "Email + password, SSO, switch-org." },
      { ttl: "Register",        href: "/register",        tag: "Flow", desc: "Profile → org → role → confirm." },
      { ttl: "Forgot password", href: "/forgot-password", tag: "Flow", desc: "Reset via email/SMS." },
      { ttl: "Two-factor",      href: "/two-factor",      tag: "Flow", desc: "6-digit OTP." },
      { ttl: "Tenant selector", href: "/tenant-selector", tag: "Auth", desc: "Organization picker." },
      { ttl: "Sign out",        href: "/logout",          tag: "Flow", desc: "Session end." },
    ]
  },
];

export default function Page() {
  return (
    <AppShell>
      <PageHeader eyebrow="Master index" title="Sitemap" sub="Every screen in MedCure — grouped by domain." />
      {groups.map(g => (
        <section key={g.title} style={{ marginBottom: 32 }}>
          <h2 className="h2" style={{ marginBottom: 4 }}>{g.title}</h2>
          <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>{g.gsub}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {g.items.map(s => (
              <Link key={s.href} className="card" href={s.href} style={{ minHeight: 130, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.tag}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{s.ttl}</div>
                <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, flex: 1 }}>{s.desc}</div>
                <div className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.href}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
