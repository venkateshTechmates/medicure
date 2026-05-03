using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Tenant : Entity
{
    public string Name { get; set; } = "";
    public string Location { get; set; } = "";
    public string Tier { get; set; } = "Main";
    public string ColorHex { get; set; } = "#0e1116";
    public string Initial { get; set; } = "M";
}
