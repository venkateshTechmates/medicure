using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class OnCallEndpoints
{
    public static IEndpointRouteBuilder MapOnCallEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/on-call").RequireAuthorization();
        g.MapGet ("/",            List);
        g.MapGet ("/current",     Current);
        g.MapPost("/",            Create);
        g.MapDelete("/{id:int}",  Delete);
        return app;
    }

    public record CreateOnCallShiftRequest(
        string Service,
        int UserId,
        int? BackupUserId,
        DateTime StartsAt,
        DateTime EndsAt,
        string? Role,
        string? Pager);

    private static async Task<IResult> List(IUnitOfWork uow, string? service, DateTime? date)
    {
        var q = uow.OnCallShifts.Query();
        if (!string.IsNullOrWhiteSpace(service)) q = q.Where(s => s.Service == service);
        if (date is DateTime d)
        {
            var dayStart = DateTime.SpecifyKind(d.Date, DateTimeKind.Utc);
            var dayEnd = dayStart.AddDays(1);
            q = q.Where(s => s.StartsAt < dayEnd && s.EndsAt >= dayStart);
        }
        var rows = await q.OrderBy(s => s.Service).ThenBy(s => s.StartsAt).Take(500).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Current(string service, IUnitOfWork uow)
    {
        if (string.IsNullOrWhiteSpace(service)) return Results.BadRequest(new { error = "service required" });
        var shift = await uow.OnCallShifts.CurrentForServiceAsync(service, DateTime.UtcNow);
        return shift is null ? Results.NotFound() : Results.Ok(shift);
    }

    private static async Task<IResult> Create(CreateOnCallShiftRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(req.Service)) return Results.BadRequest(new { error = "service required" });
        if (req.EndsAt <= req.StartsAt) return Results.BadRequest(new { error = "endsAt must be after startsAt" });
        var shift = new OnCallShift
        {
            Service = req.Service,
            UserId = req.UserId,
            BackupUserId = req.BackupUserId,
            StartsAt = req.StartsAt,
            EndsAt = req.EndsAt,
            Role = string.IsNullOrWhiteSpace(req.Role) ? "primary" : req.Role,
            Pager = req.Pager
        };
        await uow.OnCallShifts.AddAsync(shift);
        await uow.SaveAsync();
        return Results.Created($"/api/on-call/{shift.Id}", shift);
    }

    private static async Task<IResult> Delete(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (!current.IsAuthenticated) return Results.Unauthorized();
        var shift = await uow.OnCallShifts.GetAsync(id);
        if (shift is null) return Results.NotFound();
        uow.OnCallShifts.Remove(shift);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
