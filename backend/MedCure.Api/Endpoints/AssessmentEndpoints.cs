using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class AssessmentEndpoints
{
    private static readonly HashSet<string> AllowedKinds = new(StringComparer.OrdinalIgnoreCase)
    {
        "admission", "shift", "pain", "fall-risk", "braden", "vte-risk", "restraint", "suicide-risk"
    };

    public static IEndpointRouteBuilder MapAssessmentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/assessments").RequireAuthorization();
        g.MapGet ("/",          List);
        g.MapGet ("/{id:int}",  Get);
        g.MapPost("/{kind}",    Create);
        return app;
    }

    public record CreateAssessmentDto(
        int PatientId,
        int? EncounterId,
        string? Tool,
        int? Score,
        string? DetailsJson,
        string? Notes,
        string? Risk);

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, string? kind, int? take)
    {
        var q = uow.Assessments.Query().Include(a => a.Patient);
        if (patientId is int pid) q = q.Where(a => a.PatientId == pid).Include(a => a.Patient);
        if (!string.IsNullOrWhiteSpace(kind)) q = q.Where(a => a.Kind == kind).Include(a => a.Patient);
        var rows = await q.OrderByDescending(a => a.CreatedAt).Take(take ?? 100).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var a = await uow.Assessments.Query().Include(x => x.Patient)
            .FirstOrDefaultAsync(x => x.Id == id);
        return a is null ? Results.NotFound() : Results.Ok(a);
    }

    private static async Task<IResult> Create(
        string kind,
        CreateAssessmentDto input,
        IUnitOfWork uow,
        ICurrentUser current,
        INotificationService notify)
    {
        if (!AllowedKinds.Contains(kind))
            return Results.BadRequest(new { error = $"Unknown assessment kind '{kind}'." });

        if (input.PatientId <= 0)
            return Results.BadRequest(new { error = "patientId is required." });

        var score = input.Score ?? 0;
        var risk = ComputeRisk(kind, score, input.Risk);

        var assessment = new Assessment
        {
            PatientId         = input.PatientId,
            EncounterId       = input.EncounterId,
            PerformedByUserId = current.UserId ?? 0,
            Kind              = kind.ToLowerInvariant(),
            Tool              = string.IsNullOrWhiteSpace(input.Tool) ? "n/a" : input.Tool!.ToLowerInvariant(),
            Score             = score,
            Risk              = risk,
            DetailsJson       = string.IsNullOrWhiteSpace(input.DetailsJson) ? "{}" : input.DetailsJson!,
            Notes             = input.Notes ?? "",
        };

        await uow.Assessments.AddAsync(assessment);
        await uow.SaveAsync();

        // Page on-call MD when fall-risk or VTE-risk lands at high or very-high
        if ((kind.Equals("fall-risk", StringComparison.OrdinalIgnoreCase)
             || kind.Equals("vte-risk", StringComparison.OrdinalIgnoreCase))
            && (risk == "high" || risk == "very-high"))
        {
            try
            {
                var label = kind.Equals("fall-risk", StringComparison.OrdinalIgnoreCase) ? "Fall risk" : "VTE risk";
                await notify.EmitAsync(
                    kind: $"assessment-{kind}",
                    title: $"⚠ {label} {risk} (score {score})",
                    body:  $"New nursing assessment flagged {risk} — consider prophylaxis / safety bundle.",
                    severity: "bad",
                    patientId: assessment.PatientId,
                    url: $"/assessments/{assessment.Id}");
            }
            catch
            {
                // Notification path is best-effort; assessment is already persisted.
            }
        }

        return Results.Created($"/api/assessments/{assessment.Id}", assessment);
    }

    /// <summary>Score → risk band, per PRD §11.O thresholds.</summary>
    private static string ComputeRisk(string kind, int score, string? fallback)
    {
        switch (kind.ToLowerInvariant())
        {
            case "fall-risk":  // Morse Fall Scale
                if (score >= 45) return "high";
                if (score >= 25) return "moderate";
                return "low";

            case "braden":     // Lower score = higher risk
                if (score <= 12) return "very-high";
                if (score <= 14) return "high";
                if (score <= 18) return "moderate";
                return "low";

            case "pain":       // Numeric 0–10
                if (score >= 7) return "high";
                if (score >= 4) return "moderate";
                return "low";

            case "vte-risk":   // Padua
                return score >= 4 ? "high" : "low";

            case "suicide-risk": // Columbia / PHQ-9 banding
                if (score >= 15) return "very-high";
                if (score >= 10) return "high";
                if (score >= 5)  return "moderate";
                return "low";

            default:
                return string.IsNullOrWhiteSpace(fallback) ? "low" : fallback!.ToLowerInvariant();
        }
    }
}
