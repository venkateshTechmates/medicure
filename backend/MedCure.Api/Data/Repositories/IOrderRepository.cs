using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public interface IOrderRepository : IRepository<Order>
{
    Task<List<Order>> ListAsync(string? status, string? type, int? patientId, int take, CancellationToken ct = default);
    Task<List<Order>> PharmacyQueueAsync(int take, CancellationToken ct = default);
}
