using MedCure.Api.Auth;
using MedCure.Api.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public class Repository<T>(AppDbContext db, ICurrentUser current) : IRepository<T> where T : Entity
{
    protected readonly AppDbContext _db = db;
    protected readonly ICurrentUser _current = current;
    protected DbSet<T> Set => _db.Set<T>();

    public virtual async Task<T?> GetAsync(int id, CancellationToken ct = default)
    {
        var e = await Set.FindAsync(new object?[] { id }, ct);
        if (e is null) return null;
        if (e is TenantEntity te && _current.TenantId is int tid && te.TenantId != tid) return null;
        return e;
    }

    public virtual IQueryable<T> Query()
    {
        IQueryable<T> q = Set.AsNoTracking();
        if (typeof(TenantEntity).IsAssignableFrom(typeof(T)) && _current.TenantId is int tid)
        {
            q = q.Where(e => EF.Property<int>(e, "TenantId") == tid);
        }
        return q;
    }

    public virtual IQueryable<T> QueryAll() => Set.AsNoTracking();

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        if (entity is TenantEntity te && te.TenantId == 0 && _current.TenantId is int tid)
            te.TenantId = tid;
        await Set.AddAsync(entity, ct);
        return entity;
    }

    public virtual void Update(T entity) => Set.Update(entity);
    public virtual void Remove(T entity) => Set.Remove(entity);
}
