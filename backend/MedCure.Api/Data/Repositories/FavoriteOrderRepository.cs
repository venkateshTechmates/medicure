using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class FavoriteOrderRepository(AppDbContext db, ICurrentUser current)
    : Repository<FavoriteOrder>(db, current);
