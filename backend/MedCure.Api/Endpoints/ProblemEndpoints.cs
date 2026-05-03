using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ProblemEndpoints
{
    public static IEndpointRouteBuilder MapProblemEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/problems").RequireAuthorization();
        g.MapGet ("/",           List);
        g.MapPost("/",           Create);
        g.MapPatch("/{id:int}",  Update);
        g.MapDelete("/{id:int}", Delete);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, string? type, int? take)
    {
        var q = uow.Problems.Query().Include(p => p.Patient);
        if (patientId is int pid) q = q.Where(p => p.PatientId == pid).Include(p => p.Patient);
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(p => p.Type == type).Include(p => p.Patient);
        var rows = await q.OrderByDescending(p => p.Onset).Take(take ?? 200).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(Problem input, IUnitOfWork uow)
    {
        if (input.Onset == default) input.Onset = DateTime.UtcNow;
        await uow.Problems.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/problems/{input.Id}", input);
    }

    private static async Task<IResult> Update(int id, Problem input, IUnitOfWork uow)
    {
        var p = await uow.Problems.GetAsync(id);
        if (p is null) return Results.NotFound();
        if (!string.IsNullOrWhiteSpace(input.Description)) p.Description = input.Description;
        if (!string.IsNullOrWhiteSpace(input.IcdCode)) p.IcdCode = input.IcdCode;
        if (!string.IsNullOrWhiteSpace(input.Type)) p.Type = input.Type;
        uow.Problems.Update(p);
        await uow.SaveAsync();
        return Results.Ok(p);
    }

    private static async Task<IResult> Delete(int id, IUnitOfWork uow)
    {
        var p = await uow.Problems.GetAsync(id);
        if (p is null) return Results.NotFound();
        uow.Problems.Remove(p);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
