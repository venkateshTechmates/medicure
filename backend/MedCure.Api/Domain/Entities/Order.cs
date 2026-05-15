using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Order : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string OrderType { get; set; } = "Medication"; // Medication, Lab, Imaging, Nursing, Consult, Diet
    public string Name { get; set; } = "";
    public string Dose { get; set; } = "";
    public string Route { get; set; } = "";
    public string Frequency { get; set; } = "";
    public string Indication { get; set; } = "";
    public string Priority { get; set; } = "Routine"; // Stat, Urgent, Routine
    public string Status { get; set; } = "draft";     // draft, signed, verified, dispensed, administered, cancelled
    public string OrderedByName { get; set; } = "";
    public DateTime? SignedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedByName { get; set; }
    public DateTime? StartAt { get; set; }
    public string? Duration { get; set; }
    public string Notes { get; set; } = "";
    public int Revision { get; set; } = 0;
    public DateTime? DiscontinuedAt { get; set; }
    public string DiscontinuedReason { get; set; } = "";
    public int? OrderingMdId { get; set; }
    public int? EnteredByUserId { get; set; }
    public DateTime? VerbalCosignDue { get; set; }
}
