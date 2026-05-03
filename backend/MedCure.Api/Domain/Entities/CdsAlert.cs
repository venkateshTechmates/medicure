using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class CdsAlert : TenantEntity
{
    public int OrderId { get; set; }
    public string Severity { get; set; } = "info"; // crit, warn, info
    public string Type { get; set; } = "";
    public string Message { get; set; } = "";
    public string Recommendation { get; set; } = "";
}
