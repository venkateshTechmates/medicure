using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class DocumentEndpoints
{
    public static IEndpointRouteBuilder MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/documents").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapPost("/",                Create);
        g.MapPost("/upload",          Upload).DisableAntiforgery();
        g.MapGet ("/{id:int}/download", Download);
        g.MapPost("/{id:int}/sign",   Sign);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, HttpContext http, string? category, string? q, int? take, int? skip)
    {
        var query = uow.Documents.Query();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(d => d.Category == category);
        if (!string.IsNullOrWhiteSpace(q))        query = query.Where(d => d.Title.ToLower().Contains(q.ToLower()));
        var total = await query.CountAsync();
        http.Response.Headers["X-Total-Count"] = total.ToString();
        var rows = await query.OrderByDescending(d => d.CreatedAt)
            .Skip(skip ?? 0).Take(take ?? 100).ToListAsync();
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

    private static async Task<IResult> Upload(HttpRequest req, IUnitOfWork uow, IFileStore store, ICurrentUser current)
    {
        if (!req.HasFormContentType) return Results.BadRequest(new { error = "expected multipart/form-data" });
        var form = await req.ReadFormAsync();
        var file = form.Files["file"];
        if (file is null || file.Length == 0) return Results.BadRequest(new { error = "file is required" });
        if (file.Length > 25 * 1024 * 1024) return Results.BadRequest(new { error = "file too large (max 25 MB)" });

        await using var stream = file.OpenReadStream();
        var (rel, size) = await store.SaveAsync(stream, file.FileName, file.ContentType);

        var d = new Document
        {
            Title          = form["title"].FirstOrDefault() ?? Path.GetFileNameWithoutExtension(file.FileName),
            Category       = form["category"].FirstOrDefault() ?? "Note",
            FileType       = (Path.GetExtension(file.FileName) ?? ".bin").TrimStart('.').ToLowerInvariant(),
            Pages          = int.TryParse(form["pages"].FirstOrDefault(), out var pp) ? pp : 1,
            SizeBytes      = size,
            PatientId      = int.TryParse(form["patientId"].FirstOrDefault(), out var pid) ? pid : null,
            AuthorName     = current.FullName ?? "Unknown",
            Status         = "draft",
            BlobPath       = rel,
            MimeType       = file.ContentType ?? "application/octet-stream",
            OriginalFilename = file.FileName,
        };
        await uow.Documents.AddAsync(d);
        await uow.SaveAsync();
        return Results.Created($"/api/documents/{d.Id}", d);
    }

    private static async Task<IResult> Download(int id, IUnitOfWork uow, IFileStore store)
    {
        var d = await uow.Documents.GetAsync(id);
        if (d is null || string.IsNullOrEmpty(d.BlobPath)) return Results.NotFound();
        var stream = store.Open(d.BlobPath);
        if (stream is null) return Results.NotFound();
        return Results.File(stream, d.MimeType, d.OriginalFilename);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow)
    {
        var d = await uow.Documents.GetAsync(id);
        if (d is null) return Results.NotFound();
        d.Status = "signed";
        d.SignedAt = DateTime.UtcNow;
        uow.Documents.Update(d);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
