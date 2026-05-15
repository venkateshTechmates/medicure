using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class OnCallShift : TenantEntity
{
    public string Service { get; set; } = "";    // e.g. "cardiology", "icu", "pediatrics"
    public int UserId { get; set; }              // primary on-call
    public int? BackupUserId { get; set; }       // backup
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public string Role { get; set; } = "primary"; // "primary"|"backup"|"resident"
    public string? Pager { get; set; }
}

public class AlertEscalation : TenantEntity
{
    public int AlertNotificationId { get; set; }  // FK to Notification.Id
    public int Step { get; set; }
    public int ToUserId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? FiredAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string Reason { get; set; } = "";
}
