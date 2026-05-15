using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class RecentPatient : TenantEntity
{
    public int UserId { get; set; }
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
