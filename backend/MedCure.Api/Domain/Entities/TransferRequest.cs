using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class TransferRequest : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string FromUnit { get; set; } = "";  // e.g. "ED"
    public string ToUnit { get; set; } = "";    // e.g. "ICU"
    public string Reason { get; set; } = "";
    public string Acuity { get; set; } = "Stable"; // Stable, Watcher, Critical
    public string Isolation { get; set; } = "None";
    public string Status { get; set; } = "Pending"; // Pending, Accepted, InTransit, Completed, Rejected
    public string AcceptedBy { get; set; } = "";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string RequestedByName { get; set; } = "";
    public string Notes { get; set; } = "";
}
