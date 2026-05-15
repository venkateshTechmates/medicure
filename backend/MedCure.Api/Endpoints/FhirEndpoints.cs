using MedCure.Api.Data;
using MedCure.Api.Fhir;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

/// <summary>
/// Read-only FHIR R4 adapter, exposed under /fhir.
/// Routes return anonymous records (serialized as JSON) that conform to FHIR R4 resource shapes.
/// </summary>
public static class FhirEndpoints
{
    public static IEndpointRouteBuilder MapFhirEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/fhir").RequireAuthorization();

        g.MapGet("/metadata", Metadata);
        g.MapGet("/Patient/{mrn}", GetPatient);
        g.MapGet("/Patient", SearchPatients);
        g.MapGet("/Observation", SearchObservations);
        g.MapGet("/MedicationRequest", SearchMedicationRequests);
        g.MapGet("/AllergyIntolerance", SearchAllergies);
        g.MapGet("/Condition", SearchConditions);
        g.MapGet("/Encounter", SearchEncounters);
        g.MapGet("/DiagnosticReport", SearchDiagnosticReports);

        return app;
    }

    private static IResult Metadata() =>
        Results.Ok(FhirMappers.CapabilityStatement());

    private static async Task<IResult> GetPatient(string mrn, IUnitOfWork uow)
    {
        var p = await uow.Patients.GetByMrnAsync(mrn);
        if (p is null) return Results.NotFound(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "not-found", diagnostics = $"Patient {mrn} not found" } } });
        return Results.Ok(FhirMappers.ToFhirPatient(p));
    }

    private static async Task<IResult> SearchPatients(IUnitOfWork uow, int? _count)
    {
        var take = Math.Clamp(_count ?? 50, 1, 500);
        var patients = await uow.Patients.Query()
            .OrderBy(p => p.LastName)
            .Take(take)
            .ToListAsync();
        var resources = patients.Select(FhirMappers.ToFhirPatient);
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchObservations(IUnitOfWork uow, string? patient, string? category)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var includeVitals = string.IsNullOrEmpty(category) || category.Equals("vital-signs", StringComparison.OrdinalIgnoreCase);
        var includeLabs = string.IsNullOrEmpty(category) || category.Equals("laboratory", StringComparison.OrdinalIgnoreCase);

        var resources = new List<object>();
        if (includeVitals)
        {
            var vitals = await uow.Vitals.Query()
                .Where(v => v.PatientId == p.Id)
                .OrderByDescending(v => v.RecordedAt)
                .Take(200)
                .ToListAsync();
            foreach (var v in vitals)
            {
                v.Patient = p;
                resources.Add(FhirMappers.ToFhirObservation(v));
            }
        }
        if (includeLabs)
        {
            var labs = await uow.LabResults.Query()
                .Where(l => l.PatientId == p.Id)
                .OrderByDescending(l => l.ResultedAt)
                .Take(500)
                .ToListAsync();
            foreach (var l in labs)
            {
                l.Patient = p;
                resources.Add(FhirMappers.ToFhirObservation(l));
            }
        }
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchMedicationRequests(IUnitOfWork uow, string? patient)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var orders = await uow.Orders.Query()
            .Where(o => o.PatientId == p.Id && o.OrderType == "Medication")
            .OrderByDescending(o => o.CreatedAt)
            .Take(200)
            .ToListAsync();
        foreach (var o in orders) o.Patient = p;
        var resources = orders.Select(FhirMappers.ToFhirMedicationRequest);
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchAllergies(IUnitOfWork uow, string? patient)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var allergies = await uow.Allergies.Query()
            .Where(a => a.PatientId == p.Id)
            .ToListAsync();
        foreach (var a in allergies) a.Patient = p;
        var resources = allergies.Select(FhirMappers.ToFhirAllergyIntolerance);
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchConditions(IUnitOfWork uow, string? patient)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var problems = await uow.Problems.Query()
            .Where(x => x.PatientId == p.Id)
            .OrderByDescending(x => x.Onset)
            .ToListAsync();
        foreach (var pr in problems) pr.Patient = p;
        var resources = problems.Select(FhirMappers.ToFhirCondition);
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchEncounters(IUnitOfWork uow, string? patient)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var encounters = await uow.Encounters.Query()
            .Where(e => e.PatientId == p.Id)
            .OrderByDescending(e => e.StartAt)
            .ToListAsync();
        foreach (var e in encounters) e.Patient = p;
        var resources = encounters.Select(FhirMappers.ToFhirEncounter);
        return Results.Ok(FhirMappers.Bundle(resources));
    }

    private static async Task<IResult> SearchDiagnosticReports(IUnitOfWork uow, string? patient)
    {
        if (string.IsNullOrEmpty(patient))
            return Results.BadRequest(new { resourceType = "OperationOutcome", issue = new[] { new { severity = "error", code = "required", diagnostics = "patient parameter is required" } } });

        var p = await uow.Patients.GetByMrnAsync(patient);
        if (p is null) return Results.Ok(FhirMappers.Bundle(Array.Empty<object>()));

        var labs = await uow.LabResults.Query()
            .Where(l => l.PatientId == p.Id)
            .OrderByDescending(l => l.ResultedAt)
            .Take(1000)
            .ToListAsync();

        var reports = labs
            .Where(l => !string.IsNullOrEmpty(l.Panel))
            .GroupBy(l => l.Panel)
            .Select(g => FhirMappers.ToFhirDiagnosticReport(p, g.Key, g.ToList()));

        return Results.Ok(FhirMappers.Bundle(reports));
    }
}
