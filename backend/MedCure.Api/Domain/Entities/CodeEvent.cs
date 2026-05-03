using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class CodeEvent : TenantEntity
{
    public int? PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Kind { get; set; } = "Blue";    // Blue, STEMI, Stroke, Trauma, Sepsis, MTP
    public string Location { get; set; } = "";    // Bay 4, ICU-2, etc
    public string ActivatedBy { get; set; } = "";
    public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string Outcome { get; set; } = "";     // ROSC, transferred, deceased, false alarm
    public string Status { get; set; } = "active"; // active, resolved
    public string TimelineJson { get; set; } = "[]";  // serialized list of {at, label, done}
}
