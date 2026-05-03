---
name: medcure-frontend
description: Conventions for the MedCure Next.js + TypeScript frontend. Use when adding/modifying pages, components, or API client code under frontend/medcure-web. Covers App Router layout, design tokens from Mocks/styles/medcure.css, API client, auth/tenant context, and per-component file rules.
---

# MedCure frontend conventions

## Stack
- **Next.js 15** (App Router)
- **TypeScript** strict
- **No CSS framework** — port the design tokens and component classes from [Mocks/styles/medcure.css](../../../Mocks/styles/medcure.css). Add layered global CSS files (`globals.css`, `medcure.css`, `nav.css`).
- **Server components by default**, `"use client"` only where needed (forms, dropdowns, charts).
- **Fetch** for HTTP — wrapped in `lib/api.ts` so the auth/tenant headers are automatic.

## Project layout
```
frontend/medcure-web/
  app/
    layout.tsx                  — AppShell mounted here (Nav + frame)
    page.tsx                    — Dashboard (port of Mocks/Medcure Dashboard.html)
    (auth)/                     — route group with NO AppShell
      sign-in/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      two-factor/page.tsx
      tenant-selector/page.tsx
    patients/
      page.tsx                  — Patients index
      [mrn]/
        page.tsx                — PatientChart
        profile/page.tsx
    appointments/page.tsx
    schedule/page.tsx
    labs/
      page.tsx
      [id]/page.tsx             — LabDetail
    pharmacy/
      page.tsx
      verify/[orderId]/page.tsx
    cpoe/page.tsx
    orders/[id]/page.tsx
    emar/page.tsx
    bed-board/page.tsx
    ed/page.tsx
    ed/live/page.tsx
    triage/page.tsx
    code-stemi/page.tsx
    code-blue/page.tsx
    billing/page.tsx
    inventory/page.tsx
    staff/page.tsx
    messages/page.tsx
    documents/page.tsx
    settings/page.tsx
    admit/page.tsx
    discharge/page.tsx
    note-composer/page.tsx
    consult-request/page.tsx
    transfer-request/page.tsx
    signout/page.tsx
    vitals-entry/page.tsx
    care-plan/page.tsx
    allergy-management/page.tsx
    immunizations/page.tsx
    clinic-visit/page.tsx
    telemetry/page.tsx
    icu-flowsheet/page.tsx
    or-case/page.tsx
    surgery-board/page.tsx
    radiology/page.tsx
    imaging/page.tsx
    blood-bank/page.tsx
    dialysis/page.tsx
    infusion/page.tsx
    pathology/page.tsx
    result-ack/page.tsx
    specimen-tracking/page.tsx
    eligibility/page.tsx
    charge-capture/page.tsx
    payment-posting/page.tsx
    patient-statement/page.tsx
    claim-detail/page.tsx
    denial-mgmt/page.tsx
    sitemap/page.tsx
    logout/page.tsx
  components/
    AppShell.tsx
    Nav.tsx                     — top tabs, search, notifications
    TenantSwitcher.tsx
    ProfileMenu.tsx
    StatusPill.tsx
    DataTable.tsx
    Card.tsx
    Breadcrumbs.tsx
    Subnav.tsx
    Sparkline.tsx
    Gauge.tsx
    BedTile.tsx
    EsiTriagePill.tsx
    VitalTile.tsx
    ... ONE COMPONENT PER FILE
  lib/
    api.ts                      — typed fetch wrapper
    auth.ts                     — token + tenant + current-user storage
    types.ts                    — shared TS types matching backend DTOs
    fmt.ts                      — date/number formatters
  styles/
    globals.css
    medcure.css                 — ported from mocks
    nav.css                     — ported from nav.js style block
  middleware.ts                 — redirect unauthenticated to /sign-in
  next.config.ts
  tsconfig.json
  package.json
```

## Per-component file rule
**Strict.** One default export per file. File name == component name (PascalCase). No "Components.tsx" or "Pills.tsx" barrels. Helper sub-components used only by one parent stay inline; if reused, promote to its own file.

## Pages always render via the design system
Every page (except auth) is wrapped by `AppShell`, which renders:
1. `<div class="page"><div class="frame">`
2. `<Nav />` (top tabs + tenant switcher + profile menu)
3. children

Auth pages live in the `(auth)` route group with their own minimal layout — no AppShell.

## Design tokens (read [Mocks/styles/medcure.css](../../../Mocks/styles/medcure.css))
Available CSS vars (already in `styles/medcure.css` after porting):
- `--bg, --surface, --surface-2`
- `--ink, --ink-soft, --ink-mute`
- `--line, --line-2`
- `--accent` (#ffe26b), `--accent-2`
- `--good` (#27c26b), `--bad` (#ff4d6b), `--warn` (#ffb84d), `--info` (#3a86ff)
- `--shadow`

Reusable classes (do NOT redefine inline): `.page`, `.frame`, `.card`, `.tabs`, `.tab`, `.subnav`, `.pill`, `.btn`, `.searchbox`, `.table`, `.h1`, `.h2`, `.eyebrow`.

Status pills are mandatory:
```tsx
<StatusPill kind="good">Stable</StatusPill>     // green
<StatusPill kind="warn">Pending</StatusPill>    // orange
<StatusPill kind="bad">Critical</StatusPill>    // red
<StatusPill kind="info">Scheduled</StatusPill>  // blue
```

## API client
```ts
// lib/api.ts
export async function api<T>(path: string, init?: RequestInit): Promise<T> { ... }
```
- Reads `localStorage` token + active tenant on the client.
- On 401, clears auth and redirects to `/sign-in`.
- Server components use a separate `serverApi` helper that reads the cookie.

Typed wrappers per resource live alongside:
```ts
// lib/patients.ts
export const Patients = {
  list: (q?: string) => api<PatientSummary[]>(`/api/patients?q=${q ?? ""}`),
  get:  (mrn: string) => api<PatientDetail>(`/api/patients/${mrn}`),
};
```

## Auth + tenant context
- Token stored in `localStorage.medcure_token`.
- Active tenant in `localStorage.medcure_tenant_id`.
- A small client-only `<AuthProvider>` reads these on mount and exposes `useAuth()` for the Nav.
- `middleware.ts` reads the JWT cookie (set on login) and redirects unauth → `/sign-in`.

## Typing
- `lib/types.ts` mirrors the backend DTOs. Update both sides together.
- Strict `tsconfig.json`. No `any`. Use `unknown` + narrow.

## Hash-based tabs
Pages like `PatientChart` use hash routing (`#vitals`, `#labs`, `#meds`) — implement with a small client `useHashTab()` hook so the nav `router.js` paths translate 1:1.

## Build / run
```powershell
cd frontend/medcure-web
npm install
npm run dev          # :3000
npm run build
npm run lint
```

API base URL: `NEXT_PUBLIC_API_URL=http://localhost:5050` (set in `.env.local`).
