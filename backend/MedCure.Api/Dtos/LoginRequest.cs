namespace MedCure.Api.Dtos;

public record LoginRequest(string Email, string Password, int? TenantId = null, string? TotpCode = null);
