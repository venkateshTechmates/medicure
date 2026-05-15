using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class NoteDraftRepository(AppDbContext db, ICurrentUser current)
    : Repository<NoteDraft>(db, current)
{
}
