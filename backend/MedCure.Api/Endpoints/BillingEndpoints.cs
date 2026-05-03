using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class BillingEndpoints
{
    public static IEndpointRouteBuilder MapBillingEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/billing").RequireAuthorization();
        g.MapGet  ("/claims",            List);
        g.MapGet  ("/claims/{id:int}",   Get);
        g.MapPost ("/claims",            Create);
        g.MapPost ("/claims/{id:int}/appeal", Appeal);
        g.MapPost ("/claims/{id:int}/submit", Submit);
        g.MapPost ("/claims/{id:int}/pay",    Pay);
        g.MapPost ("/claims/{id:int}/deny",   Deny);
        g.MapGet  ("/aging",             Aging);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? status, int? take)
    {
        var q = uow.Claims.Query().Include(c => c.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        var rows = await q.OrderByDescending(c => c.DateOfService).Take(take ?? 100).ToListAsync();
        return Results.Ok(rows.Select(c => new
        {
            c.Id, c.ClaimNumber, c.Payer, c.CptCode, c.ServiceDescription,
            c.DateOfService, c.Amount, c.Status, c.DenialReason,
            Patient = c.Patient is null ? null : new { c.Patient.Id, c.Patient.Mrn, FullName = $"{c.Patient.FirstName} {c.Patient.LastName}" }
        }));
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var c = await uow.Claims.GetAsync(id);
        return c is null ? Results.NotFound() : Results.Ok(c);
    }

    private static async Task<IResult> Create(Claim input, IUnitOfWork uow)
    {
        if (input.DateOfService == default) input.DateOfService = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.ClaimNumber)) input.ClaimNumber = $"CLM{Random.Shared.Next(100000, 999999)}";
        if (string.IsNullOrEmpty(input.Status)) input.Status = "submitted";
        await uow.Claims.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/billing/claims/{input.Id}", input);
    }

    private static async Task<IResult> Submit(int id, IUnitOfWork uow)
    {
        var c = await uow.Claims.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "submitted";
        uow.Claims.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Pay(int id, IUnitOfWork uow)
    {
        var c = await uow.Claims.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "paid";
        uow.Claims.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    public record DenyRequest(string Reason);

    private static async Task<IResult> Deny(int id, DenyRequest req, IUnitOfWork uow)
    {
        var c = await uow.Claims.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "denied";
        c.DenialReason = req.Reason ?? "";
        uow.Claims.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Appeal(int id, IUnitOfWork uow)
    {
        var c = await uow.Claims.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "appealing";
        uow.Claims.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Aging(IUnitOfWork uow)
    {
        var rows = await uow.Claims.Query().ToListAsync();
        var now = DateTime.UtcNow;
        decimal Bucket(int loDays, int hiDays) =>
            rows.Where(c => (now - c.DateOfService).TotalDays >= loDays && (now - c.DateOfService).TotalDays < hiDays && c.Status != "paid")
                .Sum(c => c.Amount);
        return Results.Ok(new
        {
            B0_30   = Bucket(0, 31),
            B31_60  = Bucket(31, 61),
            B61_90  = Bucket(61, 91),
            B91_120 = Bucket(91, 121),
            B120    = Bucket(121, int.MaxValue)
        });
    }
}
