using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class EDEndpoints
{
    public static IEndpointRouteBuilder MapEDEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/ed").RequireAuthorization();
        g.MapGet ("/board",   Board);
        g.MapPost("/triage",  Triage);
        return app;
    }

    private static async Task<IResult> Board(IUnitOfWork uow)
    {
        var arrivals = await uow.EDArrivals.Query().OrderByDescending(a => a.ArrivedAt).Take(80).ToListAsync();
        var grouped = Enumerable.Range(1, 5).Select(level => new
        {
            EsiLevel = level,
            Patients = arrivals.Where(a => a.EsiLevel == level).OrderBy(a => a.ArrivedAt)
        });
        return Results.Ok(grouped);
    }

    private static async Task<IResult> Triage(EDArrival input, IUnitOfWork uow)
    {
        input.ArrivedAt = DateTime.UtcNow;
        input.Status = "triaged";
        await uow.EDArrivals.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/ed/{input.Id}", input);
    }
}
