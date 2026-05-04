using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/orders").RequireAuthorization();
        g.MapGet  ("/",                List);
        g.MapGet  ("/{id:int}",        Get);
        g.MapPost ("/",                Create);
        g.MapPost ("/{id:int}/sign",   Sign);
        g.MapPost ("/{id:int}/verify", Verify);
        g.MapPost ("/{id:int}/administer", Administer);
        g.MapPost ("/{id:int}/complete",   Complete);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? status, string? type, int? patientId, int? take) =>
        Results.Ok(await uow.Orders.ListAsync(status, type, patientId, take ?? 100));

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var o = await uow.Orders.GetAsync(id);
        return o is null ? Results.NotFound() : Results.Ok(o);
    }

    private static async Task<IResult> Create(Order input, IUnitOfWork uow, ICurrentUser current, IKgIngestService kg)
    {
        input.OrderedByName = current.FullName ?? "Unknown";
        await uow.Orders.AddAsync(input);
        await uow.SaveAsync();
        // Propagate order to knowledge graph so drug/patient edges are current
        var patient = await uow.Patients.Query().Where(p => p.Id == input.PatientId).FirstOrDefaultAsync();
        if (patient is not null)
            _ = kg.IngestPatientAsync(patient, orders: [input]);
        return Results.Created($"/api/orders/{input.Id}", input);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow)
    {
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "signed"; o.SignedAt = DateTime.UtcNow;
        uow.Orders.Update(o);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Verify(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "verified"; o.VerifiedAt = DateTime.UtcNow; o.VerifiedByName = current.FullName;
        uow.Orders.Update(o);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Complete(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "completed";
        if (string.IsNullOrEmpty(o.VerifiedByName)) o.VerifiedByName = current.FullName;
        uow.Orders.Update(o);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Administer(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "administered";
        uow.Orders.Update(o);
        await uow.MedAdmins.AddAsync(new MedicationAdministration
        {
            OrderId = id, PatientId = o.PatientId,
            ScheduledAt = DateTime.UtcNow, AdministeredAt = DateTime.UtcNow,
            Status = "given", AdministeredBy = current.FullName ?? "RN", ScanVerified = true
        });
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
