using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Specimen : TenantEntity
{
    public int PatientId { get; set; }
    public string Type { get; set; } = "";   // Blood, Urine, ...
    public string Status { get; set; } = "collected"; // ordered, collected, in-transit, received, processing, resulted
    public DateTime? CollectedAt { get; set; }
    public string CollectedBy { get; set; } = "";
    public string Location { get; set; } = "";
    public string Priority { get; set; } = "Routine";
}
