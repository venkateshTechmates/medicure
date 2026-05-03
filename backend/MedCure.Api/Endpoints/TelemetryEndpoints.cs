using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class TelemetryEndpoints
{
    public static IEndpointRouteBuilder MapTelemetryEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/telemetry").RequireAuthorization();
        g.MapGet("/", List);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow)
    {
        // Patients with the most recent vital snapshot — flagged by status
        var patients = await uow.Patients.Query()
            .Where(p => p.Status == "bad" || p.Status == "warn" || p.Ward.Contains("ICU") || p.Ward.Contains("Telemetry"))
            .Take(20)
            .ToListAsync();

        var pids = patients.Select(p => p.Id).ToList();
        var latest = await uow.Vitals.Query()
            .Where(v => pids.Contains(v.PatientId))
            .GroupBy(v => v.PatientId)
            .Select(g => g.OrderByDescending(v => v.RecordedAt).First())
            .ToListAsync();
        var byPid = latest.ToDictionary(v => v.PatientId);

        var result = patients.Select(p =>
        {
            byPid.TryGetValue(p.Id, out var v);
            return new
            {
                p.Id,
                p.Mrn,
                FullName = $"{p.FirstName} {p.LastName}",
                Age = (int)((DateTime.UtcNow - p.DateOfBirth).TotalDays / 365),
                p.Sex,
                p.Status,
                Bed = $"{p.Ward} / {p.Bed}",
                p.AvatarUrl,
                AttendingName = p.AttendingName,
                Hr   = v?.Hr ?? 80,
                Sbp  = v?.Sbp ?? 120,
                Dbp  = v?.Dbp ?? 80,
                Spo2 = v?.Spo2 ?? 97,
                Rr   = v?.Rr   ?? 16,
                TempC = v?.TempC ?? 37.0,
            };
        });
        return Results.Ok(result);
    }
}
