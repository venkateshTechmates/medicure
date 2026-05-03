namespace MedCure.Api.Dtos;

public record ProblemDto(int Id, string Description, string IcdCode, DateTime Onset, string Type);
