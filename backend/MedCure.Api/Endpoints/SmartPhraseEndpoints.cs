using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class SmartPhraseEndpoints
{
    public static IEndpointRouteBuilder MapSmartPhraseEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/smart-phrases").RequireAuthorization();
        g.MapGet   ("/",         List);
        g.MapPost  ("/",         Create);
        g.MapDelete("/{id:int}", Delete);
        return app;
    }

    private record CreateReq(string Code, string Title, string Body, string? Scope);

    private static async Task<IResult> List(IUnitOfWork uow, ICurrentUser current, string? q)
    {
        var uid = current.UserId;
        var query = uow.SmartPhrases.QueryAll().Where(p =>
            p.Scope == "system" ||
            (p.Scope == "tenant" && p.TenantId == (current.TenantId ?? 0)) ||
            (p.Scope == "user"   && p.TenantId == (current.TenantId ?? 0) && p.OwnerUserId == uid));
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.ToLower();
            query = query.Where(p => p.Code.ToLower().Contains(qq) || p.Title.ToLower().Contains(qq));
        }
        var rows = await query.OrderBy(p => p.Code).Take(500).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(CreateReq input, IUnitOfWork uow, ICurrentUser current)
    {
        var code = string.IsNullOrWhiteSpace(input.Code) ? "" : input.Code.Trim();
        if (!code.StartsWith('.')) code = "." + code;
        var scope = string.IsNullOrWhiteSpace(input.Scope) ? "user" : input.Scope!;
        if (scope == "system") scope = "tenant";
        var entity = new SmartPhrase
        {
            Code = code,
            Title = input.Title ?? "",
            Body = input.Body ?? "",
            Scope = scope,
            OwnerUserId = scope == "user" ? current.UserId : null,
        };
        await uow.SmartPhrases.AddAsync(entity);
        await uow.SaveAsync();
        return Results.Created($"/api/smart-phrases/{entity.Id}", entity);
    }

    private static async Task<IResult> Delete(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var p = await uow.SmartPhrases.GetAsync(id);
        if (p is null) return Results.NotFound();
        if (p.Scope == "system") return Results.Forbid();
        var isAdmin = current.Roles.Any(r => r.Equals("admin", StringComparison.OrdinalIgnoreCase));
        if (p.Scope == "user" && p.OwnerUserId != current.UserId && !isAdmin) return Results.Forbid();
        if (p.Scope == "tenant" && !isAdmin) return Results.Forbid();
        uow.SmartPhrases.Remove(p);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
