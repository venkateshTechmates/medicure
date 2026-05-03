using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Immunization : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }
    public string Vaccine { get; set; } = "";   // e.g. "Influenza", "COVID-19", "Tdap"
    public string LotNumber { get; set; } = "";
    public string Manufacturer { get; set; } = "";
    public string Site { get; set; } = "";       // L deltoid, R deltoid, etc
    public string Route { get; set; } = "IM";
    public string DoseSeries { get; set; } = ""; // "1 of 2", "Booster"
    public DateTime Administered { get; set; } = DateTime.UtcNow;
    public string AdministeredBy { get; set; } = "";
    public string Status { get; set; } = "completed"; // completed, due, refused
    public string Notes { get; set; } = "";
}
