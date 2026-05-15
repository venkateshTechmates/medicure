using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class MedReconciliation : TenantEntity
{
    public int EncounterId { get; set; }
    public Encounter? Encounter { get; set; }
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string TransitionType { get; set; } = "admission"; // admission, transfer, discharge
    public string Status { get; set; } = "draft";              // draft, completed, blocked
    public int? PerformedByUserId { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Notes { get; set; } = "";

    public List<MedReconciliationLine> Lines { get; set; } = new();
}
