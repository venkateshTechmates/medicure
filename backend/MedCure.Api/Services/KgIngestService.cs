using System.Text.Json;

namespace MedCure.Api.Services;

public class KgIngestService(HttpClient http, ILogger<KgIngestService> logger) : IKgIngestService
{
    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task IngestPatientAsync(
        object patient,
        IEnumerable<object>? problems = null,
        IEnumerable<object>? orders = null,
        IEnumerable<object>? labs = null,
        IEnumerable<object>? vitals = null,
        IEnumerable<object>? encounters = null,
        CancellationToken ct = default)
    {
        var payload = new
        {
            patient,
            problems  = problems?.ToArray()  ?? [],
            orders    = orders?.ToArray()    ?? [],
            labs      = labs?.ToArray()      ?? [],
            vitals    = vitals?.ToArray()    ?? [],
            encounters = encounters?.ToArray() ?? [],
        };

        try
        {
            var content = JsonContent.Create(payload, options: _json);
            using var resp = await http.PostAsync("/graph/ingest", content, ct);
            if (!resp.IsSuccessStatusCode)
                logger.LogWarning("KG ingest returned {Status}", (int)resp.StatusCode);
        }
        catch (Exception ex)
        {
            logger.LogWarning("KG ingest failed (non-critical): {Message}", ex.Message);
        }
    }

    public async Task InvalidateNodeAsync(string nodeId, CancellationToken ct = default)
    {
        try
        {
            using var resp = await http.DeleteAsync($"/graph/cache/{nodeId}", ct);
            if (!resp.IsSuccessStatusCode)
                logger.LogWarning("KG invalidate {NodeId} returned {Status}", nodeId, (int)resp.StatusCode);
        }
        catch (Exception ex)
        {
            logger.LogWarning("KG invalidate failed (non-critical): {Message}", ex.Message);
        }
    }
}
