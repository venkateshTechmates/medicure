using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

/// <summary>
/// Inbasket delegation rule. The Inbasket itself is an aggregator over existing entities
/// (LabResult, Message, Note, Order, Notification, ConsultRequest, TransferRequest, Document).
/// This row only stores out-of-office forwarding so another user can act on items while the
/// owner is away.
/// </summary>
public class InbasketItem : TenantEntity
{
    public int OwnerUserId { get; set; }
    public int? DelegateUserId { get; set; }
    public DateTime DelegateFromUtc { get; set; }
    public DateTime DelegateToUtc { get; set; }

    /// <summary>Comma-separated folder names. e.g. "results,messages,cosign".</summary>
    public string Folders { get; set; } = "";
}
