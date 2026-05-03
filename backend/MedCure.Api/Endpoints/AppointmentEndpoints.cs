using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class AppointmentEndpoints
{
    public static IEndpointRouteBuilder MapAppointmentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/appointments").RequireAuthorization();
        g.MapGet ("/",      List);
        g.MapPost("/",      Create);
        g.MapPatch("/{id:int}/status", Patch);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, DateTime? from, DateTime? to, string? provider)
    {
        var fromUtc = from ?? DateTime.UtcNow.Date;
        var toUtc   = to   ?? fromUtc.AddDays(7);
        var q = uow.Appointments.Query().Where(a => a.ScheduledAt >= fromUtc && a.ScheduledAt < toUtc);
        if (!string.IsNullOrWhiteSpace(provider)) q = q.Where(a => a.ProviderName == provider);
        var rows = await q.OrderBy(a => a.ScheduledAt).Take(500).ToListAsync();
        var pids = rows.Select(r => r.PatientId).Distinct().ToList();
        var pats = await uow.Patients.Query().Where(p => pids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);
        return Results.Ok(rows.Select(a => new
        {
            a.Id, a.ScheduledAt, a.DurationMin, a.ProviderName, a.Specialty, a.Room, a.Status, a.Type,
            Patient = pats.TryGetValue(a.PatientId, out var p)
                ? new { p.Id, p.Mrn, FullName = $"{p.FirstName} {p.LastName}", p.AvatarUrl }
                : null
        }));
    }

    private static async Task<IResult> Create(Appointment input, IUnitOfWork uow)
    {
        await uow.Appointments.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/appointments/{input.Id}", input);
    }

    private static async Task<IResult> Patch(int id, StatusPatch req, IUnitOfWork uow)
    {
        var a = await uow.Appointments.GetAsync(id);
        if (a is null) return Results.NotFound();
        a.Status = req.Status;
        uow.Appointments.Update(a);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    public record StatusPatch(string Status);
}
