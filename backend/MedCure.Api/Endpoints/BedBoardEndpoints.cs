using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class BedBoardEndpoints
{
    public static IEndpointRouteBuilder MapBedBoardEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/bed-board").RequireAuthorization();
        g.MapGet("/", Get);
        g.MapPatch("/beds/{id:int}", UpdateBed);
        return app;
    }

    private static async Task<IResult> Get(IUnitOfWork uow)
    {
        var wards = await uow.Wards.Query().OrderBy(w => w.Name).ToListAsync();
        var beds  = await uow.Beds.Query().ToListAsync();
        return Results.Ok(wards.Select(w => new
        {
            w.Id, w.Name, w.Code, w.BedCount, w.AvgLos, w.NurseRatio,
            Beds = beds.Where(b => b.WardId == w.Id)
                .Select(b => new { b.Id, b.BedNumber, b.Status, b.PatientId })
        }));
    }

    private static async Task<IResult> UpdateBed(int id, BedUpdate req, IUnitOfWork uow)
    {
        var bed = await uow.Beds.GetAsync(id);
        if (bed is null) return Results.NotFound();
        bed.Status = req.Status;
        if (req.PatientId is int pid) bed.PatientId = pid > 0 ? pid : null;
        uow.Beds.Update(bed);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    public record BedUpdate(string Status, int? PatientId);
}
