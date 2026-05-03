using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ImmunizationEndpoints
{
    public static IEndpointRouteBuilder MapImmunizationEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/immunizations").RequireAuthorization();
        g.MapGet ("/",            List);
        g.MapPost("/",            Create);
        g.MapPost("/{id:int}/refuse", Refuse);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, int? patientId, string? status, int? take)
    {
        var q = uow.Immunizations.Query().Include(i => i.Patient);
        if (patientId is int pid) q = q.Where(i => i.PatientId == pid).Include(i => i.Patient);
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(i => i.Status == status).Include(i => i.Patient);
        var rows = await q.OrderByDescending(i => i.Administered).Take(take ?? 200).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Create(Immunization input, IUnitOfWork uow, ICurrentUser current)
    {
        if (input.Administered == default) input.Administered = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.AdministeredBy)) input.AdministeredBy = current.FullName ?? "Unknown";
        if (string.IsNullOrEmpty(input.Status)) input.Status = "completed";
        await uow.Immunizations.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/immunizations/{input.Id}", input);
    }

    private static async Task<IResult> Refuse(int id, IUnitOfWork uow)
    {
        var imm = await uow.Immunizations.GetAsync(id);
        if (imm is null) return Results.NotFound();
        imm.Status = "refused";
        uow.Immunizations.Update(imm);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
