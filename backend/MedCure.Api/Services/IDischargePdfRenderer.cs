using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public record DischargePacketData(
    Patient Patient,
    Note? DischargeNote,
    IReadOnlyList<Order> Medications,
    IReadOnlyList<Appointment> FollowUps,
    IReadOnlyList<Allergy> Allergies);

public interface IDischargePdfRenderer
{
    string RenderHtml(DischargePacketData data);
}
