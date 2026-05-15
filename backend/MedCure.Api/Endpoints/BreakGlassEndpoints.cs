using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class BreakGlassEndpoints
{
    public static IEndpointRouteBuilder MapBreakGlassEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/audit/break-glass").RequireAuthorization();
        g.MapPost("/",       Acknowledge);
        g.MapGet ("/recent", Recent);
        return app;
    }

    public record BreakGlassInput(int PatientId, string ReasonCode, string ReasonText);

    private static async Task<IResult> Acknowledge(BreakGlassInput input, IUnitOfWork uow, ICurrentUser current, HttpContext http)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        var entry = new AuditEntry
        {
            UserId = current.UserId,
            Kind = "break_glass",
            TargetPatientId = input.PatientId,
            Reason = $"{input.ReasonCode}:{input.ReasonText}",
            Action = "break_glass",
            Resource = $"patient:{input.PatientId}",
            Detail = http.Connection.RemoteIpAddress?.ToString() ?? "",
            At = DateTime.UtcNow
        };
        await uow.AuditEntries.AddAsync(entry);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Recent(IUnitOfWork uow, ICurrentUser current, int? days)
    {
        if (RoleGuard.Require(current, "Admin", "Privacy", "PrivacyOfficer") is { } forbid) return forbid;
        var since = DateTime.UtcNow.AddDays(-(days ?? 7));
        var rows = await uow.AuditEntries.Query()
            .Where(a => a.Kind == "break_glass" && a.At >= since)
            .OrderByDescending(a => a.At)
            .Take(500)
            .ToListAsync();
        return Results.Ok(rows);
    }
}
