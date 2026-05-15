using MedCure.Api.Auth;
using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace MedCure.Api.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search", Search).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> Search(IUnitOfWork uow, ICurrentUser current, string? q, int? take, string? scope)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2) return Results.Ok(new { results = Array.Empty<object>() });
        var n = take ?? 12;
        var needle = q.ToLowerInvariant().Trim();
        var digits = new string(q.Where(char.IsDigit).ToArray());

        // DOB parsing — accept a handful of common formats.
        DateTime? dob = null;
        string[] dobFormats = { "yyyy-MM-dd", "MM/dd/yyyy", "M/d/yyyy", "MM/dd", "M/d" };
        foreach (var f in dobFormats)
        {
            if (DateTime.TryParseExact(q, f, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            {
                dob = d;
                break;
            }
        }

        // "Mine" scope: limit patients to ones the current user has authored an order/note/encounter for.
        HashSet<int>? minePatientIds = null;
        if (string.Equals(scope, "mine", StringComparison.OrdinalIgnoreCase) && current.UserId is int uid)
        {
            var fromOrders = await uow.Orders.Query()
                .Where(o => o.OrderingMdId == uid || o.EnteredByUserId == uid)
                .Select(o => o.PatientId).Distinct().ToListAsync();
            var fromNotes = await uow.Notes.Query()
                .Where(nt => nt.AuthorName == (current.FullName ?? ""))
                .Select(nt => nt.PatientId).Distinct().ToListAsync();
            minePatientIds = new HashSet<int>(fromOrders.Concat(fromNotes));
        }

        var pq = uow.Patients.Query();
        if (minePatientIds is not null) pq = pq.Where(p => minePatientIds.Contains(p.Id));

        var patientsQuery = pq.Where(p =>
            p.Mrn.ToLower().Contains(needle)
         || p.FirstName.ToLower().Contains(needle)
         || p.LastName.ToLower().Contains(needle)
         || (digits.Length >= 4 && p.Phone != null && p.Phone.Contains(digits))
         || (dob != null && p.DateOfBirth.Date == dob!.Value.Date)
         || (dob != null && dob!.Value.Year == 1 && p.DateOfBirth.Month == dob!.Value.Month && p.DateOfBirth.Day == dob!.Value.Day));

        var patientsList = await patientsQuery.OrderBy(p => p.LastName).Take(n).ToListAsync();

        // Soundex fallback — if no substring hits and the query is alphabetic, try a name soundex match.
        if (patientsList.Count == 0 && needle.All(c => char.IsLetter(c) || char.IsWhiteSpace(c)))
        {
            var code = Soundex(needle);
            var candidates = await pq.OrderBy(p => p.LastName).Take(500).ToListAsync();
            patientsList = candidates
                .Where(p => Soundex(p.FirstName) == code || Soundex(p.LastName) == code)
                .Take(n).ToList();
        }

        var patients = patientsList.Select(p => new {
            kind = "patient",
            title = $"{p.FirstName} {p.LastName}",
            sub = $"MRN {p.Mrn} · {p.Sex} · {p.Ward}/{p.Bed}",
            url = $"/patients/{p.Mrn}"
        }).ToList();

        // Filter cross-entity results by mine-scope patient ids if active.
        var orderQ = uow.Orders.Query()
            .Where(o => o.Name.ToLower().Contains(needle) || o.Indication.ToLower().Contains(needle));
        if (minePatientIds is not null) orderQ = orderQ.Where(o => minePatientIds.Contains(o.PatientId));
        var orders = await orderQ.OrderByDescending(o => o.CreatedAt).Take(n)
            .Select(o => new {
                kind = "order",
                title = o.Name,
                sub = $"{o.OrderType} · {o.Dose} {o.Route} · {o.Status}",
                url = $"/orders/{o.Id}"
            }).ToListAsync();

        var labQ = uow.LabResults.Query()
            .Where(l => l.TestName.ToLower().Contains(needle) || l.Panel.ToLower().Contains(needle));
        if (minePatientIds is not null) labQ = labQ.Where(l => minePatientIds.Contains(l.PatientId));
        var labs = await labQ.OrderByDescending(l => l.ResultedAt).Take(n)
            .Select(l => new {
                kind = "lab",
                title = $"{l.TestName} {l.Value}{l.Units}",
                sub = $"{l.Panel} · {l.Flag} · resulted {l.ResultedAt:HH:mm}",
                url = $"/labs/{l.Id}"
            }).ToListAsync();

        var noteQ = uow.Notes.Query()
            .Where(x => x.Content.ToLower().Contains(needle) || x.Type.ToLower().Contains(needle));
        if (minePatientIds is not null) noteQ = noteQ.Where(x => minePatientIds.Contains(x.PatientId));
        var notes = await noteQ.OrderByDescending(x => x.CreatedAt).Take(n)
            .Select(x => new {
                kind = "note",
                title = $"{x.Type} note",
                sub = $"by {x.AuthorName} · {x.CreatedAt:yyyy-MM-dd}",
                url = "/note-composer"
            }).ToListAsync();

        return Results.Ok(new {
            results = patients.Cast<object>()
                .Concat(orders.Cast<object>())
                .Concat(labs.Cast<object>())
                .Concat(notes.Cast<object>())
                .Take(n * 4)
        });
    }

    // Tiny Soundex — Knuth-style 4-char code.
    private static string Soundex(string s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "0000";
        s = s.Trim().ToUpperInvariant();
        var first = s[0];
        var sb = new System.Text.StringBuilder();
        sb.Append(first);
        char prev = Code(first);
        for (int i = 1; i < s.Length && sb.Length < 4; i++)
        {
            var c = Code(s[i]);
            if (c != '0' && c != prev) sb.Append(c);
            if (c != '0') prev = c; else prev = '0';
        }
        while (sb.Length < 4) sb.Append('0');
        return sb.ToString();

        static char Code(char c) => c switch
        {
            'B' or 'F' or 'P' or 'V' => '1',
            'C' or 'G' or 'J' or 'K' or 'Q' or 'S' or 'X' or 'Z' => '2',
            'D' or 'T' => '3',
            'L' => '4',
            'M' or 'N' => '5',
            'R' => '6',
            _ => '0'
        };
    }
}
