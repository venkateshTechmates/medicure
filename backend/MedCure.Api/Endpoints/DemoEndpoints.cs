using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;

namespace MedCure.Api.Endpoints;

/// <summary>
/// PRD §14.X — demo reset &amp; canned scenarios. Admin-only.
/// </summary>
public static class DemoEndpoints
{
    public static IEndpointRouteBuilder MapDemoEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/demo").RequireAuthorization();
        g.MapPost("/reset",            Reset);
        g.MapPost("/scenario/{name}",  Scenario);
        return app;
    }

    private static async Task<IResult> Reset(IDemoService demo, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "Admin", "admin") is { } forbid) return forbid;
        if (current.TenantId is not int tid) return Results.Unauthorized();

        var counts = await demo.ResetAsync(tid);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "demo_reset",
            Action = "reset",
            Resource = $"tenant:{tid}",
            Detail = string.Join(",", counts.Select(kv => $"{kv.Key}={kv.Value}")),
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();

        return Results.Ok(new { tenantId = tid, counts });
    }

    private static async Task<IResult> Scenario(string name, IDemoService demo, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "Admin", "admin") is { } forbid) return forbid;
        if (current.TenantId is not int tid) return Results.Unauthorized();

        DemoScenarioResult result;
        try
        {
            result = await demo.RunScenarioAsync(tid, name);
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { error = ex.Message });
        }

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "demo_scenario",
            Action = "scenario",
            Resource = $"tenant:{tid}",
            Detail = $"scenario={result.Scenario}; patientId={result.PatientId}; orders=[{string.Join(",", result.OrderIds)}]",
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();

        return Results.Ok(result);
    }
}
