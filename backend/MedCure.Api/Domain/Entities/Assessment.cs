using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

/// <summary>
/// Polymorphic nursing assessment record (PRD §11.O).
/// One table stores admission / shift / pain / fall-risk / braden / vte-risk / restraint / suicide-risk.
/// The <see cref="Kind"/> + <see cref="Tool"/> pair determines how <see cref="DetailsJson"/> is interpreted.
/// </summary>
public class Assessment : TenantEntity
{
    public int PatientId { get; set; }
    public Patient? Patient { get; set; }

    public int? EncounterId { get; set; }
    public Encounter? Encounter { get; set; }

    public int PerformedByUserId { get; set; }

    // admission | shift | pain | fall-risk | braden | vte-risk | restraint | suicide-risk
    public string Kind { get; set; } = "";

    // morse | hendrich | braden | padua | caprini | columbia | phq9 | numeric | flacc | wong-baker | n/a
    public string Tool { get; set; } = "n/a";

    public int Score { get; set; }

    // low | moderate | high | very-high
    public string Risk { get; set; } = "low";

    /// <summary>Structured assessment payload (subscale values, checkbox flags, free-form fields).</summary>
    public string DetailsJson { get; set; } = "{}";

    public string Notes { get; set; } = "";
}
