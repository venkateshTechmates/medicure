using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public class UserRepository(AppDbContext db, ICurrentUser current)
    : Repository<User>(db, current), IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<List<UserTenant>> GetTenantsForUserAsync(int userId, CancellationToken ct = default) =>
        _db.UserTenants
            .Where(ut => ut.UserId == userId)
            .Include(ut => ut.Tenant)
            .ToListAsync(ct);
}
