namespace MedCure.Api.Dtos;

public record TenantDto(int Id, string Name, string Location, string Tier, string Initial, string ColorHex, string Role);
