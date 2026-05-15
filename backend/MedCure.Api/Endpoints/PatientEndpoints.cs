using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Dtos.Mapping;
using MedCure.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class PatientEndpoints
{
    public static IEndpointRouteBuilder MapPatientEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/patients").RequireAuthorization();
        g.MapGet("/",                List);
        g.MapGet("/{mrn}",           Get);
        g.MapGet("/{mrn}/vitals",    Vitals);
        g.MapGet("/{mrn}/labs",      Labs);
        g.MapGet("/{mrn}/meds",      Meds);
        g.MapGet("/{mrn}/notes",     Notes);
        g.MapGet("/{mrn}/timeline",  Timeline);
        g.MapPost("/",               Create);
        g.MapPatch("/{mrn}",         UpdateStatus);
        g.MapPost("/{mrn}/discharge", Discharge);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, ICurrentUser current, string? q, string? status, string? ward, int? take, string? scope)
    {
        var patients = await uow.Patients.SearchAsync(q, status, ward, take ?? 200, default);
        if (string.Equals(scope, "mine", StringComparison.OrdinalIgnoreCase) && current.UserId is int uid)
        {
            var mineIds = await uow.Orders.Query()
                .Where(o => o.OrderingMdId == uid || o.EnteredByUserId == uid)
                .Select(o => o.PatientId).Distinct().ToListAsync();
            var noteIds = await uow.Notes.Query()
                .Where(n => n.AuthorName == (current.FullName ?? ""))
                .Select(n => n.PatientId).Distinct().ToListAsync();
            var set = new HashSet<int>(mineIds.Concat(noteIds));
            patients = patients.Where(p => set.Contains(p.Id)).ToList();
        }
        var ids = patients.Select(p => p.Id).ToList();
        var latestVitals = await uow.Vitals.Query()
            .Where(v => ids.Contains(v.PatientId))
            .GroupBy(v => v.PatientId)
            .Select(grp => grp.OrderByDescending(v => v.RecordedAt).First())
            .ToListAsync();
        var byPid = latestVitals.ToDictionary(v => v.PatientId, v => v);
        return Results.Ok(patients.Select(p => PatientMapper.ToSummary(p, byPid.GetValueOrDefault(p.Id))));
    }

    private static async Task<IResult> Get(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        return Results.Ok(PatientMapper.ToDetail(p));
    }

    private static async Task<IResult> Vitals(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        var v = await uow.Vitals.Query()
            .Where(x => x.PatientId == p.Id)
            .OrderByDescending(x => x.RecordedAt)
            .Take(48)
            .ToListAsync();
        return Results.Ok(v);
    }

    private static async Task<IResult> Labs(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        var labs = await uow.LabResults.ListAsync(null, p.Id, 100);
        return Results.Ok(labs);
    }

    private static async Task<IResult> Meds(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        var orders = await uow.Orders.ListAsync(null, "Medication", p.Id, 50);
        return Results.Ok(orders);
    }

    private static async Task<IResult> Notes(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        var notes = await uow.Notes.Query()
            .Where(n => n.PatientId == p.Id)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20)
            .ToListAsync();
        return Results.Ok(notes);
    }

    private static async Task<IResult> Timeline(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();

        var orders = await uow.Orders.Query().Where(o => o.PatientId == p.Id).OrderByDescending(o => o.CreatedAt).Take(20).ToListAsync();
        var labs   = await uow.LabResults.Query().Where(l => l.PatientId == p.Id).OrderByDescending(l => l.ResultedAt).Take(20).ToListAsync();
        var notes  = await uow.Notes.Query().Where(n => n.PatientId == p.Id).OrderByDescending(n => n.CreatedAt).Take(10).ToListAsync();

        var events = new List<object>();
        events.AddRange(orders.Select(o => new { type = "order", at = o.CreatedAt, summary = $"{o.Name} {o.Dose} {o.Route} ({o.Status})" }));
        events.AddRange(labs.Select(l => new { type = "lab", at = l.ResultedAt, summary = $"{l.TestName}: {l.Value} {l.Units} ({l.Flag})" }));
        events.AddRange(notes.Select(n => new { type = "note", at = n.CreatedAt, summary = $"{n.Type} note by {n.AuthorName}" }));
        return Results.Ok(events.OrderByDescending(e => ((dynamic)e).at).Take(40));
    }

    public record AdmitRequest(string FirstName, string LastName, DateTime DateOfBirth, string Sex,
        string Phone, string Address, string Insurance, string Ward, string Bed,
        string AttendingName, string CodeStatus, string Status);

    private static async Task<IResult> Create(AdmitRequest req, IUnitOfWork uow, IKgIngestService kg, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "Reg") is { } forbid) return forbid;
        var mrn = $"{Random.Shared.Next(1000, 9999)}-{Random.Shared.Next(10, 99)}";
        var p = new Patient
        {
            Mrn = mrn,
            FirstName = req.FirstName, LastName = req.LastName,
            DateOfBirth = req.DateOfBirth, Sex = req.Sex,
            Phone = req.Phone, Address = req.Address, Insurance = req.Insurance,
            Ward = req.Ward, Bed = req.Bed,
            AttendingName = req.AttendingName,
            CodeStatus = string.IsNullOrEmpty(req.CodeStatus) ? "Full Code" : req.CodeStatus,
            Status = string.IsNullOrEmpty(req.Status) ? "good" : req.Status,
            AdmittedAt = DateTime.UtcNow,
            AvatarUrl = $"https://i.pravatar.cc/120?u={Uri.EscapeDataString(req.FirstName + req.LastName)}"
        };
        await uow.Patients.AddAsync(p);
        await uow.SaveAsync();
        var detail = PatientMapper.ToDetail(p);
        _ = kg.IngestPatientAsync(detail);   // fire-and-forget
        return Results.Created($"/api/patients/{mrn}", detail);
    }

    public record UpdateStatusRequest(string? Status, string? Ward, string? Bed, string? CodeStatus, string? AttendingName);

    private static async Task<IResult> UpdateStatus(string mrn, UpdateStatusRequest req, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        if (!string.IsNullOrEmpty(req.Status))         p.Status = req.Status;
        if (!string.IsNullOrEmpty(req.Ward))           p.Ward = req.Ward;
        if (!string.IsNullOrEmpty(req.Bed))            p.Bed = req.Bed;
        if (!string.IsNullOrEmpty(req.CodeStatus))     p.CodeStatus = req.CodeStatus;
        if (!string.IsNullOrEmpty(req.AttendingName))  p.AttendingName = req.AttendingName;
        uow.Patients.Update(p);
        await uow.SaveAsync();
        return Results.Ok(PatientMapper.ToDetail(p));
    }

    public record DischargeRequest(string Disposition, string Summary, string FollowUp);

    private static async Task<IResult> Discharge(string mrn, DischargeRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound();
        p.Status = "discharged";
        p.Ward = "Discharged";
        p.Bed = "—";
        uow.Patients.Update(p);

        await uow.Notes.AddAsync(new Note {
            PatientId = p.Id,
            Type = "Discharge Summary",
            AuthorName = current.FullName ?? "Unknown",
            Content = $"Disposition: {req.Disposition}\nSummary: {req.Summary}\nFollow-up: {req.FollowUp}",
            Signed = true,
            SignedAt = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Ok(new { mrn, status = "discharged", at = DateTime.UtcNow });
    }
}
