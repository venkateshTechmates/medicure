using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<List<UserTenant>> GetTenantsForUserAsync(int userId, CancellationToken ct = default);
}
