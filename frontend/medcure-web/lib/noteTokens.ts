// Client-side mirror of NoteTokenResolver.
// Used for live preview while the user types; the server resolves canonically on save/render.

export interface TokenContext {
  patient?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    mrn?: string;
    sex?: string;
    age?: number;
    dateOfBirth?: string;
  } | null;
  vitals?: {
    hr?: number; sbp?: number; dbp?: number; spo2?: number; rr?: number; tempC?: number;
    recordedAt?: string;
  } | null;
  meds?: { name: string; dose?: string; route?: string; frequency?: string }[];
  allergies?: { substance: string; reaction?: string; severity?: string }[];
  problems?: { description: string; icdCode?: string }[];
  author?: string;
  today?: string;
}

function computeAge(dob?: string): number | undefined {
  if (!dob) return undefined;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function resolveTokens(body: string, ctx: TokenContext): string {
  if (!body || !body.includes("@")) return body;

  const p = ctx.patient;
  const name = p?.fullName || [p?.firstName, p?.lastName].filter(Boolean).join(" ").trim();
  const age = p?.age ?? computeAge(p?.dateOfBirth);
  const today = ctx.today || new Date().toISOString().slice(0, 10);

  const vitals = ctx.vitals
    ? `HR ${ctx.vitals.hr ?? "?"}, BP ${ctx.vitals.sbp ?? "?"}/${ctx.vitals.dbp ?? "?"}, SpO2 ${ctx.vitals.spo2 ?? "?"}%, RR ${ctx.vitals.rr ?? "?"}, T ${ctx.vitals.tempC?.toFixed?.(1) ?? ctx.vitals.tempC ?? "?"}°C` +
      (ctx.vitals.recordedAt ? ` (${ctx.vitals.recordedAt})` : "")
    : "(no vitals recorded)";

  const meds = (ctx.meds?.length
    ? ctx.meds.map(m => `- ${[m.name, m.dose, m.route, m.frequency].filter(Boolean).join(" ")}`).join("\n")
    : "(none)");

  const allergies = (ctx.allergies?.length
    ? ctx.allergies.map(a => `${a.substance}${a.reaction || a.severity ? ` (${[a.reaction, a.severity].filter(Boolean).join(", ")})` : ""}`).join("; ")
    : "NKDA");

  const problems = (ctx.problems?.length
    ? ctx.problems.map(pr => `- ${pr.description}${pr.icdCode ? ` (${pr.icdCode})` : ""}`).join("\n")
    : "(none)");

  const map: Record<string, string> = {
    "@name@":      name || "",
    "@mrn@":       p?.mrn || "",
    "@sex@":       p?.sex || "",
    "@age@":       age != null ? String(age) : "",
    "@today@":     today,
    "@author@":    ctx.author || "",
    "@lastvitals@": vitals,
    "@meds@":      meds,
    "@allergies@": allergies,
    "@problems@":  problems,
  };

  let out = body;
  for (const [tok, val] of Object.entries(map)) {
    // Why: case-insensitive global replace.
    out = out.replace(new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), val);
  }
  return out;
}
