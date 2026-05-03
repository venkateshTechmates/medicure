using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class InventoryItem : TenantEntity
{
    public string Name { get; set; } = "";
    public string Ndc { get; set; } = "";
    public string Sku { get; set; } = "";
    public string Category { get; set; } = "";
    public int OnHand { get; set; }
    public int ParLevel { get; set; }
    public string Location { get; set; } = "";
    public string LotNumber { get; set; } = "";
    public DateTime? ExpiresAt { get; set; }
    public decimal UnitCost { get; set; }
}
