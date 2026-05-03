using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class MedicationAdministration : TenantEntity
{
    public int OrderId { get; set; }
    public Order? Order { get; set; }
    public int PatientId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime? AdministeredAt { get; set; }
    public string Status { get; set; } = "scheduled"; // scheduled, given, late, held, refused
    public string AdministeredBy { get; set; } = "";
    public bool ScanVerified { get; set; }
    public string Notes { get; set; } = "";
}
