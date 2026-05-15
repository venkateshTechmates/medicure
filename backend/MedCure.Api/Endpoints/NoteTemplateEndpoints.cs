using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class NoteTemplateEndpoints
{
    public static IEndpointRouteBuilder MapNoteTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/note-templates").RequireAuthorization();
        g.MapGet   ("/",           List);
        g.MapPost  ("/",           Create);
        g.MapDelete("/{id:int}",   Delete);
        return app;
    }

    private record CreateReq(string Code, string Title, string Specialty, string Type, string Body, string? Scope);

    private static async Task<IResult> List(IUnitOfWork uow, ICurrentUser current, string? type)
    {
        var uid = current.UserId;
        // Why: include system templates (TenantId 0 / Scope=system) across tenants.
        var q = uow.NoteTemplates.QueryAll().Where(t =>
            t.Scope == "system" ||
            (t.Scope == "tenant" && t.TenantId == (current.TenantId ?? 0)) ||
            (t.Scope == "user"   && t.TenantId == (current.TenantId ?? 0) && t.OwnerUserId == uid));
        if (!string.IsNullOrWhiteSpace(type))
            q = q.Where(t => t.Type == type);
        var rows = await q.OrderBy(t => t.Type).ThenBy(t => t.Title).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(CreateReq input, IUnitOfWork uow, ICurrentUser current)
    {
        var scope = string.IsNullOrWhiteSpace(input.Scope) ? "user" : input.Scope!;
        if (scope == "system") scope = "tenant"; // Why: only seed code can create system templates.
        var entity = new NoteTemplate
        {
            Code = input.Code,
            Title = input.Title,
            Specialty = input.Specialty,
            Type = string.IsNullOrWhiteSpace(input.Type) ? "Progress" : input.Type,
            Body = input.Body,
            Scope = scope,
            OwnerUserId = scope == "user" ? current.UserId : null,
        };
        await uow.NoteTemplates.AddAsync(entity);
        await uow.SaveAsync();
        return Results.Created($"/api/note-templates/{entity.Id}", entity);
    }

    private static async Task<IResult> Delete(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var t = await uow.NoteTemplates.GetAsync(id);
        if (t is null) return Results.NotFound();
        if (t.Scope == "system") return Results.Forbid();
        var isAdmin = current.Roles.Any(r => r.Equals("admin", StringComparison.OrdinalIgnoreCase));
        if (t.Scope == "user" && t.OwnerUserId != current.UserId && !isAdmin) return Results.Forbid();
        if (t.Scope == "tenant" && !isAdmin) return Results.Forbid();
        uow.NoteTemplates.Remove(t);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
