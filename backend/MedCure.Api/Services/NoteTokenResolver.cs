using MedCure.Api.Auth;
using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Services;

public class NoteTokenResolver(IUnitOfWork uow, ICurrentUser current) : INoteTokenResolver
{
    public async Task<string> ResolveAsync(int patientId, string body, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(body)) return body ?? "";
        // Why: only do DB work for tokens that appear in body.
        var needs = body.Contains('@');
        if (!needs) return body;

        var p = await uow.Patients.GetAsync(patientId, ct);
        if (p is null) return body;

        var tokens = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        tokens["@name@"]   = ($"{p.FirstName} {p.LastName}").Trim();
        tokens["@mrn@"]    = p.Mrn;
        tokens["@sex@"]    = p.Sex;
        tokens["@today@"]  = DateTime.UtcNow.ToString("yyyy-MM-dd");
        tokens["@author@"] = current.FullName ?? "";

        int age = 0;
        if (p.DateOfBirth != default)
        {
            var now = DateTime.UtcNow;
            age = now.Year - p.DateOfBirth.Year;
            if (p.DateOfBirth.Date > now.AddYears(-age)) age--;
        }
        tokens["@age@"] = age.ToString();

        if (body.Contains("@allergies@", StringComparison.OrdinalIgnoreCase))
        {
            var rows = await uow.Allergies.Query().Where(a => a.PatientId == patientId).ToListAsync(ct);
            tokens["@allergies@"] = rows.Count == 0
                ? "NKDA"
                : string.Join("; ", rows.Select(a => $"{a.Substance} ({a.Reaction}, {a.Severity})"));
        }

        if (body.Contains("@meds@", StringComparison.OrdinalIgnoreCase))
        {
            var rows = await uow.Orders.Query()
                .Where(o => o.PatientId == patientId
                            && o.OrderType == "Medication"
                            && o.Status != "cancelled"
                            && o.DiscontinuedAt == null)
                .OrderByDescending(o => o.CreatedAt)
                .Take(50)
                .ToListAsync(ct);
            tokens["@meds@"] = rows.Count == 0
                ? "(none)"
                : string.Join("\n", rows.Select(o =>
                    $"- {o.Name} {o.Dose} {o.Route} {o.Frequency}".Trim()));
        }

        if (body.Contains("@problems@", StringComparison.OrdinalIgnoreCase))
        {
            var rows = await uow.Problems.Query()
                .Where(pr => pr.PatientId == patientId && pr.Type != "resolved")
                .OrderBy(pr => pr.Onset)
                .ToListAsync(ct);
            tokens["@problems@"] = rows.Count == 0
                ? "(none)"
                : string.Join("\n", rows.Select(pr =>
                    $"- {pr.Description}" + (string.IsNullOrEmpty(pr.IcdCode) ? "" : $" ({pr.IcdCode})")));
        }

        if (body.Contains("@lastvitals@", StringComparison.OrdinalIgnoreCase))
        {
            var v = await uow.Vitals.Query()
                .Where(x => x.PatientId == patientId)
                .OrderByDescending(x => x.RecordedAt)
                .FirstOrDefaultAsync(ct);
            tokens["@lastvitals@"] = v is null
                ? "(no vitals recorded)"
                : $"HR {v.Hr}, BP {v.Sbp}/{v.Dbp}, SpO2 {v.Spo2}%, RR {v.Rr}, T {v.TempC:0.0}°C ({v.RecordedAt:yyyy-MM-dd HH:mm})";
        }

        var result = body;
        foreach (var kv in tokens)
            result = ReplaceCaseInsensitive(result, kv.Key, kv.Value);
        return result;
    }

    private static string ReplaceCaseInsensitive(string input, string token, string value)
    {
        int idx = 0;
        while (true)
        {
            int found = input.IndexOf(token, idx, StringComparison.OrdinalIgnoreCase);
            if (found < 0) break;
            input = input[..found] + value + input[(found + token.Length)..];
            idx = found + value.Length;
        }
        return input;
    }
}
