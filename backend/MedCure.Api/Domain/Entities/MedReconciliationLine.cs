using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class MedReconciliationLine : TenantEntity
{
    public int ReconciliationId { get; set; }
    public MedReconciliation? Reconciliation { get; set; }
    public string DrugName { get; set; } = "";
    public string Dose { get; set; } = "";
    public string Route { get; set; } = "";
    public string Frequency { get; set; } = "";
    public string Source { get; set; } = "home";       // home, inpatient, prior
    public string Action { get; set; } = "";           // "" (unreconciled), continue, hold, modify, stop, new
    public string ActionReason { get; set; } = "";
    public string NewDose { get; set; } = "";          // populated when Action == "modify"
}
