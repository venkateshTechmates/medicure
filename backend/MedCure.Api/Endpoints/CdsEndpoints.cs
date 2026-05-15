using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

/// <summary>
/// Clinical Decision Support (CDS) rule engine endpoints.
/// PRD §11.L — rules registry, runtime evaluation, overrides, and alert-fatigue analytics.
/// </summary>
public static class CdsEndpoints
{
    public static IEndpointRouteBuilder MapCdsEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/cds").RequireAuthorization();
        g.MapPost ("/check",            Check);
        g.MapGet  ("/rules",            ListRules);
        g.MapPatch("/rules/{id:int}",   PatchRule);
        g.MapPost ("/override",         RecordOverride);
        g.MapGet  ("/fatigue",          Fatigue);
        return app;
    }

    // ── DTOs ──────────────────────────────────────────────────────
    public record CheckRequest(int PatientId, string? OrderDraftJson, string? TriggerPoint);
    public record CheckAlert(string RuleKey, string Family, string Severity, string Message);
    public record OverrideRequest(string RuleKey, int PatientId, int? OrderId, string ReasonCode, string ReasonText, string? Severity);
    public record RulePatch(bool? Enabled, string? Severity);
    public record FatigueRow(string RuleKey, string Name, string Family, string Severity, int Fires, int Overrides, double OverrideRate);

    // ── POST /api/cds/check ───────────────────────────────────────
    private static async Task<IResult> Check(CheckRequest body, IUnitOfWork uow)
    {
        if (body is null || body.PatientId <= 0) return Results.BadRequest(new { error = "patientId required" });

        var draft = (body.OrderDraftJson ?? "").ToLowerInvariant();
        var alerts = new List<CheckAlert>();

        // Load active rules — used to gate each check and to pick up admin-tuned severity.
        var rules = await uow.CdsRules.Query().Where(r => r.Enabled).ToListAsync();
        var byKey = rules.ToDictionary(r => r.RuleKey, r => r, StringComparer.OrdinalIgnoreCase);

        // Patient + clinical context
        var patient = await uow.Patients.Query().FirstOrDefaultAsync(p => p.Id == body.PatientId);
        if (patient is null) return Results.NotFound(new { error = "patient not found" });
        var allergies = await uow.Allergies.Query().Where(a => a.PatientId == body.PatientId).ToListAsync();
        var problems  = await uow.Problems.Query().Where(p => p.PatientId == body.PatientId).ToListAsync();
        var activeOrders = await uow.Orders.Query()
            .Where(o => o.PatientId == body.PatientId
                     && o.OrderType == "Medication"
                     && (o.Status == "signed" || o.Status == "verified" || o.Status == "administered"))
            .ToListAsync();

        // 1. drug-allergy: NSAID family ordered + NSAID-class allergy on file → hard-stop
        if (byKey.TryGetValue("drug-allergy-nsaid", out var rAllergy))
        {
            bool drugIsNsaid = ContainsAny(draft, "ibuprofen", "aspirin", "naproxen");
            bool nsaidAllergy = allergies.Any(a =>
                ContainsAny(a.Substance.ToLowerInvariant(), "nsaid", "ibuprofen", "aspirin"));
            if (drugIsNsaid && nsaidAllergy)
                alerts.Add(new CheckAlert(rAllergy.RuleKey, rAllergy.Family, rAllergy.Severity,
                    rAllergy.Message.Length > 0 ? rAllergy.Message : "NSAID allergy on file — do not administer."));
        }

        // 2. duplicate: same drug name already active
        if (byKey.TryGetValue("duplicate-active-med", out var rDup))
        {
            var drugName = ExtractDrugName(draft);
            if (!string.IsNullOrEmpty(drugName))
            {
                var existing = activeOrders.FirstOrDefault(o =>
                    o.Name.ToLowerInvariant().Contains(drugName));
                if (existing is not null)
                    alerts.Add(new CheckAlert(rDup.RuleKey, rDup.Family, rDup.Severity,
                        $"Duplicate of active order: {existing.Name} ({existing.Status})."));
            }
        }

        // 3. renal-dose: CKD/renal failure + drug in renal-sensitive list
        if (byKey.TryGetValue("renal-dose", out var rRenal))
        {
            bool hasRenal = problems.Any(p =>
                ContainsAny(p.Description.ToLowerInvariant(), "ckd", "renal failure", "chronic kidney"));
            bool drugIsRenalSensitive = ContainsAny(draft, "metformin", "enoxaparin", "gabapentin");
            if (hasRenal && drugIsRenalSensitive)
                alerts.Add(new CheckAlert(rRenal.RuleKey, rRenal.Family, rRenal.Severity,
                    rRenal.Message.Length > 0 ? rRenal.Message : "Adjust for renal function."));
        }

        // 4. pregnancy: F, 18–50, drug in teratogenic list
        if (byKey.TryGetValue("pregnancy-teratogen", out var rPreg))
        {
            int age = (int)Math.Floor((DateTime.UtcNow - patient.DateOfBirth).TotalDays / 365.25);
            bool female = string.Equals(patient.Sex, "F", StringComparison.OrdinalIgnoreCase);
            bool ofAge  = age >= 18 && age <= 50;
            bool drugIsTeratogen = ContainsAny(draft, "warfarin", "isotretinoin", "ace inhibitor", "lisinopril");
            if (female && ofAge && drugIsTeratogen)
                alerts.Add(new CheckAlert(rPreg.RuleKey, rPreg.Family, rPreg.Severity,
                    rPreg.Message.Length > 0 ? rPreg.Message : "Teratogenic — verify pregnancy status."));
        }

        return Results.Ok(alerts);
    }

    // ── GET /api/cds/rules ────────────────────────────────────────
    private static async Task<IResult> ListRules(IUnitOfWork uow)
    {
        var rows = await uow.CdsRules.Query()
            .OrderBy(r => r.Family).ThenBy(r => r.Name)
            .ToListAsync();
        return Results.Ok(rows);
    }

    // ── PATCH /api/cds/rules/{id} ─────────────────────────────────
    private static async Task<IResult> PatchRule(int id, RulePatch body, IUnitOfWork uow)
    {
        var r = await uow.CdsRules.GetAsync(id);
        if (r is null) return Results.NotFound();
        if (body.Enabled is bool en) r.Enabled = en;
        if (!string.IsNullOrWhiteSpace(body.Severity))
        {
            var sev = body.Severity!.ToLowerInvariant();
            if (sev is "info" or "warn" or "hard-stop") r.Severity = sev;
        }
        uow.CdsRules.Update(r);
        await uow.SaveAsync();
        return Results.Ok(r);
    }

    // ── POST /api/cds/override ────────────────────────────────────
    private static async Task<IResult> RecordOverride(OverrideRequest body, IUnitOfWork uow, ICurrentUser current)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.RuleKey) || body.PatientId <= 0)
            return Results.BadRequest(new { error = "ruleKey and patientId required" });

        var ov = new CdsOverride
        {
            RuleKey    = body.RuleKey,
            PatientId  = body.PatientId,
            OrderId    = body.OrderId,
            UserId     = current.UserId ?? 0,
            ReasonCode = body.ReasonCode ?? "",
            ReasonText = body.ReasonText ?? "",
            Severity   = body.Severity ?? "warn"
        };
        await uow.CdsOverrides.AddAsync(ov);
        await uow.SaveAsync();
        return Results.Created($"/api/cds/override/{ov.Id}", ov);
    }

    // ── GET /api/cds/fatigue ──────────────────────────────────────
    // Aggregate fires (CdsAlerts) vs overrides (CdsOverrides) over the trailing 30 days,
    // grouped by RuleKey. Returns one row per rule with the override rate so the admin UI
    // can flag rules > 70 % override (classic alert-fatigue heuristic).
    private static async Task<IResult> Fatigue(IUnitOfWork uow)
    {
        var since = DateTime.UtcNow.AddDays(-30);

        var rules = await uow.CdsRules.Query().ToListAsync();

        // Fires are recorded against CdsAlerts.Type (rule key for new alerts) — fall back to
        // matching by rule key prefix for legacy data which used family names.
        var alerts = await uow.CdsAlerts.Query()
            .Where(a => a.CreatedAt >= since)
            .Select(a => new { a.Type, a.CreatedAt })
            .ToListAsync();

        var overrides = await uow.CdsOverrides.Query()
            .Where(o => o.CreatedAt >= since)
            .Select(o => new { o.RuleKey })
            .ToListAsync();

        var rows = new List<FatigueRow>();
        foreach (var r in rules)
        {
            int fires = alerts.Count(a => string.Equals(a.Type, r.RuleKey, StringComparison.OrdinalIgnoreCase));
            int overs = overrides.Count(o => string.Equals(o.RuleKey, r.RuleKey, StringComparison.OrdinalIgnoreCase));
            double rate = fires > 0 ? (double)overs / fires : 0d;
            rows.Add(new FatigueRow(r.RuleKey, r.Name, r.Family, r.Severity, fires, overs, Math.Round(rate, 3)));
        }
        return Results.Ok(rows.OrderByDescending(r => r.OverrideRate));
    }

    // ── helpers ───────────────────────────────────────────────────
    private static bool ContainsAny(string haystack, params string[] needles)
    {
        foreach (var n in needles)
            if (haystack.Contains(n, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    /// <summary>Pull the first plausible drug token out of the order-draft JSON for duplicate detection.</summary>
    private static string ExtractDrugName(string draft)
    {
        if (string.IsNullOrWhiteSpace(draft)) return "";
        // Prefer a "name":"..." pattern; otherwise pick a known drug from the alert vocabulary.
        var marker = "\"name\":\"";
        var idx = draft.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
        {
            var start = idx + marker.Length;
            var end = draft.IndexOf('"', start);
            if (end > start) return draft.Substring(start, end - start).ToLowerInvariant().Split(' ').FirstOrDefault() ?? "";
        }
        // Fallback — pull a recognizable token.
        string[] known = ["ibuprofen", "aspirin", "naproxen", "metformin", "enoxaparin", "gabapentin",
                          "warfarin", "isotretinoin", "lisinopril", "amoxicillin", "vancomycin",
                          "heparin", "furosemide", "pantoprazole", "atorvastatin", "albuterol"];
        foreach (var k in known)
            if (draft.Contains(k, StringComparison.OrdinalIgnoreCase)) return k;
        return "";
    }
}
