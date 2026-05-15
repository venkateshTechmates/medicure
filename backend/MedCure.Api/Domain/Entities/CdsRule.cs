using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class CdsRule : TenantEntity
{
    public string RuleKey { get; set; } = "";
    public string Name { get; set; } = "";
    // drug-drug | drug-allergy | drug-disease | dose-range | duplicate | beers | pregnancy | indication | formulary
    public string Family { get; set; } = "drug-drug";
    // info | warn | hard-stop
    public string Severity { get; set; } = "warn";
    public bool Enabled { get; set; } = true;
    public string Threshold { get; set; } = "{}"; // JSON config
    public string Message { get; set; } = "";
}
