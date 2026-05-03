using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Vital : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public DateTime RecordedAt { get; set; }
    public int Hr { get; set; }
    public int Sbp { get; set; }
    public int Dbp { get; set; }
    public int Spo2 { get; set; }
    public int Rr { get; set; }
    public double TempC { get; set; }
    public int? Pain { get; set; }
    public string RecordedBy { get; set; } = "";
}
