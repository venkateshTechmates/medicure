using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class UserTenant : Entity
{
    public int UserId { get; set; }
    public User? User { get; set; }
    public int TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    public string Role { get; set; } = "MD";          // MD, RN, RPh, Tech, Reg, Bill, Admin
    public string Status { get; set; } = "active";    // active | pending | inactive
    public int PatientsCount { get; set; }
    public int InboxCount { get; set; }
    public int OnCallHours { get; set; }
}
