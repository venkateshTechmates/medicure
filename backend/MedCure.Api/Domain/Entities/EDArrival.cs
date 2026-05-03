using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class EDArrival : TenantEntity
{
    public int? PatientId { get; set; }
    public string PatientName { get; set; } = "";
    public int Age { get; set; }
    public string Sex { get; set; } = "";
    public string ChiefComplaint { get; set; } = "";
    public int EsiLevel { get; set; } = 3;
    public string ArrivalMode { get; set; } = "Walk-in"; // Walk-in, EMS, POV
    public DateTime ArrivedAt { get; set; }
    public string Status { get; set; } = "triaged";       // triaged, in-bed, dispo, discharged
    public string Bay { get; set; } = "";
    public int Hr { get; set; }
    public int Sbp { get; set; }
    public int Spo2 { get; set; }
}
