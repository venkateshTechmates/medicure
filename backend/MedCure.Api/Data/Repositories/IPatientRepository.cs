using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data.Repositories;

public interface IPatientRepository : IRepository<Patient>
{
    Task<Patient?> GetByMrnAsync(string mrn, CancellationToken ct = default);
    Task<List<Patient>> SearchAsync(string? q, string? status, string? ward, int take, CancellationToken ct = default);
}
