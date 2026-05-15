using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class RecentPatientRepository(AppDbContext db, ICurrentUser current)
    : Repository<RecentPatient>(db, current)
{
}
