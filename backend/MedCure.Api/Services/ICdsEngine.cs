using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public record CdsFinding(string Severity, string Code, string Message);

public interface ICdsEngine
{
    Task<IReadOnlyList<CdsFinding>> ReviewOrderAsync(Order order, CancellationToken ct = default);
}
