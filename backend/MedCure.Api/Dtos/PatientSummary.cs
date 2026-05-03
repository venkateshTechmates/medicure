namespace MedCure.Api.Dtos;

public record PatientSummary(
    int Id,
    string Mrn,
    string FullName,
    int Age,
    string Sex,
    string Status,
    string Ward,
    string Bed,
    string AttendingName,
    DateTime AdmittedAt,
    string AvatarUrl,
    int? Hr,
    int? Sbp,
    int? Dbp,
    int? Spo2
);
