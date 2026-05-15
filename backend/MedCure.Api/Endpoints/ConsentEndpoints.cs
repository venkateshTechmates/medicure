using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ConsentEndpoints
{
    public static IEndpointRouteBuilder MapConsentEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/consents").RequireAuthorization();
        g.MapGet("/",                        List);
        g.MapGet("/{id:int}",                Get);
        g.MapPost("/",                       Create);
        g.MapPost("/{id:int}/sign",          Sign);
        g.MapPost("/{id:int}/revoke",        Revoke);
        g.MapGet("/{id:int}/signature",      PatientSignature);
        g.MapGet("/{id:int}/witness-signature", WitnessSignature);
        return app;
    }

    public record CreateConsentRequest(
        int PatientId,
        int? EncounterId,
        string Kind,
        string Title,
        string BodyText,
        bool RequiredWitness,
        DateTime? ExpiresAt);

    public record SignConsentRequest(
        string SignedByPatientName,
        string SignatureDataUrl,
        string? WitnessName,
        string? WitnessSignatureDataUrl);

    public record RevokeConsentRequest(string Reason);

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, string? kind, string? status)
    {
        var q = uow.Consents.Query();
        if (patientId is int pid) q = q.Where(c => c.PatientId == pid);
        if (!string.IsNullOrWhiteSpace(kind)) q = q.Where(c => c.Kind == kind);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        var rows = await q.OrderByDescending(c => c.CreatedAt).Take(500).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var c = await uow.Consents.GetAsync(id);
        return c is null ? Results.NotFound() : Results.Ok(c);
    }

    private static async Task<IResult> Create(CreateConsentRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        var c = new Consent
        {
            PatientId = req.PatientId,
            EncounterId = req.EncounterId,
            Kind = string.IsNullOrWhiteSpace(req.Kind) ? "treatment" : req.Kind,
            Title = req.Title,
            BodyText = req.BodyText,
            RequiredWitness = req.RequiredWitness,
            ExpiresAt = req.ExpiresAt,
            Status = "draft"
        };
        await uow.Consents.AddAsync(c);
        await uow.SaveAsync();
        return Results.Created($"/api/consents/{c.Id}", c);
    }

    private static async Task<IResult> Sign(int id, SignConsentRequest req, IUnitOfWork uow, IFileStore files, ICurrentUser current)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        var c = await uow.Consents.GetAsync(id);
        if (c is null) return Results.NotFound();
        if (c.Status == "revoked") return Results.BadRequest(new { error = "consent revoked" });
        if (string.IsNullOrWhiteSpace(req.SignatureDataUrl))
            return Results.BadRequest(new { error = "patient signature required" });
        if (c.RequiredWitness && (string.IsNullOrWhiteSpace(req.WitnessName) || string.IsNullOrWhiteSpace(req.WitnessSignatureDataUrl)))
            return Results.BadRequest(new { error = "witness signature required" });

        var patientKey = await SaveSignatureAsync(files, req.SignatureDataUrl, $"consent-{id}-patient.png");
        if (patientKey is null) return Results.BadRequest(new { error = "invalid signature data url" });
        c.SignedByPatientName = req.SignedByPatientName ?? "";
        c.SignatureBlobKey = patientKey;

        if (c.RequiredWitness)
        {
            var wKey = await SaveSignatureAsync(files, req.WitnessSignatureDataUrl!, $"consent-{id}-witness.png");
            if (wKey is null) return Results.BadRequest(new { error = "invalid witness signature data url" });
            c.WitnessName = req.WitnessName;
            c.WitnessSignatureBlobKey = wKey;
        }

        c.Status = "signed";
        c.SignedAt = DateTime.UtcNow;
        uow.Consents.Update(c);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "consent_sign",
            Action = "consent_sign",
            Resource = $"consent:{id}",
            TargetPatientId = c.PatientId,
            Detail = c.Kind,
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Ok(c);
    }

    private static async Task<IResult> Revoke(int id, RevokeConsentRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        var c = await uow.Consents.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "revoked";
        c.RevokedAt = DateTime.UtcNow;
        c.RevocationReason = req.Reason;
        uow.Consents.Update(c);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "consent_revoke",
            Action = "consent_revoke",
            Resource = $"consent:{id}",
            TargetPatientId = c.PatientId,
            Reason = req.Reason ?? "",
            Detail = c.Kind,
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Ok(c);
    }

    private static async Task<IResult> PatientSignature(int id, IUnitOfWork uow, IFileStore files)
    {
        var c = await uow.Consents.GetAsync(id);
        if (c is null || string.IsNullOrEmpty(c.SignatureBlobKey)) return Results.NotFound();
        var stream = files.Open(c.SignatureBlobKey);
        return stream is null ? Results.NotFound() : Results.Stream(stream, "image/png");
    }

    private static async Task<IResult> WitnessSignature(int id, IUnitOfWork uow, IFileStore files)
    {
        var c = await uow.Consents.GetAsync(id);
        if (c is null || string.IsNullOrEmpty(c.WitnessSignatureBlobKey)) return Results.NotFound();
        var stream = files.Open(c.WitnessSignatureBlobKey);
        return stream is null ? Results.NotFound() : Results.Stream(stream, "image/png");
    }

    private static async Task<string?> SaveSignatureAsync(IFileStore files, string dataUrl, string fileName)
    {
        var idx = dataUrl.IndexOf(",", StringComparison.Ordinal);
        var b64 = idx >= 0 ? dataUrl[(idx + 1)..] : dataUrl;
        byte[] bytes;
        try { bytes = Convert.FromBase64String(b64); }
        catch { return null; }
        using var ms = new MemoryStream(bytes);
        var (rel, _) = await files.SaveAsync(ms, fileName, "image/png");
        return rel;
    }
}
