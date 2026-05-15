using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class TwoFactorSecret : TenantEntity
{
    public int UserId { get; set; }
    public string EncryptedSecret { get; set; } = "";
    public string BackupCodes { get; set; } = "";      // JSON-encoded string of remaining codes
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public bool Enabled { get; set; }
}
