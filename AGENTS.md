# MedCure — Agent Instructions

MedCure is a multi-tenant healthcare EMR built as a modular monolith.  
**Backend**: .NET 10 minimal-API + EF Core 9 + SQLite  
**Frontend**: Next.js 15 (App Router) + TypeScript (strict)  
**Design spec**: static HTML files in [`Mocks/`](Mocks/)

---

## Quick start

```powershell
# Backend (listens on :5050)
dotnet run --project backend/MedCure.Api

# Frontend (listens on :3000)
cd frontend/medcure-web
npm install
npm run dev

# Migrations
dotnet ef migrations add <Name> --project backend/MedCure.Api
dotnet ef database update --project backend/MedCure.Api

# Re-seed (wipe and restart)
Remove-Item backend/MedCure.Api/medcure.db -ErrorAction SilentlyContinue
dotnet run --project backend/MedCure.Api
```

`.env.local` required: `NEXT_PUBLIC_API_URL=http://localhost:5050`

---

## Specialist skills (load before working in each area)

| Area | Skill file |
|------|-----------|
| Backend entities, endpoints, repositories, auth | [`.claude/skills/medcure-backend/SKILL.md`](.claude/skills/medcure-backend/SKILL.md) |
| Frontend pages, components, API client, CSS | [`.claude/skills/medcure-frontend/SKILL.md`](.claude/skills/medcure-frontend/SKILL.md) |

---

## Design source of truth

The mocks **are the spec** — they define field names, table columns, status pills, and click-through targets.

1. Read [`Mocks/pages/Sitemap.html`](Mocks/pages/Sitemap.html) first — it indexes all ~60 screens by domain.
2. Open the mock for the page you are implementing before writing any code.
3. Use [`Mocks/scripts/router.js`](Mocks/scripts/router.js) to find navigation targets between screens.
4. Design tokens and reusable CSS classes live in [`Mocks/styles/medcure.css`](Mocks/styles/medcure.css) — port them, don't reinvent them.

---

## Cross-cutting conventions

### Status colours (shared contract)
All status values map to exactly four CSS classes and the `StatusKind` TypeScript union:

| Value | CSS class | Meaning |
|-------|-----------|---------|
| `good` | `.pill.good` | healthy / signed / normal |
| `warn` | `.pill.warn` | pending / borderline |
| `bad`  | `.pill.bad`  | critical / rejected / overdue |
| `info` | `.pill.info` | informational / scheduled |

Use `<StatusPill kind={…}>` in React; return the string value from the API.

### Multi-tenancy
- Every domain entity except `Tenant` and `User` carries a `TenantId`.
- The active tenant is encoded in the JWT claim `tid`.
- `Repository<T>.Query()` filters by `TenantId` automatically — never add a manual tenant filter in endpoints.

### Order lifecycle
`draft → signed → verified → dispensed → administered → cancelled`  
CDS alerts fire between `draft` and `signed`.

### Auth
- Token lifetime: **8 hours**. Re-login for refresh.
- Passwords: BCrypt (via `PasswordHasher`).
- Public routes: `/api/auth/login`, `/api/auth/register`, `/api/health`.

---

## Common pitfalls

- **Never inject `AppDbContext` into endpoints.** Use `IUnitOfWork` only.
- **One public type per `.cs` file** and one default export per `.tsx` file — no megafiles.
- **Deleting `medcure.db`** is required to re-run seed data (guard: `if (await db.Tenants.AnyAsync()) return;`).
- **Hash-based tabs** (`#vitals`, `#labs`, `#meds`) must be preserved in React so the mock router wiring works — use a `useHashTab()` hook.
- **No CSS framework** on the frontend — reuse the classes from `Mocks/styles/medcure.css`, do not add Tailwind or similar.
- **`lib/types.ts` must mirror backend DTOs** — update both sides together when changing a DTO.
- The [`Mocks/`](Mocks/) directory is deployed to GitHub Pages via [`.github/workflows/pages.yml`](.github/workflows/pages.yml) — it is **not** the application.
