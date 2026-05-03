# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This is a greenfield project. The repo currently contains only static HTML mocks under [Mocks/](Mocks/) and is being built out into a real application. The PRD lives at [PRD.md](PRD.md) (once written) and describes the target system.

The intended stack is:
- **Backend**: .NET 10 Web API (`backend/MedCure.Api`) with EF Core + SQLite
- **Frontend**: Next.js (App Router) + TypeScript (`frontend/medcure-web`)
- **Database**: SQLite (single file under `backend/MedCure.Api/medcure.db`), migrated via `dotnet ef`

If those directories do not yet exist, the work is in progress — check `PRD.md` and recent edits before assuming a layout.

## What the mocks are

[Mocks/](Mocks/) is the design source of truth — it is **not the application**, it is the spec. Treat each HTML file as the visual + interaction contract for the corresponding real page.

- [Mocks/Medcure Dashboard.html](Mocks/Medcure%20Dashboard.html) — the home page
- [Mocks/pages/](Mocks/pages/) — ~60 individual screens (Patients, PatientChart, Labs, Pharmacy, eMAR, CPOE, BedBoard, ED, Triage, Billing, Inventory, Staff, Messages, Documents, Settings, SignIn, Register, TwoFactor, TenantSelector, etc.)
- [Mocks/pages/Sitemap.html](Mocks/pages/Sitemap.html) — **read this first**: it is the master index of every screen, grouped by domain (Core / Patient record / Orders / Inpatient / ED / Workflows / Clinical / Auth / Admin) and tagged by kind (Index / Detail / Flow / Alert).
- [Mocks/styles/medcure.css](Mocks/styles/medcure.css) — the shared design system: tokens (`--accent: #ffe26b`, `--ink: #0e1116`, `--good`, `--bad`, `--warn`, `--info`), `.frame`, `.card`, `.tabs`, `.pill`, `.table`, `.btn`, `.subnav`. **Port these tokens and component classes into the Next.js app** rather than re-deriving styling from scratch.
- [Mocks/scripts/nav.js](Mocks/scripts/nav.js) — the global top-nav contract: logo · 12 tabs (Overview, Documents, Message, Labs, Patients, Appointments, Pharmacy, Billing, Stock, Staff, ED, Settings) with overflow "More", search/notifications icon buttons, **tenant switcher** (multi-org dropdown), profile menu. The set of tabs and the tenant-switcher behavior are the canonical IA — match them in the React layout.
- [Mocks/scripts/router.js](Mocks/scripts/router.js) — each mock page declares `window.MC_ROUTES = [{sel, href}]` to wire clickable cards to destinations. Use this to discover navigation flow between screens (e.g. dashboard vital cards → `PatientChart.html#vitals`, appointment cards → `PatientChart.html`).
- [Mocks/scripts/breadcrumbs.js](Mocks/scripts/breadcrumbs.js) — detail pages set `data-bc='[{label,href}, ...]'` for breadcrumbs.

When implementing a real page, **open the corresponding mock and the Sitemap entry first** — the mocks contain the field list, table columns, status pills, and click targets that the React component needs to honor.

## Domain shape (cross-cutting)

These concepts recur across the mocks and should be modeled once in the backend domain layer:

- **Tenant / Organization** — every clinician belongs to ≥1 org (Mercy Health, Northcare Pediatrics, Aurora Outpatient, Riverside Trauma, St. Olive's). Patient/order/billing data is tenant-isolated. The tenant switcher in `nav.js` and [TenantSelector.html](Mocks/pages/TenantSelector.html) are the UX for this.
- **Patient (MRN)** — universal join key. Carries demographics, allergies, weight, CrCl, code status, primary RN, attending. Referenced by every clinical module.
- **Encounter** — admission / ED visit / clinic visit. Wraps orders, vitals, notes, bed assignment.
- **Order** (CPOE) — superclass for medication / lab / imaging / nursing / consult / diet orders. Has CDS alerts, e-signature, status (draft → signed → verified → administered → resulted).
- **Vital sign**, **Lab result**, **Medication administration** (eMAR), **Bed assignment**, **Appointment**, **Note**, **Document**, **Message**, **Claim**, **Inventory item** — each has a dedicated mock and table layout that defines its fields.
- **Status enums** map to the four pill colors: `good` (green), `warn` (orange), `bad` (red), `info` (blue) — keep this convention end-to-end.
- **ESI levels 1–5** for ED triage; **I-PASS** framework for sign-out; **7-rights** for pharmacy verification — these are clinical workflows the mocks already encode, not invented terminology.

## Commands

The repo is a sandbox under `c:\Users\pedda\Source\Main\MedCure` with `dotnet 10.0.103` and `node v24.x` available. **There is no git repository yet.** No build/test/lint commands exist until the backend and frontend are scaffolded; once they are, the conventional commands apply:

```powershell
# Backend
dotnet run --project backend/MedCure.Api
dotnet ef migrations add <Name> --project backend/MedCure.Api
dotnet ef database update --project backend/MedCure.Api
dotnet test backend/MedCure.Api.Tests

# Frontend
cd frontend/medcure-web
npm install
npm run dev      # Next dev server
npm run build
npm run lint
```

To preview the mocks themselves, open any HTML file directly in a browser (no build step) — they are self-contained except for shared `styles/medcure.css` and `scripts/*.js`.

## Conventions worth preserving

- The mock IA puts **tenant switcher** and **profile menu** in the top-right of every page. Don't fragment auth/identity UI across the app — a single top-nav component should host both.
- Detail pages use **breadcrumbs**; index pages use **subnav pills** (`.subnav` in `medcure.css`). Match this split.
- Many pages use anchor fragments to deep-link tabs (e.g. `PatientChart.html#vitals`, `#labs`, `#meds`). Preserve hash-based tab routing in the React equivalents so the wiring in `router.js` translates 1:1.
- Status colors are baked into the pill classes (`.pill.good`, `.pill.warn`, `.pill.bad`, `.pill.info`) — wrap them in a typed `<StatusPill>` component rather than reinventing per page.
