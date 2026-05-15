using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public interface IConsentRepository : IRepository<Consent>
{
    Task<List<Consent>> ForPatientAsync(int patientId, CancellationToken ct = default);
}

public class ConsentRepository(AppDbContext db, ICurrentUser current)
    : Repository<Consent>(db, current), IConsentRepository
{
    public Task<List<Consent>> ForPatientAsync(int patientId, CancellationToken ct = default) =>
        Query()
            .Where(c => c.PatientId == patientId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
}
