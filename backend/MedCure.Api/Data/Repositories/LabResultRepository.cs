using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public class LabResultRepository(AppDbContext db, ICurrentUser current)
    : Repository<LabResult>(db, current), ILabResultRepository
{
    public async Task<List<LabResult>> ListAsync(string? flag, int? patientId, int take, CancellationToken ct = default)
    {
        var q = Query().Include(l => l.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(flag)) q = q.Where(l => l.Flag == flag);
        if (patientId is int pid) q = q.Where(l => l.PatientId == pid);
        return await q.OrderByDescending(l => l.ResultedAt).Take(take).ToListAsync(ct);
    }
}
