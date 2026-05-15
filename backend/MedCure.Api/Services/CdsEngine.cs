using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Services;

public class CdsEngine(IUnitOfWork uow) : ICdsEngine
{
    // Each pair is a known significant drug-drug interaction (case-insensitive substring match).
    private static readonly (string A, string B, string Severity, string Message)[] DrugDrug =
    {
        ("warfarin",   "bactrim",     "bad",  "Major bleeding risk — consider alternative antibiotic"),
        ("warfarin",   "amiodarone",  "bad",  "INR likely to rise — reduce warfarin and recheck INR in 48h"),
        ("warfarin",   "aspirin",     "warn", "Bleeding risk increased — review indication"),
        ("tramadol",   "sertraline",  "bad",  "Serotonin syndrome risk — avoid combination"),
        ("tramadol",   "fluoxetine",  "bad",  "Serotonin syndrome risk — avoid combination"),
        ("metformin",  "contrast",    "warn", "Hold metformin 48h after IV contrast"),
        ("lisinopril", "potassium",   "warn", "Hyperkalemia risk — monitor K+"),
        ("lisinopril", "spironolactone", "warn", "Hyperkalemia risk — monitor K+"),
        ("clopidogrel","omeprazole",  "warn", "Reduced antiplatelet effect — switch PPI"),
        ("digoxin",    "amiodarone",  "warn", "Digoxin levels may double — halve dose, recheck"),
    };

    // Pairs of (substance keyword, drug keyword) considered a likely cross-reaction.
    private static readonly (string Allergen, string DrugKeyword, string Message)[] AllergyCross =
    {
        ("penicillin", "penicillin",   "Documented penicillin allergy"),
        ("penicillin", "amoxicillin",  "Cross-reactivity with penicillin allergy"),
        ("penicillin", "ampicillin",   "Cross-reactivity with penicillin allergy"),
        ("penicillin", "piperacillin", "Cross-reactivity with penicillin allergy"),
        ("sulfa",      "bactrim",      "Sulfa allergy on file"),
        ("sulfa",      "sulfamethoxazole", "Sulfa allergy on file"),
        ("aspirin",    "aspirin",      "Aspirin / NSAID allergy"),
        ("aspirin",    "ibuprofen",    "Possible NSAID cross-reactivity"),
        ("nsaid",      "ibuprofen",    "Documented NSAID allergy"),
        ("nsaid",      "ketorolac",    "Documented NSAID allergy"),
        ("contrast",   "contrast",     "Contrast allergy — premedicate per protocol"),
        ("latex",      "latex",        "Latex allergy — use latex-free supplies"),
    };

    public async Task<IReadOnlyList<CdsFinding>> ReviewOrderAsync(Order order, CancellationToken ct = default)
    {
        var findings = new List<CdsFinding>();
        if (order.OrderType != "Medication" || string.IsNullOrEmpty(order.Name)) return findings;

        var drug = order.Name.ToLowerInvariant();

        // 1. Allergy cross-check
        var allergies = await uow.Allergies.Query()
            .Where(a => a.PatientId == order.PatientId)
            .ToListAsync(ct);
        foreach (var a in allergies)
        {
            var sub = a.Substance.ToLowerInvariant();
            foreach (var (allergen, keyword, msg) in AllergyCross)
            {
                if (sub.Contains(allergen) && drug.Contains(keyword))
                {
                    var sev = a.Severity.Equals("severe", StringComparison.OrdinalIgnoreCase) ? "bad" : "warn";
                    findings.Add(new CdsFinding(sev, "ALLERGY", $"{msg} (reaction: {a.Reaction})"));
                }
            }
        }

        // 2. Drug-drug interactions vs other active medication orders for this patient
        var others = await uow.Orders.Query()
            .Where(o => o.PatientId == order.PatientId
                     && o.OrderType == "Medication"
                     && o.Id != order.Id
                     && (o.Status == "signed" || o.Status == "verified" || o.Status == "administered"))
            .ToListAsync(ct);
        foreach (var other in others)
        {
            var otherName = other.Name.ToLowerInvariant();
            foreach (var (a, b, sev, msg) in DrugDrug)
            {
                if ((drug.Contains(a) && otherName.Contains(b)) || (drug.Contains(b) && otherName.Contains(a)))
                {
                    findings.Add(new CdsFinding(sev, "DDI", $"{msg} (interacting med: {other.Name})"));
                }
            }
        }

        return findings;
    }
}
