using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ConsultEndpoints
{
    public static IEndpointRouteBuilder MapConsultEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/consults").RequireAuthorization();
        g.MapGet ("/",                List);
        g.MapGet ("/{id:int}",        Get);
        g.MapPost("/",                Create);
        g.MapPost("/{id:int}/respond", Respond);
        g.MapPost("/{id:int}/decline", Decline);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, string? status, string? toService, int? patientId, int? take)
    {
        var q = uow.ConsultRequests.Query().Include(c => c.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))     q = q.Where(c => c.Status == status);
        if (!string.IsNullOrWhiteSpace(toService))  q = q.Where(c => c.ToService == toService);
        if (patientId is int pid)                   q = q.Where(c => c.PatientId == pid);
        var rows = await q.OrderByDescending(c => c.RequestedAt).Take(take ?? 50).ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var c = await uow.ConsultRequests.Query().Include(x => x.Patient).FirstOrDefaultAsync(x => x.Id == id);
        return c is null ? Results.NotFound() : Results.Ok(c);
    }

    private static async Task<IResult> Create(ConsultRequest input, IUnitOfWork uow, ICurrentUser current)
    {
        if (input.RequestedAt == default) input.RequestedAt = DateTime.UtcNow;
        if (string.IsNullOrEmpty(input.RequestedByName)) input.RequestedByName = current.FullName ?? "Unknown";
        if (string.IsNullOrEmpty(input.Status)) input.Status = "Pending";
        await uow.ConsultRequests.AddAsync(input);
        await uow.SaveAsync();
        return Results.Created($"/api/consults/{input.Id}", input);
    }

    public record RespondRequest(string Response);

    private static async Task<IResult> Respond(int id, RespondRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        var c = await uow.ConsultRequests.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Response = req.Response ?? "";
        c.Status = "Completed";
        c.RespondedAt = DateTime.UtcNow;
        c.RespondedByName = current.FullName ?? "Unknown";
        uow.ConsultRequests.Update(c);
        await uow.SaveAsync();
        return Results.Ok(c);
    }

    private static async Task<IResult> Decline(int id, IUnitOfWork uow, ICurrentUser current)
    {
        var c = await uow.ConsultRequests.GetAsync(id);
        if (c is null) return Results.NotFound();
        c.Status = "Declined";
        c.RespondedAt = DateTime.UtcNow;
        c.RespondedByName = current.FullName ?? "Unknown";
        uow.ConsultRequests.Update(c);
        await uow.SaveAsync();
        return Results.NoContent();
    }
}
