using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class NotificationChannelPref : TenantEntity
{
    public int UserId { get; set; }
    public string Category { get; set; } = "";  // e.g. "critical-lab", "refill-request", "code-blue"
    public bool InApp { get; set; } = true;
    public bool Email { get; set; }
    public bool Sms { get; set; }
    public bool Push { get; set; }
    public string? QuietFrom { get; set; }  // "22:00" 24h local
    public string? QuietUntil { get; set; } // "06:00"
}
