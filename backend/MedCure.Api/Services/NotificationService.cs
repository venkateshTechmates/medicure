using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MedCure.Api.Services;

public class NotificationService(IUnitOfWork uow, IHubContext<NotificationHub> hub) : INotificationService
{
    public async Task EmitAsync(string kind, string title, string body, string severity = "info",
        int? userId = null, int? patientId = null, string url = "", CancellationToken ct = default)
    {
        var n = new Notification
        {
            Kind = kind, Title = title, Body = body, Severity = severity,
            UserId = userId, PatientId = patientId, Url = url
        };
        await uow.Notifications.AddAsync(n, ct);
        await uow.SaveAsync(ct);

        var dto = new { n.Id, n.Kind, n.Title, n.Body, n.Severity, n.Url, n.CreatedAt, n.PatientId };
        if (userId is int uid)
            await hub.Clients.Group($"u:{uid}").SendAsync("notification", dto, ct);
        else if (n.TenantId > 0)
            await hub.Clients.Group($"t:{n.TenantId}").SendAsync("notification", dto, ct);
    }
}
