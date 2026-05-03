using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Note : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Type { get; set; } = "Progress"; // Progress, Nursing, Consult, H&P, Discharge
    public string AuthorName { get; set; } = "";
    public string Content { get; set; } = "";
    public bool Signed { get; set; }
    public DateTime? SignedAt { get; set; }
}
