using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class AllergyEndpoints
{
    public static IEndpointRouteBuilder MapAllergyEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/allergies").RequireAuthorization();
        g.MapGet ("/",         List);
        g.MapPost("/",         Create);
        g.MapDelete("/{id:int}", Delete);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, int? take)
    {
        var q = uow.Allergies.Query().Include(a => a.Patient);
        if (patientId is int pid) q = q.Where(a => a.PatientId == pid).Include(a => a.Patient);
        var rows = await q.OrderByDescending(a => a.Id).Take(take ?? 200).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(Allergy input, IUnitOfWork uow)
    {
        await uow.Allergies.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/allergies/{input.Id}", input);
    }

    private static async Task<IResult> Delete(int id, IUnitOfWork uow)
    {
        var a = await uow.Allergies.GetAsync(id);
        if (a is null) return Results.NotFound();
        uow.Allergies.Remove(a);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
