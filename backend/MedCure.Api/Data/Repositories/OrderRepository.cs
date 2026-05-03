using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data.Repositories;

public class OrderRepository(AppDbContext db, ICurrentUser current)
    : Repository<Order>(db, current), IOrderRepository
{
    public async Task<List<Order>> ListAsync(string? status, string? type, int? patientId, int take, CancellationToken ct = default)
    {
        var q = Query();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);
        if (!string.IsNullOrWhiteSpace(type))   q = q.Where(o => o.OrderType == type);
        if (patientId is int pid)               q = q.Where(o => o.PatientId == pid);
        return await q.OrderByDescending(o => o.CreatedAt).Take(take).ToListAsync(ct);
    }

    public async Task<List<Order>> PharmacyQueueAsync(int take, CancellationToken ct = default) =>
        await Query()
            .Where(o => o.OrderType == "Medication" && (o.Status == "signed" || o.Status == "draft"))
            .OrderBy(o => o.Priority == "Stat" ? 0 : o.Priority == "Urgent" ? 1 : 2)
            .ThenByDescending(o => o.CreatedAt)
            .Take(take)
            .ToListAsync(ct);
}
