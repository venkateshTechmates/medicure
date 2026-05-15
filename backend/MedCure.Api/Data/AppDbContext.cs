using MedCure.Api.Domain.Common;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> opts) : DbContext(opts)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserTenant> UserTenants => Set<UserTenant>();
    public DbSet<Ward> Wards => Set<Ward>();
    public DbSet<Bed> Beds => Set<Bed>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Allergy> Allergies => Set<Allergy>();
    public DbSet<Problem> Problems => Set<Problem>();
    public DbSet<Vital> Vitals => Set<Vital>();
    public DbSet<Encounter> Encounters => Set<Encounter>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<MedicationAdministration> MedAdmins => Set<MedicationAdministration>();
    public DbSet<LabResult> LabResults => Set<LabResult>();
    public DbSet<Specimen> Specimens => Set<Specimen>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<MessageThread> MessageThreads => Set<MessageThread>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<EDArrival> EDArrivals => Set<EDArrival>();
    public DbSet<CdsAlert> CdsAlerts => Set<CdsAlert>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();
    public DbSet<Immunization> Immunizations => Set<Immunization>();
    public DbSet<ConsultRequest> ConsultRequests => Set<ConsultRequest>();
    public DbSet<TransferRequest> TransferRequests => Set<TransferRequest>();
    public DbSet<CodeEvent> CodeEvents => Set<CodeEvent>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<CdsRule> CdsRules => Set<CdsRule>();
    public DbSet<CdsOverride> CdsOverrides => Set<CdsOverride>();
    public DbSet<MedReconciliation> MedReconciliations => Set<MedReconciliation>();
    public DbSet<MedReconciliationLine> MedReconciliationLines => Set<MedReconciliationLine>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<InbasketItem> InbasketDelegations => Set<InbasketItem>();
    public DbSet<TwoFactorSecret> TwoFactorSecrets => Set<TwoFactorSecret>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Patient>().HasIndex(p => p.Mrn).IsUnique();
        b.Entity<UserTenant>().HasIndex(x => new { x.UserId, x.TenantId }).IsUnique();
        b.Entity<TwoFactorSecret>().HasIndex(x => x.UserId).IsUnique();
        b.Entity<Order>().Property(o => o.Status).HasMaxLength(40);
        b.Entity<Claim>().Property(c => c.Amount).HasColumnType("decimal(18,2)");
        b.Entity<InventoryItem>().Property(c => c.UnitCost).HasColumnType("decimal(18,2)");
        b.Entity<Notification>().HasIndex(n => new { n.TenantId, n.UserId, n.ReadAt });
        b.Entity<CdsRule>().HasIndex(r => new { r.TenantId, r.RuleKey }).IsUnique();
        b.Entity<CdsOverride>().HasIndex(o => new { o.TenantId, o.RuleKey, o.CreatedAt });

        // Soft delete — exclude rows with DeletedAt set from default queries.
        foreach (var et in b.Model.GetEntityTypes())
        {
            if (typeof(Entity).IsAssignableFrom(et.ClrType))
            {
                var param = System.Linq.Expressions.Expression.Parameter(et.ClrType, "e");
                var prop  = System.Linq.Expressions.Expression.Property(param, nameof(Entity.DeletedAt));
                var isNull = System.Linq.Expressions.Expression.Equal(
                    prop,
                    System.Linq.Expressions.Expression.Constant(null, typeof(DateTime?)));
                var lambda = System.Linq.Expressions.Expression.Lambda(isNull, param);
                b.Entity(et.ClrType).HasQueryFilter(lambda);
            }
        }
    }

    public override int SaveChanges()
    {
        Touch();
        return base.SaveChanges();
    }
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        Touch();
        return base.SaveChangesAsync(ct);
    }

    private void Touch()
    {
        foreach (var e in ChangeTracker.Entries<Entity>())
        {
            if (e.State == EntityState.Modified) e.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
