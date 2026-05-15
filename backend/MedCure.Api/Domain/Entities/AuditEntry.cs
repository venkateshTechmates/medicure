using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class AuditEntry : TenantEntity
{
    public int? UserId { get; set; }
    public string Action { get; set; } = "";
    public string Resource { get; set; } = "";
    public string Detail { get; set; } = "";
    public DateTime At { get; set; } = DateTime.UtcNow;
    public string Kind { get; set; } = "";
    public string Reason { get; set; } = "";
    public int? TargetPatientId { get; set; }
}
