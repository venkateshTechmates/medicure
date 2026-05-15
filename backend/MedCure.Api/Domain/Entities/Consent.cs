using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Consent : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public int? EncounterId { get; set; }
    public Encounter? Encounter { get; set; }

    public string Kind { get; set; } = "treatment";
    public string Title { get; set; } = "";
    public string BodyText { get; set; } = "";

    public bool RequiredWitness { get; set; }
    public string Status { get; set; } = "draft";

    public string SignedByPatientName { get; set; } = "";
    public string? SignatureBlobKey { get; set; }

    public string? WitnessName { get; set; }
    public string? WitnessSignatureBlobKey { get; set; }

    public DateTime? SignedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? RevocationReason { get; set; }
}
