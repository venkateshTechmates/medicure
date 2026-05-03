using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class VitalEndpoints
{
    public static IEndpointRouteBuilder MapVitalEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/vitals").RequireAuthorization();
        g.MapGet ("/",  List);
        g.MapPost("/",  Create);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, int? take)
    {
        var q = uow.Vitals.Query();
        if (patientId is int pid) q = q.Where(v => v.PatientId == pid);
        var rows = await q.OrderByDescending(v => v.RecordedAt).Take(take ?? 100).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(Vital input, IUnitOfWork uow, ICurrentUser current)
    {
        if (input.RecordedAt == default) input.RecordedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.RecordedBy)) input.RecordedBy = current.FullName ?? "Unknown";
        await uow.Vitals.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/vitals/{input.Id}", input);
    }
}
