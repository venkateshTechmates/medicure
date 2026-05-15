using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;

namespace MedCure.Api.Endpoints;

public static class LabEndpoints
{
    public static IEndpointRouteBuilder MapLabEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/labs").RequireAuthorization();
        g.MapGet ("/",             List);
        g.MapGet ("/{id:int}",     Get);
        g.MapPost("/",             Create);
        g.MapPost("/{id:int}/ack", Ack);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, HttpContext http, string? flag, int? patientId, int? take, int? skip)
    {
        var rows = await uow.LabResults.ListAsync(flag, patientId, take ?? 100);
        http.Response.Headers["X-Total-Count"] = rows.Count.ToString();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var l = await uow.LabResults.GetAsync(id);
        return l is null ? Results.NotFound() : Results.Ok(l);
    }

    private static async Task<IResult> Create(LabResult input, IUnitOfWork uow, INotificationService notify)
    {
        if (input.ResultedAt == default) input.ResultedAt = DateTime.UtcNow;
        await uow.LabResults.AddAsync(input);
        await uow.SaveAsync();

        // Auto-page on critical / panic-flagged results
        var flag = (input.Flag ?? "").ToLowerInvariant();
        if (flag is "critical" or "panic" or "high-crit" or "low-crit")
        {
            await notify.EmitAsync(
                kind: "lab-critical",
                title: $"⚠ {input.TestName} = {input.Value} {input.Units}",
                body:  $"{input.Panel} · flag {input.Flag} · awaiting acknowledgement",
                severity: "bad",
                patientId: input.PatientId,
                url: $"/labs/{input.Id}");
        }
        return Results.Created($"/api/labs/{input.Id}", input);
    }

    private static async Task<IResult> Ack(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var l = await uow.LabResults.GetAsync(id);
        if (l is null) return Results.NotFound();
        l.Acknowledged = true;
        uow.LabResults.Update(l);
        await uow.SaveAsync();
        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId, Action = "ack", Resource = "LabResult",
            Detail = $"id={id} test={l.TestName} value={l.Value}{l.Units}"
        });
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
