using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class FavoritePanelItemRepository(AppDbContext db, ICurrentUser current)
    : Repository<FavoritePanelItem>(db, current);
