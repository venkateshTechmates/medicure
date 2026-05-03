using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Domain.Common;

public abstract class TenantEntity : Entity
{
    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }
}
