using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class CdsOverride : TenantEntity
{
    public string RuleKey { get; set; } = "";
    public int PatientId { get; set; }
    public int? OrderId { get; set; }
    public int UserId { get; set; }
    public string ReasonCode { get; set; } = "";
    public string ReasonText { get; set; } = "";
    public string Severity { get; set; } = "warn"; // mirror of the rule severity at override time
}
