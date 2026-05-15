using MedCure.Api.Data.Repositories;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Data;

public interface IUnitOfWork : IAsyncDisposable
{
    // Generic
    IRepository<Tenant> Tenants { get; }
    IRepository<UserTenant> UserTenants { get; }
    IRepository<Ward> Wards { get; }
    IRepository<Bed> Beds { get; }
    IRepository<Allergy> Allergies { get; }
    IRepository<Problem> Problems { get; }
    IRepository<Vital> Vitals { get; }
    IRepository<Encounter> Encounters { get; }
    IRepository<Appointment> Appointments { get; }
    IRepository<MedicationAdministration> MedAdmins { get; }
    IRepository<Specimen> Specimens { get; }
    IRepository<Note> Notes { get; }
    IRepository<Document> Documents { get; }
    IRepository<MessageThread> MessageThreads { get; }
    IRepository<Message> Messages { get; }
    IRepository<Claim> Claims { get; }
    IRepository<InventoryItem> InventoryItems { get; }
    IRepository<EDArrival> EDArrivals { get; }
    IRepository<CdsAlert> CdsAlerts { get; }
    IRepository<AuditEntry> AuditEntries { get; }
    IRepository<Immunization> Immunizations { get; }
    IRepository<ConsultRequest> ConsultRequests { get; }
    IRepository<TransferRequest> TransferRequests { get; }
    IRepository<CodeEvent> CodeEvents { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<CdsRule> CdsRules { get; }
    IRepository<CdsOverride> CdsOverrides { get; }
    IRepository<MedReconciliation> MedReconciliations { get; }
    IRepository<MedReconciliationLine> MedReconciliationLines { get; }

    // Specialized
    IUserRepository Users { get; }
    IPatientRepository Patients { get; }
    IOrderRepository Orders { get; }
    ILabResultRepository LabResults { get; }

    Task<int> SaveAsync(CancellationToken ct = default);
}
