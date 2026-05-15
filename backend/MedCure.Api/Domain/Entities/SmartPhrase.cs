using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class SmartPhrase : TenantEntity
{
    public string Code { get; set; } = "";    // must start with '.'
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Scope { get; set; } = "user"; // system, tenant, user
    public int? OwnerUserId { get; set; }
}
