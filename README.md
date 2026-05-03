# MedCure

Multi-tenant hospital information system / EHR. Frontend in **Next.js 16 + TypeScript**, backend in **.NET 10 minimal-API + EF Core 9 + SQLite**, JWT auth, multi-tenancy, and ~60 screens ported from the static HTML mocks under [Mocks/](Mocks/).

## Live mocks

The static design mocks are auto-deployed to GitHub Pages on every push to `main` that touches `Mocks/`:

- **Mocks site:** https://venkateshtechmates.github.io/medicure/
- **Sitemap (master index of all screens):** https://venkateshtechmates.github.io/medicure/pages/Sitemap.html

Workflow: [.github/workflows/pages.yml](.github/workflows/pages.yml). To enable Pages the first time, in the GitHub repo settings go to **Settings → Pages → Build and deployment** and set **Source = GitHub Actions**, then run the workflow once from the **Actions** tab.

## Quick start

### Prerequisites
- .NET SDK **10.0** (verified `10.0.103`)
- Node **24.x** (or any current LTS) and npm 11+

### 1. Backend
```powershell
cd backend/MedCure.Api
dotnet ef database update      # creates medcure.db (already-applied if you've run before)
dotnet run                     # http://localhost:5050
```
The first launch seeds 2 organizations, ~80 patients, ~220 orders, ~320 lab results, beds across 4 wards, ED arrivals, claims, inventory, and a demo user.

OpenAPI is at `http://localhost:5050/openapi/v1.json` in dev.

### 2. Frontend
```powershell
cd frontend/medcure-web
npm install                    # first time only
npm run dev                    # http://localhost:3000
```

Open **http://localhost:3000** and sign in with the seeded demo account:

```
Email:    demo@medcure.health
Password: demo123!
```

## Layout

```
MedCure/
├── PRD.md                     — product requirements
├── CLAUDE.md                  — orientation for AI tooling
├── Mocks/                     — original static HTML mocks (design source of truth)
├── backend/
│   ├── MedCure.sln
│   └── MedCure.Api/
│       ├── Program.cs
│       ├── Domain/
│       │   ├── Common/        — Entity, TenantEntity
│       │   └── Entities/      — one file per entity
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   ├── DbInitializer.cs
│       │   ├── IUnitOfWork.cs · UnitOfWork.cs
│       │   ├── Repositories/  — IRepository<T>, Repository<T>, plus aggregate-specific
│       │   └── Migrations/
│       ├── Auth/              — JwtService, PasswordHasher, ICurrentUser
│       ├── Endpoints/         — one file per module (AuthEndpoints, PatientEndpoints, …)
│       └── Dtos/              — one file per DTO
└── frontend/medcure-web/
    ├── app/                   — App Router; one folder per page
    │   ├── (auth)/            — sign-in, register, forgot, 2fa, tenant-selector
    │   └── …                  — patients, labs, pharmacy, ed, billing, bed-board, …
    ├── components/            — one component per file
    ├── lib/                   — api.ts, auth.ts, types.ts, fmt.ts
    └── app/globals.css        — design tokens ported from Mocks/styles/medcure.css
```

## Architecture

- **Repository + Unit of Work** — endpoints inject `IUnitOfWork`, never `AppDbContext`. The generic `Repository<T>` automatically filters `TenantEntity` queries by `ICurrentUser.TenantId` and stamps `TenantId` on insert. Aggregate-specific repositories (`PatientRepository`, `OrderRepository`, `LabResultRepository`, `UserRepository`) hold the queries that need joins or projections.
- **Multi-tenancy** — every domain class derives from `TenantEntity` except global ones (`Tenant`, `User`, `UserTenant`). The active tenant is read from the JWT claim `tid` and propagated to every query.
- **JWT auth** — 8-hour tokens, BCrypt password hashing, `[Authorize]` enforced via `RequireAuthorization()` on minimal-API groups.
- **Design system** — every reusable class (`.frame`, `.card`, `.tabs`, `.pill`, `.btn`, `.searchbox`, `.table`, `.subnav`) and every CSS variable comes verbatim from [Mocks/styles/medcure.css](Mocks/styles/medcure.css). Status pills are typed (`good | warn | bad | info`) and rendered through a shared `<StatusPill>` component.
- **Per-class file rule** — strict on both sides. One public type per `.cs` file, one default React component per `.tsx` file.

## Common commands

| Task | Command |
|---|---|
| Run API | `dotnet run --project backend/MedCure.Api` |
| Add migration | `dotnet ef migrations add <Name> --project backend/MedCure.Api` |
| Apply migrations | `dotnet ef database update --project backend/MedCure.Api` |
| Reset DB | delete `backend/MedCure.Api/medcure.db` and rerun |
| Frontend dev | `cd frontend/medcure-web && npm run dev` |
| Frontend build | `cd frontend/medcure-web && npm run build` |
| Frontend lint | `cd frontend/medcure-web && npm run lint` |

## End-to-end smoke test

The full happy path is wired:

1. Boot API on `:5050` and frontend on `:3000`.
2. Visit `/sign-in` → log in → land on dashboard with live KPIs.
3. Click any tab in the top nav (Patients, Labs, Pharmacy, ED, Bed board, Billing, Inventory, Staff, Messages, Documents, Settings).
4. Click a patient row → 13-tab chart loads (Summary / Vitals / Meds / Labs / Notes / Problems / Allergies). Hash deep-links work (`#vitals`, `#labs`).
5. Place an order via `/cpoe`, sign it, then verify it via `/pharmacy/verify/<id>` (7-rights checklist), then administer it via `/emar`.
6. Trigger code timer at `/code-stemi` or `/code-blue`.
7. Switch organization from the top-right tenant switcher (re-issues a JWT with new `tid`).
8. Browse the full screen index at `/sitemap`.

## Skills

The project ships with two Claude Code skills that document conventions for future contributors:
- [.claude/skills/medcure-backend/SKILL.md](.claude/skills/medcure-backend/SKILL.md)
- [.claude/skills/medcure-frontend/SKILL.md](.claude/skills/medcure-frontend/SKILL.md)
