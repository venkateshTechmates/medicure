namespace MedCure.Api.Services;

public interface INoteTokenResolver
{
    Task<string> ResolveAsync(int patientId, string body, CancellationToken ct = default);
}
