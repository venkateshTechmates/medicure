using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class NoteEndpoints
{
    public static IEndpointRouteBuilder MapNoteEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/notes").RequireAuthorization();
        g.MapGet ("/",                       List);
        g.MapGet ("/draft",                  GetDraft);
        g.MapPost("/draft",                  UpsertDraft);
        g.MapDelete("/draft/{id:int}",       DeleteDraft);
        g.MapPost("/render",                 Render);
        g.MapGet ("/{id:int}",               Get);
        g.MapPost("/",                       Create);
        g.MapPost("/{id:int}/sign",          Sign);
        g.MapPost("/{id:int}/addendum",      AddAddendum);
        g.MapGet ("/{id:int}/addenda",       ListAddenda);
        return app;
    }

    private record DraftReq(int? NoteId, int PatientId, string Type, string Body);
    private record RenderReq(int PatientId, string Body);
    private record AddendumReq(string Body);

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, string? type, int? take)
    {
        var q = uow.Notes.Query();
        if (patientId is int pid) q = q.Where(n => n.PatientId == pid);
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(n => n.Type == type);
        var rows = await q.OrderByDescending(n => n.CreatedAt).Take(take ?? 50).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var n = await uow.Notes.GetAsync(id);
        return n is null ? Results.NotFound() : Results.Ok(n);
    }

    private static async Task<IResult> Create(Note input, IUnitOfWork uow, ICurrentUser current)
    {
        input.AuthorName = current.FullName ?? "Unknown";
        if (input.Signed) input.SignedAt = DateTime.UtcNow;
        await uow.Notes.AddAsync(input);
        await uow.SaveAsync();

        await ClearMatchingDraftsAsync(uow, current, input.PatientId, input.Type);
        await uow.SaveAsync();
        return Results.Created($"/api/notes/{input.Id}", input);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var n = await uow.Notes.GetAsync(id);
        if (n is null) return Results.NotFound();
        // Why: signed notes are immutable; ignore Sign on already-signed notes.
        if (!n.Signed)
        {
            n.Signed = true;
            n.SignedAt = DateTime.UtcNow;
            uow.Notes.Update(n);
        }
        await ClearMatchingDraftsAsync(uow, current, n.PatientId, n.Type);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> AddAddendum(int id, AddendumReq input, IUnitOfWork uow, ICurrentUser current)
    {
        var n = await uow.Notes.GetAsync(id);
        if (n is null) return Results.NotFound();
        if (!n.Signed) return Results.BadRequest(new { error = "Note must be signed before adding an addendum." });
        var add = new NoteAddendum
        {
            NoteId = n.Id,
            AuthorName = current.FullName ?? "Unknown",
            AuthorUserId = current.UserId,
            Body = input.Body ?? "",
            SignedAt = DateTime.UtcNow,
        };
        await uow.NoteAddenda.AddAsync(add);
        await uow.SaveAsync();
        return Results.Created($"/api/notes/{n.Id}/addenda/{add.Id}", add);
    }

    private static async Task<IResult> ListAddenda(int id, IUnitOfWork uow)
    {
        var n = await uow.Notes.GetAsync(id);
        if (n is null) return Results.NotFound();
        var rows = await uow.NoteAddenda.Query()
            .Where(a => a.NoteId == id)
            .OrderBy(a => a.SignedAt)
            .ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> GetDraft(IUnitOfWork uow, ICurrentUser current, int patientId, string type)
    {
        var uid = current.UserId;
        if (uid is null) return Results.Unauthorized();
        var d = await uow.NoteDrafts.Query()
            .Where(x => x.AuthorUserId == uid && x.PatientId == patientId && x.Type == type)
            .OrderByDescending(x => x.UpdatedAt)
            .FirstOrDefaultAsync();
        return d is null ? Results.NoContent() : Results.Ok(d);
    }

    private static async Task<IResult> UpsertDraft(DraftReq input, IUnitOfWork uow, ICurrentUser current)
    {
        var uid = current.UserId;
        if (uid is null) return Results.Unauthorized();

        var existing = await uow.NoteDrafts.Query()
            .Where(x => x.AuthorUserId == uid && x.PatientId == input.PatientId && x.Type == input.Type)
            .OrderByDescending(x => x.UpdatedAt)
            .FirstOrDefaultAsync();

        if (existing is not null)
        {
            // Why: simple last-write-wins; UpdatedAt is auto-touched in SaveChanges.
            existing.Body = input.Body ?? "";
            existing.NoteId = input.NoteId ?? existing.NoteId;
            uow.NoteDrafts.Update(existing);
            await uow.SaveAsync();
            return Results.Ok(existing);
        }

        var draft = new NoteDraft
        {
            NoteId = input.NoteId,
            AuthorUserId = uid.Value,
            PatientId = input.PatientId,
            Type = string.IsNullOrWhiteSpace(input.Type) ? "Progress" : input.Type,
            Body = input.Body ?? "",
        };
        await uow.NoteDrafts.AddAsync(draft);
        await uow.SaveAsync();
        return Results.Created($"/api/notes/draft/{draft.Id}", draft);
    }

    private static async Task<IResult> DeleteDraft(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var d = await uow.NoteDrafts.GetAsync(id);
        if (d is null) return Results.NotFound();
        if (d.AuthorUserId != current.UserId) return Results.Forbid();
        uow.NoteDrafts.Remove(d);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Render(RenderReq input, INoteTokenResolver resolver, CancellationToken ct)
    {
        var rendered = await resolver.ResolveAsync(input.PatientId, input.Body ?? "", ct);
        return Results.Ok(new { body = rendered });
    }

    private static async Task ClearMatchingDraftsAsync(IUnitOfWork uow, ICurrentUser current, int patientId, string type)
    {
        var uid = current.UserId;
        if (uid is null) return;
        var drafts = await uow.NoteDrafts.Query()
            .Where(d => d.AuthorUserId == uid && d.PatientId == patientId && d.Type == type)
            .ToListAsync();
        foreach (var d in drafts) uow.NoteDrafts.Remove(d);
    }
}
