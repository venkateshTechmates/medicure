using Microsoft.EntityFrameworkCore;
using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

[Index(nameof(AuthorUserId), nameof(PatientId), nameof(Type))]
public class NoteDraft : TenantEntity
{
    public int? NoteId { get; set; }
    public int AuthorUserId { get; set; }
    public int PatientId { get; set; }
    public string Type { get; set; } = "Progress";
    public string Body { get; set; } = "";
}
