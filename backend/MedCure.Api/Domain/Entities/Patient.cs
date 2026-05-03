using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Patient : TenantEntity
{
    public string Mrn { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    public string Sex { get; set; } = "";
    public double WeightKg { get; set; }
    public double HeightCm { get; set; }
    public string CodeStatus { get; set; } = "Full Code";
    public string Insurance { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string Status { get; set; } = "good";       // good, warn, bad
    public string Ward { get; set; } = "";
    public string Bed { get; set; } = "";
    public string AttendingName { get; set; } = "";
    public string PrimaryRn { get; set; } = "";
    public DateTime AdmittedAt { get; set; }
    public string AvatarUrl { get; set; } = "";

    public List<Allergy> Allergies { get; set; } = new();
    public List<Problem> Problems { get; set; } = new();
    public List<Vital> Vitals { get; set; } = new();
}
