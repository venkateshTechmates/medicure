using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class SearchEndpoints
{
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/search", Search).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> Search(IUnitOfWork uow, string? q, int? take)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2) return Results.Ok(new { results = Array.Empty<object>() });
        var n = take ?? 12;
        var needle = q.ToLowerInvariant();

        var patients = await uow.Patients.Query()
            .Where(p => p.Mrn.ToLower().Contains(needle)
                     || p.FirstName.ToLower().Contains(needle)
                     || p.LastName.ToLower().Contains(needle))
            .OrderBy(p => p.LastName).Take(n)
            .Select(p => new {
                kind = "patient",
                title = $"{p.FirstName} {p.LastName}",
                sub = $"MRN {p.Mrn} · {p.Sex} · {p.Ward}/{p.Bed}",
                url = $"/patients/{p.Mrn}"
            })
            .ToListAsync();

        var orders = await uow.Orders.Query()
            .Where(o => o.Name.ToLower().Contains(needle) || o.Indication.ToLower().Contains(needle))
            .OrderByDescending(o => o.CreatedAt).Take(n)
            .Select(o => new {
                kind = "order",
                title = o.Name,
                sub = $"{o.OrderType} · {o.Dose} {o.Route} · {o.Status}",
                url = $"/orders/{o.Id}"
            })
            .ToListAsync();

        var labs = await uow.LabResults.Query()
            .Where(l => l.TestName.ToLower().Contains(needle) || l.Panel.ToLower().Contains(needle))
            .OrderByDescending(l => l.ResultedAt).Take(n)
            .Select(l => new {
                kind = "lab",
                title = $"{l.TestName} {l.Value}{l.Units}",
                sub = $"{l.Panel} · {l.Flag} · resulted {l.ResultedAt:HH:mm}",
                url = $"/labs/{l.Id}"
            })
            .ToListAsync();

        var notes = await uow.Notes.Query()
            .Where(x => x.Content.ToLower().Contains(needle) || x.Type.ToLower().Contains(needle))
            .OrderByDescending(x => x.CreatedAt).Take(n)
            .Select(x => new {
                kind = "note",
                title = $"{x.Type} note",
                sub = $"by {x.AuthorName} · {x.CreatedAt:yyyy-MM-dd}",
                url = "/note-composer"
            })
            .ToListAsync();

        return Results.Ok(new {
            results = patients.Cast<object>()
                .Concat(orders.Cast<object>())
                .Concat(labs.Cast<object>())
                .Concat(notes.Cast<object>())
                .Take(n * 4)
        });
    }
}
