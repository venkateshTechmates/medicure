using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public interface INotificationService
{
    Task EmitAsync(string kind, string title, string body, string severity = "info",
        int? userId = null, int? patientId = null, string url = "", CancellationToken ct = default);

    Task<int> ProcessEscalationsAsync(CancellationToken ct = default);
}
