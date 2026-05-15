using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class NoteTemplate : TenantEntity
{
    public string Code { get; set; } = "";
    public string Title { get; set; } = "";
    public string Specialty { get; set; } = "";
    public string Type { get; set; } = "Progress"; // Progress, SOAP, H&P, Procedure, Discharge
    public string Body { get; set; } = "";
    public string Scope { get; set; } = "user";    // system, tenant, user
    public int? OwnerUserId { get; set; }
}
