using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Notification : TenantEntity
{
    public int? UserId { get; set; }     // null = broadcast to whole tenant
    public string Kind { get; set; } = ""; // lab-critical, code-blue, order-verify, message, bed-status, cds-alert, system
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Url { get; set; } = "";  // deep link, e.g. /labs/123
    public string Severity { get; set; } = "info"; // info, warn, bad, good
    public DateTime? ReadAt { get; set; }
    public int? PatientId { get; set; }
    public Patient? Patient { get; set; }
}
