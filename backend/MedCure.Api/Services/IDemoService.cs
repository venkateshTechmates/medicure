namespace MedCure.Api.Services;

/// <summary>
/// PRD §14.X — wipe-and-reseed for the current tenant's mutable demo data; canned clinical scenarios.
/// </summary>
public interface IDemoService
{
    /// <summary>Deletes every <c>TenantEntity</c> row for <paramref name="tenantId"/> except <c>Tenant</c>, <c>User</c>, and <c>UserTenant</c>, then reseeds. Idempotent.</summary>
    Task<Dictionary<string, int>> ResetAsync(int tenantId, CancellationToken ct = default);

    /// <summary>Drops a small synthetic scenario into the current tenant and returns the URL the UI should navigate to.</summary>
    Task<DemoScenarioResult> RunScenarioAsync(int tenantId, string name, CancellationToken ct = default);
}

public record DemoScenarioResult(string Scenario, int? PatientId, int? EdArrivalId, List<int> OrderIds, string Url);
