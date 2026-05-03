using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class User : Entity
{
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Title { get; set; } = "";       // MD, RN, RPh, ...
    public string Specialty { get; set; } = "";
    public string Npi { get; set; } = "";
    public string LicenseState { get; set; } = "";
    public string Dea { get; set; } = "";
    public string AvatarUrl { get; set; } = "";
    public bool TwoFactorEnabled { get; set; }
    public List<UserTenant> Tenants { get; set; } = new();
}
