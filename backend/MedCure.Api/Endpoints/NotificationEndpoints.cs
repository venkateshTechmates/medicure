using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/notifications").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapPost("/{id:int}/read",   MarkRead);
        g.MapPost("/read-all",        MarkAllRead);
        g.MapPost("/{id:int}/ack",    Ack);
        g.MapPost("/bulk-dismiss",    BulkDismiss);
        return app;
    }

    public record AckRequest(string? Comment);
    public record BulkDismissRequest(int[] Ids, DateTime? SnoozeUntil);

    private static async Task<IResult> List(IUnitOfWork uow, ICurrentUser current, bool? unreadOnly, int? take, int? skip)
    {
        var uid = current.UserId;
        var q = uow.Notifications.Query()
            .Where(n => n.UserId == null || n.UserId == uid);
        if (unreadOnly == true) q = q.Where(n => n.ReadAt == null);
        var total = await q.CountAsync();
        var rows = await q.OrderByDescending(n => n.CreatedAt)
            .Skip(skip ?? 0).Take(take ?? 30).ToListAsync();
        return Results.Ok(new { total, items = rows });
    }

    private static async Task<IResult> MarkRead(int id, IUnitOfWork uow)
    {
        var n = await uow.Notifications.GetAsync(id);
        if (n is null) return Results.NotFound();
        n.ReadAt = DateTime.UtcNow;
        uow.Notifications.Update(n);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> MarkAllRead(IUnitOfWork uow, ICurrentUser current, AppDbContext db)
    {
        var uid = current.UserId;
        var rows = await db.Notifications
            .Where(n => (n.UserId == null || n.UserId == uid) && n.ReadAt == null)
            .ToListAsync();
        var now = DateTime.UtcNow;
        foreach (var r in rows) r.ReadAt = now;
        await db.SaveChangesAsync();
        return Results.Ok(new { marked = rows.Count });
    }

    private static async Task<IResult> Ack(int id, AckRequest? req, IUnitOfWork uow, ICurrentUser current)
    {
        var n = await uow.Notifications.GetAsync(id);
        if (n is null) return Results.NotFound();
        n.ReadAt ??= DateTime.UtcNow;
        uow.Notifications.Update(n);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "notification_ack",
            Action = "notification_ack",
            Resource = $"notification:{id}",
            Detail = req?.Comment ?? "",
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Ok(new { id = n.Id, acknowledgedAt = n.ReadAt, comment = req?.Comment });
    }

    private static async Task<IResult> BulkDismiss(BulkDismissRequest req, AppDbContext db, ICurrentUser current)
    {
        if (req.Ids is null || req.Ids.Length == 0) return Results.BadRequest(new { error = "ids required" });
        var uid = current.UserId;
        var rows = await db.Notifications
            .Where(n => req.Ids.Contains(n.Id) && (n.UserId == null || n.UserId == uid))
            .ToListAsync();
        var now = DateTime.UtcNow;
        foreach (var r in rows)
        {
            if (req.SnoozeUntil is DateTime until)
            {
                r.UpdatedAt = until;
            }
            else
            {
                r.ReadAt = now;
            }
        }
        await db.SaveChangesAsync();
        return Results.Ok(new { count = rows.Count, snoozedUntil = req.SnoozeUntil });
    }
}
