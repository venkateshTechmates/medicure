namespace MedCure.Api.Dtos;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string Title,
    string Specialty,
    string? Npi,
    string? LicenseState,
    string OrgName,
    string OrgLocation,
    string Role
);
