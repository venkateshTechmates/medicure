using MedCure.Api.Data;

namespace MedCure.Api.Endpoints;

public static class LabEndpoints
{
    public static IEndpointRouteBuilder MapLabEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/labs").RequireAuthorization();
        g.MapGet ("/",         List);
        g.MapGet ("/{id:int}", Get);
        g.MapPost("/{id:int}/ack", Ack);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? flag, int? patientId, int? take) =>
        Results.Ok(await uow.LabResults.ListAsync(flag, patientId, take ?? 100));

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var l = await uow.LabResults.GetAsync(id);
        return l is null ? Results.NotFound() : Results.Ok(l);
    }

    private static async Task<IResult> Ack(int id, IUnitOfWork uow)
    {
        var l = await uow.LabResults.GetAsync(id);
        if (l is null) return Results.NotFound();
        l.Acknowledged = true;
        uow.LabResults.Update(l);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
