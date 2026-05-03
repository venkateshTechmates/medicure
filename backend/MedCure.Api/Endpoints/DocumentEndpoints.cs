using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class DocumentEndpoints
{
    public static IEndpointRouteBuilder MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/documents").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapPost("/",                Create);
        g.MapPost("/{id:int}/sign",   Sign);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? category, string? q, int? take)
    {
        var query = uow.Documents.Query();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(d => d.Category == category);
        if (!string.IsNullOrWhiteSpace(q))        query = query.Where(d => d.Title.ToLower().Contains(q.ToLower()));
        var rows = await query.OrderByDescending(d => d.CreatedAt).Take(take ?? 100).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(Document input, IUnitOfWork uow, ICurrentUser current)
    {
        if (string.IsNullOrEmpty(input.AuthorName)) input.AuthorName = current.FullName ?? "Unknown";
        if (string.IsNullOrEmpty(input.Status)) input.Status = "draft";
        if (string.IsNullOrEmpty(input.FileType)) input.FileType = "pdf";
        if (input.Pages == 0) input.Pages = 1;
        if (input.SizeBytes == 0) input.SizeBytes = 50_000;
        await uow.Documents.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/documents/{input.Id}", input);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow)
    {
        var d = await uow.Documents.GetAsync(id);
        if (d is null) return Results.NotFound();
        d.Status = "signed";
        uow.Documents.Update(d);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
