using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Dtos.Mapping;

public static class PatientMapper
{
    public static int Age(DateTime dob)
    {
        var today = DateTime.UtcNow;
        var a = today.Year - dob.Year;
        if (dob.Date > today.AddYears(-a)) a--;
        return a;
    }

    public static PatientSummary ToSummary(Patient p, Vital? v) => new(
        p.Id, p.Mrn, $"{p.FirstName} {p.LastName}", Age(p.DateOfBirth), p.Sex,
        p.Status, p.Ward, p.Bed, p.AttendingName, p.AdmittedAt, p.AvatarUrl,
        v?.Hr, v?.Sbp, v?.Dbp, v?.Spo2);

    public static PatientDetail ToDetail(Patient p) => new(
        p.Id, p.Mrn, $"{p.FirstName} {p.LastName}", Age(p.DateOfBirth), p.Sex,
        p.WeightKg, p.HeightCm, p.CodeStatus, p.Insurance, p.Phone, p.Address,
        p.Status, p.Ward, p.Bed, p.AttendingName, p.PrimaryRn, p.AdmittedAt, p.AvatarUrl,
        p.Allergies.Select(a => new AllergyDto(a.Id, a.Substance, a.Reaction, a.Severity)).ToList(),
        p.Problems.Select(x => new ProblemDto(x.Id, x.Description, x.IcdCode, x.Onset, x.Type)).ToList());
}
