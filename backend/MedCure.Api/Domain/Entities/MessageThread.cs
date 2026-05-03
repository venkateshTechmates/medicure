using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class MessageThread : TenantEntity
{
    public string Subject { get; set; } = "";
    public int? PatientId { get; set; }
    public bool Urgent { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string Participants { get; set; } = ""; // csv of names
    public List<Message> Messages { get; set; } = new();
}
