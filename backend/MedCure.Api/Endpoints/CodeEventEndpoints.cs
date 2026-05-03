using System.Text.Json;
using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class CodeEventEndpoints
{
    public static IEndpointRouteBuilder MapCodeEventEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/codes").RequireAuthorization();
        g.MapGet ("/",                  List);
        g.MapGet ("/{id:int}",          Get);
        g.MapPost("/activate",          Activate);
        g.MapPost("/{id:int}/step",     Step);
        g.MapPost("/{id:int}/resolve",  Resolve);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? kind, string? status, int? take)
    {
        var q = uow.CodeEvents.Query().Include(c => c.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(kind))   q = q.Where(c => c.Kind == kind);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        var rows = await q.OrderByDescending(c => c.ActivatedAt).Take(take ?? 50).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var c = await uow.CodeEvents.Query().Include(x => x.Patient).FirstOrDefaultAsync(x => x.Id == id);
        return c is null ? Results.NotFound() : Results.Ok(c);
    }

    public record ActivateRequest(string Kind, string Location, int? PatientId);

    private static async Task<IResult> Activate(ActivateRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        var initial = new[] {
            new { at = DateTime.UtcNow, label = "Code activated · team paged", done = true }
        };
        var ev = new CodeEvent
        {
            Kind = req.Kind,
            Location = req.Location,
            PatientId = req.PatientId,
            ActivatedAt = DateTime.UtcNow,
            ActivatedBy = current.FullName ?? "Unknown",
            Status = "active",
            TimelineJson = JsonSerializer.Serialize(initial)
        };
        await uow.CodeEvents.AddAsync(ev);
        await uow.SaveAsync();
        return Results.Created($"/api/codes/{ev.Id}", ev);
    }

    public record StepRequest(string Label);

    private static async Task<IResult> Step(int id, StepRequest req, IUnitOfWork uow)
    {
        var c = await uow.CodeEvents.GetAsync(id);
        if (c is null) return Results.NotFound();
        var list = string.IsNullOrEmpty(c.TimelineJson)
            ? new List<object>()
            : JsonSerializer.Deserialize<List<JsonElement>>(c.TimelineJson)!.Cast<object>().ToList();
        list.Add(new { at = DateTime.UtcNow, label = req.Label, done = true });
        c.TimelineJson = JsonSerializer.Serialize(list);
        uow.CodeEvents.Update(c);
        await uow.SaveAsync();
        return Results.Ok(c);
    }

    public record ResolveRequest(string Outcome);

    private static async Task<IResult> Resolve(int id, ResolveRequest req, IUnitOfWork uow)
    {
        var c = await uow.CodeEvents.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "resolved";
        c.ResolvedAt = DateTime.UtcNow;
        c.Outcome = req.Outcome ?? "";
        uow.CodeEvents.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
