using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

/// <summary>
/// Unified Inbasket — aggregator over LabResult, Message, Note (cosign), Order (refill),
/// Notification, ConsultRequest, Document. No native entity (delegation rules use InbasketItem).
/// PRD §11.P.
/// </summary>
public static class InbasketEndpoints
{
    public static IEndpointRouteBuilder MapInbasketEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/inbasket").RequireAuthorization();
        g.MapGet ("/",                              List);
        g.MapGet ("/counts",                        Counts);
        g.MapPost("/{folder}/{sourceId:int}/action", Act);
        g.MapPost("/delegate",                      Delegate);
        return app;
    }

    public record InbasketDto(
        int Id,
        string Folder,
        int? PatientId,
        string PatientName,
        string Title,
        string Subtitle,
        string Priority,        // "urgent" | "normal"
        DateTime CreatedAt,
        string SourceType,
        int SourceId);

    public record ActionRequest(string Action, string? Reason);

    public record DelegateRequest(int DelegateUserId, string Folders, DateTime FromUtc, DateTime ToUtc);

    // ────────────────────────────────────────────────────────────────────────
    // LIST per folder
    // ────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> List(string? folder, IUnitOfWork uow, ICurrentUser current)
    {
        var f = (folder ?? "results").ToLowerInvariant();
        var items = f switch
        {
            "results"   => await ListResults(uow),
            "messages"  => await ListMessages(uow, current),
            "cosign"    => await ListCosign(uow),
            "refills"   => await ListRefills(uow),
            "staff"     => await ListStaff(uow),
            "documents" => await ListDocuments(uow),
            "consults"  => await ListConsults(uow, current),
            _ => new List<InbasketDto>()
        };
        return Results.Ok(items);
    }

    private static async Task<List<InbasketDto>> ListResults(IUnitOfWork uow)
    {
        var rows = await uow.LabResults.Query()
            .Include(l => l.Patient)
            .Where(l => !l.Acknowledged && (l.Flag == "critical" || l.Flag == "high" || l.Flag == "low" || l.Flag == "abnormal"))
            .OrderByDescending(l => l.ResultedAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(l => new InbasketDto(
            Id: l.Id,
            Folder: "results",
            PatientId: l.PatientId,
            PatientName: l.Patient is null ? "" : $"{l.Patient.FirstName} {l.Patient.LastName}",
            Title: $"{l.TestName} = {l.Value} {l.Units}",
            Subtitle: $"{l.Panel} · ref {l.RefRange} · {l.Flag}",
            Priority: l.Flag == "critical" ? "urgent" : "normal",
            CreatedAt: l.ResultedAt == default ? l.CreatedAt : l.ResultedAt,
            SourceType: "LabResult",
            SourceId: l.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListMessages(IUnitOfWork uow, ICurrentUser current)
    {
        // Message entity has no ToUserId — best we can do is filter unread messages within
        // the current tenant. Tenant filtering happens automatically via Repository.Query().
        var rows = await uow.Messages.Query()
            .Include(m => m.Thread)
            .Where(m => !m.Read)
            .OrderByDescending(m => m.SentAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(m => new InbasketDto(
            Id: m.Id,
            Folder: "messages",
            PatientId: m.Thread?.PatientId,
            PatientName: m.SenderName,
            Title: m.Thread?.Subject ?? "Message",
            Subtitle: m.Body.Length > 120 ? m.Body[..120] + "…" : m.Body,
            Priority: m.Thread?.Urgent == true ? "urgent" : "normal",
            CreatedAt: m.SentAt == default ? m.CreatedAt : m.SentAt,
            SourceType: "Message",
            SourceId: m.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListCosign(IUnitOfWork uow)
    {
        // No RequiresCosign field — heuristic: unsigned notes with author title containing
        // "resident" or "student" (or simply all unsigned notes).
        var rows = await uow.Notes.Query()
            .Include(n => n.Patient)
            .Where(n => !n.Signed)
            .OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(n => new InbasketDto(
            Id: n.Id,
            Folder: "cosign",
            PatientId: n.PatientId,
            PatientName: n.Patient is null ? "" : $"{n.Patient.FirstName} {n.Patient.LastName}",
            Title: $"{n.Type} note — {n.AuthorName}",
            Subtitle: n.Content.Length > 120 ? n.Content[..120] + "…" : n.Content,
            Priority: "normal",
            CreatedAt: n.CreatedAt,
            SourceType: "Note",
            SourceId: n.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListRefills(IUnitOfWork uow)
    {
        // Orders has no "refill-requested" status in seed data; match status substring so we
        // surface anything similar. If nothing matches the list will be empty.
        var rows = await uow.Orders.Query()
            .Include(o => o.Patient)
            .Where(o => o.OrderType == "Medication"
                     && (o.Status == "refill-requested" || o.Status.Contains("refill")))
            .OrderByDescending(o => o.CreatedAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(o => new InbasketDto(
            Id: o.Id,
            Folder: "refills",
            PatientId: o.PatientId,
            PatientName: o.Patient is null ? "" : $"{o.Patient.FirstName} {o.Patient.LastName}",
            Title: $"Refill — {o.Name} {o.Dose}",
            Subtitle: $"{o.Route} · {o.Frequency} · ordered by {o.OrderedByName}",
            Priority: o.Priority == "Stat" ? "urgent" : "normal",
            CreatedAt: o.CreatedAt,
            SourceType: "Order",
            SourceId: o.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListStaff(IUnitOfWork uow)
    {
        // Generic staff/team channel: surface urgent message threads.
        var rows = await uow.MessageThreads.Query()
            .Where(t => t.Urgent)
            .OrderByDescending(t => t.LastMessageAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(t => new InbasketDto(
            Id: t.Id,
            Folder: "staff",
            PatientId: t.PatientId,
            PatientName: t.Participants,
            Title: t.Subject,
            Subtitle: t.Participants,
            Priority: t.Urgent ? "urgent" : "normal",
            CreatedAt: t.LastMessageAt == default ? t.CreatedAt : t.LastMessageAt,
            SourceType: "MessageThread",
            SourceId: t.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListDocuments(IUnitOfWork uow)
    {
        // No AssignedToUserId — surface the 20 most recent unsigned documents.
        var rows = await uow.Documents.Query()
            .Where(d => d.SignedAt == null && d.Status != "signed")
            .OrderByDescending(d => d.CreatedAt)
            .Take(20)
            .ToListAsync();
        return rows.Select(d => new InbasketDto(
            Id: d.Id,
            Folder: "documents",
            PatientId: d.PatientId,
            PatientName: d.AuthorName,
            Title: d.Title,
            Subtitle: $"{d.Category} · {d.FileType.ToUpperInvariant()} · {d.Pages} page{(d.Pages == 1 ? "" : "s")}",
            Priority: "normal",
            CreatedAt: d.CreatedAt,
            SourceType: "Document",
            SourceId: d.Id
        )).ToList();
    }

    private static async Task<List<InbasketDto>> ListConsults(IUnitOfWork uow, ICurrentUser current)
    {
        // ConsultRequest has no ToUserId — filter by status only.
        var rows = await uow.ConsultRequests.Query()
            .Include(c => c.Patient)
            .Where(c => c.Status == "Pending")
            .OrderByDescending(c => c.RequestedAt)
            .Take(100)
            .ToListAsync();
        return rows.Select(c => new InbasketDto(
            Id: c.Id,
            Folder: "consults",
            PatientId: c.PatientId,
            PatientName: c.Patient is null ? "" : $"{c.Patient.FirstName} {c.Patient.LastName}",
            Title: $"{c.FromService} → {c.ToService}",
            Subtitle: $"{c.Reason} · {c.Question}",
            Priority: c.Urgency is "Stat" or "Urgent" ? "urgent" : "normal",
            CreatedAt: c.RequestedAt == default ? c.CreatedAt : c.RequestedAt,
            SourceType: "ConsultRequest",
            SourceId: c.Id
        )).ToList();
    }

    // ────────────────────────────────────────────────────────────────────────
    // COUNTS
    // ────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Counts(IUnitOfWork uow, ICurrentUser current)
    {
        var results = await uow.LabResults.Query()
            .CountAsync(l => !l.Acknowledged && (l.Flag == "critical" || l.Flag == "high" || l.Flag == "low" || l.Flag == "abnormal"));
        var messages = await uow.Messages.Query().CountAsync(m => !m.Read);
        var cosign = await uow.Notes.Query().CountAsync(n => !n.Signed);
        var refills = await uow.Orders.Query()
            .CountAsync(o => o.OrderType == "Medication" && (o.Status == "refill-requested" || o.Status.Contains("refill")));
        var staff = await uow.MessageThreads.Query().CountAsync(t => t.Urgent);
        var documents = await uow.Documents.Query().CountAsync(d => d.SignedAt == null && d.Status != "signed");
        var consults = await uow.ConsultRequests.Query().CountAsync(c => c.Status == "Pending");
        return Results.Ok(new
        {
            results,
            messages,
            cosign,
            refills,
            staff,
            documents,
            consults,
            total = results + messages + cosign + refills + staff + documents + consults
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // ACTION — ack / complete / delegate / dismiss
    // ────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Act(string folder, int sourceId, ActionRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        var f = (folder ?? "").ToLowerInvariant();
        var act = (req.Action ?? "").ToLowerInvariant();

        switch (f)
        {
            case "results":
            {
                var l = await uow.LabResults.GetAsync(sourceId);
                if (l is null) return Results.NotFound();
                if (act is "ack" or "complete" or "dismiss")
                {
                    l.Acknowledged = true;
                    uow.LabResults.Update(l);
                    await uow.AuditEntries.AddAsync(new AuditEntry
                    {
                        UserId = current.UserId, Action = act, Resource = "LabResult",
                        Detail = $"inbasket id={sourceId} test={l.TestName}"
                    });
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            case "messages":
            {
                var m = await uow.Messages.GetAsync(sourceId);
                if (m is null) return Results.NotFound();
                m.Read = true;
                uow.Messages.Update(m);
                await uow.SaveAsync();
                return Results.NoContent();
            }
            case "cosign":
            {
                var n = await uow.Notes.GetAsync(sourceId);
                if (n is null) return Results.NotFound();
                if (act == "complete" || act == "ack")
                {
                    n.Signed = true;
                    n.SignedAt = DateTime.UtcNow;
                    uow.Notes.Update(n);
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            case "refills":
            {
                var o = await uow.Orders.GetAsync(sourceId);
                if (o is null) return Results.NotFound();
                if (act == "complete" || act == "ack")
                {
                    o.Status = "signed";
                    o.SignedAt = DateTime.UtcNow;
                    uow.Orders.Update(o);
                    await uow.SaveAsync();
                }
                else if (act == "dismiss")
                {
                    o.Status = "cancelled";
                    uow.Orders.Update(o);
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            case "staff":
            {
                var t = await uow.MessageThreads.GetAsync(sourceId);
                if (t is null) return Results.NotFound();
                if (act == "ack" || act == "complete" || act == "dismiss")
                {
                    t.Urgent = false;
                    uow.MessageThreads.Update(t);
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            case "documents":
            {
                var d = await uow.Documents.GetAsync(sourceId);
                if (d is null) return Results.NotFound();
                if (act == "complete" || act == "ack")
                {
                    d.Status = "signed";
                    d.SignedAt = DateTime.UtcNow;
                    uow.Documents.Update(d);
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            case "consults":
            {
                var c = await uow.ConsultRequests.GetAsync(sourceId);
                if (c is null) return Results.NotFound();
                if (act == "complete" || act == "ack")
                {
                    c.Status = "Completed";
                    c.Response = req.Reason ?? c.Response;
                    c.RespondedAt = DateTime.UtcNow;
                    c.RespondedByName = current.FullName ?? "Unknown";
                    uow.ConsultRequests.Update(c);
                    await uow.SaveAsync();
                }
                else if (act == "dismiss")
                {
                    c.Status = "Declined";
                    c.RespondedAt = DateTime.UtcNow;
                    c.RespondedByName = current.FullName ?? "Unknown";
                    uow.ConsultRequests.Update(c);
                    await uow.SaveAsync();
                }
                return Results.NoContent();
            }
            default:
                return Results.BadRequest(new { error = $"unknown folder '{folder}'" });
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // DELEGATE — out-of-office forwarding
    // ────────────────────────────────────────────────────────────────────────

    private static async Task<IResult> Delegate(DelegateRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is null) return Results.Unauthorized();
        var row = new InbasketItem
        {
            OwnerUserId     = current.UserId.Value,
            DelegateUserId  = req.DelegateUserId,
            DelegateFromUtc = req.FromUtc,
            DelegateToUtc   = req.ToUtc,
            Folders         = req.Folders ?? "",
        };
        await uow.InbasketDelegations.AddAsync(row);
        await uow.SaveAsync();
        return Results.Created($"/api/inbasket/delegate/{row.Id}", row);
    }
}
