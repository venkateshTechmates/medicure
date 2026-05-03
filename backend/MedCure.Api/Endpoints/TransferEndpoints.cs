using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class TransferEndpoints
{
    public static IEndpointRouteBuilder MapTransferEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/transfers").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapGet ("/{id:int}",        Get);
        g.MapPost("/",                Create);
        g.MapPost("/{id:int}/accept",   Accept);
        g.MapPost("/{id:int}/complete", Complete);
        g.MapPost("/{id:int}/reject",   Reject);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? status, string? toUnit, int? take)
    {
        var q = uow.TransferRequests.Query().Include(t => t.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(t => t.Status == status);
        if (!string.IsNullOrWhiteSpace(toUnit)) q = q.Where(t => t.ToUnit == toUnit);
        var rows = await q.OrderByDescending(t => t.RequestedAt).Take(take ?? 50).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var t = await uow.TransferRequests.Query().Include(x => x.Patient).FirstOrDefaultAsync(x => x.Id == id);
        return t is null ? Results.NotFound() : Results.Ok(t);
    }

    private static async Task<IResult> Create(TransferRequest input, IUnitOfWork uow, ICurrentUser current)
    {
        if (input.RequestedAt == default) input.RequestedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.RequestedByName)) input.RequestedByName = current.FullName ?? "Unknown";
        if (string.IsNullOrEmpty(input.Status)) input.Status = "Pending";
        await uow.TransferRequests.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/transfers/{input.Id}", input);
    }

    private static async Task<IResult> Accept(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var t = await uow.TransferRequests.GetAsync(id);
        if (t is null) return Results.NotFound();
        t.Status = "Accepted";
        t.AcceptedAt = DateTime.UtcNow;
        t.AcceptedBy = current.FullName ?? "Unknown";
        uow.TransferRequests.Update(t);
        await uow.SaveAsync();
        return Results.Ok(t);
    }

    private static async Task<IResult> Complete(int id, IUnitOfWork uow)
    {
        var t = await uow.TransferRequests.GetAsync(id);
        if (t is null) return Results.NotFound();
        t.Status = "Completed";
        t.CompletedAt = DateTime.UtcNow;
        uow.TransferRequests.Update(t);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Reject(int id, IUnitOfWork uow)
    {
        var t = await uow.TransferRequests.GetAsync(id);
        if (t is null) return Results.NotFound();
        t.Status = "Rejected";
        uow.TransferRequests.Update(t);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
