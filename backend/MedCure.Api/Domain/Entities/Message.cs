using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Message : TenantEntity
{
    public int ThreadId { get; set; }
    public MessageThread? Thread { get; set; }
    public string SenderName { get; set; } = "";
    public string Body { get; set; } = "";
    public DateTime SentAt { get; set; }
    public bool Read { get; set; }
}
