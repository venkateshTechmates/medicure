using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public interface IOnCallShiftRepository : IRepository<OnCallShift>
{
    Task<OnCallShift?> CurrentForServiceAsync(string service, DateTime atUtc, CancellationToken ct = default);
}

public class OnCallShiftRepository(AppDbContext db, ICurrentUser current)
    : Repository<OnCallShift>(db, current), IOnCallShiftRepository
{
    public Task<OnCallShift?> CurrentForServiceAsync(string service, DateTime atUtc, CancellationToken ct = default) =>
        Query()
            .Where(s => s.Service == service && s.StartsAt <= atUtc && s.EndsAt >= atUtc)
            .OrderBy(s => s.Role == "primary" ? 0 : 1)
            .ThenBy(s => s.StartsAt)
            .FirstOrDefaultAsync(ct);
}
