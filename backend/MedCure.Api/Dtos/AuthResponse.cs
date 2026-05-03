namespace MedCure.Api.Dtos;

public record AuthResponse(
    string Token,
    UserDto User,
    TenantDto ActiveTenant,
    IReadOnlyList<TenantDto> Tenants
);
