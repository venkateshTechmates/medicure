using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/dashboard").RequireAuthorization();
        g.MapGet("/", Get);
        return app;
    }

    private static async Task<IResult> Get(IUnitOfWork uow)
    {
        var totalPatients     = await uow.Patients.Query().CountAsync();
        var critical          = await uow.Patients.Query().CountAsync(p => p.Status == "bad");
        var warn              = await uow.Patients.Query().CountAsync(p => p.Status == "warn");
        var todayStart        = DateTime.UtcNow.Date;
        var apptsToday        = await uow.Appointments.Query().CountAsync(a => a.ScheduledAt >= todayStart && a.ScheduledAt < todayStart.AddDays(1));
        var pendingOrders     = await uow.Orders.Query().CountAsync(o => o.Status == "draft" || o.Status == "signed");
        var criticalLabs      = await uow.LabResults.Query().CountAsync(l => l.Flag == "critical" && !l.Acknowledged);
        var edActive          = await uow.EDArrivals.Query().CountAsync(e => e.Status != "discharged");

        var upcoming = await uow.Appointments.Query()
            .Where(a => a.ScheduledAt >= DateTime.UtcNow)
            .OrderBy(a => a.ScheduledAt)
            .Take(2)
            .Include(a => a.Patient)
            .Select(a => new {
                a.Id, a.ScheduledAt, a.ProviderName, a.Specialty,
                Patient = a.Patient == null ? null : new {
                    a.Patient.Id, a.Patient.Mrn, FullName = a.Patient.FirstName + " " + a.Patient.LastName,
                    a.Patient.AvatarUrl, a.Patient.DateOfBirth
                }
            }).ToListAsync();

        return Results.Ok(new
        {
            TotalPatients = totalPatients,
            Critical = critical, Warn = warn,
            AppointmentsToday = apptsToday,
            PendingOrders = pendingOrders,
            CriticalLabs = criticalLabs,
            EDActive = edActive,
            UpcomingAppointments = upcoming
        });
    }
}
