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
        g.MapPost ("/{id:int}/cds-review", CdsReview);
        g.MapPatch("/{id:int}",            Modify);
        g.MapPost ("/{id:int}/discontinue", Discontinue);
        g.MapPost ("/verbal",              CreateVerbal);
        g.MapPost ("/{id:int}/cosign",     Cosign);
        return app;
    }

    public record OrderModifyInput(Dictionary<string, object?> Updates, string Reason);
    public record OrderReasonInput(string Reason);
    public record VerbalOrderInput(int PatientId, string DrugName, string Dose, string Route,
        string Frequency, string Indication, int OrderingMdId);

    private static async Task<IResult> Modify(int id, OrderModifyInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        if (o.Status != "signed" && o.Status != "verified")
            return Results.BadRequest(new { error = "Only signed or verified orders can be modified." });

        var before = new
        {
            o.Name, o.Dose, o.Route, o.Frequency, o.Indication, o.Priority,
            o.StartAt, o.Duration, o.Notes
        };

        foreach (var (k, v) in input.Updates)
        {
            var val = v?.ToString() ?? "";
            switch (k.ToLowerInvariant())
            {
                case "name":       o.Name = val; break;
                case "dose":       o.Dose = val; break;
                case "route":      o.Route = val; break;
                case "frequency":  o.Frequency = val; break;
                case "indication": o.Indication = val; break;
                case "priority":   o.Priority = val; break;
                case "duration":   o.Duration = val; break;
                case "notes":      o.Notes = val; break;
            }
        }
        o.Revision += 1;
        o.SignedAt = DateTime.UtcNow;
        uow.Orders.Update(o);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "order_modified",
            Reason = input.Reason,
            Action = "modify",
            Resource = $"order:{id}",
            TargetPatientId = o.PatientId,
            Detail = $"rev={o.Revision}; before={System.Text.Json.JsonSerializer.Serialize(before)}",
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Ok(o);
    }

    private static async Task<IResult> Discontinue(int id, OrderReasonInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "discontinued";
        o.DiscontinuedAt = DateTime.UtcNow;
        o.DiscontinuedReason = input.Reason;
        uow.Orders.Update(o);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "order_discontinued",
            Reason = input.Reason,
            Action = "discontinue",
            Resource = $"order:{id}",
            TargetPatientId = o.PatientId,
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> CreateVerbal(VerbalOrderInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "RN", "RnEd", "ChargeNurse") is { } forbid) return forbid;
        var order = new Order
        {
            PatientId = input.PatientId,
            OrderType = "Medication",
            Name = input.DrugName,
            Dose = input.Dose,
            Route = input.Route,
            Frequency = input.Frequency,
            Indication = input.Indication,
            Priority = "Routine",
            Status = "verbal-pending-cosign",
            OrderedByName = current.FullName ?? "RN",
            OrderingMdId = input.OrderingMdId,
            EnteredByUserId = current.UserId,
            VerbalCosignDue = DateTime.UtcNow.AddHours(24)
        };
        await uow.Orders.AddAsync(order);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "order_verbal_entered",
            Action = "verbal_entry",
            Resource = $"order:new",
            TargetPatientId = input.PatientId,
            Detail = $"orderingMdId={input.OrderingMdId}; drug={input.DrugName}",
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.Created($"/api/orders/{order.Id}", order);
    }

    private static async Task<IResult> Cosign(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        if (o.Status != "verbal-pending-cosign")
            return Results.BadRequest(new { error = "Order is not pending verbal cosign." });
        if (o.OrderingMdId is not int mdId || mdId != current.UserId)
            return Results.Forbid();

        o.Status = "signed";
        o.SignedAt = DateTime.UtcNow;
        uow.Orders.Update(o);

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "order_cosigned",
            Action = "cosign",
            Resource = $"order:{id}",
            TargetPatientId = o.PatientId,
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> List(IUnitOfWork uow, HttpContext http, string? status, string? type, int? patientId, int? take, int? skip)
    {
        var rows = await uow.Orders.ListAsync(status, type, patientId, take ?? 100);
        http.Response.Headers["X-Total-Count"] = rows.Count.ToString();
        return Results.Ok(rows);
    }

    private static async Task<IResult> Get(int id, IUnitOfWork uow)
    {
        var o = await uow.Orders.GetAsync(id);
        return o is null ? Results.NotFound() : Results.Ok(o);
    }

    private static async Task<IResult> Create(Order input, IUnitOfWork uow, ICurrentUser current,
        IKgIngestService kg, ICdsEngine cds, INotificationService notify)
    {
        input.OrderedByName = current.FullName ?? "Unknown";
        await uow.Orders.AddAsync(input);
        await uow.SaveAsync();

        // Clinical decision support — emit notifications for any findings
        var findings = await cds.ReviewOrderAsync(input);
        foreach (var f in findings)
        {
            await notify.EmitAsync(
                kind: "cds-alert",
                title: f.Severity == "bad" ? "⚠ CDS critical" : "CDS warning",
                body:  $"{input.Name}: {f.Message}",
                severity: f.Severity,
                patientId: input.PatientId,
                url: $"/orders/{input.Id}");
            await uow.CdsAlerts.AddAsync(new CdsAlert {
                Type = f.Code, Message = f.Message, Severity = f.Severity,
                OrderId = input.Id, Recommendation = ""
            });
        }
        if (findings.Count > 0) await uow.SaveAsync();

        var patient = await uow.Patients.Query().Where(p => p.Id == input.PatientId).FirstOrDefaultAsync();
        if (patient is not null)
            _ = kg.IngestPatientAsync(patient, orders: [input]);
        // Same shape as before; CDS findings are also exposed via GET /api/orders/{id}/cds-review and as notifications.
        return Results.Created($"/api/orders/{input.Id}", input);
    }

    private static async Task<IResult> CdsReview(int id, IUnitOfWork uow, ICdsEngine cds)
    {
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        var findings = await cds.ReviewOrderAsync(o);
        return Results.Ok(findings);
    }

    private static async Task<IResult> Sign(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
        var o = await uow.Orders.GetAsync(id);
        if (o is null) return Results.NotFound();
        o.Status = "signed"; o.SignedAt = DateTime.UtcNow;
        uow.Orders.Update(o);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Verify(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (RoleGuard.Require(current, "RPh") is { } forbid) return forbid;
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
        if (RoleGuard.Require(current, "RN", "RnEd", "ChargeNurse") is { } forbid) return forbid;
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
