using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class LabResult : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public int? OrderId { get; set; }
    public string Panel { get; set; } = "";        // CBC, BMP, ...
    public string TestName { get; set; } = "";
    public string Value { get; set; } = "";
    public string Units { get; set; } = "";
    public string RefRange { get; set; } = "";
    public string Flag { get; set; } = "normal";   // normal, high, low, critical
    public DateTime ResultedAt { get; set; }
    public string ResultedBy { get; set; } = "";
    public bool Acknowledged { get; set; }
}
