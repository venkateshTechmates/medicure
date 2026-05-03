namespace MedCure.Api.Dtos;

public record PatientDetail(
    int Id,
    string Mrn,
    string FullName,
    int Age,
    string Sex,
    double WeightKg,
    double HeightCm,
    string CodeStatus,
    string Insurance,
    string Phone,
    string Address,
    string Status,
    string Ward,
    string Bed,
    string AttendingName,
    string PrimaryRn,
    DateTime AdmittedAt,
    string AvatarUrl,
    IReadOnlyList<AllergyDto> Allergies,
    IReadOnlyList<ProblemDto> Problems
);
