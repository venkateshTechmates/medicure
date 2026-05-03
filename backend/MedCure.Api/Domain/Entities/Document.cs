using MedCure.Api.Domain.Common;

namespace MedCure.Api.Domain.Entities;

public class Document : TenantEntity
{
    public int? PatientId { get; set; }
    public string Title { get; set; } = "";
    public string Category { get; set; } = "";    // Consent, Imaging, Note, Lab
    public string FileType { get; set; } = "pdf";
    public int Pages { get; set; } = 1;
    public long SizeBytes { get; set; }
    public string AuthorName { get; set; } = "";
    public string Status { get; set; } = "signed"; // signed, draft, unsigned
}
