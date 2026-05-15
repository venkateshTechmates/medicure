using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Services;

public class NotificationService(
    IUnitOfWork uow,
    IHubContext<NotificationHub> hub,
    ILogger<NotificationService> logger) : INotificationService
{
    private static readonly TimeSpan DefaultEscalationDelay = TimeSpan.FromMinutes(5);

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

        var category = MapKindToCategory(kind);
        var channels = await ResolveChannelsAsync(userId, category, ct);

        if (channels.InApp)
        {
            var dto = new { n.Id, n.Kind, n.Title, n.Body, n.Severity, n.Url, n.CreatedAt, n.PatientId };
            if (userId is int uid)
                await hub.Clients.Group($"u:{uid}").SendAsync("notification", dto, ct);
            else if (n.TenantId > 0)
                await hub.Clients.Group($"t:{n.TenantId}").SendAsync("notification", dto, ct);
        }

        if (channels.Email) logger.LogInformation("Would send via email: notif={NotificationId} user={UserId} title={Title}", n.Id, userId, title);
        if (channels.Sms)   logger.LogInformation("Would send via sms: notif={NotificationId} user={UserId} title={Title}",   n.Id, userId, title);
        if (channels.Push)  logger.LogInformation("Would send via push: notif={NotificationId} user={UserId} title={Title}",  n.Id, userId, title);

        if (userId is int targetUid && IsCritical(severity))
        {
            var escalation = new AlertEscalation
            {
                TenantId = n.TenantId,
                AlertNotificationId = n.Id,
                Step = 1,
                ToUserId = targetUid,
                ScheduledAt = DateTime.UtcNow.Add(DefaultEscalationDelay),
                Reason = $"primary={targetUid}; awaiting ack on critical {kind}"
            };
            await uow.AlertEscalations.AddAsync(escalation, ct);
            await uow.SaveAsync(ct);
        }
    }

    public async Task<int> ProcessEscalationsAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var due = await uow.AlertEscalations.QueryAll()
            .Where(e => e.FiredAt == null && e.ScheduledAt <= now)
            .Take(100)
            .ToListAsync(ct);

        var fired = 0;
        foreach (var esc in due)
        {
            var notif = await uow.Notifications.GetAsync(esc.AlertNotificationId, ct);
            if (notif is null) { esc.FiredAt = now; uow.AlertEscalations.Update(esc); continue; }
            if (notif.ReadAt is not null) { esc.AcknowledgedAt = notif.ReadAt; esc.FiredAt = now; uow.AlertEscalations.Update(esc); continue; }

            var next = await ResolveNextEscalationTargetAsync(esc, ct);
            if (next is int nextUid)
            {
                var clone = new Notification
                {
                    TenantId = notif.TenantId,
                    UserId = nextUid,
                    Kind = notif.Kind,
                    Title = $"[ESCALATED] {notif.Title}",
                    Body = notif.Body,
                    Severity = notif.Severity,
                    Url = notif.Url,
                    PatientId = notif.PatientId
                };
                await uow.Notifications.AddAsync(clone, ct);
                logger.LogWarning("Escalating notif={NotificationId} step={Step} to user={ToUserId}", esc.AlertNotificationId, esc.Step + 1, nextUid);

                await uow.AlertEscalations.AddAsync(new AlertEscalation
                {
                    TenantId = esc.TenantId,
                    AlertNotificationId = notif.Id,
                    Step = esc.Step + 1,
                    ToUserId = nextUid,
                    ScheduledAt = now.Add(DefaultEscalationDelay),
                    Reason = $"escalated from step {esc.Step}"
                }, ct);
            }
            esc.FiredAt = now;
            uow.AlertEscalations.Update(esc);
            fired++;
        }
        if (fired > 0 || due.Count > 0) await uow.SaveAsync(ct);
        return fired;
    }

    private async Task<(bool InApp, bool Email, bool Sms, bool Push)> ResolveChannelsAsync(int? userId, string category, CancellationToken ct)
    {
        if (userId is not int uid) return (true, false, false, false);

        var pref = await uow.NotificationChannelPrefs.QueryAll()
            .FirstOrDefaultAsync(p => p.UserId == uid && p.Category == category, ct);

        if (pref is null) return (true, false, false, false);

        if (IsWithinQuietHours(pref.QuietFrom, pref.QuietUntil, DateTime.Now))
            return (true, false, false, false);

        return (pref.InApp, pref.Email, pref.Sms, pref.Push);
    }

    private async Task<int?> ResolveNextEscalationTargetAsync(AlertEscalation esc, CancellationToken ct)
    {
        var notif = await uow.Notifications.GetAsync(esc.AlertNotificationId, ct);
        if (notif is null) return null;
        var service = MapKindToService(notif.Kind);
        if (service is null) return null;
        var shift = await uow.OnCallShifts.CurrentForServiceAsync(service, DateTime.UtcNow, ct);
        if (shift is null) return null;
        if (shift.BackupUserId is int backup && backup != esc.ToUserId) return backup;
        if (shift.UserId != esc.ToUserId) return shift.UserId;
        return null;
    }

    private static bool IsCritical(string severity) =>
        severity.Equals("high", StringComparison.OrdinalIgnoreCase) ||
        severity.Equals("critical", StringComparison.OrdinalIgnoreCase) ||
        severity.Equals("bad", StringComparison.OrdinalIgnoreCase);

    private static bool IsWithinQuietHours(string? from, string? until, DateTime nowLocal)
    {
        if (string.IsNullOrWhiteSpace(from) || string.IsNullOrWhiteSpace(until)) return false;
        if (!TimeSpan.TryParse(from, out var qFrom) || !TimeSpan.TryParse(until, out var qUntil)) return false;
        var t = nowLocal.TimeOfDay;
        return qFrom <= qUntil ? (t >= qFrom && t < qUntil) : (t >= qFrom || t < qUntil);
    }

    private static string MapKindToCategory(string kind) => kind switch
    {
        "lab-critical"    => "critical-lab",
        "code-blue"       => "code-blue",
        "order-verify"    => "refill-request",
        "message"         => "secure-message",
        "cds-alert"       => "consult-request",
        "discharge"       => "discharge-ready",
        _                 => kind
    };

    private static string? MapKindToService(string kind) => kind switch
    {
        "code-blue"     => "icu",
        "lab-critical"  => "icu",
        "cds-alert"     => "icu",
        _               => null
    };
}
