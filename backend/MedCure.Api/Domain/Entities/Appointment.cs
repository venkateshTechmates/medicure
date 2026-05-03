using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Appointment : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string ProviderName { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string Room { get; set; } = "";
    public DateTime ScheduledAt { get; set; }
    public int DurationMin { get; set; } = 30;
    public string Type { get; set; } = "Follow-up";
    public string Status { get; set; } = "scheduled"; // scheduled, checked-in, completed, cancelled
}
