using MedCure.Api.Auth;
using MedCure.Api.Data;
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
        return app;
    }

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
}
