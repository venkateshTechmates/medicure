using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Claim : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string ClaimNumber { get; set; } = "";
    public string Payer { get; set; } = "";
    public string CptCode { get; set; } = "";
    public string ServiceDescription { get; set; } = "";
    public DateTime DateOfService { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "submitted"; // draft, submitted, paid, denied, appealing
    public string DenialReason { get; set; } = "";
}
