using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class SmartPhraseRepository(AppDbContext db, ICurrentUser current)
    : Repository<SmartPhrase>(db, current)
{
}
