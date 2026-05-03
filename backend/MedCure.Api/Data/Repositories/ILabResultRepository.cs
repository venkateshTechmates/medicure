using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public interface ILabResultRepository : IRepository<LabResult>
{
    Task<List<LabResult>> ListAsync(string? flag, int? patientId, int take, CancellationToken ct = default);
}
