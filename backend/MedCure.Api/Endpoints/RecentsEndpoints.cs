using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class RecentsEndpoints
{
    public static IEndpointRouteBuilder MapRecentsEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet   ("/api/recents",                 ListRecents).RequireAuthorization();
        app.MapPost  ("/api/recents/{patientId}",     TouchRecent).RequireAuthorization();
        app.MapGet   ("/api/pinned",                  ListPinned).RequireAuthorization();
        app.MapPost  ("/api/pinned/{patientId}",      Pin).RequireAuthorization();
        app.MapDelete("/api/pinned/{patientId}",      Unpin).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> ListRecents(IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId ?? 0;
        if (uid == 0) return Results.Ok(Array.Empty<object>());

        var rows = await uow.RecentPatients.Query()
            .Where(r => r.UserId == uid)
            .OrderByDescending(r => r.ViewedAt)
            .Take(20)
            .Join(uow.Patients.Query(), r => r.PatientId, p => p.Id, (r, p) => new {
                id        = p.Id,
                mrn       = p.Mrn,
                fullName  = (p.FirstName + " " + p.LastName),
                status    = p.Status,
                ward      = p.Ward,
                bed       = p.Bed,
                avatarUrl = p.AvatarUrl,
                viewedAt  = r.ViewedAt
            })
            .ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> TouchRecent(string patientId, IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId ?? 0;
        if (uid == 0) return Results.Unauthorized();

        // patientId param accepts either int id or MRN string
        var patient = int.TryParse(patientId, out var pid)
            ? await uow.Patients.Query().FirstOrDefaultAsync(p => p.Id == pid)
            : await uow.Patients.Query().FirstOrDefaultAsync(p => p.Mrn == patientId);
        if (patient is null) return Results.NotFound();

        var existing = await uow.RecentPatients.Query()
            .FirstOrDefaultAsync(r => r.UserId == uid && r.PatientId == patient.Id);
        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            // Re-read tracked entity to update
            var tracked = await uow.RecentPatients.GetAsync(existing.Id);
            if (tracked is not null)
            {
                tracked.ViewedAt = now;
                uow.RecentPatients.Update(tracked);
            }
        }
        else
        {
            await uow.RecentPatients.AddAsync(new RecentPatient {
                UserId = uid, PatientId = patient.Id, ViewedAt = now
            });
        }
        await uow.SaveAsync();

        // Cap to 20: remove oldest beyond the cap
        var ids = await uow.RecentPatients.Query()
            .Where(r => r.UserId == uid)
            .OrderByDescending(r => r.ViewedAt)
            .Skip(20)
            .Select(r => r.Id)
            .ToListAsync();
        if (ids.Count > 0)
        {
            foreach (var id in ids)
            {
                var r = await uow.RecentPatients.GetAsync(id);
                if (r is not null) uow.RecentPatients.Remove(r);
            }
            await uow.SaveAsync();
        }
        return Results.Ok(new { ok = true });
    }

    private static async Task<IResult> ListPinned(IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId ?? 0;
        if (uid == 0) return Results.Ok(Array.Empty<object>());

        var rows = await uow.PinnedPatients.Query()
            .Where(r => r.UserId == uid)
            .OrderByDescending(r => r.PinnedAt)
            .Join(uow.Patients.Query(), r => r.PatientId, p => p.Id, (r, p) => new {
                id        = p.Id,
                mrn       = p.Mrn,
                fullName  = (p.FirstName + " " + p.LastName),
                status    = p.Status,
                ward      = p.Ward,
                bed       = p.Bed,
                avatarUrl = p.AvatarUrl,
                pinnedAt  = r.PinnedAt
            })
            .ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Pin(string patientId, IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId ?? 0;
        if (uid == 0) return Results.Unauthorized();
        var patient = int.TryParse(patientId, out var pid)
            ? await uow.Patients.Query().FirstOrDefaultAsync(p => p.Id == pid)
            : await uow.Patients.Query().FirstOrDefaultAsync(p => p.Mrn == patientId);
        if (patient is null) return Results.NotFound();

        var existing = await uow.PinnedPatients.Query()
            .FirstOrDefaultAsync(r => r.UserId == uid && r.PatientId == patient.Id);
        if (existing is null)
        {
            await uow.PinnedPatients.AddAsync(new PinnedPatient {
                UserId = uid, PatientId = patient.Id, PinnedAt = DateTime.UtcNow
            });
            await uow.SaveAsync();
        }
        return Results.Ok(new { pinned = true, patientId = patient.Id });
    }

    private static async Task<IResult> Unpin(string patientId, IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId ?? 0;
        if (uid == 0) return Results.Unauthorized();
        var patient = int.TryParse(patientId, out var pid)
            ? await uow.Patients.Query().FirstOrDefaultAsync(p => p.Id == pid)
            : await uow.Patients.Query().FirstOrDefaultAsync(p => p.Mrn == patientId);
        if (patient is null) return Results.NotFound();

        var existing = await uow.PinnedPatients.Query()
            .FirstOrDefaultAsync(r => r.UserId == uid && r.PatientId == patient.Id);
        if (existing is not null)
        {
            var tracked = await uow.PinnedPatients.GetAsync(existing.Id);
            if (tracked is not null)
            {
                uow.PinnedPatients.Remove(tracked);
                await uow.SaveAsync();
            }
        }
        return Results.Ok(new { pinned = false, patientId = patient.Id });
    }
}
