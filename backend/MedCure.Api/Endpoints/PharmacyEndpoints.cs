using MedCure.Api.Data;

namespace MedCure.Api.Endpoints;

public static class PharmacyEndpoints
{
    public static IEndpointRouteBuilder MapPharmacyEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/pharmacy").RequireAuthorization();
        g.MapGet("/queue",     Queue);
        g.MapGet("/inventory", Inventory);
        return app;
    }

    private static async Task<IResult> Queue(IUnitOfWork uow, int? take) =>
        Results.Ok(await uow.Orders.PharmacyQueueAsync(take ?? 50));

    private static IResult Inventory(IUnitOfWork uow) =>
        Results.Ok(uow.InventoryItems.Query().OrderBy(i => i.Name));
}
