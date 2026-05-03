---
name: medcure-backend
description: Conventions for the MedCure .NET 10 Web API backend. Use when adding/modifying entities, endpoints, services, or repositories under backend/MedCure.Api. Covers Repository + Unit of Work pattern, multi-tenancy, JWT auth, EF Core SQLite, and per-class file layout.
---

# MedCure backend conventions

## Stack
- **.NET 10** (`net10.0`) minimal-API
- **EF Core 9** with **SQLite** (`medcure.db` in project root, gitignored)
- **JWT bearer** auth (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- **BCrypt.Net-Next** for password hashing
- All public endpoints documented via OpenAPI (built-in for .NET 10)

## Solution layout
```
backend/
  MedCure.sln
  MedCure.Api/
    Program.cs                 — composition root only
    appsettings.json
    Domain/
      Common/                  — Entity, TenantEntity base classes
      Entities/                — ONE FILE PER ENTITY (Patient.cs, Order.cs, ...)
      Enums/                   — string-backed enums where applicable
    Data/
      AppDbContext.cs
      DbInitializer.cs         — seed runner (dev/demo only)
      Seed/                    — one file per seed module (TenantSeed, PatientSeed, ...)
      Repositories/
        IRepository.cs         — generic contract
        Repository.cs          — generic implementation
        IPatientRepository.cs  — aggregate-specific contracts (only when generic isn't enough)
        PatientRepository.cs
        ... (one pair per aggregate that needs custom queries)
      IUnitOfWork.cs
      UnitOfWork.cs
    Auth/
      JwtService.cs            — issue + validate
      PasswordHasher.cs
      ICurrentUser.cs          — abstraction over HttpContext
      CurrentUserService.cs
    Endpoints/
      AuthEndpoints.cs         — one file per module, exposing MapXxx(this IEndpointRouteBuilder)
      TenantEndpoints.cs
      PatientEndpoints.cs
      ...
    Dtos/                      — one file per DTO (XxxRequest.cs, XxxResponse.cs)
    Services/                  — domain services (CdsService, BillingService, ...) when logic is non-trivial
```

## Per-class file rule
**Strict.** One public type per `.cs` file. File name == type name. No "Entities.cs" or "Repositories.cs" megafiles. Even simple DTOs get their own file.

## Repository + Unit of Work pattern
Every endpoint that touches the DB does so through `IUnitOfWork`, never the `DbContext` directly.

```csharp
public interface IRepository<T> where T : Entity
{
    Task<T?> GetAsync(int id, CancellationToken ct = default);
    IQueryable<T> Query();                               // tenant-filtered, no-tracking
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}

public interface IUnitOfWork : IAsyncDisposable
{
    IRepository<Patient> Patients { get; }
    IPatientRepository PatientsAdvanced { get; }         // when custom queries needed
    IRepository<Order>   Orders   { get; }
    // ... one accessor per aggregate
    Task<int> SaveAsync(CancellationToken ct = default);
}
```

- Generic `Repository<T>` filters by `TenantId` automatically when `T : TenantEntity` using the current user's tenant from `ICurrentUser`.
- Aggregate-specific repositories (e.g. `PatientRepository : Repository<Patient>, IPatientRepository`) hold queries that need joins / projections.
- **Never** inject `AppDbContext` into endpoints. Inject `IUnitOfWork`.
- `SaveAsync` is the only commit point per request.

## Multi-tenancy
- Every domain class derives from `TenantEntity` unless it is global (only `Tenant`, `User` are global; `UserTenant` is a join).
- `ICurrentUser.TenantId` is read from the JWT claim `tid`.
- The generic `Repository<T>.Query()` adds `.Where(x => x.TenantId == _current.TenantId)` for `TenantEntity` automatically.
- On insert, `Repository<T>.AddAsync` stamps `TenantId = _current.TenantId` if zero.

## Endpoints
- Minimal-API style, grouped into static classes:
  ```csharp
  public static class PatientEndpoints
  {
      public static IEndpointRouteBuilder MapPatientEndpoints(this IEndpointRouteBuilder app)
      {
          var g = app.MapGroup("/api/patients").RequireAuthorization();
          g.MapGet("/", List);
          g.MapGet("/{mrn}", Get);
          // ...
          return app;
      }
      private static async Task<IResult> List(IUnitOfWork uow, string? q, ...)
      { ... }
  }
  ```
- One handler method per route, returning `IResult` (`Results.Ok`, `Results.NotFound`, `Results.Created`).
- Route prefix: `/api/<resource>`. Plural nouns. Hyphenated multi-word (`/api/lab-results`).
- All groups call `.RequireAuthorization()` except `/api/auth/login`, `/register`, `/forgot`, `/api/health`.

## DTOs
- Inputs: `XxxRequest.cs` (record). Outputs: `XxxResponse.cs` (record).
- Never return raw entities — always project to a response DTO.
- DTOs live under `Dtos/` (flat, not by feature) and use `Mapster`-style manual mappers in `Dtos/Mapping/` when projection is non-trivial.

## Auth
- `JwtService.Issue(user, tenantId)` produces a token with claims: `sub` (userId), `email`, `tid`, `role[]`, `name`.
- Token lifetime: 8h. Refresh handled by re-login.
- `[Authorize(Roles = "MD,RN")]` style policies via `RequireAuthorization(p => p.RequireRole(...))` in endpoint groups.

## Status conventions (must match frontend)
Status pill colors are typed enums in DB (string-backed):
- `good | warn | bad | info` → translates 1:1 to `.pill.good`/`.pill.warn`/`.pill.bad`/`.pill.info` in CSS.
- Order status: `draft | signed | verified | dispensed | administered | cancelled`.
- ESI: `1 | 2 | 3 | 4 | 5`.
- Bed status: `occ | empty | cleaning | held | discharge | iso | boarding`.

## Build / run
```powershell
dotnet build backend/MedCure.sln
dotnet run --project backend/MedCure.Api          # listens on :5050
dotnet ef migrations add <Name> --project backend/MedCure.Api
dotnet ef database update --project backend/MedCure.Api
```

CORS: in dev, allow `http://localhost:3000`. Configure in `Program.cs`.
