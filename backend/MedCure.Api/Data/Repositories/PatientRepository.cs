using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public class PatientRepository(AppDbContext db, ICurrentUser current)
    : Repository<Patient>(db, current), IPatientRepository
{
    public Task<Patient?> GetByMrnAsync(string mrn, CancellationToken ct = default) =>
        Query()
            .Include(p => p.Allergies)
            .Include(p => p.Problems)
            .FirstOrDefaultAsync(p => p.Mrn == mrn, ct);

    public async Task<List<Patient>> SearchAsync(string? q, string? status, string? ward, int take, CancellationToken ct = default)
    {
        var query = Query();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qq = q.ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(qq) ||
                p.LastName.ToLower().Contains(qq) ||
                p.Mrn.ToLower().Contains(qq));
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(p => p.Status == status);
        if (!string.IsNullOrWhiteSpace(ward))   query = query.Where(p => p.Ward == ward);
        return await query.OrderBy(p => p.LastName).Take(take).ToListAsync(ct);
    }
}
