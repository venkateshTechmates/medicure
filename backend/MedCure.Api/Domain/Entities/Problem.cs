using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Problem : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Description { get; set; } = "";
    public string IcdCode { get; set; } = "";
    public DateTime Onset { get; set; }
    public string Type { get; set; } = "active"; // active, chronic, resolved
}
