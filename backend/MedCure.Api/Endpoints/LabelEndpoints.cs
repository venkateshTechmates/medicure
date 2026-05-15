using MedCure.Api.Data;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class LabelEndpoints
{
    public static IEndpointRouteBuilder MapLabelEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/labels").RequireAuthorization();
        g.MapGet("/wristband/{patientId:int}", Wristband);
        g.MapGet("/specimen/{specimenId:int}", SpecimenLabel);
        g.MapGet("/discharge/{patientId:int}", Discharge);
        return app;
    }

    private static async Task<IResult> Wristband(int patientId, string? fmt, IUnitOfWork uow, ILabelRenderer labels)
    {
        var p = await uow.Patients.GetAsync(patientId);
        if (p is null) return Results.NotFound();
        if (string.Equals(fmt, "zpl", StringComparison.OrdinalIgnoreCase))
            return Results.Text(labels.Wristband_Zpl(p), "text/plain");
        return Results.Text(labels.Wristband_Html(p), "text/html");
    }

    private static async Task<IResult> SpecimenLabel(int specimenId, string? fmt, IUnitOfWork uow, ILabelRenderer labels)
    {
        var s = await uow.Specimens.GetAsync(specimenId);
        if (s is null) return Results.NotFound();
        var p = await uow.Patients.GetAsync(s.PatientId);
        if (p is null) return Results.NotFound();
        if (string.Equals(fmt, "zpl", StringComparison.OrdinalIgnoreCase))
            return Results.Text(labels.Specimen_Zpl(s, p), "text/plain");
        return Results.Text(labels.Specimen_Html(s, p), "text/html");
    }

    private static async Task<IResult> Discharge(int patientId, IUnitOfWork uow, IDischargePdfRenderer renderer)
    {
        var p = await uow.Patients.GetAsync(patientId);
        if (p is null) return Results.NotFound();

        var note = await uow.Notes.Query()
            .Where(n => n.PatientId == p.Id && (n.Type == "Discharge" || n.Type == "Discharge Summary"))
            .OrderByDescending(n => n.SignedAt ?? n.CreatedAt)
            .FirstOrDefaultAsync();

        var meds = await uow.Orders.Query()
            .Where(o => o.PatientId == p.Id && o.OrderType == "Medication"
                && o.Status != "cancelled" && o.DiscontinuedAt == null)
            .OrderByDescending(o => o.CreatedAt)
            .Take(50)
            .ToListAsync();

        var followUps = await uow.Appointments.Query()
            .Where(a => a.PatientId == p.Id && a.ScheduledAt >= DateTime.UtcNow.Date && a.Status != "cancelled")
            .OrderBy(a => a.ScheduledAt)
            .Take(20)
            .ToListAsync();

        var allergies = await uow.Allergies.Query()
            .Where(a => a.PatientId == p.Id)
            .ToListAsync();

        var html = renderer.RenderHtml(new DischargePacketData(p, note, meds, followUps, allergies));
        return Results.Text(html, "text/html");
    }
}
