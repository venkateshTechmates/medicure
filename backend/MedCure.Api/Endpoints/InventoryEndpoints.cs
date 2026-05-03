using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class InventoryEndpoints
{
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/inventory").RequireAuthorization();
        g.MapGet("/", List);
        g.MapGet("/expiring", Expiring);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow) =>
        Results.Ok(await uow.InventoryItems.Query().OrderBy(i => i.Name).ToListAsync());

    private static async Task<IResult> Expiring(IUnitOfWork uow, int? days)
    {
        var cutoff = DateTime.UtcNow.AddDays(days ?? 60);
        var rows = await uow.InventoryItems.Query()
            .Where(i => i.ExpiresAt != null && i.ExpiresAt <= cutoff)
            .OrderBy(i => i.ExpiresAt)
            .ToListAsync();
        return Results.Ok(rows);
    }
}
