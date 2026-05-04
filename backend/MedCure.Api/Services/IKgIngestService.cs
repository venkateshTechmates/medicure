namespace MedCure.Api.Services;

/// <summary>
/// Pushes entity bundles to the Python Knowledge Graph service
/// so it can cache relationships without polling the API.
/// Fire-and-forget: failures are logged but never propagate.
/// </summary>
public interface IKgIngestService
{
    Task IngestPatientAsync(object patient, IEnumerable<object>? problems = null,
        IEnumerable<object>? orders = null, IEnumerable<object>? labs = null,
        IEnumerable<object>? vitals = null, IEnumerable<object>? encounters = null,
        CancellationToken ct = default);

    Task InvalidateNodeAsync(string nodeId, CancellationToken ct = default);
}
