using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class NoteEndpoints
{
    public static IEndpointRouteBuilder MapNoteEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/notes").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapGet ("/{id:int}",        Get);
        g.MapPost("/",                Create);
        g.MapPost("/{id:int}/sign",   Sign);
        return app;
    }

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
        return Results.Created($"/api/notes/{input.Id}", input);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow)
    {
        var n = await uow.Notes.GetAsync(id);
        if (n is null) return Results.NotFound();
        n.Signed = true; n.SignedAt = DateTime.UtcNow;
        uow.Notes.Update(n);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
