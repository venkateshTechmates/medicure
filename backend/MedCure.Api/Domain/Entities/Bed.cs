using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Bed : TenantEntity
{
    public int WardId { get; set; }
    public Ward? Ward { get; set; }
    public string BedNumber { get; set; } = "";
    public string Status { get; set; } = "empty"; // occ, empty, cleaning, held, discharge, iso, boarding
    public int? PatientId { get; set; }
    public Patient? Patient { get; set; }
}
