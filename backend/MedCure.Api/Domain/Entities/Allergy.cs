using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Allergy : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Substance { get; set; } = "";
    public string Reaction { get; set; } = "";
    public string Severity { get; set; } = "moderate"; // mild, moderate, severe
}
