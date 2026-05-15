using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class AuditEndpoints
{
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/audit").RequireAuthorization();
        g.MapGet("/",       List);
        g.MapGet("/search", Search);
        return app;
    }

    private static async Task<IResult> Search(IUnitOfWork uow, HttpContext http,
        int? userId, int? patientId, string? kind, DateTime? fromUtc, DateTime? toUtc,
        int? take, int? skip)
    {
        var q = uow.AuditEntries.Query();
        if (userId is int uid)    q = q.Where(a => a.UserId == uid);
        if (patientId is int pid) q = q.Where(a => a.TargetPatientId == pid);
        if (!string.IsNullOrWhiteSpace(kind)) q = q.Where(a => a.Kind == kind);
        if (fromUtc is DateTime f) q = q.Where(a => a.At >= f);
        if (toUtc   is DateTime t) q = q.Where(a => a.At <= t);

        var total = await q.CountAsync();
        http.Response.Headers["X-Total-Count"] = total.ToString();

        var rows = await q.OrderByDescending(a => a.At)
            .Skip(skip ?? 0).Take(take ?? 100).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> List(IUnitOfWork uow, HttpContext http,
        int? userId, string? entityType, string? action, int? take, int? skip)
    {
        var q = uow.AuditEntries.Query();
        if (userId is int uid) q = q.Where(a => a.UserId == uid);
        if (!string.IsNullOrWhiteSpace(entityType)) q = q.Where(a => a.Resource == entityType);
        if (!string.IsNullOrWhiteSpace(action))     q = q.Where(a => a.Action == action);

        var total = await q.CountAsync();
        http.Response.Headers["X-Total-Count"] = total.ToString();

        var rows = await q.OrderByDescending(a => a.At)
            .Skip(skip ?? 0).Take(take ?? 50).ToListAsync();
        return Results.Ok(rows);
    }
}
