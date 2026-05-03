using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Encounter : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Type { get; set; } = "Inpatient"; // Inpatient, ED, Clinic, OR
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public string ChiefComplaint { get; set; } = "";
    public int? EsiLevel { get; set; }
    public string Disposition { get; set; } = "";
}
