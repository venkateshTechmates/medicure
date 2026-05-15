using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class PinnedPatient : TenantEntity
{
    public int UserId { get; set; }
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public DateTime PinnedAt { get; set; } = DateTime.UtcNow;
}
