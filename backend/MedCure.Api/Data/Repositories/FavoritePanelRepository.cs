using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class FavoritePanelRepository(AppDbContext db, ICurrentUser current)
    : Repository<FavoritePanel>(db, current);
