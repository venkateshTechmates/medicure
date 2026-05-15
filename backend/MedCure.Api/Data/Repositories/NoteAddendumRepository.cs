using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class NoteAddendumRepository(AppDbContext db, ICurrentUser current)
    : Repository<NoteAddendum>(db, current)
{
}
