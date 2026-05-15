using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class MedReconciliationEndpoints
{
    public record LineInput(
        string DrugName,
        string Dose,
        string Route,
        string Frequency,
        string Source,
        string Action,
        string ActionReason,
        string NewDose);

    public record CreateInput(
        int EncounterId,
        int PatientId,
        string TransitionType,
        List<LineInput>? Lines,
        string? Notes);

    public record PatchLineInput(
        string? Action,
        string? ActionReason,
        string? NewDose);

    public static IEndpointRouteBuilder MapMedReconciliationEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/med-rec").RequireAuthorization();
        g.MapGet ("/{encounterId:int}",        GetByEncounter);
        g.MapPost("/",                         Create);
        g.MapPost("/{id:int}/complete",        Complete);
        g.MapPatch("/lines/{lineId:int}",      PatchLine);
        return app;
    }

    private static async Task<IResult> GetByEncounter(int encounterId, IUnitOfWork uow, string? transitionType)
    {
        var q = uow.MedReconciliations.Query().Where(r => r.EncounterId == encounterId);
        if (!string.IsNullOrWhiteSpace(transitionType))
            q = q.Where(r => r.TransitionType == transitionType);

        var header = await q.OrderByDescending(r => r.Id).FirstOrDefaultAsync();
        if (header is null) return Results.Ok(new { header = (MedReconciliation?)null, lines = Array.Empty<MedReconciliationLine>() });

        var lines = await uow.MedReconciliationLines.Query()
            .Where(l => l.ReconciliationId == header.Id)
            .OrderBy(l => l.Id)
            .ToListAsync();

        return Results.Ok(new { header, lines });
    }

    private static async Task<IResult> Create(CreateInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (string.IsNullOrWhiteSpace(input.TransitionType)) return Results.BadRequest("transitionType required");
        if (input.EncounterId <= 0) return Results.BadRequest("encounterId required");

        var header = new MedReconciliation
        {
            EncounterId    = input.EncounterId,
            PatientId      = input.PatientId,
            TransitionType = input.TransitionType,
            Status         = "draft",
            Notes          = input.Notes ?? "",
        };
        await uow.MedReconciliations.AddAsync(header);
        await uow.SaveAsync();

        var lines = new List<MedReconciliationLine>();
        if (input.Lines is { Count: > 0 })
        {
            foreach (var li in input.Lines)
            {
                lines.Add(new MedReconciliationLine
                {
                    ReconciliationId = header.Id,
                    DrugName     = li.DrugName ?? "",
                    Dose         = li.Dose ?? "",
                    Route        = li.Route ?? "",
                    Frequency    = li.Frequency ?? "",
                    Source       = string.IsNullOrWhiteSpace(li.Source) ? "home" : li.Source,
                    Action       = li.Action ?? "",
                    ActionReason = li.ActionReason ?? "",
                    NewDose      = li.NewDose ?? "",
                });
            }
        }

        // Auto-import home meds on admission: Patient has no HomeMeds field in this schema, so skip.
        // (Hook left here intentionally — when Patient.HomeMeds is added, seed from it here.)

        foreach (var l in lines) await uow.MedReconciliationLines.AddAsync(l);
        if (lines.Count > 0) await uow.SaveAsync();

        return Results.Created($"/api/med-rec/{header.Id}", new { header, lines });
    }

    private static async Task<IResult> Complete(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var header = await uow.MedReconciliations.GetAsync(id);
        if (header is null) return Results.NotFound();

        var lines = await uow.MedReconciliationLines.Query()
            .Where(l => l.ReconciliationId == id)
            .ToListAsync();

        if (lines.Any(l => string.IsNullOrWhiteSpace(l.Action)))
            return Results.BadRequest("unreconciled lines block completion");

        header.Status            = "completed";
        header.CompletedAt       = DateTime.UtcNow;
        header.PerformedByUserId = current.UserId;
        uow.MedReconciliations.Update(header);
        await uow.SaveAsync();

        return Results.Ok(header);
    }

    private static async Task<IResult> PatchLine(int lineId, PatchLineInput input, IUnitOfWork uow)
    {
        var line = await uow.MedReconciliationLines.GetAsync(lineId);
        if (line is null) return Results.NotFound();

        if (input.Action       is not null) line.Action       = input.Action;
        if (input.ActionReason is not null) line.ActionReason = input.ActionReason;
        if (input.NewDose      is not null) line.NewDose      = input.NewDose;

        uow.MedReconciliationLines.Update(line);
        await uow.SaveAsync();
        return Results.Ok(line);
    }
}
