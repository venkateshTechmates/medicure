using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ChannelPrefEndpoints
{
    public static IEndpointRouteBuilder MapChannelPrefEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/channel-prefs").RequireAuthorization();
        g.MapGet("/",            List);
        g.MapPut("/{category}",  Upsert);
        return app;
    }

    public record UpsertChannelPrefRequest(bool InApp, bool Email, bool Sms, bool Push, string? QuietFrom, string? QuietUntil);

    private static async Task<IResult> List(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var rows = await uow.NotificationChannelPrefs.Query()
            .Where(p => p.UserId == uid)
            .OrderBy(p => p.Category)
            .ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Upsert(string category, UpsertChannelPrefRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(category)) return Results.BadRequest(new { error = "category required" });

        var existing = await uow.NotificationChannelPrefs.Query()
            .FirstOrDefaultAsync(p => p.UserId == uid && p.Category == category);

        if (existing is null)
        {
            var pref = new NotificationChannelPref
            {
                UserId = uid,
                Category = category,
                InApp = req.InApp,
                Email = req.Email,
                Sms = req.Sms,
                Push = req.Push,
                QuietFrom = req.QuietFrom,
                QuietUntil = req.QuietUntil
            };
            await uow.NotificationChannelPrefs.AddAsync(pref);
            await uow.SaveAsync();
            return Results.Ok(pref);
        }

        existing.InApp = req.InApp;
        existing.Email = req.Email;
        existing.Sms = req.Sms;
        existing.Push = req.Push;
        existing.QuietFrom = req.QuietFrom;
        existing.QuietUntil = req.QuietUntil;
        uow.NotificationChannelPrefs.Update(existing);
        await uow.SaveAsync();
        return Results.Ok(existing);
    }
}
