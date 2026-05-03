using MedCure.Api.Domain.Common;

namespace MedCure.Api.Data.Repositories;

public interface IRepository<T> where T : Entity
{
    Task<T?> GetAsync(int id, CancellationToken ct = default);
    IQueryable<T> Query();
    IQueryable<T> QueryAll(); // bypass tenant filter — use sparingly
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    void Update(T entity);
    void Remove(T entity);
}
