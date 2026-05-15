using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

/// <summary>
/// PRD §14.C — a clinician's saved single-order template. Idempotent on (UserId, TenantId, Name, OrderType).
/// </summary>
public class FavoriteOrder : TenantEntity
{
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public string OrderType { get; set; } = "Medication"; // Medication, Lab, Imaging, Nursing, Consult, Diet
    public string Dose { get; set; } = "";
    public string Route { get; set; } = "";
    public string Frequency { get; set; } = "";
    public string Indication { get; set; } = "";
    public string Notes { get; set; } = "";
}
