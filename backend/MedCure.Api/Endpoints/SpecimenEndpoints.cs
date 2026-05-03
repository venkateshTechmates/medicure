using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class SpecimenEndpoints
{
    public static IEndpointRouteBuilder MapSpecimenEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/specimens").RequireAuthorization();
        g.MapGet ("/",         List);
        g.MapPost("/",         Create);
        g.MapPost("/{id:int}/advance", Advance);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow) =>
        Results.Ok(await uow.Specimens.Query().OrderByDescending(s => s.CreatedAt).Take(50).ToListAsync());

    private static async Task<IResult> Create(Specimen input, IUnitOfWork uow, ICurrentUser current)
    {
        input.CollectedBy = current.FullName ?? "RN";
        input.CollectedAt = DateTime.UtcNow;
        input.Status = "collected";
        await uow.Specimens.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/specimens/{input.Id}", input);
    }

    private static async Task<IResult> Advance(int id, AdvanceRequest req, IUnitOfWork uow)
    {
        var s = await uow.Specimens.GetAsync(id);
        if (s is null) return Results.NotFound();
        s.Status = req.Status;
        uow.Specimens.Update(s);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    public record AdvanceRequest(string Status);
}
