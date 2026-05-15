using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

/// <summary>
/// PRD §14.C — a clinician's named multi-order bundle (e.g. "Sepsis bundle"). Items live in <see cref="FavoritePanelItem"/>.
/// </summary>
public class FavoritePanel : TenantEntity
{
    public int UserId { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";

    public List<FavoritePanelItem> Items { get; set; } = new();
}
