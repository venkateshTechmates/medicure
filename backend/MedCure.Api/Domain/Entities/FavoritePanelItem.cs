using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

/// <summary>
/// PRD §14.C — one order template inside a <see cref="FavoritePanel"/>. Cloned into a real <see cref="Order"/> on apply.
/// </summary>
public class FavoritePanelItem : TenantEntity
{
    public int PanelId { get; set; }
    public FavoritePanel? Panel { get; set; }

    public string Name { get; set; } = "";
    public string OrderType { get; set; } = "Medication";
    public string Dose { get; set; } = "";
    public string Route { get; set; } = "";
    public string Frequency { get; set; } = "";
    public string Indication { get; set; } = "";
}
