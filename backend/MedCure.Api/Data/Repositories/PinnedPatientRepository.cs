using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class PinnedPatientRepository(AppDbContext db, ICurrentUser current)
    : Repository<PinnedPatient>(db, current)
{
}
