# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Backend**: .NET 10 Web API at `backend/MedCure.Api` — EF Core 9 + SQLite, Minimal APIs, Repository + Unit of Work, JWT auth
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript at `frontend/medcure-web`
- **Database**: SQLite (`backend/MedCure.Api/medcure.db`), migrated via `dotnet ef`
- **Demo credentials**: `demo@medcure.health` / `demo123!`

## Commands

```powershell
# Backend (listens on http://localhost:5050)
dotnet run --project backend/MedCure.Api
dotnet ef migrations add <Name> --project backend/MedCure.Api
dotnet ef database update --project backend/MedCure.Api

# Frontend (proxies API at NEXT_PUBLIC_API_URL=http://localhost:5050)
cd frontend/medcure-web
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

To preview mocks, open any HTML file in `Mocks/` directly in a browser — they are self-contained.

## What the mocks are

`Mocks/` is the design source of truth — not the application, the spec. Every real page must match its mock for fields, table columns, status pills, and click targets.

- [Mocks/pages/Sitemap.html](Mocks/pages/Sitemap.html) — **read first**: master index of every screen grouped by domain and kind
- [Mocks/styles/medcure.css](Mocks/styles/medcure.css) — design tokens and component classes (already imported in the Next.js app via `globals.css`)
- [Mocks/scripts/nav.js](Mocks/scripts/nav.js) — canonical top-nav: 12 tabs, tenant switcher, profile menu
- [Mocks/scripts/router.js](Mocks/scripts/router.js) — `window.MC_ROUTES` wires mock cards to destinations; use to discover inter-page navigation
- [Mocks/scripts/breadcrumbs.js](Mocks/scripts/breadcrumbs.js) — `data-bc` pattern for breadcrumb data on detail pages

When implementing a real page, open the corresponding mock and the Sitemap entry first.

## Backend architecture

### Entities

All entities extend `Entity` (adds `Id`, `CreatedAt`, `UpdatedAt`). Multi-tenant entities extend `TenantEntity` (adds `TenantId`). Both timestamps auto-set/update in `AppDbContext.SaveChanges`.

Key domain entities: `Tenant`, `User`, `UserTenant`, `Patient`, `Encounter`, `Order`, `LabResult`, `Vital`, `MedicationAdministration`, `Appointment`, `Bed`, `Ward`, `EDArrival`, `Claim`, `InventoryItem`, `Note`, `Document`, `MessageThread`, `Message`, `Specimen`, `Allergy`, `Problem`, `Immunization`, `ConsultRequest`, `TransferRequest`, `CodeEvent`, `CdsAlert`, `AuditEntry`.

### Repository + Unit of Work

`Repository<T>` (`Data/Repositories/Repository.cs`) is the generic base:
- `Query()` — automatically filters `TenantEntity` records by `ICurrentUser.TenantId`
- `QueryAll()` — bypasses tenant filter
- `AddAsync()` — auto-assigns `TenantId` from current user if entity is `TenantEntity` with `TenantId == 0`
- All queries use `AsNoTracking()` by default

Specialized repositories (e.g. `PatientRepository`, `UserRepository`, `OrderRepository`) extend `Repository<T>` and add domain-specific query methods.

`IUnitOfWork` aggregates all repositories and exposes `SaveAsync()`. Inject it in endpoints; never call `DbContext` directly.

### Minimal APIs

Each domain has an endpoint file in `Endpoints/` that defines a static `MapXxxEndpoints(this IEndpointRouteBuilder)` extension method. All protected routes use `.RequireAuthorization()`. Handler methods receive `IUnitOfWork uow, ICurrentUser current` via DI. Request bodies use inline `record` types.

### Auth

JWT (HS256, 8-hour expiry). Claims: `sub` = UserId, `tid` = TenantId, `role` = role in active tenant. `ICurrentUser` / `CurrentUserService` extract these from `HttpContext.User`. Passwords hashed with BCrypt.

`UserTenant` join table tracks a user's role and status per tenant. Switching tenants reissues the JWT with the new `tid`.

### Multi-tenancy

Tenant isolation is automatic at the repository layer — `Query()` always filters by `ICurrentUser.TenantId`. Use `QueryAll()` only for cross-tenant admin queries.

## Frontend architecture

### Auth flow

Login → POST `/api/auth/login` → store `token`, `user`, `activeTenant`, `tenants[]` in `localStorage` via `lib/auth.ts`. `AuthGate` (`components/AuthGate.tsx`) is a client component that reads `localStorage` and redirects to `/sign-in` if no token. On any 401 response, `lib/api.ts` clears storage and redirects.

### API client

`lib/api.ts` exports `api<T>(path, init)` — a thin `fetch` wrapper that injects `Authorization: Bearer <token>`, sets `cache: "no-store"`, and handles 401 centrally. All API calls go through this function.

### Page structure

Pages are Server Components that render `<AppShell><XxxClient /></AppShell>`. The actual UI lives in `components/pages/*Client.tsx` client components. `AppShell` wraps with `<AuthGate>` + `<Nav>`. New pages should follow this split.

### Design system

Design tokens and component classes from `Mocks/styles/medcure.css` are imported globally. Use them directly — do not reinvent. Key tokens: `--accent: #ffe26b`, `--ink`, `--good`, `--warn`, `--bad`, `--info`. Key classes: `.card`, `.pill`, `.table`, `.btn`, `.tabs`, `.subnav`, `.frame`.

`StatusPill` (`components/StatusPill.tsx`) wraps `.pill.{good|warn|bad|info}` — use it everywhere a status needs a colored badge.

## Conventions

- **Status strings** — use `"good"`, `"warn"`, `"bad"`, `"info"` end-to-end (entity field → DTO → StatusPill). Never use numeric enums for display status.
- **Detail pages** use breadcrumbs (`Breadcrumbs` component); **index pages** use subnav pills (`.subnav`).
- **Hash-based tab routing** — deep-link tabs via URL fragment (e.g. `/patients/MRN001#labs`) so mock router wiring translates 1:1.
- **Tenant switcher + profile menu** live only in `Nav.tsx` — never fragment identity UI elsewhere.
- **Type definitions** live in `lib/types.ts` — add new DTOs there and keep them in sync with backend response shapes.
- **New endpoints** go in a dedicated `Endpoints/XxxEndpoints.cs` and are registered in `Program.cs` via `app.MapXxxEndpoints()`.
- **New entities** go in `Domain/Entities/`, extend the appropriate base class, get a `DbSet` in `AppDbContext`, and require a new migration.
