using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class NoteAddendum : TenantEntity
{
    public int NoteId { get; set; }
    public Note? Note { get; set; }
    public string AuthorName { get; set; } = "";
    public int? AuthorUserId { get; set; }
    public string Body { get; set; } = "";
    public DateTime SignedAt { get; set; } = DateTime.UtcNow;
}
