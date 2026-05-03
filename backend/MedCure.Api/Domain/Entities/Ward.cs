using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Ward : TenantEntity
{
    public string Name { get; set; } = "";
    public string Code { get; set; } = "";
    public int BedCount { get; set; }
    public double AvgLos { get; set; }
    public string NurseRatio { get; set; } = "1:4";
}
