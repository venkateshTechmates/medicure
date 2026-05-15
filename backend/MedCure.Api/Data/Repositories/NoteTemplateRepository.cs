using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class NoteTemplateRepository(AppDbContext db, ICurrentUser current)
    : Repository<NoteTemplate>(db, current)
{
}
