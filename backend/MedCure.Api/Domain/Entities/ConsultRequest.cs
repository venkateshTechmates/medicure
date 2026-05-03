using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class ConsultRequest : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string FromService { get; set; } = "";   // e.g. "Hospitalist"
    public string ToService { get; set; } = "";     // e.g. "Cardiology"
    public string ToProvider { get; set; } = "";    // optional named consultant
    public string Reason { get; set; } = "";
    public string Question { get; set; } = "";
    public string Urgency { get; set; } = "Routine"; // Stat, Urgent, Routine
    public string Status { get; set; } = "Pending";  // Pending, Accepted, Completed, Declined
    public string Response { get; set; } = "";
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public string RequestedByName { get; set; } = "";
    public string RespondedByName { get; set; } = "";
}
