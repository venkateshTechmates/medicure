using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
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

    private static async Task<IResult> Create(Vital input, IUnitOfWork uow, ICurrentUser current,
        INews2Service news, INotificationService notify)
    {
        if (input.RecordedAt == default) input.RecordedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.RecordedBy)) input.RecordedBy = current.FullName ?? "Unknown";
        var score = news.Score(input);
        input.News2Score = score;
        input.News2Risk  = news.Risk(score);
        await uow.Vitals.AddAsync(input);
        await uow.SaveAsync();

        // Page the team on high-risk NEWS2
        if (input.News2Risk == "high")
        {
            await notify.EmitAsync(
                kind: "news2-high",
                title: $"⚠ NEWS2 = {score}",
                body:  $"High deterioration risk · HR {input.Hr} · BP {input.Sbp}/{input.Dbp} · SpO₂ {input.Spo2}% · RR {input.Rr}",
                severity: "bad",
                patientId: input.PatientId,
                url: $"/icu-flowsheet");
        }
        return Results.Created($"/api/vitals/{input.Id}", input);
    }
}
