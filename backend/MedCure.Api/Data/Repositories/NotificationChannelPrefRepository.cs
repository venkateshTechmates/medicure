using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public class NotificationChannelPrefRepository(AppDbContext db, ICurrentUser current)
    : Repository<NotificationChannelPref>(db, current);
